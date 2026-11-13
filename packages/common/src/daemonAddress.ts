/** The port the daemon listens on, on the loopback interface only. */
export const DAEMON_PORT = 47_610;

/** The port `nuxt dev` serves the app on; the desktop shell loads it in development (`build.devUrl` in `tauri.conf.json`). */
export const DEV_SERVER_PORT = 4100;

/** The path the daemon serves its API under: `<DAEMON_API_PATH><endpoint name>`, e.g. `/api/sandbox/status`. */
export const DAEMON_API_PATH = '/api/';

/** What the daemon answers on `GET /status`, so a client can tell it is running. */
export interface DaemonStatus {
    /** Always `ok` while the daemon serves requests. */
    status: 'ok';
}
