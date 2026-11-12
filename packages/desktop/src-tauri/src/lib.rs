//! The poweragents desktop app: the app's static build (`packages/app`) in one native window. It is a thin
//! client of the daemon (`packages/daemon`), which it reaches over the loopback port.

mod daemon;

/// Starts the app and blocks until it quits.
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            daemon::start(app.handle());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("the desktop app failed to start");
}
