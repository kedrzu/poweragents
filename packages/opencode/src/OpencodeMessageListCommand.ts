import { defineCommand } from '@nzyme/ioc/Command.js';
import { assertNever } from '@nzyme/utils/assertNever.js';

import { OpencodeClient } from './OpencodeClient.js';
import type { OpencodeReportedError, OpencodeRunOutcome, OpencodeToolOutput } from './OpencodeTypes.js';
import type { components } from './schema.gen.js';
import { createOpencodeStatusError } from './utils/createOpencodeStatusError.js';
import { mapOpencodeReportedError } from './utils/mapOpencodeReportedError.js';
import { mapOpencodeToolOutput } from './utils/mapOpencodeToolOutput.js';

/** A message of a session, discriminated by `type`. */
export type OpencodeMessage =
    | OpencodePromptMessage
    | OpencodeReplyMessage
    | OpencodeRunEndMessage
    | OpencodeOtherMessage;

/** What the person asked. */
export interface OpencodePromptMessage {
    type: 'prompt';
    id: string;
    /** Server clock, epoch ms. */
    createdAt: number;
    text: string;
}

/** One reply of the agent; a run produces one per model step. */
export interface OpencodeReplyMessage {
    type: 'reply';
    id: string;
    /** Server clock, epoch ms. */
    createdAt: number;
    parts: OpencodeReplyPart[];
    /** Why the model stopped, as OpenCode names it (`stop`, `tool-calls`, `error`, …); absent while it streams. */
    finish?: string;
    error?: OpencodeReportedError;
}

/** The end of a run: how it ended and, when it failed, why. */
export interface OpencodeRunEndMessage {
    type: 'runEnd';
    id: string;
    /** Server clock, epoch ms. */
    createdAt: number;
    outcome: OpencodeRunOutcome;
    error?: OpencodeReportedError;
}

/** A message that is not part of the conversation's content: a model switch, a compaction, a system note, … */
export interface OpencodeOtherMessage {
    type: 'other';
    id: string;
    /** Server clock, epoch ms. */
    createdAt: number;
}

/** A piece of a reply. The model's reasoning is left out. */
export type OpencodeReplyPart = OpencodeTextPart | OpencodeToolCallPart;

/** Text the agent wrote. */
export interface OpencodeTextPart {
    type: 'text';
    text: string;
}

/** Where a tool call is: its input still streaming in, running, finished or failed. */
export type OpencodeToolCallStatus = 'pending' | 'running' | 'completed' | 'failed';

/** A tool the agent called. */
export interface OpencodeToolCallPart {
    type: 'tool';
    callId: string;
    /** The tool's name, e.g. `write`. */
    name: string;
    status: OpencodeToolCallStatus;
    /** The arguments; absent while they still stream in. */
    input?: Record<string, unknown>;
    /** What the tool returned; empty until it has finished. */
    output: OpencodeToolOutput[];
    /** Why it failed, when `status` is `failed`. */
    error?: OpencodeReportedError;
}

/** Params of `OpencodeMessageListCommand`. */
export interface OpencodeMessageListCommandParams {
    sessionId: string;
    /** Where the page ends: `olderCursor` of the page after it; absent for the newest page. */
    olderCursor?: string;
    /** How many messages a page holds, at most 200 (the API's maximum). */
    limit: number;
}

/** A page of a session's messages. */
export interface OpencodeMessagePage {
    /** Oldest first. */
    messages: OpencodeMessage[];
    /** Reads the page of older messages; absent when this page holds the oldest (it is not full). */
    olderCursor?: string;
}

/** A page of a session's messages, counting back from the newest. */
export interface OpencodeMessageListCommandShape {
    (params: OpencodeMessageListCommandParams): Promise<OpencodeMessagePage>;
}

/** Lists a session's messages, a page at a time. */
export const OpencodeMessageListCommand = defineCommand({
    name: 'OpencodeMessageListCommand',
    deps: { client: OpencodeClient },
    setup({ client }): OpencodeMessageListCommandShape {
        return async params => {
            const limit = String(params.limit);
            // OpenCode pages newest first here; a cursor carries the order and must not be combined with it.
            const query: OpencodeMessageQuery =
                params.olderCursor == null ? { order: 'desc', limit } : { cursor: params.olderCursor, limit };
            const response = await client({
                method: 'GET',
                path: '/api/session/{sessionID}/message',
                pathParams: { sessionID: params.sessionId },
                query,
            });
            if (response.status !== 200) {
                throw createOpencodeStatusError('listMessages', response);
            }

            const page = response.data.data;
            // OpenCode gives a cursor after the oldest message too, leading to an empty page; a short page is the last.
            const olderCursor = page.length < params.limit ? undefined : (response.data.cursor.next ?? undefined);
            return { messages: page.map(mapMessage).toReversed(), olderCursor };
        };
    },
});

interface OpencodeMessageQuery {
    order?: 'desc';
    cursor?: string;
    limit: string;
}

type Schemas = components['schemas'];

function mapMessage(message: Schemas['Session.Message.Info']): OpencodeMessage {
    const base = { id: message.id, createdAt: message.time.created };
    switch (message.type) {
        case 'user':
            return { ...base, type: 'prompt', text: message.text };
        case 'assistant':
            return {
                ...base,
                type: 'reply',
                parts: mapReplyParts(message.content),
                finish: message.finish,
                error: message.error && mapOpencodeReportedError(message.error),
            };
        case 'idle':
            return {
                ...base,
                type: 'runEnd',
                outcome: message.outcome,
                error: message.error && mapOpencodeReportedError(message.error),
            };
        // `synthetic` among them: input the daemon gave the agent (App setup's opening instruction), not the person's words.
        default:
            return { ...base, type: 'other' };
    }
}

function mapReplyParts(content: Schemas['Session.Message.Assistant']['content']) {
    const parts: OpencodeReplyPart[] = [];
    for (const part of content) {
        switch (part.type) {
            case 'text':
                parts.push({ type: 'text', text: part.text });
                break;
            case 'tool':
                parts.push(mapToolCall(part));
                break;
            case 'reasoning':
                break;
        }
    }
    return parts;
}

function mapToolCall(tool: Schemas['Session.Message.Assistant.Tool']): OpencodeToolCallPart {
    const call: Pick<OpencodeToolCallPart, 'type' | 'callId' | 'name'> = {
        type: 'tool',
        callId: tool.id,
        name: tool.name,
    };
    const state = tool.state;
    switch (state.status) {
        case 'streaming':
            return { ...call, status: 'pending', output: [] };
        case 'running':
            return { ...call, status: 'running', input: state.input, output: [] };
        case 'completed':
            return { ...call, status: 'completed', input: state.input, output: mapOpencodeToolOutput(state.content) };
        case 'error':
            return {
                ...call,
                status: 'failed',
                input: state.input,
                output: mapOpencodeToolOutput(state.content),
                error: mapOpencodeReportedError(state.error),
            };
        default:
            return assertNever(state, 'Unknown OpenCode tool state');
    }
}
