//! Starting the daemon, which ships inside the app as a sidecar (`bundle.externalBin` in `tauri.conf.json`, built by
//! `bun nx run @poweragents/daemon:sidecar`).

use tauri::AppHandle;

/// The sidecar's name: `binaries/poweragents-daemon-<target triple>` in the bundle.
#[cfg(not(debug_assertions))]
const SIDECAR: &str = "poweragents-daemon";

/// Starts the bundled daemon. It keeps running after the app quits, so schedules and the agent's browser go on; when a
/// daemon already holds the port, the new one fails to listen and exits, and the app talks to the running one.
#[cfg(not(debug_assertions))]
pub fn start(app: &AppHandle) {
    use tauri_plugin_shell::ShellExt;

    let spawned = app
        .shell()
        .sidecar(SIDECAR)
        .and_then(|command| command.spawn());
    if let Err(error) = spawned {
        eprintln!("the daemon failed to start: {error}");
    }
}

/// In development the daemon runs from source under `bun --watch` (`beforeDevCommand`), so the app starts none.
#[cfg(debug_assertions)]
pub fn start(_app: &AppHandle) {}
