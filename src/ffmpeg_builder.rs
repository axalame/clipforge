use crate::config::AppConfig;
use serde_json::Value;
use std::fs;
use std::path::Path;

pub struct FFmpegBuilder {
    cfg: AppConfig,
}

impl FFmpegBuilder {
    pub fn new() -> Self {
        Self {
            cfg: AppConfig::load(),
        }
    }

    pub fn build_command(
        &self,
        operation: &str,
        input_path: &str,
        params: &Value,
        output_path: Option<&str>,
    ) -> Result<(Vec<String>, String), String> {
        let ffmpeg = self.cfg.ffmpeg_exe();
        let mut cmd = vec![ffmpeg, "-y".to_string(), "-hide_banner".to_string()];

        let out_dir = params["output_dir"]
            .as_str()
            .unwrap_or(&self.cfg.output_dir)
            .to_string();

        match operation {
            "trim" => {
                let start = params["start"].as_f64().unwrap_or(0.0);
                let end = params["end"].as_f64().unwrap_or(10.0);
                let duration = (end - start).max(0.1);
                let target_out = output_path
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| get_output_path(input_path, &format!("trim_{}_{}", start as i64, end as i64), &out_dir, None));

                cmd.extend(vec![
                    "-ss".to_string(),
                    start.to_string(),
                    "-i".to_string(),
                    input_path.to_string(),
                    "-t".to_string(),
                    duration.to_string(),
                    "-c".to_string(),
                    "copy".to_string(),
                    target_out.clone(),
                ]);
                Ok((cmd, target_out))
            }

            "split" => {
                let chunk_sec = params["chunk_duration"].as_i64().unwrap_or(30).max(1);
                let p = Path::new(input_path);
                let stem = p.file_stem().unwrap_or_default().to_string_lossy();
                let ext = p.extension().unwrap_or_default().to_string_lossy();
                let pattern = Path::new(&out_dir)
                    .join(format!("{}_part_%03d.{}", stem, ext))
                    .to_string_lossy()
                    .to_string();

                cmd.extend(vec![
                    "-i".to_string(),
                    input_path.to_string(),
                    "-c".to_string(),
                    "copy".to_string(),
                    "-f".to_string(),
                    "segment".to_string(),
                    "-segment_time".to_string(),
                    chunk_sec.to_string(),
                    "-reset_timestamps".to_string(),
                    "1".to_string(),
                    pattern.clone(),
                ]);
                Ok((cmd, out_dir))
            }

            "change_speed" => {
                let speed = params["speed"].as_f64().unwrap_or(1.5).clamp(0.25, 10.0);
                let audio_mode = params["audio_mode"].as_str().unwrap_or("sync");
                let keep_pitch = params["keep_pitch"].as_bool().unwrap_or(true);
                let target_out = output_path
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| get_output_path(input_path, &format!("speed_{}x", speed), &out_dir, None));

                let pts = 1.0 / speed;
                let v_filter = format!("[0:v]setpts={:.4}*PTS[v]", pts);

                match audio_mode {
                    "mute" => {
                        cmd.extend(vec![
                            "-i".to_string(),
                            input_path.to_string(),
                            "-filter_complex".to_string(),
                            v_filter,
                            "-map".to_string(),
                            "[v]".to_string(),
                            "-an".to_string(),
                            "-c:v".to_string(),
                            "libx264".to_string(),
                            target_out.clone(),
                        ]);
                    }
                    "keep_original" => {
                        // Audio speed stays 1.0x (normal, separate from video speed)
                        let a_filter = "[0:a]anull[a]".to_string();
                        cmd.extend(vec![
                            "-i".to_string(),
                            input_path.to_string(),
                            "-filter_complex".to_string(),
                            format!("{};{}", v_filter, a_filter),
                            "-map".to_string(),
                            "[v]".to_string(),
                            "-map".to_string(),
                            "[a]".to_string(),
                            "-c:v".to_string(),
                            "libx264".to_string(),
                            "-c:a".to_string(),
                            "aac".to_string(),
                            "-shortest".to_string(),
                            target_out.clone(),
                        ]);
                    }
                    "custom" => {
                        let audio_speed = params["audio_speed"].as_f64().unwrap_or(1.0).clamp(0.25, 10.0);
                        let a_filter = if keep_pitch {
                            build_atempo_filter(audio_speed)
                        } else {
                            format!("[0:a]asetrate=44100*{:.2},aresample=44100[a]", audio_speed)
                        };
                        cmd.extend(vec![
                            "-i".to_string(),
                            input_path.to_string(),
                            "-filter_complex".to_string(),
                            format!("{};{}", v_filter, a_filter),
                            "-map".to_string(),
                            "[v]".to_string(),
                            "-map".to_string(),
                            "[a]".to_string(),
                            "-c:v".to_string(),
                            "libx264".to_string(),
                            "-c:a".to_string(),
                            "aac".to_string(),
                            "-shortest".to_string(),
                            target_out.clone(),
                        ]);
                    }
                    _ => {
                        // "sync" mode: audio speed follows video speed
                        let a_filter = if keep_pitch {
                            build_atempo_filter(speed)
                        } else {
                            format!("[0:a]asetrate=44100*{:.2},aresample=44100[a]", speed)
                        };
                        cmd.extend(vec![
                            "-i".to_string(),
                            input_path.to_string(),
                            "-filter_complex".to_string(),
                            format!("{};{}", v_filter, a_filter),
                            "-map".to_string(),
                            "[v]".to_string(),
                            "-map".to_string(),
                            "[a]".to_string(),
                            "-c:v".to_string(),
                            "libx264".to_string(),
                            "-c:a".to_string(),
                            "aac".to_string(),
                            target_out.clone(),
                        ]);
                    }
                }
                Ok((cmd, target_out))
            }

            "add_watermark" => {
                let wm_file = params["watermark_file"]
                    .as_str()
                    .ok_or_else(|| "Файл водяного знака не указан".to_string())?;
                let opacity = (params["opacity"].as_f64().unwrap_or(80.0) / 100.0).clamp(0.05, 1.0);
                let size_pct = (params["size"].as_f64().unwrap_or(20.0) / 100.0).clamp(0.05, 0.95);
                let pos = params["position"].as_str().unwrap_or("bottom-right");

                let (x_pos, y_pos) = if params.get("x_pct").is_some() && params.get("y_pct").is_some() {
                    let xp = params["x_pct"].as_f64().unwrap_or(0.0).clamp(0.0, 100.0) / 100.0;
                    let yp = params["y_pct"].as_f64().unwrap_or(0.0).clamp(0.0, 100.0) / 100.0;
                    (format!("(main_w-overlay_w)*{:.3}", xp), format!("(main_h-overlay_h)*{:.3}", yp))
                } else {
                    position_coords(pos, 20)
                };

                let target_out = output_path
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| get_output_path(input_path, "watermarked", &out_dir, None));

                let filter_str = format!(
                    "[1:v]format=rgba,colorchannelmixer=aa={:.2}[wm_a];[wm_a][0:v]scale2ref=w=main_w*{:.2}:h=-2[wm][base];[base][wm]overlay={}:{}[v]",
                    opacity, size_pct, x_pos, y_pos
                );

                cmd.extend(vec![
                    "-i".to_string(),
                    input_path.to_string(),
                    "-i".to_string(),
                    wm_file.to_string(),
                    "-filter_complex".to_string(),
                    filter_str,
                    "-map".to_string(),
                    "[v]".to_string(),
                    "-map".to_string(),
                    "0:a?".to_string(),
                    "-c:v".to_string(),
                    "libx264".to_string(),
                    "-preset".to_string(),
                    "fast".to_string(),
                    "-crf".to_string(),
                    "22".to_string(),
                    "-c:a".to_string(),
                    "copy".to_string(),
                    target_out.clone(),
                ]);
                Ok((cmd, target_out))
            }

            "add_text_overlay" => {
                let text = params["text"].as_str().unwrap_or("Title");
                let pos = params["position"].as_str().unwrap_or("center");
                let size = params["fontsize"].as_i64().unwrap_or(32).max(10);
                let color = params["color"].as_str().unwrap_or("white");
                let use_box = params["use_box"].as_bool().unwrap_or(false);

                let (x_pos, y_pos) = if params.get("x_pct").is_some() && params.get("y_pct").is_some() {
                    let xp = params["x_pct"].as_f64().unwrap_or(50.0).clamp(0.0, 100.0) / 100.0;
                    let yp = params["y_pct"].as_f64().unwrap_or(50.0).clamp(0.0, 100.0) / 100.0;
                    (format!("(w-text_w)*{:.3}", xp), format!("(h-text_h)*{:.3}", yp))
                } else {
                    position_text_coords(pos, 25)
                };

                let target_out = output_path
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| get_output_path(input_path, "text_overlay", &out_dir, None));

                let font_arg = get_font_option();
                let box_arg = if use_box {
                    ":box=1:boxcolor=black@0.6:boxborderw=8"
                } else {
                    ":borderw=2:bordercolor=black@0.8"
                };

                // Write text to UTF-8 textfile in temp directory to avoid escaping / codepage issues with Cyrillic
                let text_file = std::env::temp_dir().join(format!("drawtext_overlay_{}.txt", std::process::id()));
                let text_source = if fs::write(&text_file, text.as_bytes()).is_ok() {
                    let p_str = text_file.to_string_lossy().to_string()
                        .replace('\\', "/")
                        .replace(':', "\\:");
                    format!("textfile='{}'", p_str)
                } else {
                    let sanitized = text.replace('\\', "\\\\").replace('\'', "\\'").replace(':', "\\:");
                    format!("text='{}'", sanitized)
                };

                let vf = format!(
                    "drawtext={}{}:fontsize={}:fontcolor={}:x={}:y={}{}",
                    font_arg, text_source, size, color, x_pos, y_pos, box_arg
                );

                cmd.extend(vec![
                    "-i".to_string(),
                    input_path.to_string(),
                    "-vf".to_string(),
                    vf,
                    "-c:v".to_string(),
                    "libx264".to_string(),
                    "-c:a".to_string(),
                    "copy".to_string(),
                    target_out.clone(),
                ]);
                Ok((cmd, target_out))
            }

            "add_timestamp" => {
                let fmt = params["format"].as_str().unwrap_or("%Y-%m-%d %H:%M:%S");
                let pos = params["position"].as_str().unwrap_or("top-right");
                let size = params["fontsize"].as_i64().unwrap_or(24).max(10);
                let color = params["color"].as_str().unwrap_or("white");
                let use_box = params["use_box"].as_bool().unwrap_or(false);

                let (x_pos, y_pos) = if params.get("x_pct").is_some() && params.get("y_pct").is_some() {
                    let xp = params["x_pct"].as_f64().unwrap_or(85.0).clamp(0.0, 100.0) / 100.0;
                    let yp = params["y_pct"].as_f64().unwrap_or(10.0).clamp(0.0, 100.0) / 100.0;
                    (format!("(w-text_w)*{:.3}", xp), format!("(h-text_h)*{:.3}", yp))
                } else {
                    position_text_coords(pos, 25)
                };

                let target_out = output_path
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| get_output_path(input_path, "timestamped", &out_dir, None));

                let font_arg = get_font_option();
                let box_arg = if use_box {
                    ":box=1:boxcolor=black@0.6:boxborderw=6"
                } else {
                    ":borderw=2:bordercolor=black@0.8"
                };

                let time_expr = if fmt.contains("pts") || fmt.contains("hms") {
                    "%{pts\\:hms}".to_string()
                } else {
                    let safe_fmt = fmt.replace("%H:%M:%S", "%X").replace("%T", "%X");
                    if safe_fmt.trim().is_empty() {
                        "%{localtime}".to_string()
                    } else {
                        format!("%{{localtime\\:{}}}", safe_fmt)
                    }
                };

                let vf = format!(
                    "drawtext={}text='{}':fontsize={}:fontcolor={}:x={}:y={}{}",
                    font_arg, time_expr, size, color, x_pos, y_pos, box_arg
                );

                cmd.extend(vec![
                    "-i".to_string(),
                    input_path.to_string(),
                    "-vf".to_string(),
                    vf,
                    "-c:v".to_string(),
                    "libx264".to_string(),
                    "-c:a".to_string(),
                    "copy".to_string(),
                    target_out.clone(),
                ]);
                Ok((cmd, target_out))
            }

            "blur_video" => {
                let effect = params["effect"].as_str().unwrap_or("blur");
                let intensity = params["intensity"].as_i64().unwrap_or(50).clamp(5, 100);
                let x = params["x"].as_i64().unwrap_or(100).max(0);
                let y = params["y"].as_i64().unwrap_or(100).max(0);
                let mut w = params["w"].as_i64().unwrap_or(300).max(16);
                let mut h = params["h"].as_i64().unwrap_or(200).max(16);
                w = w - (w % 2);
                h = h - (h % 2);

                let fx = if effect == "pixelate" {
                    let factor = (intensity / 3).max(4);
                    format!("scale=iw/{}:ih/{},scale=iw*{}:ih*{}:flags=neighbor", factor, factor, factor, factor)
                } else {
                    let radius = (intensity / 4).max(2);
                    format!("boxblur=luma_radius={}:luma_power=2", radius)
                };

                let target_out = output_path
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| get_output_path(input_path, &format!("{}ed", effect), &out_dir, None));

                let filter_str = format!(
                    "[0:v]split[base][crop_src];[crop_src]crop={}:{}:{}:{},{}[fx_crop];[base][fx_crop]overlay={}:{}[v]",
                    w, h, x, y, fx, x, y
                );

                cmd.extend(vec![
                    "-i".to_string(),
                    input_path.to_string(),
                    "-filter_complex".to_string(),
                    filter_str,
                    "-map".to_string(),
                    "[v]".to_string(),
                    "-map".to_string(),
                    "0:a?".to_string(),
                    "-c:v".to_string(),
                    "libx264".to_string(),
                    "-c:a".to_string(),
                    "copy".to_string(),
                    target_out.clone(),
                ]);
                Ok((cmd, target_out))
            }

            "overlay" => {
                let pip_file = params["pip_file"]
                    .as_str()
                    .ok_or_else(|| "Файл для PIP не указан".to_string())?;
                let scale = (params["scale"].as_f64().unwrap_or(30.0) / 100.0).clamp(0.1, 0.9);
                let pos = params["position"].as_str().unwrap_or("bottom-right");

                let (x_pos, y_pos) = if params.get("x_pct").is_some() && params.get("y_pct").is_some() {
                    let xp = params["x_pct"].as_f64().unwrap_or(80.0).clamp(0.0, 100.0) / 100.0;
                    let yp = params["y_pct"].as_f64().unwrap_or(80.0).clamp(0.0, 100.0) / 100.0;
                    (format!("(main_w-overlay_w)*{:.3}", xp), format!("(main_h-overlay_h)*{:.3}", yp))
                } else {
                    position_coords(pos, 20)
                };

                let target_out = output_path
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| get_output_path(input_path, "pip_overlay", &out_dir, None));

                let filter_str = format!(
                    "[1:v]scale=iw*{:.2}:-1[pip];[0:v][pip]overlay={}:{}[v]",
                    scale, x_pos, y_pos
                );

                cmd.extend(vec![
                    "-i".to_string(),
                    input_path.to_string(),
                    "-i".to_string(),
                    pip_file.to_string(),
                    "-filter_complex".to_string(),
                    filter_str,
                    "-map".to_string(),
                    "[v]".to_string(),
                    "-map".to_string(),
                    "0:a?".to_string(),
                    "-c:v".to_string(),
                    "libx264".to_string(),
                    "-c:a".to_string(),
                    "copy".to_string(),
                    target_out.clone(),
                ]);
                Ok((cmd, target_out))
            }

            "rotate" => {
                let angle = params["angle"].as_i64().unwrap_or(90);
                let target_out = output_path
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| get_output_path(input_path, &format!("rotate_{}", angle), &out_dir, None));

                let vf = match angle {
                    90 => "transpose=1",
                    180 => "transpose=1,transpose=1",
                    270 => "transpose=2",
                    _ => "null",
                };

                cmd.extend(vec![
                    "-i".to_string(),
                    input_path.to_string(),
                    "-vf".to_string(),
                    vf.to_string(),
                    "-c:v".to_string(),
                    "libx264".to_string(),
                    "-c:a".to_string(),
                    "copy".to_string(),
                    target_out.clone(),
                ]);
                Ok((cmd, target_out))
            }

            "crop" => {
                let mut w = params["width"].as_i64().unwrap_or(1280).max(16);
                let mut h = params["height"].as_i64().unwrap_or(720).max(16);
                w = w - (w % 2);
                h = h - (h % 2);

                let vf = if params.get("x").is_some() && params.get("y").is_some() {
                    let x = params["x"].as_i64().unwrap_or(0).max(0);
                    let y = params["y"].as_i64().unwrap_or(0).max(0);
                    format!("crop={}:{}:{}:{}", w, h, x, y)
                } else {
                    let xp = params["x_pct"].as_f64().unwrap_or(50.0).clamp(0.0, 100.0) / 100.0;
                    let yp = params["y_pct"].as_f64().unwrap_or(50.0).clamp(0.0, 100.0) / 100.0;
                    format!("crop={}:{}:(in_w-out_w)*{:.3}:(in_h-out_h)*{:.3}", w, h, xp, yp)
                };

                let target_out = output_path
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| get_output_path(input_path, &format!("cropped_{}x{}", w, h), &out_dir, None));

                cmd.extend(vec![
                    "-i".to_string(),
                    input_path.to_string(),
                    "-vf".to_string(),
                    vf,
                    "-c:v".to_string(),
                    "libx264".to_string(),
                    "-c:a".to_string(),
                    "copy".to_string(),
                    target_out.clone(),
                ]);
                Ok((cmd, target_out))
            }

            "resize" => {
                let w = params["width"].as_i64().unwrap_or(1280);
                let h = params["height"].as_i64().unwrap_or(720);
                let keep_aspect = params["keep_aspect"].as_bool().unwrap_or(true);
                let target_out = output_path
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| get_output_path(input_path, &format!("resized_{}x{}", w, h), &out_dir, None));

                let vf = if keep_aspect {
                    format!("scale={}:{}:force_original_aspect_ratio=decrease,pad={}:{}:(ow-iw)/2:(oh-ih)/2", w, h, w, h)
                } else {
                    format!("scale={}:{}", w, h)
                };

                cmd.extend(vec![
                    "-i".to_string(),
                    input_path.to_string(),
                    "-vf".to_string(),
                    vf,
                    "-c:v".to_string(),
                    "libx264".to_string(),
                    "-c:a".to_string(),
                    "copy".to_string(),
                    target_out.clone(),
                ]);
                Ok((cmd, target_out))
            }

            "change_fps" => {
                let fps = params["fps"].as_i64().unwrap_or(30).clamp(1, 120);
                let target_out = output_path
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| get_output_path(input_path, &format!("fps_{}", fps), &out_dir, None));

                cmd.extend(vec![
                    "-i".to_string(),
                    input_path.to_string(),
                    "-vf".to_string(),
                    format!("fps={}", fps),
                    "-c:v".to_string(),
                    "libx264".to_string(),
                    "-c:a".to_string(),
                    "copy".to_string(),
                    target_out.clone(),
                ]);
                Ok((cmd, target_out))
            }

            "smart_blur_9_16" => {
                let w = params["target_width"]
                    .as_i64()
                    .or_else(|| params["width"].as_i64())
                    .unwrap_or(1080);
                let h = params["target_height"]
                    .as_i64()
                    .or_else(|| params["height"].as_i64())
                    .unwrap_or(1920);
                let blur = params["blur"]
                    .as_i64()
                    .or_else(|| params["blur"].as_f64().map(|v| v.round() as i64))
                    .unwrap_or(20)
                    .clamp(5, 60);

                let target_out = output_path
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| get_output_path(input_path, "shorts_9_16", &out_dir, None));

                let filter_str = format!(
                    "[0:v]scale={}:{}:force_original_aspect_ratio=increase,crop={}:{},boxblur={}:5[bg];[0:v]scale={}:{}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]",
                    w, h, w, h, blur, w, h
                );

                cmd.extend(vec![
                    "-i".to_string(),
                    input_path.to_string(),
                    "-filter_complex".to_string(),
                    filter_str,
                    "-map".to_string(),
                    "[outv]".to_string(),
                    "-map".to_string(),
                    "0:a?".to_string(),
                    "-c:v".to_string(),
                    "libx264".to_string(),
                    "-preset".to_string(),
                    "medium".to_string(),
                    "-crf".to_string(),
                    "20".to_string(),
                    "-c:a".to_string(),
                    "copy".to_string(),
                    target_out.clone(),
                ]);
                Ok((cmd, target_out))
            }

            "normalize_audio" => {
                let i = params["i"].as_f64().unwrap_or(-16.0).clamp(-70.0, -5.0);
                let tp = params["tp"].as_f64().unwrap_or(-1.5).clamp(-9.0, 0.0);
                let lra = params["lra"].as_f64().unwrap_or(11.0).clamp(1.0, 50.0);

                let target_out = output_path
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| get_output_path(input_path, "loudnorm", &out_dir, None));

                let af = format!("loudnorm=I={:.1}:TP={:.1}:LRA={:.1}", i, tp, lra);

                cmd.extend(vec![
                    "-i".to_string(),
                    input_path.to_string(),
                    "-af".to_string(),
                    af,
                    "-c:v".to_string(),
                    "copy".to_string(),
                    "-c:a".to_string(),
                    "aac".to_string(),
                    "-b:a".to_string(),
                    "192k".to_string(),
                    target_out.clone(),
                ]);
                Ok((cmd, target_out))
            }

            "remove_silence" => {
                let db = params["threshold_db"].as_i64().unwrap_or(-30);
                let dur = params["min_duration"].as_f64().unwrap_or(1.5).max(0.1);
                let target_out = output_path
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| get_output_path(input_path, "silence_removed", &out_dir, None));

                let af = format!("silenceremove=stop_periods=-1:stop_duration={}:stop_threshold={}dB", dur, db);

                cmd.extend(vec![
                    "-i".to_string(),
                    input_path.to_string(),
                    "-af".to_string(),
                    af,
                    "-c:v".to_string(),
                    "libx264".to_string(),
                    "-c:a".to_string(),
                    "aac".to_string(),
                    target_out.clone(),
                ]);
                Ok((cmd, target_out))
            }

            "replace_audio" => {
                let audio_file = params["audio_file"]
                    .as_str()
                    .ok_or_else(|| "Аудиофайл не указан".to_string())?;
                let target_out = output_path
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| get_output_path(input_path, "replaced_audio", &out_dir, None));

                cmd.extend(vec![
                    "-i".to_string(),
                    input_path.to_string(),
                    "-i".to_string(),
                    audio_file.to_string(),
                    "-c:v".to_string(),
                    "copy".to_string(),
                    "-c:a".to_string(),
                    "aac".to_string(),
                    "-map".to_string(),
                    "0:v:0".to_string(),
                    "-map".to_string(),
                    "1:a:0".to_string(),
                    "-shortest".to_string(),
                    target_out.clone(),
                ]);
                Ok((cmd, target_out))
            }

            "compress" => {
                let codec = params["codec"].as_str().unwrap_or("libx264");
                let crf = params["crf"].as_i64().unwrap_or(23);
                let preset = params["preset"].as_str().unwrap_or("medium");
                let target_out = output_path
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| get_output_path(input_path, &format!("compressed_{}", preset), &out_dir, None));

                cmd.extend(vec![
                    "-i".to_string(),
                    input_path.to_string(),
                    "-c:v".to_string(),
                    codec.to_string(),
                ]);

                if codec.contains("nvenc") {
                    cmd.extend(vec![
                        "-cq".to_string(),
                        crf.to_string(),
                        "-preset".to_string(),
                        preset.to_string(),
                    ]);
                } else {
                    cmd.extend(vec![
                        "-crf".to_string(),
                        crf.to_string(),
                        "-preset".to_string(),
                        preset.to_string(),
                    ]);
                }

                cmd.extend(vec![
                    "-c:a".to_string(),
                    "aac".to_string(),
                    "-b:a".to_string(),
                    "128k".to_string(),
                    target_out.clone(),
                ]);
                Ok((cmd, target_out))
            }

            "convert" => {
                let fmt = params["target_format"]
                    .as_str()
                    .or_else(|| params["format"].as_str())
                    .unwrap_or("mp4")
                    .to_lowercase()
                    .replace('.', "");
                let fast = params["fast"].as_bool().unwrap_or(true);
                let target_out = output_path
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| get_output_path(input_path, "converted", &out_dir, Some(&fmt)));

                cmd.extend(vec!["-i".to_string(), input_path.to_string()]);

                if fast && (fmt == "mp4" || fmt == "mkv" || fmt == "mov") {
                    cmd.extend(vec!["-c".to_string(), "copy".to_string()]);
                } else {
                    cmd.extend(vec![
                        "-c:v".to_string(),
                        "libx264".to_string(),
                        "-c:a".to_string(),
                        "aac".to_string(),
                    ]);
                }

                cmd.push(target_out.clone());
                Ok((cmd, target_out))
            }

            "create_gif" => {
                let start = params["start"].as_f64().unwrap_or(0.0);
                let duration = params["duration"].as_f64().unwrap_or(5.0);
                let quality = params["quality"].as_str().unwrap_or("480p");
                let target_out = output_path
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| get_output_path(input_path, "anim", &out_dir, Some("gif")));

                let w = match quality {
                    "320p" => 480,
                    "480p" => 640,
                    "720p" => 960,
                    _ => 640,
                };

                let filter_str = format!(
                    "fps=15,scale={}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
                    w
                );

                cmd.extend(vec![
                    "-ss".to_string(),
                    start.to_string(),
                    "-t".to_string(),
                    duration.to_string(),
                    "-i".to_string(),
                    input_path.to_string(),
                    "-vf".to_string(),
                    filter_str,
                    "-loop".to_string(),
                    "0".to_string(),
                    target_out.clone(),
                ]);
                Ok((cmd, target_out))
            }

            "apply_metadata" => {
                let target_out = output_path
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| get_output_path(input_path, "meta", &out_dir, None));

                cmd.extend(vec!["-i".to_string(), input_path.to_string()]);

                if let Some(t) = params["title"].as_str() {
                    if !t.is_empty() {
                        cmd.extend(vec!["-metadata".to_string(), format!("title={}", t)]);
                    }
                }
                if let Some(a) = params["artist"].as_str() {
                    if !a.is_empty() {
                        cmd.extend(vec!["-metadata".to_string(), format!("artist={}", a)]);
                    }
                }
                if let Some(c) = params["comment"].as_str() {
                    if !c.is_empty() {
                        cmd.extend(vec!["-metadata".to_string(), format!("comment={}", c)]);
                    }
                }

                cmd.extend(vec![
                    "-c".to_string(),
                    "copy".to_string(),
                    target_out.clone(),
                ]);
                Ok((cmd, target_out))
            }

            "merge_videos" => {
                let files = params["files"]
                    .as_array()
                    .ok_or_else(|| "Список файлов для объединения пуст".to_string())?;

                if files.is_empty() {
                    return Err("Для объединения требуется минимум 1 файл".to_string());
                }

                let first_file = files[0].as_str().unwrap_or(input_path);
                let target_out = output_path
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| get_output_path(first_file, "merged", &out_dir, None));

                let list_file = std::env::temp_dir().join(format!("concat_list_{}.txt", std::process::id()));
                let mut content = String::new();
                for f in files {
                    if let Some(p) = f.as_str() {
                        let sanitized = p.replace('\\', "/").replace('\'', "'\\''");
                        content.push_str(&format!("file '{}'\n", sanitized));
                    }
                }
                fs::write(&list_file, content).map_err(|e| format!("Не удалось создать concat list: {}", e))?;

                cmd.extend(vec![
                    "-f".to_string(),
                    "concat".to_string(),
                    "-safe".to_string(),
                    "0".to_string(),
                    "-i".to_string(),
                    list_file.to_string_lossy().to_string(),
                    "-c".to_string(),
                    "copy".to_string(),
                    target_out.clone(),
                ]);
                Ok((cmd, target_out))
            }

            _ => Err(format!("Неизвестная операция FFmpeg: {}", operation)),
        }
    }
}

fn get_output_path(input_path: &str, suffix: &str, out_dir: &str, ext_override: Option<&str>) -> String {
    let p = Path::new(input_path);
    let stem = p.file_stem().unwrap_or_default().to_string_lossy();
    let ext = ext_override.unwrap_or_else(|| p.extension().unwrap_or_default().to_str().unwrap_or("mp4"));

    let target_dir = if !out_dir.is_empty() {
        let d = Path::new(out_dir);
        let _ = fs::create_dir_all(d);
        d.to_path_buf()
    } else {
        p.parent().unwrap_or_else(|| Path::new(".")).to_path_buf()
    };

    let filename = format!("{}_{}.{}", stem, suffix, ext);
    target_dir.join(filename).to_string_lossy().to_string()
}

fn build_atempo_filter(speed: f64) -> String {
    let mut filters = Vec::new();
    let mut s = speed;
    while s > 2.0 {
        filters.push("atempo=2.0".to_string());
        s /= 2.0;
    }
    while s < 0.5 {
        filters.push("atempo=0.5".to_string());
        s /= 0.5;
    }
    filters.push(format!("atempo={:.3}", s));
    format!("[0:a]{}[a]", filters.join(","))
}

fn position_coords(pos: &str, margin: i64) -> (String, String) {
    match pos {
        "top-left" => (margin.to_string(), margin.to_string()),
        "top-center" => ("(main_w-overlay_w)/2".to_string(), margin.to_string()),
        "top-right" => (format!("main_w-overlay_w-{}", margin), margin.to_string()),
        "center-left" => (margin.to_string(), "(main_h-overlay_h)/2".to_string()),
        "center" => ("(main_w-overlay_w)/2".to_string(), "(main_h-overlay_h)/2".to_string()),
        "center-right" => (format!("main_w-overlay_w-{}", margin), "(main_h-overlay_h)/2".to_string()),
        "bottom-left" => (margin.to_string(), format!("main_h-overlay_h-{}", margin)),
        "bottom-center" => ("(main_w-overlay_w)/2".to_string(), format!("main_h-overlay_h-{}", margin)),
        "bottom-right" => (format!("main_w-overlay_w-{}", margin), format!("main_h-overlay_h-{}", margin)),
        _ => ("(main_w-overlay_w)/2".to_string(), "(main_h-overlay_h)/2".to_string()),
    }
}

fn position_text_coords(pos: &str, margin: i64) -> (String, String) {
    match pos {
        "top-left" => (margin.to_string(), margin.to_string()),
        "top-center" => ("(w-text_w)/2".to_string(), margin.to_string()),
        "top-right" => (format!("w-text_w-{}", margin), margin.to_string()),
        "center-left" => (margin.to_string(), "(h-text_h)/2".to_string()),
        "center" => ("(w-text_w)/2".to_string(), "(h-text_h)/2".to_string()),
        "center-right" => (format!("w-text_w-{}", margin), "(h-text_h)/2".to_string()),
        "bottom-left" => (margin.to_string(), format!("h-text_h-{}", margin)),
        "bottom-center" => ("(w-text_w)/2".to_string(), format!("h-text_h-{}", margin)),
        "bottom-right" => (format!("w-text_w-{}", margin), format!("h-text_h-{}", margin)),
        _ => ("(w-text_w)/2".to_string(), "(h-text_h)/2".to_string()),
    }
}

fn get_font_option() -> &'static str {
    #[cfg(windows)]
    {
        if Path::new(r"C:\Windows\Fonts\arial.ttf").exists() {
            return "fontfile='C\\:/Windows/Fonts/arial.ttf':";
        }
        if Path::new(r"C:\Windows\Fonts\segoeui.ttf").exists() {
            return "fontfile='C\\:/Windows/Fonts/segoeui.ttf':";
        }
    }
    ""
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_trim_command() {
        let builder = FFmpegBuilder::new();
        let (cmd, out) = builder.build_command("trim", "video.mp4", &json!({ "start": 2.5, "end": 10.0 }), None).unwrap();
        assert!(cmd.contains(&"-ss".to_string()));
        assert!(cmd.contains(&"2.5".to_string()));
        assert!(out.contains("trim_2_10"));
    }

    #[test]
    fn test_watermark_command() {
        let builder = FFmpegBuilder::new();
        let (cmd, _out) = builder.build_command("add_watermark", "video.mp4", &json!({
            "watermark_file": "logo.png",
            "size": 25,
            "x_pct": 90,
            "y_pct": 90,
            "opacity": 80
        }), None).unwrap();
        let filter = cmd.iter().find(|s| s.contains("scale2ref")).unwrap();
        assert!(filter.contains("scale2ref=w=main_w*0.25:h=-2"));
        assert!(filter.contains("(main_w-overlay_w)*0.900"));
    }

    #[test]
    fn test_crop_even_dims() {
        let builder = FFmpegBuilder::new();
        let (cmd, _out) = builder.build_command("crop", "video.mp4", &json!({
            "width": 1281,
            "height": 721,
            "x": 10,
            "y": 10
        }), None).unwrap();
        let vf = cmd.iter().find(|s| s.starts_with("crop=")).unwrap();
        assert_eq!(vf, "crop=1280:720:10:10");
    }

    #[test]
    fn test_change_speed_keep_audio_original() {
        let builder = FFmpegBuilder::new();
        let (cmd, _out) = builder.build_command("change_speed", "video.mp4", &json!({
            "speed": 2.0,
            "audio_mode": "keep_original"
        }), None).unwrap();
        let filter = cmd.iter().find(|s| s.contains("setpts")).unwrap();
        assert!(filter.contains("setpts=0.5000*PTS[v]"));
        assert!(filter.contains("[0:a]anull[a]"));
        assert!(cmd.contains(&"-shortest".to_string()));
    }

    #[test]
    fn test_normalize_audio_params() {
        let builder = FFmpegBuilder::new();
        let (cmd, _out) = builder.build_command("normalize_audio", "video.mp4", &json!({
            "i": -14.0,
            "tp": -1.0,
            "lra": 9.5
        }), None).unwrap();
        let af_idx = cmd.iter().position(|s| s == "-af").unwrap();
        let af_val = &cmd[af_idx + 1];
        assert_eq!(af_val, "loudnorm=I=-14.0:TP=-1.0:LRA=9.5");
    }

    #[test]
    fn test_add_text_overlay_cyrillic() {
        let builder = FFmpegBuilder::new();
        let (cmd, _out) = builder.build_command("add_text_overlay", "video.mp4", &json!({
            "text": "Тестовая надпись на русском",
            "fontsize": 36,
            "color": "#ffffff"
        }), None).unwrap();
        let vf_idx = cmd.iter().position(|s| s == "-vf").unwrap();
        let vf_val = &cmd[vf_idx + 1];
        assert!(vf_val.contains("textfile=") || vf_val.contains("text="));
        #[cfg(windows)]
        {
            assert!(vf_val.contains("fontfile='C\\:/Windows/Fonts/"));
        }
    }

    #[test]
    fn test_crop_dynamic_percentage() {
        let builder = FFmpegBuilder::new();
        let (cmd, _out) = builder.build_command("crop", "video.mp4", &json!({
            "width": 1080,
            "height": 1920,
            "x_pct": 50,
            "y_pct": 50
        }), None).unwrap();
        let vf = cmd.iter().find(|s| s.starts_with("crop=")).unwrap();
        assert!(vf.contains("(in_w-out_w)*0.500"));
        assert!(vf.contains("(in_h-out_h)*0.500"));
    }

    #[test]
    fn test_atempo_chaining_extreme_speeds() {
        // Fast motion: 4.0x -> atempo=2.0,atempo=2.0
        let fast_filter = build_atempo_filter(4.0);
        assert!(fast_filter.contains("atempo=2.0,atempo=2.0"));

        // Slow motion: 0.25x -> atempo=0.5,atempo=0.5
        let slow_filter = build_atempo_filter(0.25);
        assert!(slow_filter.contains("atempo=0.5,atempo=0.5"));
    }

    #[test]
    fn test_rotate_transpose() {
        let builder = FFmpegBuilder::new();
        let (cmd, _out) = builder.build_command("rotate", "video.mp4", &json!({
            "angle": 90
        }), None).unwrap();
        let vf = cmd.iter().find(|s| s.contains("transpose=")).unwrap();
        assert_eq!(vf, "transpose=1");

        let (cmd180, _out) = builder.build_command("rotate", "video.mp4", &json!({
            "angle": 180
        }), None).unwrap();
        let vf180 = cmd180.iter().find(|s| s.contains("transpose=")).unwrap();
        assert_eq!(vf180, "transpose=1,transpose=1");
    }

    #[test]
    fn test_smart_blur_9_16() {
        let builder = FFmpegBuilder::new();
        let (cmd, target_out) = builder
            .build_command(
                "smart_blur_9_16",
                "test_input.mp4",
                &json!({
                    "blur": 25,
                    "width": 1080,
                    "height": 1920
                }),
                None,
            )
            .unwrap();

        assert!(target_out.contains("shorts_9_16"));
        let fc_idx = cmd.iter().position(|s| s == "-filter_complex").expect("should have -filter_complex");
        let filter_str = &cmd[fc_idx + 1];
        assert!(filter_str.contains("boxblur=25:5"));
        assert!(filter_str.contains("scale=1080:1920:force_original_aspect_ratio=increase"));
        assert!(filter_str.contains("crop=1080:1920"));
        assert!(filter_str.contains("scale=1080:1920:force_original_aspect_ratio=decrease"));
        assert!(filter_str.contains("overlay=(W-w)/2:(H-h)/2[outv]"));

        assert!(cmd.contains(&"-c:v".to_string()));
        assert!(cmd.contains(&"libx264".to_string()));
        assert!(cmd.contains(&"-preset".to_string()));
        assert!(cmd.contains(&"medium".to_string()));
        assert!(cmd.contains(&"-crf".to_string()));
        assert!(cmd.contains(&"20".to_string()));
        assert!(cmd.contains(&"-c:a".to_string()));
        assert!(cmd.contains(&"copy".to_string()));
        assert!(cmd.contains(&"[outv]".to_string()));
        assert!(cmd.contains(&"0:a?".to_string()));
    }

    #[test]
    #[ignore]
    fn test_benchmark_command_creation() {
        use std::time::Instant;
        let builder = FFmpegBuilder::new();
        let iterations = 20_000;
        let p_trim = json!({ "start": 10.0, "end": 25.0 });
        let p_wm = json!({ "watermark_file": "logo.png", "opacity": 80, "size": 20, "x_pct": 90, "y_pct": 90 });
        let p_blur = json!({ "effect": "blur", "intensity": 50, "x": 100, "y": 100, "w": 200, "h": 200 });
        let p_norm = json!({ "i": -14.0, "tp": -1.0, "lra": 11.0 });

        let start = Instant::now();
        for _ in 0..iterations {
            let _ = builder.build_command("trim", "input.mp4", &p_trim, None);
            let _ = builder.build_command("add_watermark", "input.mp4", &p_wm, None);
            let _ = builder.build_command("blur_video", "input.mp4", &p_blur, None);
            let _ = builder.build_command("normalize_audio", "input.mp4", &p_norm, None);
        }
        let elapsed = start.elapsed();
        let total_ops = iterations * 4;
        let ops_per_sec = (total_ops as f64) / elapsed.as_secs_f64();
        let avg_us = elapsed.as_micros() as f64 / (total_ops as f64);
        println!("\n=== RUST COMMAND CREATION BENCHMARK ===");
        println!("Generated {} complex FFmpeg commands in {:.2?}", total_ops, elapsed);
        println!("Throughput:  {:.0} commands/sec", ops_per_sec);
        println!("Avg Latency: {:.2} µs per command\n", avg_us);
        assert!(total_ops > 0);
    }
}
