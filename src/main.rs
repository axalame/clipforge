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

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Start media streaming server on 127.0.0.1 (assigned free port)
    let media_server_url = start_media_server();
    println!("Native Rust Media Server listening at {}", media_server_url);

    // 2. Initialize Tao Event Loop with UserEvent support
    let event_loop = EventLoopBuilder::<UserEvent>::with_user_event().build();
    let proxy = event_loop.create_proxy();

    // 3. Build native desktop window
    let mut window_builder = WindowBuilder::new()
        .with_title("Video Processing Studio")
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

    // 5. Build native WebView2 instance
    let webview = WebViewBuilder::new()
        .with_url(&media_server_url)
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
        *control_flow = ControlFlow::Wait;

        match event {
            Event::UserEvent(UserEvent::EvalJs(script)) => {
                let _ = webview.evaluate_script(&script);
            }
            Event::WindowEvent {
                event: WindowEvent::CloseRequested,
                ..
            } => {
                api_exit.cancel();
                *control_flow = ControlFlow::Exit;
            }
            _ => (),
        }
    });
}
