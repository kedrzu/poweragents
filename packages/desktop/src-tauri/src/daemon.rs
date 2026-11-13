//! Starting the daemon, which ships inside the app as a sidecar (`bundle.externalBin` in `tauri.conf.json`, built by
//! `bun nx run @poweragents/daemon:sidecar`).

use tauri::AppHandle;

/// The sidecar's name: `binaries/poweragents-daemon-<target triple>` in the bundle.
#[cfg(not(debug_assertions))]
const SIDECAR: &str = "poweragents-daemon";

/// Lima as bundled in the app's resources (`bundle.resources` in `tauri.macos.conf.json`): `bin/limactl` and the
/// `share/lima` it finds beside it. The daemon runs the sandbox from there (`POWERAGENTS_LIMA_DIR`).
#[cfg(all(not(debug_assertions), target_os = "macos"))]
const LIMA_RESOURCE: &str = "lima";

/// Starts the bundled daemon. It keeps running after the app quits, so schedules and the agent's browser go on; when a
/// daemon already holds the port, the new one fails to listen and exits, and the app talks to the running one.
#[cfg(not(debug_assertions))]
pub fn start(app: &AppHandle) {
    if let Err(error) = spawn(app) {
        eprintln!("the daemon failed to start: {error}");
    }
}

#[cfg(not(debug_assertions))]
fn spawn(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    use std::process::Stdio;
    use tauri_plugin_shell::ShellExt;

    let command = app.shell().sidecar(SIDECAR)?;
    #[cfg(target_os = "macos")]
    let command = {
        use tauri::Manager;
        let lima_dir = app.path().resource_dir()?.join(LIMA_RESOURCE);
        command.env("POWERAGENTS_LIMA_DIR", lima_dir)
    };
    // Nobody reads the daemon's output, and a pipe would break once the app quits while the daemon goes on: it gets
    // none, and writes its log to a file (`DaemonLoggerTransport`).
    let mut command = std::process::Command::from(command);
    command
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());
    let mut child = command.spawn()?;
    // Reaped when it exits while the app runs, so it leaves no zombie behind.
    std::thread::spawn(move || child.wait());
    Ok(())
}

/// In development the daemon runs from source under `bun --watch` (`beforeDevCommand`), so the app starts none.
#[cfg(debug_assertions)]
pub fn start(_app: &AppHandle) {}
