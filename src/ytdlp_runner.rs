use crate::config::AppConfig;
use serde_json::{json, Value};
use std::fs;
use std::path::Path;
use std::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

pub fn analyze_url(params: &Value) -> Result<Value, String> {
    let cfg = AppConfig::load();
    let ytdlp = cfg.ytdlp_exe();
    let url = params["url"]
        .as_str()
        .ok_or_else(|| "URL не указан".to_string())?
        .trim();
    if url.is_empty() {
        return Err("URL не может быть пустым".to_string());
    }
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err("Разрешены только веб-ссылки http:// и https://".to_string());
    }

    let mut cmd = Command::new(&ytdlp);
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let deno_exe = cfg.deno_exe();
    let js_runtime = if Path::new(&deno_exe).exists() {
        format!("deno:{}", deno_exe)
    } else {
        "node".to_string()
    };

    cmd.args([
        "--dump-single-json",
        "--skip-download",
        "--no-playlist",
        "--no-warnings",
        "--socket-timeout", "15",
        "--js-runtimes",
        &js_runtime,
    ]);

    let ffmpeg_dir = if !cfg.ffmpeg_dir.is_empty() && cfg.ffmpeg_dir != "PATH" {
        cfg.ffmpeg_dir.clone()
    } else {
        Path::new(&cfg.ffmpeg_exe())
            .parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default()
    };
    if !ffmpeg_dir.is_empty() && Path::new(&ffmpeg_dir).exists() {
        cmd.args(["--ffmpeg-location", &ffmpeg_dir]);
    }

    let cookie_source = params["cookie_source"]
        .as_str()
        .unwrap_or(&cfg.cookie_source);
    let cookie_file = params["cookie_file"]
        .as_str()
        .unwrap_or(&cfg.cookie_file);

    if cookie_source == "file" {
        if !cookie_file.is_empty() && Path::new(cookie_file).exists() {
            cmd.args(["--cookies", cookie_file]);
        }
    } else if cookie_source.to_lowercase() != "none" && !cookie_source.is_empty() {
        cmd.args(["--cookies-from-browser", cookie_source]);
    }

    cmd.arg("--");
    cmd.arg(url);

    let output = cmd.output().map_err(|e| format!("Не удалось запустить yt-dlp: {}", e))?;
    if !output.status.success() {
        let err_msg = String::from_utf8_lossy(&output.stderr);
        let first_err = err_msg.lines().rfind(|l| l.contains("ERROR:")).unwrap_or(&err_msg);
        return Err(first_err.trim().to_string());
    }

    let raw: Value = serde_json::from_slice(&output.stdout)
        .map_err(|e| format!("Ошибка парсинга метаданных: {}", e))?;

    let title = raw["title"].as_str().unwrap_or("Без названия").to_string();
    let uploader = raw["uploader"].as_str().or_else(|| raw["channel"].as_str()).unwrap_or("").to_string();
    let view_count = raw["view_count"].as_i64().unwrap_or(0);
    let duration = raw["duration_string"].as_str().unwrap_or("").to_string();
    let duration_sec = raw["duration"].as_f64().unwrap_or(0.0);
    let thumbnail = raw["thumbnail"].as_str().unwrap_or("").to_string();

    let mut video_formats = Vec::new();
    let mut audio_formats = Vec::new();

    if let Some(formats) = raw["formats"].as_array() {
        for f in formats {
            let format_id = f["format_id"].as_str().unwrap_or("").to_string();
            let ext = f["ext"].as_str().unwrap_or("mp4").to_string();
            let vcodec = f["vcodec"].as_str().unwrap_or("none");
            let acodec = f["acodec"].as_str().unwrap_or("none");
            let height = f["height"].as_f64().unwrap_or(0.0).round() as i64;
            let fps = f["fps"].as_f64().unwrap_or(0.0).round() as i64;
            let filesize = f["filesize"]
                .as_f64()
                .or_else(|| f["filesize_approx"].as_f64())
                .unwrap_or(0.0)
                .round() as i64;
            let size_mb = if filesize > 0 {
                (filesize as f64 / (1024.0 * 1024.0) * 10.0).round() / 10.0
            } else {
                0.0
            };

            if vcodec != "none" {
                let codec_short = if vcodec.contains("vp9") {
                    "VP9"
                } else if vcodec.contains("av01") {
                    "AV1"
                } else if vcodec.contains("avc") || vcodec.contains("h264") {
                    "H.264"
                } else {
                    vcodec
                };

                let res_label = match height {
                    2160 => "4K (2160p)",
                    1440 => "2K (1440p)",
                    1080 => "1080p (Full HD)",
                    720 => "720p (HD)",
                    480 => "480p",
                    360 => "360p",
                    240 => "240p",
                    144 => "144p",
                    _ if height > 0 => &format!("{}p", height),
                    _ => "Video",
                };

                let size_str = if size_mb > 0.0 { format!("{} MB", size_mb) } else { "—".to_string() };
                let fps_str = if fps > 0 { format!("{}fps • ", fps) } else { "".to_string() };

                let label = format!("{} • {}{} • {} • {} • #{}", res_label, fps_str, codec_short, ext.to_uppercase(), size_str, format_id);

                video_formats.push(json!({
                    "format_id": format_id,
                    "height": height,
                    "resolution": res_label,
                    "fps": fps,
                    "codec": codec_short,
                    "ext": ext,
                    "size_mb": size_mb,
                    "label": label
                }));
            } else if acodec != "none" {
                let abr = f["abr"]
                    .as_f64()
                    .or_else(|| f["tbr"].as_f64())
                    .unwrap_or(0.0)
                    .round() as i64;
                let codec_short = if acodec.contains("opus") {
                    "Opus"
                } else if acodec.contains("mp4a") || acodec.contains("aac") {
                    "AAC"
                } else {
                    acodec
                };

                let size_str = if size_mb > 0.0 { format!("{} MB", size_mb) } else { "—".to_string() };
                let abr_str = if abr > 0 { format!("{} kbps • ", abr) } else { "".to_string() };

                let label = format!("{}• {} • {} • {} • #{}", abr_str, codec_short, ext.to_uppercase(), size_str, format_id);

                audio_formats.push(json!({
                    "format_id": format_id,
                    "abr": abr,
                    "codec": codec_short,
                    "ext": ext,
                    "size_mb": size_mb,
                    "label": label
                }));
            }
        }
    }

    video_formats.sort_by(|a, b| {
        let ha = a["height"].as_i64().unwrap_or(0);
        let hb = b["height"].as_i64().unwrap_or(0);
        if ha != hb {
            return hb.cmp(&ha);
        }
        let fa = a["fps"].as_i64().unwrap_or(0);
        let fb = b["fps"].as_i64().unwrap_or(0);
        fb.cmp(&fa)
    });

    audio_formats.sort_by(|a, b| {
        let aa = a["abr"].as_i64().unwrap_or(0);
        let ab = b["abr"].as_i64().unwrap_or(0);
        let is_a_drc = a["format_id"].as_str().unwrap_or("").contains("-drc");
        let is_b_drc = b["format_id"].as_str().unwrap_or("").contains("-drc");

        match ab.cmp(&aa) {
            std::cmp::Ordering::Equal => is_a_drc.cmp(&is_b_drc),
            other => other,
        }
    });

    Ok(json!({
        "ok": true,
        "title": title,
        "uploader": uploader,
        "view_count": view_count,
        "duration": duration,
        "duration_sec": duration_sec,
        "thumbnail": thumbnail,
        "video_formats": video_formats,
        "audio_formats": audio_formats
    }))
}

pub fn build_ytdlp_command(params: &Value) -> Result<(Vec<String>, String), String> {
    let cfg = AppConfig::load();
    let ytdlp = cfg.ytdlp_exe();
    let mut cmd = vec![ytdlp];

    let url = params["url"]
        .as_str()
        .ok_or_else(|| "URL не указан".to_string())?
        .trim();
    if url.is_empty() {
        return Err("URL не может быть пустым".to_string());
    }
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err("Разрешены только веб-ссылки http:// и https://".to_string());
    }

    let quality = params["quality"].as_str().unwrap_or("1080p");
    let container = params["format"].as_str().unwrap_or("mp4");
    let out_dir = params["output_dir"]
        .as_str()
        .unwrap_or(&cfg.output_dir)
        .to_string();

    let _ = fs::create_dir_all(&out_dir);

    // Pass ffmpeg location to yt-dlp for muxing and partial section downloading
    let ffmpeg_dir = if !cfg.ffmpeg_dir.is_empty() && cfg.ffmpeg_dir != "PATH" {
        cfg.ffmpeg_dir.clone()
    } else {
        Path::new(&cfg.ffmpeg_exe()).parent().map(|p| p.to_string_lossy().to_string()).unwrap_or_default()
    };
    if !ffmpeg_dir.is_empty() && Path::new(&ffmpeg_dir).exists() {
        cmd.extend(vec!["--ffmpeg-location".to_string(), ffmpeg_dir]);
    }

    // Pass JavaScript runtime to solve YouTube n-challenge
    let deno_exe = cfg.deno_exe();
    let js_runtime = if Path::new(&deno_exe).exists() {
        format!("deno:{}", deno_exe)
    } else {
        "node".to_string()
    };
    cmd.extend(vec!["--js-runtimes".to_string(), js_runtime]);

    // Cookie configuration
    let cookie_source = params["cookie_source"]
        .as_str()
        .unwrap_or(&cfg.cookie_source);
    let cookie_file = params["cookie_file"]
        .as_str()
        .unwrap_or(&cfg.cookie_file);

    if cookie_source == "file" {
        if !cookie_file.is_empty() && Path::new(cookie_file).exists() {
            cmd.extend(vec!["--cookies".to_string(), cookie_file.to_string()]);
        }
    } else if cookie_source.to_lowercase() != "none" && !cookie_source.is_empty() {
        cmd.extend(vec!["--cookies-from-browser".to_string(), cookie_source.to_string()]);
    }

    // Format & Quality selection with resilient fallback chains
    let is_audio_only = params["extract_audio"].as_bool().unwrap_or(false);
    let height = params["height"].as_i64().unwrap_or(0);

    let format_arg = if is_audio_only {
        if let Some(custom_fmt) = params["format_id"].as_str().filter(|s| !s.is_empty()) {
            let base_aid = custom_fmt.replace("-drc", "");
            if base_aid != custom_fmt {
                format!("{}/{}/bestaudio/best", custom_fmt, base_aid)
            } else {
                format!("{}/bestaudio/best", custom_fmt)
            }
        } else {
            "bestaudio/best".to_string()
        }
    } else if let Some(custom_fmt) = params["format_id"].as_str().filter(|s| !s.is_empty()) {
        if custom_fmt.contains('+') {
            let parts: Vec<&str> = custom_fmt.split('+').collect();
            let vid = parts[0].trim();
            let aid = parts[1].trim();
            let base_aid = aid.replace("-drc", "");

            let height_fallback = if height > 0 {
                format!("bestvideo[height<={}]+bestaudio/", height)
            } else {
                String::new()
            };

            if base_aid != aid {
                format!(
                    "{}+{}/{}+{}/{}+bestaudio/bestvideo+{}/bestvideo+{}/{}bestvideo+bestaudio/best",
                    vid, aid, vid, base_aid, vid, aid, base_aid, height_fallback
                )
            } else {
                format!(
                    "{}+{}/{}+bestaudio/bestvideo+{}/{}bestvideo+bestaudio/best",
                    vid, aid, vid, aid, height_fallback
                )
            }
        } else {
            let height_fallback = if height > 0 {
                format!("bestvideo[height<={}]+bestaudio/", height)
            } else {
                String::new()
            };
            format!("{}/{}bestvideo/best", custom_fmt, height_fallback)
        }
    } else {
        match quality {
            "best" => "bestvideo+bestaudio/best".to_string(),
            "4K" => "bestvideo[height<=2160]+bestaudio/best[height<=2160]/best".to_string(),
            "1440p" => "bestvideo[height<=1440]+bestaudio/best[height<=1440]/best".to_string(),
            "1080p" => "bestvideo[height<=1080]+bestaudio/best[height<=1080]/best".to_string(),
            "720p" => "bestvideo[height<=720]+bestaudio/best[height<=720]/best".to_string(),
            "480p" => "bestvideo[height<=480]+bestaudio/best[height<=480]/best".to_string(),
            _ => "bestvideo+bestaudio/best".to_string(),
        }
    };

    cmd.extend(vec![
        "-f".to_string(),
        format_arg,
    ]);

    if params["extract_audio"].as_bool().unwrap_or(false) {
        cmd.extend(vec![
            "-x".to_string(),
            "--audio-format".to_string(),
            "mp3".to_string(),
        ]);
    } else {
        cmd.extend(vec![
            "--merge-output-format".to_string(),
            container.to_string(),
        ]);
    }

    let embed_subs = params["embed_subs"].as_bool().unwrap_or(false);
    let write_subs = params["write_subs"].as_bool().unwrap_or(false);

    if embed_subs || write_subs {
        let sub_langs = params["sub_langs"]
            .as_str()
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .unwrap_or("ru,en");

        cmd.extend(vec![
            "--write-subs".to_string(),
            "--write-auto-subs".to_string(),
            "--sub-format".to_string(),
            "srt/best".to_string(),
            "--convert-subs".to_string(),
            "srt".to_string(),
            "--sub-langs".to_string(),
            sub_langs.to_string(),
        ]);

        if embed_subs {
            cmd.push("--embed-subs".to_string());
        }
    }
    if params["split_chapters"].as_bool().unwrap_or(false) {
        cmd.push("--split-chapters".to_string());
    }
    if params["embed_thumbnail"].as_bool().unwrap_or(false) {
        cmd.push("--embed-thumbnail".to_string());
    }
    if params["embed_metadata"].as_bool().unwrap_or(false) {
        cmd.push("--embed-metadata".to_string());
    }
    if params["sponsorblock"].as_bool().unwrap_or(false) {
        cmd.extend(vec!["--sponsorblock-remove".to_string(), "all".to_string()]);
    }

    // Timecode sections trimming (only when a genuine slice is requested)
    let start_time = params["start_time"].as_str().unwrap_or("").trim();
    let end_time = params["end_time"].as_str().unwrap_or("").trim();
    let is_zero_start = start_time.is_empty() || start_time == "0" || start_time == "00:00:00" || start_time == "00:00" || start_time == "0:00";
    let is_empty_end = end_time.is_empty() || end_time == "inf";

    if !(is_zero_start && is_empty_end) {
        let s = if start_time.is_empty() { "0" } else { start_time };
        let e = if end_time.is_empty() { "inf" } else { end_time };
        cmd.extend(vec![
            "--download-sections".to_string(),
            format!("*{}-{}", s, e),
        ]);
        // NOTE: We do NOT pass --force-keyframes-at-cuts because it forces ffmpeg
        // to re-encode the entire video with CPU libx264 at 90-100% CPU.
    }

    // Output template with 120 char max title length to prevent Windows MAX_PATH overflow
    let out_template = Path::new(&out_dir)
        .join("%(title).120s [%(id)s].%(ext)s")
        .to_string_lossy()
        .to_string();

    cmd.extend(vec![
        "-P".to_string(),
        out_dir.clone(),
        "-o".to_string(),
        out_template,
        "--no-playlist".to_string(),
        "--socket-timeout".to_string(),
        "30".to_string(),
        "--newline".to_string(),
        "--progress".to_string(),
        "--no-colors".to_string(),
        "--print".to_string(),
        "after_move:__FINAL_OUT__:%(filepath)s".to_string(),
        "--".to_string(),
        url.to_string(),
    ]);

    Ok((cmd, out_dir))
}

/// Detects the video platform name from a URL for dynamic UI status display.
pub fn detect_platform(url: &str) -> String {
    let lower = url.to_lowercase();
    let trimmed = lower.trim();

    // Extract domain part
    let host_part = if let Some(pos) = trimmed.find("://") {
        &trimmed[pos + 3..]
    } else {
        trimmed
    };
    let host_and_port = host_part.split('/').next().unwrap_or(host_part);
    let host = host_and_port.split(':').next().unwrap_or(host_and_port);
    let clean_host = host.trim_start_matches("www.");

    // Match well-known services
    if clean_host.contains("youtube.com")
        || clean_host.contains("youtu.be")
        || clean_host.contains("youtube-nocookie.com")
    {
        return "YouTube".to_string();
    }
    if clean_host.contains("twitch.tv") {
        return "Twitch".to_string();
    }
    if clean_host.contains("rutube.ru") {
        return "Rutube".to_string();
    }
    if clean_host.contains("vk.com") || clean_host.contains("vkvideo.ru") {
        return "VK Видео".to_string();
    }
    if clean_host.contains("tiktok.com") {
        return "TikTok".to_string();
    }
    if clean_host.contains("instagram.com") || clean_host.contains("instagr.am") {
        return "Instagram".to_string();
    }
    if clean_host == "x.com" || clean_host.ends_with(".x.com") || clean_host.contains("twitter.com") {
        return "X (Twitter)".to_string();
    }
    if clean_host.contains("vimeo.com") {
        return "Vimeo".to_string();
    }
    if clean_host.contains("bilibili.com") || clean_host.contains("b23.tv") {
        return "Bilibili".to_string();
    }
    if clean_host.contains("reddit.com") || clean_host.contains("redd.it") {
        return "Reddit".to_string();
    }
    if clean_host.contains("facebook.com") || clean_host.contains("fb.watch") || clean_host.contains("fb.com") {
        return "Facebook".to_string();
    }
    if clean_host.contains("dzen.ru") || clean_host.contains("zen.yandex") {
        return "Дзен".to_string();
    }
    if clean_host.contains("ok.ru") || clean_host.contains("odnoklassniki.ru") {
        return "Одноклассники".to_string();
    }
    if clean_host.contains("kick.com") {
        return "Kick".to_string();
    }
    if clean_host.contains("soundcloud.com") {
        return "SoundCloud".to_string();
    }
    if clean_host.contains("pinterest.com") || clean_host.contains("pin.it") {
        return "Pinterest".to_string();
    }
    if clean_host.contains("loom.com") {
        return "Loom".to_string();
    }
    if clean_host.contains("coub.com") {
        return "Coub".to_string();
    }
    if clean_host.contains("dailymotion.com") || clean_host.contains("dai.ly") {
        return "Dailymotion".to_string();
    }
    if clean_host.contains("rumble.com") {
        return "Rumble".to_string();
    }
    if clean_host.contains("streamable.com") {
        return "Streamable".to_string();
    }

    // Generic fallback: derive name from host
    let parts: Vec<&str> = clean_host.split('.').collect();
    if parts.len() >= 2 {
        let name_part = parts[parts.len() - 2];
        if !name_part.is_empty() {
            let mut c = name_part.chars();
            let capitalized = match c.next() {
                None => String::new(),
                Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
            };
            return capitalized;
        }
    } else if !clean_host.is_empty() {
        let mut c = clean_host.chars();
        return match c.next() {
            None => "URL".to_string(),
            Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
        };
    }

    "URL".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_ytdlp_command_template_and_timeout() {
        let params = json!({
            "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "format_id": "137+140"
        });
        let (cmd, _out) = build_ytdlp_command(&params).unwrap();
        assert!(cmd.iter().any(|arg| arg.contains("%(title).120s")));
        let timeout_idx = cmd.iter().position(|arg| arg == "--socket-timeout").unwrap();
        assert_eq!(cmd[timeout_idx + 1], "30");
        let format_idx = cmd.iter().position(|arg| arg == "-f").unwrap();
        assert!(cmd[format_idx + 1].starts_with("137+140/"));
        assert!(cmd[format_idx + 1].ends_with("bestvideo+bestaudio/best"));
    }

    #[test]
    fn test_build_ytdlp_command_drc_fallback() {
        let params = json!({
            "url": "https://www.youtube.com/watch?v=test",
            "format_id": "299+249-drc"
        });
        let (cmd, _out) = build_ytdlp_command(&params).unwrap();
        let format_idx = cmd.iter().position(|arg| arg == "-f").unwrap();
        let fmt = &cmd[format_idx + 1];
        assert!(fmt.contains("299+249-drc"));
        assert!(fmt.contains("299+249"));
        assert!(fmt.contains("bestvideo+bestaudio/best"));
    }

    #[test]
    fn test_build_ytdlp_command_best_mode() {
        let params = json!({
            "url": "https://www.youtube.com/watch?v=test",
            "quality": "best"
        });
        let (cmd, _out) = build_ytdlp_command(&params).unwrap();
        let format_idx = cmd.iter().position(|arg| arg == "-f").unwrap();
        assert_eq!(cmd[format_idx + 1], "bestvideo+bestaudio/best");
    }

    #[test]
    fn test_detect_platform() {
        assert_eq!(detect_platform("https://www.youtube.com/watch?v=5it4hn6M8LE"), "YouTube");
        assert_eq!(detect_platform("https://youtu.be/5it4hn6M8LE"), "YouTube");
        assert_eq!(detect_platform("https://www.twitch.tv/shroud"), "Twitch");
        assert_eq!(detect_platform("https://clips.twitch.tv/AmazingClip"), "Twitch");
        assert_eq!(detect_platform("https://rutube.ru/video/123"), "Rutube");
        assert_eq!(detect_platform("https://vkvideo.ru/video-123_456"), "VK Видео");
        assert_eq!(detect_platform("https://vk.com/video-123_456"), "VK Видео");
        assert_eq!(detect_platform("https://www.tiktok.com/@user/video/123"), "TikTok");
        assert_eq!(detect_platform("https://x.com/elonmusk/status/123"), "X (Twitter)");
        assert_eq!(detect_platform("https://vimeo.com/12345678"), "Vimeo");
        assert_eq!(detect_platform("https://unknown-platform.org/watch?v=1"), "Unknown-platform");
        assert_eq!(detect_platform(""), "URL");
    }

    #[test]
    fn test_build_ytdlp_command_subs_and_chapters() {
        let params_default = json!({
            "url": "https://www.youtube.com/watch?v=test"
        });
        let (cmd_default, _out) = build_ytdlp_command(&params_default).unwrap();
        assert!(!cmd_default.iter().any(|a| a == "--write-subs"));
        assert!(!cmd_default.iter().any(|a| a == "--split-chapters"));

        let params_custom = json!({
            "url": "https://www.youtube.com/watch?v=test",
            "write_subs": true,
            "sub_langs": "ru,en",
            "split_chapters": true
        });
        let (cmd, _out) = build_ytdlp_command(&params_custom).unwrap();
        assert!(cmd.iter().any(|a| a == "--write-subs"));
        assert!(cmd.iter().any(|a| a == "--write-auto-subs"));
        assert!(cmd.iter().any(|a| a == "--sub-format"));
        assert!(cmd.iter().any(|a| a == "srt/best"));
        assert!(cmd.iter().any(|a| a == "--convert-subs"));
        assert!(cmd.iter().any(|a| a == "srt"));
        assert!(cmd.iter().any(|a| a == "--sub-langs"));
        let langs_idx = cmd.iter().position(|a| a == "--sub-langs").unwrap();
        assert_eq!(cmd[langs_idx + 1], "ru,en");
        assert!(cmd.iter().any(|a| a == "--split-chapters"));

        // Default sub_langs fallback
        let params_default_langs = json!({
            "url": "https://www.youtube.com/watch?v=test",
            "write_subs": true
        });
        let (cmd_langs, _out) = build_ytdlp_command(&params_default_langs).unwrap();
        let default_langs_idx = cmd_langs.iter().position(|a| a == "--sub-langs").unwrap();
        assert_eq!(cmd_langs[default_langs_idx + 1], "ru,en");
    }
}
