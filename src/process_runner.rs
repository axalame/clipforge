use regex::Regex;
use serde_json::json;
use std::io::{BufRead, BufReader};
use std::path::Path;
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, LazyLock, Mutex};
use std::thread;

static RE_FFMPEG_TIME: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"time=(\d+):(\d+):(\d+\.\d+)").unwrap());
static RE_FFMPEG_SPEED: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"speed=\s*([\d\.]+)x").unwrap());
static RE_FFMPEG_FPS: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"fps=\s*([\d\.]+)").unwrap());
static RE_FFMPEG_FRAME: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"frame=\s*(\d+)").unwrap());
static RE_YTDLP: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"\[download\]\s+([\d\.]+)%\s+of\s+~?([\d\.]+\w+)\s+at\s+([\d\.]+\w+/s)\s+ETA\s+(\S+)").unwrap()
});

#[cfg(windows)]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

pub trait ProcessCallbacks: Send + Sync + 'static {
    fn on_progress(&self, data: serde_json::Value);
    fn on_log(&self, line: &str);
    fn on_success(&self, output_file: &str, message: &str);
    fn on_error(&self, error: &str);
    fn on_cancel(&self);
}

#[derive(Clone)]
pub struct ProcessRunner {
    current_child: Arc<Mutex<Option<Child>>>,
    is_running: Arc<AtomicBool>,
    cancelled: Arc<AtomicBool>,
}

impl ProcessRunner {
    pub fn new() -> Self {
        Self {
            current_child: Arc::new(Mutex::new(None)),
            is_running: Arc::new(AtomicBool::new(false)),
            cancelled: Arc::new(AtomicBool::new(false)),
        }
    }

    pub fn is_running(&self) -> bool {
        self.is_running.load(Ordering::SeqCst)
    }

    pub fn is_cancelled(&self) -> bool {
        self.cancelled.load(Ordering::SeqCst)
    }

    pub fn reset_cancelled(&self) {
        self.cancelled.store(false, Ordering::SeqCst);
    }

    pub fn cancel(&self) {
        if self.is_running.load(Ordering::SeqCst) {
            self.cancelled.store(true, Ordering::SeqCst);
            if let Ok(mut lock) = self.current_child.lock() {
                if let Some(mut child) = lock.take() {
                    let pid = child.id();
                    #[cfg(windows)]
                    {
                        let _ = Command::new("taskkill")
                            .args(&["/F", "/T", "/PID", &pid.to_string()])
                            .creation_flags(CREATE_NO_WINDOW)
                            .output();
                    }
                    #[cfg(not(windows))]
                    {
                        let _ = child.kill();
                    }
                    let _ = child.wait();
                }
            }
        }
    }

    pub fn run_command<C: ProcessCallbacks>(
        &self,
        cmd_args: &[String],
        target_output: &str,
        total_duration: Option<f64>,
        callbacks: Arc<C>,
    ) {
        if cmd_args.is_empty() {
            callbacks.on_error("Команда запуска пуста");
            return;
        }

        if self.is_running.compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst).is_err() {
            callbacks.on_error("Другая операция уже выполняется");
            return;
        }

        self.cancelled.store(false, Ordering::SeqCst);

        let mut cmd = Command::new(&cmd_args[0]);
        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);

        if cmd_args.len() > 1 {
            cmd.args(&cmd_args[1..]);
        }

        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());

        let mut child = match cmd.spawn() {
            Ok(c) => c,
            Err(e) => {
                self.is_running.store(false, Ordering::SeqCst);
                callbacks.on_error(&format!("Не удалось запустить процесс: {}", e));
                return;
            }
        };

        let stdout = child.stdout.take();
        let stderr = child.stderr.take();

        if let Ok(mut lock) = self.current_child.lock() {
            *lock = Some(child);
        }

        let is_ytdlp = cmd_args[0].to_lowercase().contains("yt-dlp");
        let total_dur = total_duration.unwrap_or(0.0);

        let cancelled = self.cancelled.clone();
        let is_running = self.is_running.clone();
        let current_child = self.current_child.clone();
        let target_out = target_output.to_string();

        thread::spawn(move || {
            let mut last_progress_pct = 0.0;

            let cb_log = callbacks.clone();
            let cb_prog = callbacks.clone();

            // Handle stderr (used by FFmpeg for progress)
            let err_handle = thread::spawn(move || {
                if let Some(err_stream) = stderr {
                    let reader = BufReader::new(err_stream);
                    let mut log_batch: Vec<String> = Vec::new();
                    let mut last_log_time = std::time::Instant::now();
                    let mut last_prog_time = std::time::Instant::now();

                    for line in reader.lines().flatten() {
                        log_batch.push(line.clone());
                        if log_batch.len() >= 25 || last_log_time.elapsed().as_millis() >= 100 {
                            cb_log.on_log(&log_batch.join("\n"));
                            log_batch.clear();
                            last_log_time = std::time::Instant::now();
                        }

                        if !is_ytdlp {
                            let mut pct = last_progress_pct;
                            let mut speed_val = String::new();
                            let mut time_val = String::new();
                            let mut fps_val = 0.0;
                            let mut frame_val = 0;

                            if let Some(caps) = RE_FFMPEG_TIME.captures(&line) {
                                let h: f64 = caps[1].parse().unwrap_or(0.0);
                                let m: f64 = caps[2].parse().unwrap_or(0.0);
                                let s: f64 = caps[3].parse().unwrap_or(0.0);
                                let current_sec = h * 3600.0 + m * 60.0 + s;
                                time_val = format!("{:02}:{:02}:{:02}", h as i64, m as i64, s as i64);

                                if total_dur > 0.0 {
                                    pct = ((current_sec / total_dur) * 100.0).clamp(0.0, 99.0);
                                    last_progress_pct = pct;
                                }
                            }

                            if let Some(caps) = RE_FFMPEG_SPEED.captures(&line) {
                                speed_val = format!("{}x", &caps[1]);
                            }
                            if let Some(caps) = RE_FFMPEG_FPS.captures(&line) {
                                fps_val = caps[1].parse().unwrap_or(0.0);
                            }
                            if let Some(caps) = RE_FFMPEG_FRAME.captures(&line) {
                                frame_val = caps[1].parse().unwrap_or(0);
                            }

                            if (!time_val.is_empty() || !speed_val.is_empty())
                                && (last_prog_time.elapsed().as_millis() >= 70 || (pct - last_progress_pct).abs() >= 1.0)
                            {
                                cb_prog.on_progress(json!({
                                    "percent": (pct * 10.0).round() / 10.0,
                                    "speed": speed_val,
                                    "time": time_val,
                                    "fps": fps_val,
                                    "frame": frame_val
                                }));
                                last_prog_time = std::time::Instant::now();
                            }
                        }
                    }
                    if !log_batch.is_empty() {
                        cb_log.on_log(&log_batch.join("\n"));
                    }
                }
            });

            let mut detected_out_file = String::new();

            // Handle stdout (used by yt-dlp for progress)
            if let Some(out_stream) = stdout {
                let reader = BufReader::new(out_stream);
                let mut log_batch: Vec<String> = Vec::new();
                let mut last_log_time = std::time::Instant::now();
                let mut last_prog_time = std::time::Instant::now();

                for line in reader.lines().flatten() {
                    log_batch.push(line.clone());
                    if log_batch.len() >= 25 || last_log_time.elapsed().as_millis() >= 100 {
                        callbacks.on_log(&log_batch.join("\n"));
                        log_batch.clear();
                        last_log_time = std::time::Instant::now();
                    }

                    if is_ytdlp {
                        let trimmed = line.trim();
                        if trimmed.starts_with("[download] Destination:") {
                            let dest = trimmed.trim_start_matches("[download] Destination:").trim();
                            detected_out_file = dest.to_string();
                        } else if trimmed.starts_with("[Merger] Merging formats into") {
                            let dest = trimmed.trim_start_matches("[Merger] Merging formats into").trim().trim_matches('"');
                            detected_out_file = dest.to_string();
                        } else if trimmed.starts_with("[ExtractAudio] Destination:") {
                            let dest = trimmed.trim_start_matches("[ExtractAudio] Destination:").trim();
                            detected_out_file = dest.to_string();
                        } else if trimmed.starts_with("[download]") && trimmed.ends_with("has already been downloaded") {
                            let dest = trimmed.trim_start_matches("[download]").trim_end_matches("has already been downloaded").trim();
                            detected_out_file = dest.to_string();
                        }

                        if let Some(caps) = RE_YTDLP.captures(&line) {
                            let pct: f64 = caps[1].parse().unwrap_or(0.0);
                            let size = &caps[2];
                            let speed = &caps[3];
                            let eta = &caps[4];

                            if last_prog_time.elapsed().as_millis() >= 70 {
                                callbacks.on_progress(json!({
                                    "percent": pct,
                                    "speed": speed,
                                    "eta": eta,
                                    "total_size": size
                                }));
                                last_prog_time = std::time::Instant::now();
                            }
                        }
                    }
                }
                if !log_batch.is_empty() {
                    callbacks.on_log(&log_batch.join("\n"));
                }
            }

            let _ = err_handle.join();

            let status = if let Ok(mut lock) = current_child.lock() {
                if let Some(mut child) = lock.take() {
                    child.wait().ok()
                } else {
                    None
                }
            } else {
                None
            };

            is_running.store(false, Ordering::SeqCst);

            if cancelled.load(Ordering::SeqCst) {
                callbacks.on_cancel();
                return;
            }

            match status {
                Some(st) if st.success() => {
                    callbacks.on_progress(json!({ "percent": 100.0 }));
                    let final_out = if !detected_out_file.is_empty() {
                        let p = Path::new(&detected_out_file);
                        if p.is_absolute() {
                            detected_out_file
                        } else {
                            std::env::current_dir()
                                .map(|cwd| cwd.join(&detected_out_file).to_string_lossy().to_string())
                                .unwrap_or(detected_out_file)
                        }
                    } else {
                        target_out
                    };
                    callbacks.on_success(&final_out, "Операция успешно завершена!");
                }
                Some(st) => {
                    let code = st.code().unwrap_or(-1);
                    callbacks.on_error(&format!("Процесс завершился с кодом ошибки: {}", code));
                }
                None => {
                    callbacks.on_error("Процесс был прерван");
                }
            }
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_process_runner_initial_state() {
        let runner = ProcessRunner::new();
        assert!(!runner.is_running());
        assert!(!runner.is_cancelled());
    }

    #[test]
    fn test_process_runner_cancel_and_reset() {
        let runner = ProcessRunner::new();
        runner.cancelled.store(true, Ordering::SeqCst);
        assert!(runner.is_cancelled());
        runner.reset_cancelled();
        assert!(!runner.is_cancelled());
    }
}
