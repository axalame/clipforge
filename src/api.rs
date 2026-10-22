use crate::config::AppConfig;
use crate::ffmpeg_builder::FFmpegBuilder;
use crate::media_info::get_media_info;
use crate::media_server::get_media_server_url;
use crate::process_runner::{ProcessCallbacks, ProcessRunner};
use crate::ytdlp_runner::{build_ytdlp_command, detect_platform};
use rfd::FileDialog;
use serde_json::{json, Value};
use std::path::Path;
use std::process::Command;
use std::sync::Arc;
use std::thread;
use tao::event_loop::EventLoopProxy;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Debug)]
pub enum UserEvent {
    EvalJs(String),
    TrayIconEvent(tray_icon::TrayIconEvent),
    MenuEvent(tray_icon::menu::MenuEvent),
    RestoreWindow,
}

pub struct ApiCallbacks {
    proxy: EventLoopProxy<UserEvent>,
}

impl ApiCallbacks {
    pub fn new(proxy: EventLoopProxy<UserEvent>) -> Self {
        Self { proxy }
    }

    fn eval_js(&self, js: String) {
        let _ = self.proxy.send_event(UserEvent::EvalJs(js));
    }
}

impl ProcessCallbacks for ApiCallbacks {
    fn on_progress(&self, data: Value) {
        let payload = serde_json::to_string(&data).unwrap_or_else(|_| "{}".to_string());
        self.eval_js(format!("if (window.onTaskProgress) window.onTaskProgress({});", payload));
    }

    fn on_log(&self, line: &str) {
        let payload = serde_json::to_string(line).unwrap_or_default();
        self.eval_js(format!("if (window.onTaskLog) window.onTaskLog({});", payload));
    }

    fn on_success(&self, output_file: &str, message: &str) {
        let payload = serde_json::to_string(&json!({
            "output": output_file,
            "message": message
        })).unwrap_or_default();
        self.eval_js(format!("if (window.onTaskComplete) window.onTaskComplete({});", payload));
    }

    fn on_error(&self, error: &str) {
        let payload = serde_json::to_string(&json!({
            "error": error
        })).unwrap_or_default();
        self.eval_js(format!("if (window.onTaskError) window.onTaskError({});", payload));
    }

    fn on_cancel(&self) {
        self.eval_js("if (window.onTaskCancelled) window.onTaskCancelled();".to_string());
    }
}

pub struct Api {
    runner: ProcessRunner,
    proxy: EventLoopProxy<UserEvent>,
}

impl Api {
    pub fn new(proxy: EventLoopProxy<UserEvent>) -> Self {
        Self {
            runner: ProcessRunner::new(),
            proxy,
        }
    }

    pub fn handle_rpc(&self, method: &str, args: &Value) -> Value {
        match method {
            "get_config" => self.get_config(),
            "save_config" => {
                let data = args.get(0).unwrap_or(&Value::Null);
                self.save_config(data)
            }
            "select_files" => self.select_files(),
            "select_watermark_file" => self.select_watermark_file(),
            "select_audio_file" => self.select_audio_file(),
            "select_cookies_file" => self.select_cookies_file(),
            "select_folder" => self.select_folder(),
            "get_media_info" => {
                let path = args.get(0).and_then(|v| v.as_str()).unwrap_or("");
                get_media_info(path)
            }
            "preview_file" => {
                let path = args.get(0).and_then(|v| v.as_str()).unwrap_or("");
                self.preview_file(path)
            }
            "start_operation" => {
                let op = args.get(0).and_then(|v| v.as_str()).unwrap_or("");
                let file = args.get(1).and_then(|v| v.as_str()).unwrap_or("");
                let params = args.get(2).unwrap_or(&Value::Null);
                self.start_operation(op, file, params)
            }
            "start_batch" => {
                let op = args.get(0).and_then(|v| v.as_str()).unwrap_or("");
                let files = args.get(1).cloned().unwrap_or_else(|| json!([]));
                let params = args.get(2).cloned().unwrap_or_else(|| json!({}));
                self.start_batch(op, files, params)
            }
            "start_download" => {
                let params = args.get(0).unwrap_or(&Value::Null);
                self.start_download(params)
            }
            "analyze_url" => {
                let params = args.get(0).unwrap_or(&Value::Null);
                match crate::ytdlp_runner::analyze_url(params) {
                    Ok(val) => val,
                    Err(e) => json!({ "ok": false, "error": e }),
                }
            }
            "open_in_explorer" => {
                let path = args.get(0).and_then(|v| v.as_str()).unwrap_or("");
                self.open_in_explorer(path)
            }
            "delete_file" => {
                let path = args.get(0).and_then(|v| v.as_str()).unwrap_or("");
                self.delete_file(path)
            }
            "update_ytdlp" => self.update_ytdlp(),
            "check_deno_update" => self.check_deno_update(),
            "check_ffmpeg_update" => self.check_ffmpeg_update(),
            "check_app_update" => self.check_app_update(),
            "download_tool" => {
                let name = args.get(0).and_then(|v| v.as_str()).unwrap_or("");
                self.download_tool(name)
            },
            "install_app_update" => {
                let url = args.get(0).and_then(|v| v.as_str()).unwrap_or("");
                self.install_app_update(url)
            }
            "cancel" => self.cancel(),
            _ => json!({ "error": format!("Неизвестный RPC метод: {}", method) }),
        }
    }

    fn update_ytdlp(&self) -> Value {
        let cfg = AppConfig::load();
        let exe = cfg.ytdlp_exe();
        let mut cmd = Command::new(&exe);
        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.arg("-U");

        match cmd.output() {
            Ok(out) => {
                let stdout = String::from_utf8_lossy(&out.stdout);
                let stderr = String::from_utf8_lossy(&out.stderr);
                let msg = if !stdout.trim().is_empty() {
                    stdout.trim().to_string()
                } else {
                    stderr.trim().to_string()
                };
                json!({ "ok": out.status.success(), "msg": msg })
            }
            Err(e) => json!({ "ok": false, "msg": format!("Не удалось запустить обновление: {}", e) }),
        }
    }

    fn check_deno_update(&self) -> Value {
        let cfg = AppConfig::load();
        let exe = cfg.deno_exe();
        let mut cmd = Command::new(&exe);
        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.arg("upgrade");

        match cmd.output() {
            Ok(out) => {
                let stdout = String::from_utf8_lossy(&out.stdout);
                let stderr = String::from_utf8_lossy(&out.stderr);
                let full = format!("{}\n{}", stdout, stderr).trim().to_string();
                let is_latest = full.contains("is the most recent release") || full.contains("up to date");
                let clean_msg = full.lines()
                    .map(|l| l.trim())
                    .filter(|l| !l.is_empty() && !l.starts_with("Looking up"))
                    .collect::<Vec<_>>()
                    .join(". ");
                json!({
                    "ok": out.status.success(),
                    "is_latest": is_latest,
                    "msg": clean_msg
                })
            }
            Err(e) => json!({ "ok": false, "msg": format!("Не удалось проверить обновления Deno: {}", e) }),
        }
    }

    fn check_ffmpeg_update(&self) -> Value {
        let cfg = AppConfig::load();
        let tools = cfg.validate_tools();
        let local_ver = tools["ffmpeg"]["version"].as_str().unwrap_or("").to_string();

        let mut cmd = Command::new("curl.exe");
        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.args(["-s", "--max-time", "5", "https://www.gyan.dev/ffmpeg/builds/release-version"]);

        match cmd.output() {
            Ok(out) if out.status.success() => {
                let remote_ver = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if remote_ver.is_empty() {
                    return json!({ "ok": false, "msg": "Не удалось получить версию с сервера" });
                }
                let is_latest = local_ver.starts_with(&remote_ver);
                let msg = if is_latest {
                    format!("Установлена актуальная версия FFmpeg ({})", remote_ver)
                } else {
                    format!("Доступна новая версия FFmpeg {} (установлена: {})", remote_ver, local_ver)
                };
                json!({
                    "ok": true,
                    "is_latest": is_latest,
                    "remote_version": remote_ver,
                    "local_version": local_ver,
                    "msg": msg,
                    "url": "https://www.gyan.dev/ffmpeg/builds/"
                })
            }
            Ok(_) => json!({ "ok": false, "msg": "Сервер обновлений FFmpeg временно недоступен" }),
            Err(e) => json!({ "ok": false, "msg": format!("Ошибка проверки: {}", e) }),
        }
    }

    fn check_app_update(&self) -> Value {
        let repo = "axalame/clipforge";
        let url = format!("https://api.github.com/repos/{}/releases/latest", repo);

        let mut cmd = Command::new("curl.exe");
        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.args(["-s", "-L", "--max-time", "10", "-H", "User-Agent: ClipForge-App", "-H", "Cache-Control: no-cache", &url]);

        let output = match cmd.output() {
            Ok(o) if o.status.success() => o,
            _ => return json!({ "ok": false, "msg": "Не удалось связаться с сервером обновлений GitHub" }),
        };

        let body_str = String::from_utf8_lossy(&output.stdout);
        let release: Value = match serde_json::from_str(&body_str) {
            Ok(v) => v,
            Err(_) => return json!({ "ok": false, "msg": "Некорректный ответ от GitHub Releases" }),
        };

        let tag_name = release["tag_name"].as_str().unwrap_or("").trim_start_matches('v');
        let current_version = env!("CARGO_PKG_VERSION");

        let parse_ver = |v: &str| -> Vec<u32> {
            v.split('.')
                .filter_map(|s| s.chars().take_while(|c| c.is_ascii_digit()).collect::<String>().parse().ok())
                .collect()
        };

        let has_update = parse_ver(tag_name) > parse_ver(current_version);
        let mut download_url = String::new();
        let mut asset_size = 0u64;

        if let Some(assets) = release["assets"].as_array() {
            for asset in assets {
                let name = asset["name"].as_str().unwrap_or("");
                if name.ends_with("-setup.exe") || name.ends_with(".exe") {
                    download_url = asset["browser_download_url"].as_str().unwrap_or("").to_string();
                    asset_size = asset["size"].as_u64().unwrap_or(0);
                    break;
                }
            }
        }

        let msg = if has_update {
            format!("Доступна новая версия v{}!", tag_name)
        } else {
            format!("У вас установлена самая последняя версия (v{})", current_version)
        };

        json!({
            "ok": true,
            "has_update": has_update,
            "current_version": current_version,
            "latest_version": tag_name,
            "release_name": release["name"].as_str().unwrap_or(""),
            "release_notes": release["body"].as_str().unwrap_or(""),
            "download_url": download_url,
            "size": asset_size,
            "msg": msg
        })
    }

    fn install_app_update(&self, download_url: &str) -> Value {
        if download_url.is_empty() {
            return json!({ "ok": false, "msg": "Ссылка на скачивание не указана" });
        }

        let temp_dir = std::env::temp_dir();
        let installer_path = temp_dir.join("clipforge-update-setup.exe");

        let mut cmd = Command::new("curl.exe");
        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.args(["-L", "--max-time", "180", "-o", installer_path.to_str().unwrap_or("setup.exe"), download_url]);

        let _status = match cmd.status() {
            Ok(s) if s.success() => s,
            Ok(s) => return json!({ "ok": false, "msg": format!("curl завершился с ошибкой: {}", s) }),
            Err(e) => return json!({ "ok": false, "msg": format!("Ошибка загрузки: {}", e) }),
        };

        if !installer_path.exists() {
            return json!({ "ok": false, "msg": "Файл установщика не найден после скачивания" });
        }

        #[cfg(windows)]
        {
            let _ = Command::new(&installer_path)
                .args(["/CLOSEAPPLICATIONS", "/RESTARTAPPLICATIONS"])
                .spawn();

            std::thread::spawn(|| {
                std::thread::sleep(std::time::Duration::from_millis(600));
                std::process::exit(0);
            });
        }

        json!({ "ok": true, "msg": "Установщик запущен. Приложение обновляется..." })
    }

    fn emit_component_progress(&self, component: &str, msg: &str, percent: u32) {
        let payload = json!({
            "component": component,
            "message": msg,
            "percent": percent
        }).to_string();
        let _ = self.proxy.send_event(UserEvent::EvalJs(format!(
            "if (window.onComponentProgress) window.onComponentProgress({});",
            payload
        )));
    }

    fn download_file_with_curl(
        &self,
        component: &str,
        url: &str,
        target_file: &Path,
        max_secs: u32,
        expected_size_mb: f64,
        pct_start: u32,
        pct_end: u32,
        stage_desc: &str,
    ) -> Result<(), String> {
        let (stop_tx, stop_rx) = std::sync::mpsc::channel();
        let target_path_clone = target_file.to_path_buf();
        let proxy = self.proxy.clone();
        let comp_str = component.to_string();
        let stage_str = stage_desc.to_string();

        let monitor_handle = std::thread::spawn(move || {
            let expected_bytes = (expected_size_mb * 1024.0 * 1024.0) as u64;
            let mut last_pct = pct_start;
            loop {
                if stop_rx.try_recv().is_ok() {
                    break;
                }
                std::thread::sleep(std::time::Duration::from_millis(250));
                if let Ok(meta) = target_path_clone.metadata() {
                    let current = meta.len();
                    if expected_bytes > 0 {
                        let ratio = (current as f64 / expected_bytes as f64).clamp(0.0, 1.0);
                        let calculated_pct = pct_start + (((pct_end - pct_start) as f64 * ratio) as u32);
                        if calculated_pct > last_pct {
                            last_pct = calculated_pct;
                            let mb_curr = current as f64 / 1_048_576.0;
                            let msg = format!("{}: {:.1} / {:.1} MB ({}%)", stage_str, mb_curr, expected_size_mb, calculated_pct);
                            let payload = json!({
                                "component": comp_str,
                                "message": msg,
                                "percent": calculated_pct
                            }).to_string();
                            let _ = proxy.send_event(UserEvent::EvalJs(format!(
                                "if (window.onComponentProgress) window.onComponentProgress({});",
                                payload
                            )));
                        }
                    }
                }
            }
        });

        let mut cmd = Command::new("curl.exe");
        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.args([
            "-L",
            "--fail",
            "--retry", "2",
            "--max-time", &max_secs.to_string(),
            "-o", target_file.to_str().unwrap_or("out.tmp"),
            url,
        ]);

        let status = cmd.status().map_err(|e| format!("Не удалось запустить curl.exe: {}", e));
        let _ = stop_tx.send(());
        let _ = monitor_handle.join();

        let st = status?;
        if !st.success() {
            return Err(format!("curl.exe завершился с кодом ошибки: {}", st));
        }
        if !target_file.exists() || target_file.metadata().map(|m| m.len()).unwrap_or(0) == 0 {
            return Err("Файл не был загружен или имеет нулевой размер".to_string());
        }
        Ok(())
    }

    fn extract_archive_zip(zip_path: &Path, dest_dir: &Path) -> Result<(), String> {
        let _ = std::fs::create_dir_all(dest_dir);

        // 1. Try tar.exe (fast, built into Windows 10/11)
        let mut tar_cmd = Command::new("tar.exe");
        #[cfg(windows)]
        tar_cmd.creation_flags(CREATE_NO_WINDOW);
        tar_cmd.args(["-xf", zip_path.to_str().unwrap_or(""), "-C", dest_dir.to_str().unwrap_or("")]);

        if let Ok(st) = tar_cmd.status() {
            if st.success() {
                return Ok(());
            }
        }

        // 2. Fallback to PowerShell Expand-Archive
        let ps_script = format!(
            "Expand-Archive -LiteralPath '{}' -DestinationPath '{}' -Force",
            zip_path.to_string_lossy().replace('\'', "''"),
            dest_dir.to_string_lossy().replace('\'', "''")
        );
        let mut ps_cmd = Command::new("powershell.exe");
        #[cfg(windows)]
        ps_cmd.creation_flags(CREATE_NO_WINDOW);
        ps_cmd.args(["-NoProfile", "-Command", &ps_script]);

        let ps_status = ps_cmd.status().map_err(|e| format!("Ошибка распаковки архива: {}", e))?;
        if ps_status.success() {
            Ok(())
        } else {
            Err("Не удалось распаковать архив с помощью tar.exe и PowerShell".to_string())
        }
    }

    fn replace_executable(temp_path: &Path, target_path: &Path) -> Result<(), String> {
        #[cfg(windows)]
        {
            let backup_path = target_path.with_extension("backup.exe");
            let _ = std::fs::remove_file(&backup_path);
            if target_path.exists() {
                let _ = std::fs::rename(target_path, &backup_path);
            }
            if let Err(e) = std::fs::rename(temp_path, target_path) {
                if let Err(copy_err) = std::fs::copy(temp_path, target_path) {
                    if backup_path.exists() {
                        let _ = std::fs::rename(&backup_path, target_path);
                    }
                    return Err(format!("Не удалось заменить исполняемый файл: {} (copy: {})", e, copy_err));
                }
                let _ = std::fs::remove_file(temp_path);
            }
            let _ = std::fs::remove_file(backup_path);
            Ok(())
        }
        #[cfg(not(windows))]
        {
            std::fs::rename(temp_path, target_path).map_err(|e| format!("Не удалось заменить исполняемый файл: {}", e))
        }
    }

    fn verify_executable(path: &Path, version_arg: &str) -> Result<String, String> {
        let mut cmd = Command::new(path);
        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.arg(version_arg);
        match cmd.output() {
            Ok(out) if out.status.success() && !out.stdout.is_empty() => {
                Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
            }
            Ok(out) => {
                let err = String::from_utf8_lossy(&out.stderr).trim().to_string();
                Err(if !err.is_empty() { err } else { format!("exit_code: {:?}", out.status.code()) })
            }
            Err(e) => Err(format!("Не удалось запустить файл: {}", e)),
        }
    }

    fn install_ytdlp(&self, bin_dir: &Path, _temp_dir: &Path) -> Result<Value, String> {
        let cfg = AppConfig::load();
        let channel = cfg.ytdlp_channel.trim();
        let repo = match channel {
            "nightly" => "yt-dlp/yt-dlp-nightly-builds",
            "master" => "yt-dlp/yt-dlp-master-builds",
            _ => "yt-dlp/yt-dlp",
        };
        let ytdlp_url = format!("https://github.com/{}/releases/latest/download/yt-dlp.exe", repo);
        let target_exe = bin_dir.join("yt-dlp.exe");
        let temp_exe = bin_dir.join("yt-dlp.download.exe");

        let _ = std::fs::remove_file(&temp_exe);
        self.download_file_with_curl(
            "ytdlp",
            &ytdlp_url,
            &temp_exe,
            180,
            18.5,
            0,
            90,
            "Скачивание yt-dlp.exe",
        )?;

        self.emit_component_progress("ytdlp", "Проверка версии yt-dlp...", 95);
        let ver = Self::verify_executable(&temp_exe, "--version")
            .map_err(|e| {
                let _ = std::fs::remove_file(&temp_exe);
                format!("Ошибка проверки yt-dlp: {}", e)
            })?;

        self.emit_component_progress("ytdlp", "Сохранение yt-dlp.exe...", 98);
        Self::replace_executable(&temp_exe, &target_exe)?;

        let mut cfg = AppConfig::load();
        cfg.ytdlp_path = target_exe.to_string_lossy().to_string();
        cfg.save();

        self.emit_component_progress("ytdlp", "yt-dlp успешно установлен!", 100);

        Ok(json!({
            "ok": true,
            "version": ver,
            "path": cfg.ytdlp_path,
            "msg": format!("yt-dlp v{} успешно установлен!", ver)
        }))
    }

    fn install_deno(&self, bin_dir: &Path, temp_dir: &Path) -> Result<Value, String> {
        let deno_url = "https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip";
        let target_exe = bin_dir.join("deno.exe");
        let temp_zip = bin_dir.join("deno.download.zip");
        let temp_exe = bin_dir.join("deno.download.exe");
        let extract_dir = temp_dir.join("deno_extract");

        let _ = std::fs::remove_file(&temp_zip);
        let _ = std::fs::remove_file(&temp_exe);
        let _ = std::fs::remove_dir_all(&extract_dir);

        self.download_file_with_curl(
            "deno",
            deno_url,
            &temp_zip,
            180,
            35.5,
            0,
            80,
            "Скачивание Deno JS",
        )?;

        self.emit_component_progress("deno", "Распаковка Deno JS...", 85);
        Self::extract_archive_zip(&temp_zip, &extract_dir)?;

        let found_deno = extract_dir.join("deno.exe");
        if !found_deno.exists() {
            let _ = std::fs::remove_file(&temp_zip);
            let _ = std::fs::remove_dir_all(&extract_dir);
            return Err("Исполняемый файл deno.exe не найден внутри загруженного архива".to_string());
        }

        let _ = std::fs::copy(&found_deno, &temp_exe);
        let _ = std::fs::remove_file(&temp_zip);
        let _ = std::fs::remove_dir_all(&extract_dir);

        self.emit_component_progress("deno", "Проверка Deno JS...", 95);
        let ver_raw = Self::verify_executable(&temp_exe, "--version")
            .map_err(|e| {
                let _ = std::fs::remove_file(&temp_exe);
                format!("Ошибка проверки Deno JS: {}", e)
            })?;
        let ver = ver_raw.lines().next().unwrap_or("").replace("deno ", "").trim().to_string();

        self.emit_component_progress("deno", "Сохранение Deno JS...", 98);
        Self::replace_executable(&temp_exe, &target_exe)?;

        let mut cfg = AppConfig::load();
        cfg.deno_path = target_exe.to_string_lossy().to_string();
        cfg.save();

        self.emit_component_progress("deno", "Deno JS успешно установлен!", 100);

        Ok(json!({
            "ok": true,
            "version": ver,
            "path": cfg.deno_path,
            "msg": format!("Deno JS v{} успешно установлен!", ver)
        }))
    }

    fn install_ffmpeg(&self, bin_dir: &Path, temp_dir: &Path) -> Result<Value, String> {
        let ffmpeg_bin_dir = bin_dir.join("ffmpeg");
        let _ = std::fs::create_dir_all(&ffmpeg_bin_dir);

        let target_ffmpeg = ffmpeg_bin_dir.join("ffmpeg.exe");
        let target_ffprobe = ffmpeg_bin_dir.join("ffprobe.exe");

        let temp_ffmpeg = ffmpeg_bin_dir.join("ffmpeg.download.exe");
        let temp_ffprobe = ffmpeg_bin_dir.join("ffprobe.download.exe");

        let _ = std::fs::remove_file(&temp_ffmpeg);
        let _ = std::fs::remove_file(&temp_ffprobe);

        // Primary source: exact implementation from imsyy/yt-dlp-gui
        // Prebuilt standalone static binaries from eugeneware/ffmpeg-static
        let ffmpeg_url = "https://github.com/eugeneware/ffmpeg-static/releases/latest/download/ffmpeg-win32-x64";
        let ffprobe_url = "https://github.com/eugeneware/ffmpeg-static/releases/latest/download/ffprobe-win32-x64";

        let primary_res: Result<(), String> = (|| {
            // [1/2] Download & verify FFmpeg (0% .. 48%)
            self.download_file_with_curl(
                "ffmpeg",
                ffmpeg_url,
                &temp_ffmpeg,
                300,
                78.9,
                0,
                48,
                "[1/2] Скачивание FFmpeg",
            )?;

            self.emit_component_progress("ffmpeg", "Проверка FFmpeg...", 49);
            Self::verify_executable(&temp_ffmpeg, "-version")
                .map_err(|e| format!("FFmpeg поврежден или не запускается: {}", e))?;

            // [2/2] Download & verify FFprobe (50% .. 95%)
            self.download_file_with_curl(
                "ffmpeg",
                ffprobe_url,
                &temp_ffprobe,
                300,
                78.8,
                50,
                95,
                "[2/2] Скачивание FFprobe",
            )?;

            self.emit_component_progress("ffmpeg", "Проверка FFprobe...", 96);
            Self::verify_executable(&temp_ffprobe, "-version")
                .map_err(|e| format!("FFprobe поврежден или не запускается: {}", e))?;

            self.emit_component_progress("ffmpeg", "Сохранение FFmpeg & FFprobe...", 98);
            Self::replace_executable(&temp_ffmpeg, &target_ffmpeg)?;
            Self::replace_executable(&temp_ffprobe, &target_ffprobe)?;

            Ok(())
        })();

        // Fallback strategy if direct download fails: use fast ffbinaries prebuilt zips
        if primary_res.is_err() {
            let _ = std::fs::remove_file(&temp_ffmpeg);
            let _ = std::fs::remove_file(&temp_ffprobe);

            self.emit_component_progress("ffmpeg", "Резервная загрузка FFmpeg...", 10);
            let ffbin_ffmpeg_url = "https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v6.1/ffmpeg-6.1-win-64.zip";
            let ffbin_ffprobe_url = "https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v6.1/ffprobe-6.1-win-64.zip";

            let temp_ffmpeg_zip = temp_dir.join("ffmpeg_fb.download.zip");
            let temp_ffprobe_zip = temp_dir.join("ffprobe_fb.download.zip");
            let extract_ffmpeg_dir = temp_dir.join("ffmpeg_fb_extract");
            let extract_ffprobe_dir = temp_dir.join("ffprobe_fb_extract");

            let _ = std::fs::remove_file(&temp_ffmpeg_zip);
            let _ = std::fs::remove_file(&temp_ffprobe_zip);
            let _ = std::fs::remove_dir_all(&extract_ffmpeg_dir);
            let _ = std::fs::remove_dir_all(&extract_ffprobe_dir);

            self.download_file_with_curl(
                "ffmpeg",
                ffbin_ffmpeg_url,
                &temp_ffmpeg_zip,
                300,
                52.1,
                10,
                50,
                "[Резерв 1/2] Скачивание FFmpeg",
            )?;

            self.download_file_with_curl(
                "ffmpeg",
                ffbin_ffprobe_url,
                &temp_ffprobe_zip,
                300,
                52.1,
                50,
                85,
                "[Резерв 2/2] Скачивание FFprobe",
            )?;

            self.emit_component_progress("ffmpeg", "Распаковка резервных архивов...", 88);
            Self::extract_archive_zip(&temp_ffmpeg_zip, &extract_ffmpeg_dir)?;
            Self::extract_archive_zip(&temp_ffprobe_zip, &extract_ffprobe_dir)?;

            let src_ffmpeg = extract_ffmpeg_dir.join("ffmpeg.exe");
            let src_ffprobe = extract_ffprobe_dir.join("ffprobe.exe");

            if !src_ffmpeg.exists() || !src_ffprobe.exists() {
                return Err("Исполняемые файлы FFmpeg/FFprobe не найдены в архивах".to_string());
            }

            Self::replace_executable(&src_ffmpeg, &target_ffmpeg)?;
            Self::replace_executable(&src_ffprobe, &target_ffprobe)?;

            let _ = std::fs::remove_file(&temp_ffmpeg_zip);
            let _ = std::fs::remove_file(&temp_ffprobe_zip);
            let _ = std::fs::remove_dir_all(&extract_ffmpeg_dir);
            let _ = std::fs::remove_dir_all(&extract_ffprobe_dir);
        }

        self.emit_component_progress("ffmpeg", "Проверка установленных FFmpeg & FFprobe...", 99);
        let ver = match Self::verify_executable(&target_ffmpeg, "-version") {
            Ok(s) => s.replace("ffmpeg version ", "").split_whitespace().next().unwrap_or("Ready").to_string(),
            _ => "Ready".to_string(),
        };

        let mut cfg = AppConfig::load();
        cfg.ffmpeg_dir = ffmpeg_bin_dir.to_string_lossy().to_string();
        cfg.save();

        self.emit_component_progress("ffmpeg", "FFmpeg & FFprobe успешно установлены!", 100);

        Ok(json!({
            "ok": true,
            "version": ver,
            "path": cfg.ffmpeg_dir,
            "msg": format!("FFmpeg & FFprobe v{} успешно установлены!", ver)
        }))
    }

    fn download_tool(&self, name: &str) -> Value {
        let bin_dir = AppConfig::get_tools_dir();
        let _ = std::fs::create_dir_all(&bin_dir);

        let temp_dir = std::env::temp_dir().join("clipforge_component_downloads");
        let _ = std::fs::create_dir_all(&temp_dir);

        match name {
            "ytdlp" => {
                self.emit_component_progress("ytdlp", "Загрузка yt-dlp.exe...", 10);
                match self.install_ytdlp(&bin_dir, &temp_dir) {
                    Ok(val) => {
                        self.emit_component_progress("ytdlp", "yt-dlp успешно установлен!", 100);
                        val
                    }
                    Err(e) => {
                        self.emit_component_progress("ytdlp", &format!("Ошибка: {}", e), 0);
                        json!({ "ok": false, "msg": e })
                    }
                }
            }
            "deno" => {
                self.emit_component_progress("deno", "Загрузка Deno JS Runtime...", 10);
                match self.install_deno(&bin_dir, &temp_dir) {
                    Ok(val) => {
                        self.emit_component_progress("deno", "Deno JS успешно установлен!", 100);
                        val
                    }
                    Err(e) => {
                        self.emit_component_progress("deno", &format!("Ошибка: {}", e), 0);
                        json!({ "ok": false, "msg": e })
                    }
                }
            }
            "ffmpeg" => {
                self.emit_component_progress("ffmpeg", "Загрузка FFmpeg & FFprobe...", 10);
                match self.install_ffmpeg(&bin_dir, &temp_dir) {
                    Ok(val) => {
                        self.emit_component_progress("ffmpeg", "FFmpeg & FFprobe успешно установлены!", 100);
                        val
                    }
                    Err(e) => {
                        self.emit_component_progress("ffmpeg", &format!("Ошибка: {}", e), 0);
                        json!({ "ok": false, "msg": e })
                    }
                }
            }
            "all" => {
                let mut results = serde_json::Map::new();

                self.emit_component_progress("all", "[1/3] Загрузка yt-dlp...", 15);
                let yt_res = self.install_ytdlp(&bin_dir, &temp_dir);
                results.insert("ytdlp".to_string(), match &yt_res {
                    Ok(v) => v.clone(),
                    Err(e) => json!({ "ok": false, "msg": e }),
                });

                self.emit_component_progress("all", "[2/3] Загрузка Deno JS...", 50);
                let deno_res = self.install_deno(&bin_dir, &temp_dir);
                results.insert("deno".to_string(), match &deno_res {
                    Ok(v) => v.clone(),
                    Err(e) => json!({ "ok": false, "msg": e }),
                });

                self.emit_component_progress("all", "[3/3] Загрузка FFmpeg + FFprobe...", 80);
                let ff_res = self.install_ffmpeg(&bin_dir, &temp_dir);
                results.insert("ffmpeg".to_string(), match &ff_res {
                    Ok(v) => v.clone(),
                    Err(e) => json!({ "ok": false, "msg": e }),
                });

                let all_ok = yt_res.is_ok() && deno_res.is_ok() && ff_res.is_ok();
                self.emit_component_progress("all", if all_ok { "Все компоненты успешно установлены!" } else { "Установка завершена с замечаниями" }, 100);

                let cfg = AppConfig::load();
                json!({
                    "ok": all_ok,
                    "results": results,
                    "tools": cfg.validate_tools()
                })
            }
            _ => json!({ "ok": false, "msg": format!("Неизвестный компонент: {}", name) }),
        }
    }

    fn get_config(&self) -> Value {
        let cfg = AppConfig::load();
        let tools = cfg.validate_tools();
        json!({
            "app_version": env!("CARGO_PKG_VERSION"),
            "ffmpeg_dir": cfg.ffmpeg_dir,
            "ytdlp_path": cfg.ytdlp_path,
            "deno_path": cfg.deno_path,
            "ytdlp_channel": cfg.ytdlp_channel,
            "cookie_source": cfg.cookie_source,
            "cookie_file": cfg.cookie_file,
            "output_dir": cfg.output_dir,
            "tools": tools,
            "media_server_url": get_media_server_url()
        })
    }

    fn save_config(&self, data: &Value) -> Value {
        let mut cfg = AppConfig::load();
        if let Some(d) = data["ffmpeg_dir"].as_str() {
            cfg.ffmpeg_dir = d.to_string();
        }
        if let Some(y) = data["ytdlp_path"].as_str() {
            cfg.ytdlp_path = y.to_string();
        }
        if let Some(dp) = data["deno_path"].as_str() {
            cfg.deno_path = dp.to_string();
        }
        if let Some(ch) = data["ytdlp_channel"].as_str() {
            cfg.ytdlp_channel = ch.to_string();
        }
        if let Some(cs) = data["cookie_source"].as_str() {
            cfg.cookie_source = cs.to_string();
        }
        if let Some(cf) = data["cookie_file"].as_str() {
            cfg.cookie_file = cf.to_string();
        }
        if let Some(od) = data["output_dir"].as_str() {
            cfg.output_dir = od.to_string();
        }
        cfg.save();
        self.get_config()
    }

    fn select_files(&self) -> Value {
        let files = FileDialog::new()
            .add_filter("Видеофайлы", &["mp4", "mkv", "avi", "webm", "mov", "flv"])
            .add_filter("Все файлы", &["*"])
            .pick_files();

        match files {
            Some(paths) => {
                let list: Vec<String> = paths.into_iter().map(|p| p.to_string_lossy().to_string()).collect();
                json!(list)
            }
            None => json!([]),
        }
    }

    fn select_watermark_file(&self) -> Value {
        let file = FileDialog::new()
            .add_filter("Изображения", &["png", "jpg", "jpeg", "webp"])
            .add_filter("Все файлы", &["*"])
            .pick_file();

        match file {
            Some(p) => json!(p.to_string_lossy().to_string()),
            None => Value::Null,
        }
    }

    fn select_audio_file(&self) -> Value {
        let file = FileDialog::new()
            .add_filter("Аудиофайлы", &["mp3", "wav", "aac", "m4a", "ogg", "flac"])
            .add_filter("Все файлы", &["*"])
            .pick_file();

        match file {
            Some(p) => json!(p.to_string_lossy().to_string()),
            None => Value::Null,
        }
    }

    fn select_cookies_file(&self) -> Value {
        let file = FileDialog::new()
            .add_filter("Файлы Cookies", &["txt"])
            .add_filter("Все файлы", &["*"])
            .pick_file();

        match file {
            Some(p) => json!(p.to_string_lossy().to_string()),
            None => Value::Null,
        }
    }

    fn select_folder(&self) -> Value {
        let folder = FileDialog::new().pick_folder();
        match folder {
            Some(p) => json!(p.to_string_lossy().to_string()),
            None => Value::Null,
        }
    }

    fn preview_file(&self, filepath: &str) -> Value {
        if Path::new(filepath).exists() {
            #[cfg(windows)]
            {
                let mut cmd = Command::new("explorer");
                cmd.creation_flags(CREATE_NO_WINDOW);
                cmd.arg(filepath);
                let _ = cmd.spawn();
            }
            json!({ "ok": true })
        } else {
            json!({ "ok": false, "error": "Файл не существует" })
        }
    }

    fn open_in_explorer(&self, filepath: &str) -> Value {
        let p = Path::new(filepath);
        #[cfg(windows)]
        {
            let mut cmd = Command::new("explorer");
            cmd.creation_flags(CREATE_NO_WINDOW);
            if p.is_file() {
                cmd.args(["/select,", filepath]);
            } else if p.is_dir() {
                cmd.arg(filepath);
            } else if let Some(parent) = p.parent() {
                if parent.exists() {
                    cmd.arg(parent.to_string_lossy().as_ref());
                } else {
                    return json!({ "ok": false, "error": "Путь не найден" });
                }
            } else {
                return json!({ "ok": false, "error": "Путь не найден" });
            }
            let _ = cmd.spawn();
        }
        json!({ "ok": true })
    }

    fn delete_file(&self, filepath: &str) -> Value {
        let trimmed = filepath.trim();
        if trimmed.is_empty() || trimmed.starts_with(r"\\") || trimmed.starts_with("//") {
            return json!({ "ok": false, "error": "Недопустимый путь к файлу" });
        }

        let cfg = AppConfig::load();
        let mut p = std::path::PathBuf::from(trimmed);

        if p.is_dir() {
            return json!({ "ok": false, "error": "Указанный путь является папкой, удаление папок запрещено" });
        }

        if !p.exists() {
            let alt = std::path::Path::new(&cfg.output_dir).join(trimmed);
            if alt.is_dir() {
                return json!({ "ok": false, "error": "Указанный путь является папкой, удаление папок запрещено" });
            }
            if alt.exists() {
                p = alt;
            } else {
                let raw_stem = std::path::Path::new(trimmed)
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or(trimmed);
                let target_stem = raw_stem.trim().to_lowercase();

                let out_dir = std::path::Path::new(&cfg.output_dir);
                if out_dir.exists() && !target_stem.is_empty() {
                    if let Ok(entries) = std::fs::read_dir(out_dir) {
                        let mut matched_file: Option<std::path::PathBuf> = None;
                        for entry in entries.flatten() {
                            let path = entry.path();
                            if path.is_file()
                                && path.file_stem().and_then(|s| s.to_str()).map(|s| s.to_lowercase()) == Some(target_stem.clone())
                            {
                                let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
                                let is_media = matches!(
                                    ext.as_str(),
                                    "mp4" | "mkv" | "webm" | "mov" | "avi" | "flv" | "wmv" | "ts" | "m4v"
                                    | "mp3" | "wav" | "ogg" | "m4a" | "flac" | "aac" | "opus"
                                );
                                if is_media {
                                    matched_file = Some(path);
                                    break;
                                }
                            }
                        }
                        if let Some(found) = matched_file {
                            p = found;
                        }
                    }
                }
            }
        }

        if !p.exists() {
            return json!({ "ok": true, "message": "Файл уже отсутствует на диске" });
        }

        if !p.is_file() {
            return json!({ "ok": false, "error": "Указанный путь не является файлом" });
        }

        // Safety check: only allow deleting media/output files, not system files or executables
        let ext = p.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
        let is_media_ext = matches!(
            ext.as_str(),
            "mp4" | "mkv" | "webm" | "mov" | "avi" | "flv" | "wmv" | "ts" | "m4v"
            | "mp3" | "wav" | "ogg" | "m4a" | "flac" | "aac" | "opus" | "jpg" | "jpeg"
            | "png" | "webp" | "gif" | "part" | "ytdl"
        );

        if !is_media_ext {
            return json!({ "ok": false, "error": "Удаление файлов данного типа запрещено в целях безопасности" });
        }

        let deleted_name = p.to_string_lossy().to_string();

        // 1. Delete main file
        match std::fs::remove_file(&p) {
            Ok(_) => {
                // 2. Also clean up any associated sidecars (.jpg, .webp, .vtt, .srt, .part, .ytdl)
                if let Some(parent) = p.parent() {
                    if let Some(stem) = p.file_stem().and_then(|s| s.to_str()) {
                        if let Ok(entries) = std::fs::read_dir(parent) {
                            for entry in entries.flatten() {
                                let side = entry.path();
                                if side != p && side.is_file() {
                                    let s_name = side.file_name().and_then(|n| n.to_str()).unwrap_or("");
                                    let s_stem = side.file_stem().and_then(|s| s.to_str()).unwrap_or("");
                                    let s_ext = side.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
                                    let is_match = (s_stem.eq_ignore_ascii_case(stem) || s_name.starts_with(&format!("{}.", stem)))
                                        && matches!(s_ext.as_str(), "jpg" | "jpeg" | "webp" | "png" | "vtt" | "srt" | "part" | "ytdl" | "temp");
                                    if is_match {
                                        let _ = std::fs::remove_file(&side);
                                    }
                                }
                            }
                        }
                    }
                }
                json!({ "ok": true, "deleted": deleted_name })
            }
            Err(e) => json!({ "ok": false, "error": format!("Не удалось удалить файл: {}", e) }),
        }
    }

    pub fn cancel(&self) -> Value {
        self.runner.cancel();
        json!({ "ok": true, "message": "Процесс отменяется..." })
    }

    fn start_operation(&self, operation: &str, input_file: &str, params: &Value) -> Value {
        if self.runner.is_running() {
            return json!({ "error": "Другая операция уже выполняется" });
        }

        let builder = FFmpegBuilder::new();
        let (cmd, target_out) = match builder.build_command(operation, input_file, params, None) {
            Ok(res) => res,
            Err(e) => return json!({ "error": e }),
        };

        let media_info = get_media_info(input_file);
        let duration = media_info["duration"].as_f64();

        let start_payload = json!({
            "operation": operation,
            "cmd": cmd.join(" ")
        }).to_string();
        let _ = self.proxy.send_event(UserEvent::EvalJs(format!("if (window.onTaskStarted) window.onTaskStarted({});", start_payload)));

        let cb = Arc::new(ApiCallbacks::new(self.proxy.clone()));
        self.runner.run_command(&cmd, &target_out, duration, cb);

        json!({ "status": "started", "output": target_out })
    }

    fn start_batch(&self, operation: &str, files_val: Value, params_val: Value) -> Value {
        if self.runner.is_running() {
            return json!({ "error": "Другая операция уже выполняется" });
        }

        let files = match files_val.as_array() {
            Some(arr) => arr.clone(),
            None => return json!({ "error": "Список файлов пуст" }),
        };

        if files.is_empty() {
            return json!({ "error": "Список файлов пуст" });
        }

        let proxy = self.proxy.clone();
        let runner = self.runner.clone();
        let op = operation.to_string();

        let start_payload = json!({
            "operation": format!("Пакетная обработка: {}", op),
            "cmd": format!("{} файлов", files.len())
        }).to_string();
        let _ = self.proxy.send_event(UserEvent::EvalJs(format!("if (window.onTaskStarted) window.onTaskStarted({});", start_payload)));

        thread::spawn(move || {
            let total = files.len();
            let mut processed = 0;
            let builder = FFmpegBuilder::new();

            runner.reset_cancelled();
            for (idx, file_val) in files.iter().enumerate() {
                if runner.is_cancelled() {
                    break;
                }

                let file_path = match file_val.as_str() {
                    Some(s) => s,
                    None => continue,
                };

                let filename = Path::new(file_path)
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy();

                let payload = json!({
                    "index": idx + 1,
                    "total": total,
                    "name": filename
                }).to_string();
                let _ = proxy.send_event(UserEvent::EvalJs(format!("if (window.onBatchFileStart) window.onBatchFileStart({});", payload)));

                let info = get_media_info(file_path);
                let dur = info["duration"].as_f64();

                let mut file_params = params_val.clone();
                if op == "compress" && file_params["target_size_mb"].as_f64().unwrap_or(0.0) > 0.0 {
                    if let Some(d) = dur {
                        if d > 0.0 {
                            file_params["duration"] = json!(d);
                        }
                    }
                }

                let (cmd, target_out) = match builder.build_command(&op, file_path, &file_params, None) {
                    Ok(c) => c,
                    Err(e) => {
                        let err_msg = format!("[ОШИБКА] {}: {}", filename, e);
                        let err_json = serde_json::to_string(&err_msg).unwrap_or_default();
                        let _ = proxy.send_event(UserEvent::EvalJs(format!(
                            "if (window.onTaskLog) window.onTaskLog({});",
                            err_json
                        )));
                        continue;
                    }
                };

                let cb = Arc::new(ApiCallbacks::new(proxy.clone()));
                runner.run_command(&cmd, &target_out, dur, cb);

                while runner.is_running() {
                    thread::sleep(std::time::Duration::from_millis(100));
                }

                if runner.is_cancelled() {
                    break;
                }

                processed += 1;
            }

            let batch_res = json!({
                "processed": processed,
                "total": total
            }).to_string();
            let _ = proxy.send_event(UserEvent::EvalJs(format!("if (window.onBatchComplete) window.onBatchComplete({});", batch_res)));
        });

        json!({ "status": "started", "batch": true })
    }

    fn start_download(&self, params: &Value) -> Value {
        if self.runner.is_running() {
            return json!({ "error": "Другая операция уже выполняется" });
        }

        let (cmd, out_dir) = match build_ytdlp_command(params) {
            Ok(c) => c,
            Err(e) => return json!({ "error": e }),
        };

        let url_str = params.get("url").and_then(|u| u.as_str()).unwrap_or("");
        let platform = detect_platform(url_str);
        let operation_name = format!("Загрузка с {}", platform);

        let start_payload = json!({
            "operation": operation_name,
            "platform": platform,
            "cmd": cmd.join(" ")
        }).to_string();
        let _ = self.proxy.send_event(UserEvent::EvalJs(format!("if (window.onTaskStarted) window.onTaskStarted({});", start_payload)));

        let cb = Arc::new(ApiCallbacks::new(self.proxy.clone()));
        self.runner.run_command(&cmd, &out_dir, None, cb);

        json!({ "status": "started", "output": out_dir })
    }
}
