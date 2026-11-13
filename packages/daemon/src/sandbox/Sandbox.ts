import { defineInterface } from '@nzyme/ioc/Interface.js';
import type { EventEmitter } from '@nzyme/utils/createEventEmitter.js';

/**
 * Where the sandbox is in its lifecycle. `start()` walks `startingVm → buildingImage → startingAgent → ready`;
 * `buildingImage` is skipped when the image is already built.
 */
export type SandboxState =
    | { status: 'stopped' }
    | { status: 'startingVm' }
    | { status: 'buildingImage' }
    | { status: 'startingAgent' }
    | { status: 'ready'; endpoint: SandboxEndpoint }
    | { status: 'stopping' }
    | { status: 'failed'; message: string };

/** How the daemon reaches the agent (OpenCode) running in the sandbox: HTTP basic auth on a loopback URL. */
export interface SandboxEndpoint {
    url: string;
    username: string;
    /** Generated once and kept in a file only the user can read; never log it. */
    password: string;
}

/** A command to run inside the agent's container. */
export interface SandboxExecParams {
    command: string[];
}

/** A process running inside the agent's container. */
export interface SandboxProcess {
    /** Open until `end()`: a process that reads its stdin to the end waits for it. */
    stdin: SandboxProcessStdin;
    stdout: ReadableStream<Uint8Array>;
    stderr: ReadableStream<Uint8Array>;
    /** Resolves with the exit code once the process ends. */
    exited: Promise<number>;
    /**
     * Kills the host side of the process. The process inside the container keeps running (`nerdctl exec` does not pass
     * the signal on), so a caller that must end it does so in the container, e.g. with `pkill`.
     */
    kill(): void;
}

/** Writes to a sandbox process's stdin. */
export interface SandboxProcessStdin {
    write(chunk: string | Uint8Array): void;
    /** Closes stdin, so the process reads end-of-file. */
    end(): void;
}

/**
 * The Linux sandbox all agent work runs in: one per profile, holding the agent's container, which sees the profile's
 * projects and nothing else of the computer (design D6, D8). Runtime-agnostic: each platform has its own
 * implementation.
 */
export interface Sandbox {
    getState(): SandboxState;
    /**
     * The state, with `ready` re-checked against the agent when it last answered a while ago: a sandbox whose agent
     * stopped answering starts again (and reports `startingVm`) instead of reporting `ready`.
     */
    getVerifiedState(): Promise<SandboxState>;
    /** Fires on every state transition with the new state. */
    readonly stateChanged: EventEmitter<[state: SandboxState]>;
    /**
     * Brings the sandbox up and resolves with the agent's endpoint once the agent answers. Concurrent calls join the
     * same start; a call while ready returns the current endpoint. Rejects (and moves to `failed`) when a step fails.
     */
    start(): Promise<SandboxEndpoint>;
    /** Shuts the sandbox down; the next `start()` brings it up again with its state (volumes, projects) intact. */
    stop(): Promise<void>;
    /** Runs a command in the agent's container; the sandbox must be ready. */
    exec(params: SandboxExecParams): SandboxProcess;
}

/** The sandbox of the current profile. */
export const Sandbox = defineInterface<Sandbox>({ name: 'Sandbox' });
