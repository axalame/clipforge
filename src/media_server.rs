use crate::config::AppConfig;
use percent_encoding::percent_decode_str;
use rust_embed::RustEmbed;
use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicU16, Ordering};
use std::sync::Arc;
use std::thread;
use tiny_http::{Header, Response, Server, StatusCode};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;
static SERVER_PORT: AtomicU16 = AtomicU16::new(0);

#[derive(RustEmbed)]
#[folder = "frontend/dist/"]
struct Asset;

pub fn start_media_server() -> String {
    let current = SERVER_PORT.load(Ordering::SeqCst);
    if current != 0 {
        return format!("http://127.0.0.1:{}", current);
    }

    let server = Arc::new(Server::http("127.0.0.1:0").unwrap_or_else(|e| {
        eprintln!("Warning: Dynamic port binding failed ({}), trying port 12633...", e);
        Server::http("127.0.0.1:12633").unwrap_or_else(|e2| {
            panic!("Critical: Failed to bind local media server: {}", e2);
        })
    }));
    let port = server.server_addr().to_ip().map(|ip| ip.port()).unwrap_or(0);
    SERVER_PORT.store(port, Ordering::SeqCst);

    let server_clone = server.clone();
    thread::spawn(move || {
        for request in server_clone.incoming_requests() {
            let server_ref = server_clone.clone();
            thread::spawn(move || {
                let _ = handle_request(request);
                drop(server_ref);
            });
        }
    });

    format!("http://127.0.0.1:{}", port)
}

pub fn get_media_server_url() -> String {
    let port = SERVER_PORT.load(Ordering::SeqCst);
    if port == 0 {
        start_media_server()
    } else {
        format!("http://127.0.0.1:{}", port)
    }
}

fn is_safe_file_path(path_str: &str) -> bool {
    if path_str.trim().is_empty() {
        return false;
    }
    // Block Windows SMB / UNC paths to prevent NTLM reflection attacks
    if path_str.starts_with(r"\\") || path_str.starts_with("//") {
        return false;
    }
    if path_str.contains('\0') {
        return false;
    }
    Path::new(path_str).is_file()
}

fn is_allowed_ext(path_str: &str, allowed: &[&str]) -> bool {
    let ext = Path::new(path_str)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    allowed.contains(&ext.as_str())
}

const ALLOWED_IMAGES: &[&str] = &["jpg", "jpeg", "png", "webp", "gif", "svg", "bmp", "ico"];
const ALLOWED_MEDIA: &[&str] = &[
    "mp4", "mkv", "webm", "mov", "avi", "flv", "wmv", "ts", "m4v",
    "mp3", "wav", "ogg", "m4a", "flac", "aac", "opus"
];

fn get_frontend_dist_dir() -> Option<PathBuf> {
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(parent) = exe_path.parent() {
            let p = parent.join("frontend").join("dist");
            if p.is_dir() {
                if let Ok(can) = p.canonicalize() {
                    return Some(can);
                }
            }
        }
    }
    let p = Path::new("frontend/dist");
    if p.is_dir() {
        if let Ok(can) = p.canonicalize() {
            return Some(can);
        }
    }
    None
}

fn handle_request(request: tiny_http::Request) -> Result<(), ()> {
    let url_raw = request.url();
    let (path, query) = match url_raw.split_once('?') {
        Some((p, q)) => (p, q),
        None => (url_raw, ""),
    };

    let params: Vec<(String, String)> = query
        .split('&')
        .filter_map(|pair| {
            let mut parts = pair.splitn(2, '=');
            let k = parts.next()?;
            let v = parts.next().unwrap_or("");
            let dec_k = percent_decode_str(k).decode_utf8_lossy().to_string();
            let dec_v = percent_decode_str(v).decode_utf8_lossy().to_string();
            Some((dec_k, dec_v))
        })
        .collect();

    let get_param = |name: &str| -> Option<String> {
        params.iter().find(|(k, _)| k == name).map(|(_, v)| v.clone())
    };

    if request.method().as_str() == "OPTIONS" {
        let resp = Response::empty(200)
            .with_header(header("Access-Control-Allow-Origin", "*"))
            .with_header(header("Access-Control-Allow-Methods", "GET, OPTIONS"))
            .with_header(header("Access-Control-Allow-Headers", "*"));
        let _ = request.respond(resp);
        return Ok(());
    }

    if path == "/health" {
        let resp = Response::from_string("{\"status\":\"ok\"}")
            .with_header(header("Content-Type", "application/json"));
        let _ = request.respond(resp);
        return Ok(());
    }

    if path == "/frame" {
        let file_path = match get_param("path") {
            Some(p) if is_safe_file_path(&p) && is_allowed_ext(&p, ALLOWED_MEDIA) => p,
            _ => {
                let _ = request.respond(Response::empty(404));
                return Ok(());
            }
        };

        let t_val = get_param("t").unwrap_or_else(|| "0.5".to_string());
        let cfg = AppConfig::load();
        let ffmpeg = cfg.ffmpeg_exe();

        let mut cmd = Command::new(ffmpeg);
        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.args(&[
            "-y",
            "-ss", &t_val,
            "-i", &file_path,
            "-vframes", "1",
            "-f", "image2pipe",
            "-vcodec", "mjpeg",
            "-q:v", "3",
            "-",
        ]);
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::null());

        if let Ok(out) = cmd.output() {
            if out.status.success() && !out.stdout.is_empty() {
                let resp = Response::from_data(out.stdout)
                    .with_header(header("Access-Control-Allow-Origin", "*"))
                    .with_header(header("Content-Type", "image/jpeg"))
                    .with_header(header("Cache-Control", "public, max-age=300"));
                let _ = request.respond(resp);
                return Ok(());
            }
        }
        let _ = request.respond(Response::empty(500));
        return Ok(());
    }

    if path == "/image" {
        let file_path = match get_param("path") {
            Some(p) if is_safe_file_path(&p) && is_allowed_ext(&p, ALLOWED_IMAGES) => p,
            _ => {
                let _ = request.respond(Response::empty(404));
                return Ok(());
            }
        };

        let ext = Path::new(&file_path)
            .extension()
            .unwrap_or_default()
            .to_string_lossy()
            .to_lowercase();

        let mime = match ext.as_str() {
            "jpg" | "jpeg" => "image/jpeg",
            "webp" => "image/webp",
            "gif" => "image/gif",
            "svg" => "image/svg+xml",
            _ => "image/png",
        };

        if let Ok(data) = std::fs::read(&file_path) {
            let resp = Response::from_data(data)
                .with_header(header("Access-Control-Allow-Origin", "*"))
                .with_header(header("Content-Type", mime))
                .with_header(header("Cache-Control", "private, max-age=3600"));
            let _ = request.respond(resp);
            return Ok(());
        }
        let _ = request.respond(Response::empty(500));
        return Ok(());
    }

    if path == "/video" {
        let file_path = match get_param("path") {
            Some(p) if is_safe_file_path(&p) && is_allowed_ext(&p, ALLOWED_MEDIA) => p,
            _ => {
                let _ = request.respond(Response::empty(404));
                return Ok(());
            }
        };

        let file_size = match std::fs::metadata(&file_path) {
            Ok(m) => m.len(),
            Err(_) => {
                let _ = request.respond(Response::empty(404));
                return Ok(());
            }
        };

        let ext = Path::new(&file_path)
            .extension()
            .unwrap_or_default()
            .to_string_lossy()
            .to_lowercase();

        let mime = match ext.as_str() {
            "webm" => "video/webm",
            "mkv" => "video/x-matroska",
            "mov" => "video/quicktime",
            "avi" => "video/x-msvideo",
            "mp3" => "audio/mpeg",
            "wav" => "audio/wav",
            "ogg" => "audio/ogg",
            _ => "video/mp4",
        };

        let range_header = request
            .headers()
            .iter()
            .find(|h| h.field.equiv("Range"))
            .map(|h| h.value.as_str().to_string());

        if let Some(ref range_str) = range_header {
            if let Some(range_val) = range_str.strip_prefix("bytes=") {
                let mut parts = range_val.splitn(2, '-');
                let start: u64 = parts.next().and_then(|s| s.parse().ok()).unwrap_or(0);
                if start >= file_size {
                    let resp = Response::empty(StatusCode(416))
                        .with_header(header("Access-Control-Allow-Origin", "*"))
                        .with_header(header("Content-Range", &format!("bytes */{}", file_size)));
                    let _ = request.respond(resp);
                    return Ok(());
                }

                let end: u64 = parts
                    .next()
                    .and_then(|s| if s.is_empty() { None } else { s.parse().ok() })
                    .unwrap_or(file_size.saturating_sub(1));
                let max_slice: u64 = 2 * 1024 * 1024; // 2 MB max per HTTP range slice
                let end = end.min(start + max_slice - 1).min(file_size.saturating_sub(1));

                if start <= end && start < file_size {
                    let length = end - start + 1;
                    if let Ok(mut f) = File::open(&file_path) {
                        if f.seek(SeekFrom::Start(start)).is_ok() {
                            let mut buf = Vec::with_capacity(length as usize);
                            if f.by_ref().take(length).read_to_end(&mut buf).is_ok() && !buf.is_empty() {
                                let actual_len = buf.len() as u64;
                                let actual_end = start + actual_len - 1;
                                let content_range = format!("bytes {}-{}/{}", start, actual_end, file_size);
                                let resp = Response::new(
                                    StatusCode(206),
                                    vec![
                                        header("Access-Control-Allow-Origin", "*"),
                                        header("Content-Type", mime),
                                        header("Accept-Ranges", "bytes"),
                                        header("Content-Range", &content_range),
                                        header("Content-Length", &actual_len.to_string()),
                                    ],
                                    &buf[..],
                                    Some(buf.len()),
                                    None,
                                );
                                let _ = request.respond(resp);
                                return Ok(());
                            }
                        }
                    }
                }
            }
        }

        // Full file response
        if let Ok(f) = File::open(&file_path) {
            let resp = Response::new(
                StatusCode(200),
                vec![
                    header("Access-Control-Allow-Origin", "*"),
                    header("Content-Type", mime),
                    header("Accept-Ranges", "bytes"),
                    header("Content-Length", &file_size.to_string()),
                ],
                f,
                Some(file_size as usize),
                None,
            );
            let _ = request.respond(resp);
            return Ok(());
        }

        let _ = request.respond(Response::empty(500));
        return Ok(());
    }

    // Static Assets serving from frontend/dist (disk override or embedded bundle)
    let raw_rel = path.trim_start_matches('/');
    let rel_path = if raw_rel.is_empty() { "index.html" } else { raw_rel };

    // 1. Check local disk for development, protected against Path Traversal
    if let Some(dist_dir) = get_frontend_dist_dir() {
        let candidate = dist_dir.join(rel_path);
        if let Ok(canonical) = candidate.canonicalize() {
            if canonical.starts_with(&dist_dir) && canonical.is_file() {
                if let Ok(data) = std::fs::read(&canonical) {
                    let mime = get_mime_type(rel_path);
                    let resp = Response::from_data(data)
                        .with_header(header("Content-Type", mime));
                    let _ = request.respond(resp);
                    return Ok(());
                }
            }
        }
        // If file not found on disk, but path is a SPA client-side route, fallback to disk index.html
        if !rel_path.contains('.') {
            let disk_index = dist_dir.join("index.html");
            if disk_index.is_file() {
                if let Ok(data) = std::fs::read(&disk_index) {
                    let resp = Response::from_data(data)
                        .with_header(header("Content-Type", "text/html; charset=utf-8"));
                    let _ = request.respond(resp);
                    return Ok(());
                }
            }
        }
    }

    // 2. Check embedded assets
    if let Some(file) = Asset::get(rel_path) {
        let mime = get_mime_type(rel_path);
        let resp = Response::from_data(file.data)
            .with_header(header("Content-Type", mime));
        let _ = request.respond(resp);
        return Ok(());
    }

    // 3. Fallback to index.html for SPA client-side routing
    if let Some(file) = Asset::get("index.html") {
        let resp = Response::from_data(file.data)
            .with_header(header("Content-Type", "text/html; charset=utf-8"));
        let _ = request.respond(resp);
        return Ok(());
    }

    let _ = request.respond(Response::empty(404));
    Ok(())
}

fn get_mime_type(file_path: &str) -> &'static str {
    let p = Path::new(file_path);
    let ext = p.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
    match ext.as_str() {
        "html" => "text/html; charset=utf-8",
        "js" | "mjs" => "application/javascript; charset=utf-8",
        "css" => "text/css; charset=utf-8",
        "json" => "application/json; charset=utf-8",
        "svg" => "image/svg+xml",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "ico" => "image/x-icon",
        "woff" => "font/woff",
        "woff2" => "font/woff2",
        "ttf" => "font/ttf",
        "wasm" => "application/wasm",
        _ => "application/octet-stream",
    }
}

fn header(name: &str, val: &str) -> Header {
    let clean_val = val.replace(['\r', '\n'], "");
    Header::from_bytes(name.as_bytes(), clean_val.as_bytes())
        .unwrap_or_else(|_| Header::from_bytes(b"X-Safe", b"Safe").unwrap())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_header_sanitization_newlines() {
        let h = header("Content-Type", "video/mp4\r\nInjected: malicious");
        let val_str = h.value.as_str();
        assert!(!val_str.contains('\r'));
        assert!(!val_str.contains('\n'));
        assert!(val_str.contains("video/mp4"));
    }

    #[test]
    fn test_header_normal() {
        let h = header("Content-Type", "application/json");
        assert_eq!(h.value.as_str(), "application/json");
    }

    #[test]
    fn test_mime_types() {
        assert_eq!(get_mime_type("index.html"), "text/html; charset=utf-8");
        assert_eq!(get_mime_type("assets/app.js"), "application/javascript; charset=utf-8");
        assert_eq!(get_mime_type("assets/style.css"), "text/css; charset=utf-8");
        assert_eq!(get_mime_type("logo.svg"), "image/svg+xml");
    }

    #[test]
    fn test_asset_embedded() {
        let files: Vec<String> = Asset::iter().map(|f| f.to_string()).collect();
        println!("Embedded assets: {:?}", files);
        assert!(Asset::get("index.html").is_some(), "index.html must be embedded");
        assert!(files.iter().any(|f| f.starts_with("assets/index")), "assets must be embedded");
    }
}
