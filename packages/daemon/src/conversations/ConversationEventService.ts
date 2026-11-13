import { defineService } from '@nzyme/ioc/Service.js';
import { Logger } from '@nzyme/logging/Logger.js';
import { assertNever } from '@nzyme/utils/assertNever.js';
import { createEventEmitter } from '@nzyme/utils/createEventEmitter.js';
import { createExponentialBackoff } from '@nzyme/utils/createExponentialBackoff.js';

import type { DaemonEvent } from '@poweragents/common/api/DaemonEventTypes.js';
import { OpencodeEventSubscribeCommand } from '@poweragents/opencode/OpencodeEventSubscribeCommand.js';
import type { OpencodeSessionEvent } from '@poweragents/opencode/OpencodeEventSubscribeCommand.js';

import { ProjectService } from '../projects/ProjectService.js';
import { Sandbox } from '../sandbox/Sandbox.js';
import { toAgentDir } from './utils/toAgentDir.js';
import { toConversationError } from './utils/toConversationError.js';
import { toConversationStep } from './utils/toConversationStep.js';

/**
 * What happens in the person's conversations, live, for the daemon's event stream. The daemon holds one feed of the
 * agent's events, started by the first listener and kept for the daemon's lifetime: it waits for a ready sandbox and
 * reconnects with backoff when it drops, then sends `streamRestored` once the feed is open again, since what happened
 * meanwhile was not streamed.
 */
export interface ConversationEventServiceShape {
    /** Calls `listener` with every event from now on, until the returned function is called or the listener throws. */
    listen(listener: (event: DaemonEvent) => void): () => void;
}

/** The longest wait between two attempts to reconnect the feed. */
const MAX_RECONNECT_DELAY_MS = 30_000;

/** The person's conversations, live. */
export const ConversationEventService = defineService({
    name: 'ConversationEventService',
    deps: {
        logger: Logger,
        projects: ProjectService,
        sandbox: Sandbox,
        subscribe: OpencodeEventSubscribeCommand,
    },
    setup({ logger, projects, sandbox, subscribe }): ConversationEventServiceShape {
        const emitter = createEventEmitter<[event: DaemonEvent]>();
        let feed: Promise<void> | undefined;

        return { listen };

        function listen(listener: (event: DaemonEvent) => void) {
            let listening = true;
            emitter.event.on(guarded);
            feed ??= runFeed();
            return stop;

            // A listener that throws (a client's closed connection) is dropped, so it never breaks the feed of the rest.
            function guarded(event: DaemonEvent) {
                if (!listening) {
                    return;
                }
                try {
                    listener(event);
                } catch (error) {
                    logger.warn('Conversation event listener failed, dropped', { error });
                    stop();
                }
            }

            function stop() {
                // The flag also silences it for the rest of an event being sent: the emitter still calls a listener
                // removed during that event.
                listening = false;
                emitter.event.off(guarded);
            }
        }

        async function runFeed() {
            const backoff = createExponentialBackoff({ maxDelay: MAX_RECONNECT_DELAY_MS });
            // The feed runs as long as the daemon does, so nothing ever aborts it.
            const signal = new AbortController().signal;
            let lostEvents = false;

            while (true) {
                await waitForReadySandbox();
                try {
                    for await (const event of subscribe(signal)) {
                        if (event.type === 'streamOpened') {
                            backoff.reset();
                            if (lostEvents) {
                                lostEvents = false;
                                logger.info('Agent event feed restored');
                                emitter.emit({ type: 'streamRestored' });
                            }
                            continue;
                        }
                        for (const mapped of await mapEvent(event)) {
                            emitter.emit(mapped);
                        }
                    }
                    logger.warn('Agent event feed ended, reconnecting');
                } catch (error) {
                    logger.warn('Agent event feed failed, reconnecting', { error, attempt: backoff.retries + 1 });
                }
                lostEvents = true;
                await backoff.backoff();
            }
        }

        async function waitForReadySandbox() {
            if (sandbox.getState().status === 'ready') {
                return;
            }
            const ready = Promise.withResolvers<void>();
            const onState = () => {
                if (sandbox.getState().status === 'ready') {
                    ready.resolve();
                }
            };
            sandbox.stateChanged.on(onState);
            try {
                await ready.promise;
            } finally {
                sandbox.stateChanged.off(onState);
            }
        }

        /** The agent's event as the conversation's events; most of the agent's events have none. */
        async function mapEvent(event: OpencodeSessionEvent): Promise<DaemonEvent[]> {
            const conversationId = event.sessionId;
            switch (event.type) {
                case 'sessionCreated': {
                    // A sub-session is the agent's own helper, not a conversation of the person's.
                    const projectId = event.parentId == null ? await findProjectId(event.directory) : undefined;
                    return projectId == null
                        ? []
                        : [{ type: 'conversationCreated', conversationId, projectId, title: event.title }];
                }
                case 'sessionRenamed':
                    return [{ type: 'conversationRenamed', conversationId, title: event.title }];
                case 'runStarted':
                    return [{ type: 'runningChanged', conversationId, running: true }];
                case 'textDelta':
                    return [{ type: 'textDelta', conversationId, messageId: event.messageId, delta: event.delta }];
                case 'toolStarted': {
                    const step = toConversationStep({
                        callId: event.callId,
                        toolName: event.name,
                        input: event.input,
                        status: 'running',
                    });
                    return [{ type: 'stepStarted', conversationId, step }];
                }
                case 'toolFinished':
                    return [{ type: 'stepFinished', conversationId, stepId: event.callId }];
                case 'toolFailed':
                    return [{ type: 'stepFailed', conversationId, stepId: event.callId, error: event.error.message }];
                case 'runFinished':
                    return [
                        {
                            type: 'runFinished',
                            conversationId,
                            outcome: event.outcome,
                            error: event.outcome === 'failed' ? toConversationError(event.error) : undefined,
                        },
                        { type: 'runningChanged', conversationId, running: false },
                    ];
                // A failed model step is retried or ends the run, which reports the error; the agent runs without
                // permission prompts.
                case 'stepFailed':
                case 'retryScheduled':
                case 'permissionAsked':
                    return [];
                default:
                    return assertNever(event, 'Unknown agent event');
            }
        }

        /** The project whose folder the agent sees as `directory`; none for a folder that is not a project. */
        async function findProjectId(directory: string) {
            const all = await projects.list();
            return all.find(project => toAgentDir(project.dir) === directory)?.id;
        }
    },
});
