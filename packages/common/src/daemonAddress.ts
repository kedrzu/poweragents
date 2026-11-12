/** The port the daemon listens on, on the loopback interface only. */
export const DAEMON_PORT = 47_610;

/** What the daemon answers on `GET /status`, so a client can tell it is running. */
export interface DaemonStatus {
    /** Always `ok` while the daemon serves requests. */
    status: 'ok';
}
