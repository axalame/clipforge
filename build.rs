use std::env;
use std::fs;
use std::path::PathBuf;

fn main() {
    println!("cargo:rerun-if-changed=frontend/dist/index.html");

    // Copy runtime DLLs to target folder if available
    if let Ok(out_dir) = env::var("OUT_DIR") {
        let out_path = PathBuf::from(out_dir);
        // OUT_DIR is target/(debug|release)/build/video_studio-.../out
        if let Some(target_dir) = out_path.ancestors().nth(3) {
            let root_loader = PathBuf::from("WebView2Loader.dll");
            let root_unwind = PathBuf::from("libunwind.dll");

            if root_loader.exists() {
                let _ = fs::copy(&root_loader, target_dir.join("WebView2Loader.dll"));
            }
            if root_unwind.exists() {
                let _ = fs::copy(&root_unwind, target_dir.join("libunwind.dll"));
            }
        }
    }

    #[cfg(windows)]
    {
        println!("cargo:rerun-if-changed=app.rc");
        println!("cargo:rerun-if-changed=app_icon.ico");
        if let Ok(out_dir) = env::var("OUT_DIR") {
            let res_path = format!("{}/app.res", out_dir);
            let status = std::process::Command::new("windres")
                .args(&["app.rc", "-O", "coff", "-o"])
                .arg(&res_path)
                .status();
            if let Ok(s) = status {
                if s.success() {
                    println!("cargo:rustc-link-arg={}", res_path);
                }
            }
        }
    }
}
