#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod api;
mod config;
mod ffmpeg_builder;
mod media_info;
mod media_server;
mod process_runner;
mod ytdlp_runner;

use api::{Api, UserEvent};
use media_server::start_media_server;
use serde_json::Value;
use std::sync::Arc;
use tao::{
    dpi::LogicalSize,
    event::{Event, WindowEvent},
    event_loop::{ControlFlow, EventLoopBuilder},
    window::WindowBuilder,
};
use wry::WebViewBuilder;

const POLYFILL_JS: &str = r#"
window.__rpcCallbacks = {};
window.__resolveRpc = function(id, res) {
  if (window.__rpcCallbacks[id]) {
    window.__rpcCallbacks[id].resolve(res);
    delete window.__rpcCallbacks[id];
  }
};
window.__rejectRpc = function(id, err) {
  if (window.__rpcCallbacks[id]) {
    window.__rpcCallbacks[id].reject(err);
    delete window.__rpcCallbacks[id];
  }
};
window.pywebview = {
  api: new Proxy({}, {
    get: function(target, prop) {
      return function() {
        var args = Array.prototype.slice.call(arguments);
        return new Promise(function(resolve, reject) {
          var id = Math.random().toString(36).substring(2);
          window.__rpcCallbacks[id] = { resolve: resolve, reject: reject };
          window.ipc.postMessage(JSON.stringify({ id: id, method: prop, args: args }));
        });
      };
    }
  })
};
window.dispatchEvent(new Event('pywebviewready'));
"#;

fn load_app_icon() -> Option<tao::window::Icon> {
    const ICON_RGBA: &[u8] = include_bytes!("app_icon.rgba");
    tao::window::Icon::from_rgba(ICON_RGBA.to_vec(), 32, 32).ok()
}

fn load_tray_icon() -> Option<tray_icon::Icon> {
    const ICON_RGBA: &[u8] = include_bytes!("app_icon.rgba");
    match tray_icon::Icon::from_rgba(ICON_RGBA.to_vec(), 32, 32) {
        Ok(icon) => Some(icon),
        Err(e) => {
            eprintln!("Failed to load tray icon: {}", e);
            None
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_load_tray_icon_rgba() {
        assert!(load_tray_icon().is_some());
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Start media streaming server on 127.0.0.1 (assigned free port)
    let media_server_url = start_media_server();
    println!("Native Rust Media Server listening at {}", media_server_url);

    // 2. Initialize Tao Event Loop with UserEvent support
    let event_loop = EventLoopBuilder::<UserEvent>::with_user_event().build();
    let proxy = event_loop.create_proxy();

    // Set up tray event forwarding to Tao event loop
    let proxy_tray = proxy.clone();
    tray_icon::TrayIconEvent::set_event_handler(Some(move |event| {
        let _ = proxy_tray.send_event(UserEvent::TrayIconEvent(event));
    }));

    let proxy_menu = proxy.clone();
    tray_icon::menu::MenuEvent::set_event_handler(Some(move |event| {
        let _ = proxy_menu.send_event(UserEvent::MenuEvent(event));
    }));

    // Create system tray menu
    let tray_menu = tray_icon::menu::Menu::new();
    let show_item = tray_icon::menu::MenuItem::new("Открыть ClipForge", true, None);
    let quit_item = tray_icon::menu::MenuItem::new("Выход", true, None);
    let show_id = show_item.id().clone();
    let quit_id = quit_item.id().clone();
    let _ = tray_menu.append_items(&[&show_item, &quit_item]);

    let mut tray_builder = tray_icon::TrayIconBuilder::new()
        .with_menu(Box::new(tray_menu))
        .with_tooltip("ClipForge ⚡")
        .with_menu_on_left_click(false);

    if let Some(tray_icon_img) = load_tray_icon() {
        tray_builder = tray_builder.with_icon(tray_icon_img);
    }

    let tray_icon = tray_builder.build()?;

    // 3. Build native desktop window
    let mut window_builder = WindowBuilder::new()
        .with_title("ClipForge")
        .with_inner_size(LogicalSize::new(1280.0, 850.0))
        .with_min_inner_size(LogicalSize::new(960.0, 640.0));

    if let Some(icon) = load_app_icon() {
        window_builder = window_builder.with_window_icon(Some(icon));
    }

    let window = window_builder.build(&event_loop)?;

    // 4. Initialize API controller
    let api = Arc::new(Api::new(proxy.clone()));
    let api_clone = api.clone();
    let proxy_for_ipc = proxy.clone();

    let data_dir = if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
        std::path::PathBuf::from(local_app_data).join("ClipForge").join("EBWebView")
    } else {
        std::env::temp_dir().join("ClipForge").join("EBWebView")
    };
    let _ = std::fs::create_dir_all(&data_dir);
    let mut web_context = wry::WebContext::new(Some(data_dir));

    // 5. Select target URL: probe for Vite dev server at http://127.0.0.1:5173 for live HMR
    let mut target_url = media_server_url.clone();
    if let Ok(addr) = "127.0.0.1:5173".parse() {
        if let Ok(stream) = std::net::TcpStream::connect_timeout(&addr, std::time::Duration::from_millis(150)) {
            drop(stream);
            println!("[DevMode] Vite dev server detected at http://127.0.0.1:5173! Connecting for live HMR...");
            target_url = "http://localhost:5173".to_string();
        }
    }

    // Build native WebView2 instance
    let webview = WebViewBuilder::with_web_context(&mut web_context)
        .with_url(&target_url)
        .with_devtools(true)
        .with_initialization_script(POLYFILL_JS)
        .with_ipc_handler(move |req| {
            let body = req.body();
            if let Ok(val) = serde_json::from_str::<Value>(body) {
                let id = val["id"].as_str().unwrap_or("").to_string();
                let method = val["method"].as_str().unwrap_or("").to_string();
                let args = val["args"].clone();

                let api_ref = api_clone.clone();
                let proxy_ref = proxy_for_ipc.clone();

                std::thread::spawn(move || {
                    let result = api_ref.handle_rpc(&method, &args);
                    let res_str = serde_json::to_string(&result).unwrap_or_else(|_| "null".to_string());
                    let id_escaped = serde_json::to_string(&id).unwrap_or_else(|_| "\"\"".to_string());
                    let js = format!("window.__resolveRpc({}, {});", id_escaped, res_str);
                    let _ = proxy_ref.send_event(UserEvent::EvalJs(js));
                });
            }
        })
        .build(&window)?;

    let api_exit = api.clone();

    // 6. Run native Tao event loop
    event_loop.run(move |event, _, control_flow| {
        let _keep_tray_alive = &tray_icon;
        *control_flow = ControlFlow::Wait;

        match event {
            Event::UserEvent(UserEvent::EvalJs(script)) => {
                let _ = webview.evaluate_script(&script);
            }
            Event::UserEvent(UserEvent::TrayIconEvent(tray_event)) => {
                match tray_event {
                    tray_icon::TrayIconEvent::Click {
                        button: tray_icon::MouseButton::Left,
                        button_state: tray_icon::MouseButtonState::Up,
                        ..
                    }
                    | tray_icon::TrayIconEvent::DoubleClick {
                        button: tray_icon::MouseButton::Left,
                        ..
                    } => {
                        window.set_visible(true);
                        window.set_minimized(false);
                        window.set_focus();
                    }
                    _ => {}
                }
            }
            Event::UserEvent(UserEvent::MenuEvent(menu_event)) => {
                if menu_event.id == show_id {
                    window.set_visible(true);
                    window.set_minimized(false);
                    window.set_focus();
                } else if menu_event.id == quit_id {
                    api_exit.cancel();
                    *control_flow = ControlFlow::Exit;
                }
            }
            Event::WindowEvent {
                event: WindowEvent::CloseRequested,
                ..
            } => {
                // Вместо выхода из программы скрываем окно в трей
                window.set_visible(false);
            }
            _ => (),
        }
    });
}
