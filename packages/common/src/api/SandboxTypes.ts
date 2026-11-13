/**
 * Where the agent's sandbox is, as the daemon's API reports it. Starting walks `startingVm → buildingImage →
 * startingAgent → ready` (`buildingImage` only when the environment is first downloaded or changed); `failed` carries a
 * technical message for the details view, and `sandbox/start` retries.
 */
export type SandboxStatus =
    | { status: 'stopped' }
    | { status: 'startingVm' }
    | { status: 'buildingImage' }
    | { status: 'startingAgent' }
    | { status: 'ready' }
    | { status: 'stopping' }
    | { status: 'failed'; message: string };
