use crate::config::AppConfig;
use serde_json::{json, Value};
use std::fs;
use std::path::Path;
use std::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

pub fn get_media_info(filepath: &str) -> Value {
    let p = Path::new(filepath);
    if !p.exists() {
        return json!({
            "ok": false,
            "error": format!("Файл не найден: {}", filepath)
        });
    }

    let cfg = AppConfig::load();
    let ffprobe_exe = cfg.ffprobe_exe();

    let mut cmd = Command::new(&ffprobe_exe);
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd.args(&[
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        filepath,
    ]);

    let output = match cmd.output() {
        Ok(out) => out,
        Err(e) => {
            return json!({
                "ok": false,
                "error": format!("Не удалось запустить ffprobe: {}", e)
            });
        }
    };

    if !output.status.success() {
        return json!({
            "ok": false,
            "error": "ffprobe завершился с ошибкой"
        });
    }

    let raw: Value = match serde_json::from_slice(&output.stdout) {
        Ok(v) => v,
        Err(e) => {
            return json!({
                "ok": false,
                "error": format!("Ошибка парсинга JSON ffprobe: {}", e)
            });
        }
    };

    let streams = raw["streams"].as_array();
    let format = &raw["format"];

    let mut video_info = Value::Null;
    let mut audio_info = Value::Null;

    if let Some(stream_list) = streams {
        for s in stream_list {
            let codec_type = s["codec_type"].as_str().unwrap_or("");
            if codec_type == "video" && video_info.is_null() {
                let w = s["width"].as_i64().unwrap_or(0);
                let h = s["height"].as_i64().unwrap_or(0);
                let fps = parse_fps(s["r_frame_rate"].as_str().unwrap_or(""));

                let aspect = if w > 0 && h > 0 {
                    format!("{}:{}", w, h)
                } else {
                    "".to_string()
                };

                video_info = json!({
                    "codec": s["codec_name"].as_str().unwrap_or(""),
                    "codec_long": s["codec_long_name"].as_str().unwrap_or(""),
                    "width": w,
                    "height": h,
                    "resolution": format!("{}x{}", w, h),
                    "fps": fps,
                    "aspect_ratio": aspect,
                    "pix_fmt": s["pix_fmt"].as_str().unwrap_or("")
                });
            } else if codec_type == "audio" && audio_info.is_null() {
                let sr = s["sample_rate"].as_str().and_then(|r| r.parse::<i64>().ok()).unwrap_or(0);
                let ch = s["channels"].as_i64().unwrap_or(0);
                let br = s["bit_rate"].as_str().and_then(|b| b.parse::<f64>().ok()).unwrap_or(0.0) / 1000.0;

                audio_info = json!({
                    "codec": s["codec_name"].as_str().unwrap_or(""),
                    "codec_long": s["codec_long_name"].as_str().unwrap_or(""),
                    "sample_rate": sr,
                    "channels": ch,
                    "bitrate_kbps": br.round() as i64
                });
            }
        }
    }

    let duration_sec = format["duration"].as_str().and_then(|d| d.parse::<f64>().ok()).unwrap_or(0.0);
    let size_bytes = fs::metadata(p).map(|m| m.len()).unwrap_or(0);
    let size_mb = (size_bytes as f64 / (1024.0 * 1024.0) * 100.0).round() / 100.0;
    let bitrate = format["bit_rate"].as_str().and_then(|b| b.parse::<f64>().ok()).unwrap_or(0.0) / 1000.0;

    let format_name = format["format_long_name"].as_str().unwrap_or(
        format["format_name"].as_str().unwrap_or("")
    );

    let tags = format["tags"].as_object();
    let title = tags.and_then(|t| t.get("title")).and_then(|v| v.as_str()).unwrap_or("");
    let artist = tags.and_then(|t| t.get("artist")).and_then(|v| v.as_str()).unwrap_or("");
    let comment = tags.and_then(|t| t.get("comment")).and_then(|v| v.as_str()).unwrap_or("");
    let date = tags.and_then(|t| t.get("date")).and_then(|v| v.as_str()).unwrap_or("");

    json!({
        "ok": true,
        "filename": p.file_name().unwrap_or_default().to_string_lossy(),
        "path": filepath,
        "size_bytes": size_bytes,
        "size_mb": size_mb,
        "duration": (duration_sec * 10.0).round() / 10.0,
        "duration_str": format_duration(duration_sec),
        "bitrate_kbps": bitrate.round() as i64,
        "format_name": format_name,
        "video": video_info,
        "audio": audio_info,
        "tags": {
            "title": title,
            "artist": artist,
            "comment": comment,
            "date": date
        }
    })
}

fn parse_fps(val: &str) -> f64 {
    if let Some((num, den)) = val.split_once('/') {
        if let (Ok(n), Ok(d)) = (num.parse::<f64>(), den.parse::<f64>()) {
            if d > 0.0 {
                return (n / d * 100.0).round() / 100.0;
            }
        }
    }
    val.parse::<f64>().unwrap_or(30.0)
}

fn format_duration(sec: f64) -> String {
    let s = sec as u64;
    let h = s / 3600;
    let m = (s % 3600) / 60;
    let sec_rem = s % 60;
    if h > 0 {
        format!("{:02}:{:02}:{:02}", h, m, sec_rem)
    } else {
        format!("{:02}:{:02}", m, sec_rem)
    }
}
