import { defineCommand } from '@nzyme/ioc/Command.js';
import { ApplicationError } from '@nzyme/logging/ApplicationError.js';
import { Logger } from '@nzyme/logging/Logger.js';
import { isPlainObject } from '@nzyme/utils/isPlainObject.js';

import { OpencodeClient } from './OpencodeClient.js';
import type { OpencodeReportedError, OpencodeToolOutput } from './OpencodeTypes.js';
import type { components } from './schema.gen.js';
import { createOpencodeStatusError } from './utils/createOpencodeStatusError.js';
import { mapOpencodeReportedError } from './utils/mapOpencodeReportedError.js';
import { mapOpencodeToolOutput } from './utils/mapOpencodeToolOutput.js';
import { readSseData } from './utils/readSseData.js';

/** An event of the stream or of a session's run, discriminated by `type`. */
export type OpencodeEvent = OpencodeStreamOpenedEvent | OpencodeSessionEvent;

/**
 * The stream is open: always the first event. Events from here on are streamed; a subscriber that lost an earlier
 * stream knows what happened in between is missing.
 */
export interface OpencodeStreamOpenedEvent {
    type: 'streamOpened';
}

/** An event of a session's run, discriminated by `type`. */
export type OpencodeSessionEvent =
    | OpencodeSessionCreatedEvent
    | OpencodeSessionRenamedEvent
    | OpencodeRunStartedEvent
    | OpencodeTextDeltaEvent
    | OpencodeToolStartedEvent
    | OpencodeToolFinishedEvent
    | OpencodeToolFailedEvent
    | OpencodeStepFailedEvent
    | OpencodeRetryScheduledEvent
    | OpencodeRunFinishedEvent
    | OpencodePermissionAskedEvent;

/** A session was created. */
export interface OpencodeSessionCreatedEvent {
    type: 'sessionCreated';
    sessionId: string;
    /** The working directory as the container sees it. */
    directory: string;
    /** Set when the session is a sub-session (an agent's helper). */
    parentId?: string;
    title?: string;
}

/** A session got a title: OpenCode names a session from its first prompt, during the first run. */
export interface OpencodeSessionRenamedEvent {
    type: 'sessionRenamed';
    sessionId: string;
    title: string;
}

/** A run began: the session works on its prompts until `runFinished`. */
export interface OpencodeRunStartedEvent {
    type: 'runStarted';
    sessionId: string;
}

/** The next piece of text the agent is writing. */
export interface OpencodeTextDeltaEvent {
    type: 'textDelta';
    sessionId: string;
    /** The reply message the text belongs to. */
    messageId: string;
    delta: string;
}

/** The agent called a tool with its full input. */
export interface OpencodeToolStartedEvent {
    type: 'toolStarted';
    sessionId: string;
    callId: string;
    /** Absent when the call began before the subscription did. */
    name?: string;
    input: Record<string, unknown>;
}

/** A tool call returned. */
export interface OpencodeToolFinishedEvent {
    type: 'toolFinished';
    sessionId: string;
    callId: string;
    /** Absent when the call began before the subscription did. */
    name?: string;
    output: OpencodeToolOutput[];
}

/** A tool call failed. */
export interface OpencodeToolFailedEvent {
    type: 'toolFailed';
    sessionId: string;
    callId: string;
    /** Absent when the call began before the subscription did. */
    name?: string;
    error: OpencodeReportedError;
    /** What the tool returned before it failed, if anything. */
    output: OpencodeToolOutput[];
}

/** A model step of the run failed; the run may still retry or go on. */
export interface OpencodeStepFailedEvent {
    type: 'stepFailed';
    sessionId: string;
    /** The reply message of the step. */
    messageId: string;
    error: OpencodeReportedError;
}

/** A failed call to the model will be retried. */
export interface OpencodeRetryScheduledEvent {
    type: 'retryScheduled';
    sessionId: string;
    /** Counts from 1. */
    attempt: number;
    /** When the retry runs (server clock, epoch ms). */
    at: number;
    error: OpencodeReportedError;
}

/** Why a run was interrupted: the person stopped it, OpenCode shut down, a newer prompt superseded it, or it idled. */
export type OpencodeInterruptReason = 'user' | 'shutdown' | 'superseded' | 'inactivity';

/** The run ended, discriminated by `outcome`. */
export type OpencodeRunFinishedEvent = OpencodeRunSucceededEvent | OpencodeRunFailedEvent | OpencodeRunInterruptedEvent;

/** The run ended as the agent meant it to. */
export interface OpencodeRunSucceededEvent {
    type: 'runFinished';
    outcome: 'succeeded';
    sessionId: string;
}

/** The run ended on an error. */
export interface OpencodeRunFailedEvent {
    type: 'runFinished';
    outcome: 'failed';
    sessionId: string;
    error: OpencodeReportedError;
}

/** The run was stopped before it ended. */
export interface OpencodeRunInterruptedEvent {
    type: 'runFinished';
    outcome: 'interrupted';
    sessionId: string;
    reason: OpencodeInterruptReason;
}

/** The agent waits for a permission; answer with `OpencodePermissionReplyCommand`. */
export interface OpencodePermissionAskedEvent {
    type: 'permissionAsked';
    sessionId: string;
    permissionId: string;
    /** What the agent wants to do, e.g. `external_directory`. */
    action: string;
    /** What it wants to do it to: paths, commands, URLs. */
    resources: string[];
    /** OpenCode's own description of the request. */
    message?: string;
}

/**
 * Streams the events of every session until `signal` aborts, which ends the iteration quietly — also before the
 * stream has opened. Subscribe before prompting: the stream does not replay what already happened. OpenCode's other
 * events are skipped.
 */
export interface OpencodeEventSubscribeCommandShape {
    (signal: AbortSignal): AsyncIterable<OpencodeEvent>;
}

/** Subscribes to OpenCode's event stream. */
export const OpencodeEventSubscribeCommand = defineCommand({
    name: 'OpencodeEventSubscribeCommand',
    deps: { client: OpencodeClient, logger: Logger },
    setup({ client, logger }): OpencodeEventSubscribeCommandShape {
        return subscribe;

        async function* subscribe(signal: AbortSignal): AsyncGenerator<OpencodeEvent> {
            try {
                yield* readEvents(signal);
            } catch (error) {
                if (!signal.aborted) {
                    throw error;
                }
            }
        }

        async function* readEvents(signal: AbortSignal): AsyncGenerator<OpencodeEvent> {
            const response = await client({ method: 'GET', path: '/api/event', fetchOptions: { signal } });
            if (response.status !== 200) {
                throw createOpencodeStatusError('subscribeEvents', response);
            }
            const body = response.response.body;
            if (!body) {
                throw new ApplicationError('OpenCode event stream has no body', { operation: 'subscribeEvents' });
            }
            yield { type: 'streamOpened' };

            // A tool's name comes with the start of its input; the later events of the call carry only its id.
            const toolNames = new Map<string, string>();
            for await (const data of readSseData(body)) {
                const event = parseEvent(data);
                const mapped = event && mapEvent(event, toolNames);
                if (mapped) {
                    yield mapped;
                }
            }
        }

        /** An unreadable event is skipped (logged), so one odd event does not end the stream. */
        function parseEvent(data: string) {
            let event: unknown;
            try {
                event = JSON.parse(data);
            } catch (error) {
                logger.warn('OpenCode event skipped', { error });
                return undefined;
            }
            if (!isVendorEvent(event)) {
                logger.warn('OpenCode event skipped', { reason: 'no type' });
                return undefined;
            }
            return event;
        }
    },
});

type VendorEvent = components['schemas']['V2Event'];

/**
 * The spec types the stream's frames only as SSE (`text/event-stream`), with each `data` a JSON string whose content
 * schema is `V2Event`; the parsed JSON is trusted to match it once it carries a `type`, as a JSON response body is.
 */
function isVendorEvent(value: unknown): value is VendorEvent {
    return isPlainObject(value) && typeof value.type === 'string';
}

/** The event in the daemon's terms; `undefined` for the event types not modelled, including ones a later OpenCode adds. */
function mapEvent(event: VendorEvent, toolNames: Map<string, string>): OpencodeSessionEvent | undefined {
    switch (event.type) {
        case 'session.created':
            return {
                type: 'sessionCreated',
                sessionId: event.data.sessionID,
                directory: event.data.location.directory,
                parentId: event.data.parentID,
                title: event.data.title,
            };
        case 'session.renamed':
            return { type: 'sessionRenamed', sessionId: event.data.sessionID, title: event.data.title };
        case 'session.execution.started':
            return { type: 'runStarted', sessionId: event.data.sessionID };
        case 'session.text.delta':
            return {
                type: 'textDelta',
                sessionId: event.data.sessionID,
                messageId: event.data.assistantMessageID,
                delta: event.data.delta,
            };
        case 'session.tool.input.started':
            toolNames.set(event.data.id, event.data.name);
            return undefined;
        case 'session.tool.called':
            return {
                type: 'toolStarted',
                sessionId: event.data.sessionID,
                callId: event.data.id,
                name: toolNames.get(event.data.id),
                input: event.data.input,
            };
        case 'session.tool.success': {
            const name = toolNames.get(event.data.id);
            toolNames.delete(event.data.id);
            return {
                type: 'toolFinished',
                sessionId: event.data.sessionID,
                callId: event.data.id,
                name,
                output: mapOpencodeToolOutput(event.data.content),
            };
        }
        case 'session.tool.failed': {
            const name = toolNames.get(event.data.id);
            toolNames.delete(event.data.id);
            return {
                type: 'toolFailed',
                sessionId: event.data.sessionID,
                callId: event.data.id,
                name,
                error: mapOpencodeReportedError(event.data.error),
                output: mapOpencodeToolOutput(event.data.content),
            };
        }
        case 'session.step.failed':
            return {
                type: 'stepFailed',
                sessionId: event.data.sessionID,
                messageId: event.data.assistantMessageID,
                error: mapOpencodeReportedError(event.data.error),
            };
        case 'session.retry.scheduled':
            return {
                type: 'retryScheduled',
                sessionId: event.data.sessionID,
                attempt: event.data.attempt,
                at: event.data.at,
                error: mapOpencodeReportedError(event.data.error),
            };
        case 'session.execution.succeeded':
            return { type: 'runFinished', sessionId: event.data.sessionID, outcome: 'succeeded' };
        case 'session.execution.failed':
            return {
                type: 'runFinished',
                sessionId: event.data.sessionID,
                outcome: 'failed',
                error: mapOpencodeReportedError(event.data.error),
            };
        case 'session.execution.interrupted':
            return {
                type: 'runFinished',
                sessionId: event.data.sessionID,
                outcome: 'interrupted',
                reason: event.data.reason,
            };
        case 'permission.asked':
            return {
                type: 'permissionAsked',
                sessionId: event.data.sessionID,
                permissionId: event.data.id,
                action: event.data.action,
                resources: event.data.resources,
                message: event.data.message,
            };
        default:
            return undefined;
    }
}
