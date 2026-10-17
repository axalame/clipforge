use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

const CONFIG_FILE: &str = "video_processor_config.json";
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AppConfig {
    #[serde(default)]
    pub ffmpeg_dir: String,
    #[serde(default)]
    pub ytdlp_path: String,
    #[serde(default)]
    pub deno_path: String,
    #[serde(default = "default_ytdlp_channel")]
    pub ytdlp_channel: String,
    #[serde(default = "default_cookie_source")]
    pub cookie_source: String,
    #[serde(default)]
    pub cookie_file: String,
    #[serde(default = "default_output_dir")]
    pub output_dir: String,
}

fn default_ytdlp_channel() -> String {
    "Stable".to_string()
}

fn default_cookie_source() -> String {
    "file".to_string()
}

fn default_output_dir() -> String {
    if let Ok(user_profile) = std::env::var("USERPROFILE") {
        let downloads = PathBuf::from(user_profile).join("Downloads");
        if downloads.exists() {
            return downloads.to_string_lossy().to_string();
        }
    }
    "downloads".to_string()
}

impl Default for AppConfig {
    fn default() -> Self {
        let mut cfg = Self {
            ffmpeg_dir: String::new(),
            ytdlp_path: String::new(),
            deno_path: String::new(),
            ytdlp_channel: default_ytdlp_channel(),
            cookie_source: default_cookie_source(),
            cookie_file: String::new(),
            output_dir: default_output_dir(),
        };
        cfg.autodetect_tools();
        cfg
    }
}

impl AppConfig {
    pub fn get_config_path() -> PathBuf {
        let local = Path::new(CONFIG_FILE);
        if local.exists() {
            return local.to_path_buf();
        }
        if let Ok(appdata) = std::env::var("APPDATA") {
            let dir = PathBuf::from(appdata).join("VideoStudioPro");
            let _ = fs::create_dir_all(&dir);
            return dir.join(CONFIG_FILE);
        }
        PathBuf::from(CONFIG_FILE)
    }

    pub fn load() -> Self {
        let path = Self::get_config_path();
        if path.exists() {
            if let Ok(content) = fs::read_to_string(&path) {
                if let Ok(mut cfg) = serde_json::from_str::<AppConfig>(&content) {
                    if cfg.ffmpeg_dir.is_empty() || cfg.ytdlp_path.is_empty() || cfg.deno_path.is_empty() {
                        cfg.autodetect_tools();
                    }
                    return cfg;
                }
            }
        }
        let cfg = Self::default();
        cfg.save();
        cfg
    }

    pub fn save(&self) {
        let path = Self::get_config_path();
        if let Ok(json) = serde_json::to_string_pretty(self) {
            let _ = fs::write(path, json);
        }
    }

    pub fn autodetect_tools(&mut self) {
        // 1. Check Roaming directory from yt-dlp-gui
        if let Ok(user_profile) = std::env::var("USERPROFILE") {
            let roaming_ffmpeg = PathBuf::from(&user_profile)
                .join("AppData")
                .join("Roaming")
                .join("com.imsyy.yt-dlp-gui")
                .join("ffmpeg");
            if roaming_ffmpeg.join("ffmpeg.exe").exists() && self.ffmpeg_dir.is_empty() {
                self.ffmpeg_dir = roaming_ffmpeg.to_string_lossy().to_string();
            }

            let roaming_deno = PathBuf::from(&user_profile)
                .join("AppData")
                .join("Roaming")
                .join("com.imsyy.yt-dlp-gui")
                .join("deno.exe");
            if roaming_deno.exists() && self.deno_path.is_empty() {
                self.deno_path = roaming_deno.to_string_lossy().to_string();
            }

            let dl_cookie = PathBuf::from(&user_profile)
                .join("Downloads")
                .join("www.youtube.com_cookies.txt");
            if dl_cookie.exists() && self.cookie_file.is_empty() {
                self.cookie_file = dl_cookie.to_string_lossy().to_string();
            } else {
                let dl_cookie_generic = PathBuf::from(&user_profile)
                    .join("Downloads")
                    .join("cookies.txt");
                if dl_cookie_generic.exists() && self.cookie_file.is_empty() {
                    self.cookie_file = dl_cookie_generic.to_string_lossy().to_string();
                }
            }
        }

        // 2. Check C:\yt-dlp\yt-dlp.exe
        let c_ytdlp = Path::new(r"C:\yt-dlp\yt-dlp.exe");
        if c_ytdlp.exists() && self.ytdlp_path.is_empty() {
            self.ytdlp_path = c_ytdlp.to_string_lossy().to_string();
        }

        // 3. Fallback to system PATH
        if self.ffmpeg_dir.is_empty() && is_command_available("ffmpeg") {
            self.ffmpeg_dir = "PATH".to_string();
        }
        if self.ytdlp_path.is_empty() && is_command_available("yt-dlp") {
            self.ytdlp_path = "yt-dlp".to_string();
        }
        if self.deno_path.is_empty() && is_command_available("deno") {
            self.deno_path = "deno".to_string();
        }
    }

    pub fn ffmpeg_exe(&self) -> String {
        if !self.ffmpeg_dir.is_empty() && self.ffmpeg_dir != "PATH" {
            let p = Path::new(&self.ffmpeg_dir).join("ffmpeg.exe");
            if p.exists() {
                return p.to_string_lossy().to_string();
            }
        }
        "ffmpeg".to_string()
    }

    pub fn ffprobe_exe(&self) -> String {
        if !self.ffmpeg_dir.is_empty() && self.ffmpeg_dir != "PATH" {
            let p = Path::new(&self.ffmpeg_dir).join("ffprobe.exe");
            if p.exists() {
                return p.to_string_lossy().to_string();
            }
        }
        "ffprobe".to_string()
    }

    pub fn ytdlp_exe(&self) -> String {
        if !self.ytdlp_path.is_empty() && Path::new(&self.ytdlp_path).exists() {
            return self.ytdlp_path.clone();
        }
        "yt-dlp".to_string()
    }

    pub fn deno_exe(&self) -> String {
        if !self.deno_path.is_empty() && Path::new(&self.deno_path).exists() {
            return self.deno_path.clone();
        }
        if is_command_available("deno") {
            return "deno".to_string();
        }
        if let Ok(user_profile) = std::env::var("USERPROFILE") {
            let p = PathBuf::from(&user_profile)
                .join("AppData")
                .join("Roaming")
                .join("com.imsyy.yt-dlp-gui")
                .join("deno.exe");
            if p.exists() {
                return p.to_string_lossy().to_string();
            }
        }
        "deno".to_string()
    }

    pub fn validate_tools(&self) -> serde_json::Value {
        let (ff_ok, ff_msg) = test_tool(&self.ffmpeg_exe(), &["-version"]);
        let (probe_ok, probe_msg) = test_tool(&self.ffprobe_exe(), &["-version"]);
        let (yt_ok, yt_msg) = test_tool(&self.ytdlp_exe(), &["--version"]);
        let (deno_ok, deno_msg) = test_tool(&self.deno_exe(), &["--version"]);

        let ffmpeg_full_path = self.ffmpeg_exe();
        let ytdlp_full_path = self.ytdlp_exe();
        let deno_full_path = self.deno_exe();
        let cookie_ok = !self.cookie_file.is_empty() && Path::new(&self.cookie_file).exists();

        let ff_ver = if ff_ok {
            ff_msg.replace("ffmpeg version ", "").split_whitespace().next().unwrap_or(&ff_msg).to_string()
        } else {
            ff_msg.clone()
        };

        let deno_ver = if deno_ok {
            deno_msg.lines().next().unwrap_or(&deno_msg).replace("deno ", "").trim().to_string()
        } else {
            deno_msg.clone()
        };

        let ytdlp_ver = if yt_ok {
            yt_msg.lines().next().unwrap_or(&yt_msg).trim().to_string()
        } else {
            yt_msg.clone()
        };

        serde_json::json!({
            "ytdlp": {
                "ok": yt_ok,
                "version": ytdlp_ver,
                "path": ytdlp_full_path,
                "channel": self.ytdlp_channel,
                "msg": yt_msg
            },
            "deno": {
                "ok": deno_ok,
                "version": deno_ver,
                "path": deno_full_path,
                "msg": deno_msg
            },
            "ffmpeg": {
                "ok": ff_ok,
                "version": ff_ver,
                "path": ffmpeg_full_path,
                "msg": ff_msg
            },
            "ffprobe": {
                "ok": probe_ok,
                "version": probe_msg.trim(),
                "msg": probe_msg
            },
            "cookie": {
                "ok": cookie_ok,
                "path": self.cookie_file
            },
            "output_dir": {
                "ok": true,
                "path": self.output_dir
            }
        })
    }
}

fn is_command_available(cmd: &str) -> bool {
    let mut command = Command::new(cmd);
    #[cfg(windows)]
    command.creation_flags(CREATE_NO_WINDOW);
    command.arg("-version").output().is_ok()
}

fn test_tool(exe: &str, args: &[&str]) -> (bool, String) {
    let mut cmd = Command::new(exe);
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd.args(args);

    match cmd.output() {
        Ok(out) if out.status.success() => {
            let s = String::from_utf8_lossy(&out.stdout);
            let first_line = s.lines().next().unwrap_or("Ready").trim().to_string();
            (true, first_line)
        }
        Ok(out) => {
            let s = String::from_utf8_lossy(&out.stderr);
            (false, s.lines().next().unwrap_or("Failed").trim().to_string())
        }
        Err(e) => (false, e.to_string()),
    }
}
