// The shapes several OpenCode operations share, in the daemon's terms. The commands map OpenCode's own (`schema.gen.ts`,
// typed by its spec) into these, so a renamed or moved field in the spec fails the build in this package only.

/** How a run (the agent's work on one prompt) ended. */
export type OpencodeRunOutcome = 'succeeded' | 'failed' | 'interrupted';

/** A conversation, bound to a working directory inside the sandbox. */
export interface OpencodeSession {
    id: string;
    /** The working directory as the container sees it. */
    directory: string;
    title?: string;
    /** Server clock, epoch ms. */
    createdAt: number;
    /** When anything in it last changed: a message, a run, its title (server clock, epoch ms). */
    updatedAt: number;
    /** How the last run ended; absent until a run has ended. */
    outcome?: OpencodeRunOutcome;
}

/** An error as OpenCode reports it on a message, a tool call, a step or a run. */
export interface OpencodeReportedError {
    /** OpenCode's error class, e.g. `ProviderError`. */
    kind: string;
    message: string;
    /** The HTTP status the model provider answered with, when the error came from it. */
    httpStatus?: number;
    /** The provider's response body, verbatim. */
    responseBody?: string;
    retryAfterMs?: number;
}

/** What a tool call produced: text, or a file it points at. */
export type OpencodeToolOutput = OpencodeToolTextOutput | OpencodeToolFileOutput;

/** Text a tool returned. */
export interface OpencodeToolTextOutput {
    type: 'text';
    text: string;
}

/** A file a tool returned. */
export interface OpencodeToolFileOutput {
    type: 'file';
    uri: string;
    mimeType: string;
    name?: string;
}
