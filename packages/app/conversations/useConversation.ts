import { HttpError } from '@nzyme/fetch-utils/HttpError.js';
import { assertNever } from '@nzyme/utils/assertNever.js';
import { useLogger } from '@nzyme/vue-ioc/useLogger.js';
import { useService } from '@nzyme/vue-ioc/useService.js';
import { onEventEmitter } from '@nzyme/vue-utils/onEventEmitter.js';
import { makeRef } from '@nzyme/vue-utils/reactivity/makeRef.js';
import { reactive } from '@nzyme/vue-utils/reactivity/reactive.js';
import { computed, onScopeDispose, ref, watch } from 'vue';
import type { MaybeRefOrGetter } from 'vue';

import { ConversationMessageListEndpoint } from '@poweragents/common/api/ConversationMessageListEndpoint.js';
import { ConversationSendEndpoint } from '@poweragents/common/api/ConversationSendEndpoint.js';
import { ConversationStopEndpoint } from '@poweragents/common/api/ConversationStopEndpoint.js';
import type {
    ConversationAgentMessage,
    ConversationAgentPart,
    ConversationError,
    ConversationMessage,
    ConversationMessagePage,
    ConversationStep,
    ConversationStepPart,
} from '@poweragents/common/api/ConversationTypes.js';
import type { DaemonEvent } from '@poweragents/common/api/DaemonEventTypes.js';

import { DaemonClient } from '@/daemon/DaemonClient.js';
import { DaemonEventStream } from '@/daemon/DaemonEventStream.js';
import { SetupStore } from '@/setup/SetupStore.js';

import { ConversationStore } from './ConversationStore.js';

export interface UseConversationOptions {
    projectId: MaybeRefOrGetter<string>;
    conversationId: MaybeRefOrGetter<string>;
}

/** What the conversation's screen shows, in order. */
export type ConversationItem =
    | { type: 'user'; key: string; text: string }
    | { type: 'agent'; key: string; parts: ConversationAgentPart[]; running: boolean }
    | ConversationErrorItem;

/** Why a run brought no answer. */
export interface ConversationErrorItem {
    type: 'error';
    key: string;
    error: ConversationError;
    /** When the run ended, epoch ms (the sandbox's clock). */
    at: number;
    /** The message to send again. */
    retryText?: string;
}

export interface ConversationViewModel {
    /** The messages have been read once. */
    readonly loaded: boolean;
    /** The daemon has no such conversation in the project. */
    readonly notFound: boolean;
    readonly items: readonly ConversationItem[];
    /** The agent is working on the conversation. */
    readonly running: boolean;
    /**
     * Why the agent cannot answer now: the last run ended on signing out (until the person signs in again) or on the
     * usage limit (until it resets; for good when Claude did not say when).
     */
    readonly blockingError: ConversationError | null;
    /**
     * The last item is an error whose message can be sent again: an error on Claude's side, or a known failure whose
     * fix is done (signed in again, the limit reset) or cannot be known (a limit with no reset time).
     */
    readonly retryable: boolean;
    /** Sends a message; queued by the daemon while the agent works. */
    send(text: string): Promise<void>;
    /** Stops the agent; resolves the messages still waiting for it, withdrawn, for the person to keep or drop. */
    stop(): Promise<string[]>;
    /** Reads the page of older messages, if there is one. */
    loadOlder(): Promise<void>;
}

/** A message the person sent that the daemon does not list yet (just sent, or waiting for the agent's current step). */
interface PendingMessage {
    /** The screen's key for it, until the daemon lists it. */
    key: string;
    /** The id the daemon lists it under; unknown until the daemon has taken it. */
    messageId?: string;
    text: string;
    /** The daemon queued it for the agent's next step; it shows after the reply being written. */
    queued: boolean;
    /**
     * A run ended before the daemon answered the send: the message may be listed already, before the run's end, under
     * an id not known yet, so it does not count as coming after that run's error.
     */
    overtaken?: boolean;
}

/** The longest wait a browser timer takes; a longer one fires at once. */
const MAX_TIMER_MS = 2_147_483_647;

/**
 * The open conversation, live: its messages read from the daemon, the person's messages shown as soon as they are
 * sent, the agent's text and steps applied as the daemon streams them, and the messages read again when a run ends
 * or the stream had a gap, so what shows is what the agent stored.
 */
export function useConversation(options: UseConversationOptions): ConversationViewModel {
    const daemon = useService(DaemonClient);
    const events = useService(DaemonEventStream);
    const store = useService(ConversationStore);
    const setup = useService(SetupStore);
    const logger = useLogger();

    const projectId = makeRef(options.projectId);
    const conversationId = makeRef(options.conversationId);
    const messages = ref<ConversationMessage[]>([]);
    const pending = ref<PendingMessage[]>([]);
    const olderCursor = ref<string | undefined>();
    const loaded = ref(false);
    const notFound = ref(false);
    /** Counts loads, so an answer for a conversation opened before (or overtaken by a newer load) is dropped. */
    let loadSeq = 0;
    /** Counts the stream's changes to the messages, so a page read before one of them is read again, not shown. */
    let streamSeq = 0;
    let pendingSeq = 0;
    /** Counts each conversation's run ends, so a send answered after its run already ended does not mark it running. */
    const runEnds = new Map<string, number>();
    /** Epoch ms, moved on when the usage limit of the last error resets. */
    const now = ref(Date.now());
    let resetTimer: ReturnType<typeof setTimeout> | undefined;

    const running = computed(() => store.find(conversationId.value)?.running ?? false);
    const items = computed(() => toItems({ messages: messages.value, pending: pending.value, running: running.value }));
    const lastError = computed(() => {
        const overtaken = new Set(pending.value.filter(item => item.overtaken).map(item => item.key));
        const last = items.value.findLast(item => !overtaken.has(item.key));
        return !running.value && last?.type === 'error' ? last : null;
    });
    const blockingError = computed(() => {
        const item = lastError.value;
        return item && isBlocking(item) ? item.error : null;
    });
    const retryable = computed(() => {
        const item = lastError.value;
        return item?.retryText !== undefined && canRetry(item);
    });

    watch(
        conversationId,
        () => {
            messages.value = [];
            pending.value = [];
            olderCursor.value = undefined;
            loaded.value = false;
            notFound.value = false;
            void load();
        },
        { immediate: true },
    );
    watch(
        () => {
            const error = lastError.value?.error;
            return error?.kind === 'usageLimit' ? error.resetAt : undefined;
        },
        resetAt => {
            clearTimeout(resetTimer);
            now.value = Date.now();
            if (resetAt != null) {
                waitForReset(resetAt);
            }
        },
        { immediate: true },
    );
    onScopeDispose(() => clearTimeout(resetTimer));
    onEventEmitter(events.event, onEvent);

    return reactive<ConversationViewModel>({
        loaded,
        notFound,
        items,
        running,
        blockingError,
        retryable,
        send,
        stop,
        loadOlder,
    });

    async function send(text: string) {
        const id = conversationId.value;
        const endedBefore = runEnds.get(id) ?? 0;
        const message: PendingMessage = { key: `pending-${++pendingSeq}`, text, queued: false };
        pending.value = [...pending.value, message];
        try {
            const result = await daemon(ConversationSendEndpoint, {
                projectId: projectId.value,
                conversationId: id,
                text,
            });
            const taken = pending.value.map(item =>
                item.key === message.key
                    ? { ...item, messageId: result.messageId, queued: result.queued, overtaken: false }
                    : item,
            );
            // A read answered while the send was on its way may list the message already.
            pending.value = settlePending(taken, messages.value);
            if (!result.queued) {
                // A run that already ended (signed out, the usage limit) said so before this answer: it stays ended.
                if ((runEnds.get(id) ?? 0) === endedBefore) {
                    store.setRunning(id, true);
                }
                // The daemon lists a message that started a run at once: read, the agent's reply streams in after it.
                void load();
            }
        } catch (error) {
            pending.value = pending.value.filter(item => item.key !== message.key);
            throw error;
        }
    }

    async function stop() {
        const { withdrawn } = await daemon(ConversationStopEndpoint, {
            projectId: projectId.value,
            conversationId: conversationId.value,
        });
        const withdrawnIds = new Set(withdrawn.map(message => message.id));
        pending.value = pending.value.filter(item => item.messageId === undefined || !withdrawnIds.has(item.messageId));
        await load();
        return withdrawn.map(message => message.text);
    }

    async function loadOlder() {
        const cursor = olderCursor.value;
        if (!cursor || !loaded.value) {
            return;
        }
        const id = conversationId.value;
        const page = await daemon(ConversationMessageListEndpoint, {
            projectId: projectId.value,
            conversationId: id,
            olderCursor: cursor,
        });
        if (id === conversationId.value && olderCursor.value === cursor) {
            messages.value = [...page.messages, ...messages.value];
            olderCursor.value = page.olderCursor;
        }
    }

    async function load() {
        const id = conversationId.value;
        const seq = ++loadSeq;
        try {
            const streamedBefore = streamSeq;
            let page = await readPage(id);
            if (seq !== loadSeq) {
                return;
            }
            if (streamedBefore !== streamSeq) {
                // The stream changed the messages meanwhile: the page may not hold that yet, so it is read again, once.
                // While the agent writes, the stream changes them all the time; the second page is taken as it is, and
                // what it missed comes with the read at the run's end.
                page = await readPage(id);
                if (seq !== loadSeq) {
                    return;
                }
            }
            messages.value = page.messages;
            olderCursor.value = page.olderCursor;
            pending.value = settlePending(pending.value, page.messages);
            loaded.value = true;
        } catch (error) {
            if (seq !== loadSeq) {
                return;
            }
            if (error instanceof HttpError && error.status === 404) {
                notFound.value = true;
                return;
            }
            logger.warn('Conversation messages could not be loaded', { conversationId: id, error });
        }
    }

    function readPage(id: string): Promise<ConversationMessagePage> {
        return daemon(ConversationMessageListEndpoint, { projectId: projectId.value, conversationId: id });
    }

    function isBlocking(item: ConversationErrorItem) {
        switch (item.error.kind) {
            case 'signedOut':
                return !signedInSince(item.at);
            case 'usageLimit':
                return !limitReset(item.error.resetAt);
            case 'other':
                return false;
            default:
                return assertNever(item.error);
        }
    }

    function canRetry(item: ConversationErrorItem) {
        switch (item.error.kind) {
            case 'signedOut':
                return signedInSince(item.at);
            case 'usageLimit':
                return item.error.resetAt == null || limitReset(item.error.resetAt);
            case 'other':
                return true;
            default:
                return assertNever(item.error);
        }
    }

    function signedInSince(at: number) {
        const signedInAt = setup.state.signedInAt;
        return signedInAt != null && signedInAt > at;
    }

    function limitReset(resetAt: number | undefined) {
        return resetAt != null && now.value >= resetAt;
    }

    // Moves `now` on once the limit resets, in steps a browser timer can take.
    function waitForReset(resetAt: number) {
        const wait = resetAt - Date.now();
        if (wait <= 0) {
            now.value = Date.now();
            return;
        }
        resetTimer = setTimeout(() => waitForReset(resetAt), Math.min(wait, MAX_TIMER_MS));
    }

    function onEvent(event: DaemonEvent) {
        if (event.type === 'runFinished' || (event.type === 'runningChanged' && !event.running)) {
            runEnds.set(event.conversationId, (runEnds.get(event.conversationId) ?? 0) + 1);
            if (event.conversationId === conversationId.value) {
                pending.value = pending.value.map(item =>
                    item.messageId === undefined ? { ...item, overtaken: true } : item,
                );
            }
        }
        if (event.type !== 'streamRestored' && event.conversationId !== conversationId.value) {
            return;
        }
        switch (event.type) {
            case 'streamRestored':
                void load();
                break;
            case 'textDelta':
                streamSeq++;
                messages.value = appendText({
                    messages: messages.value,
                    messageId: event.messageId,
                    delta: event.delta,
                });
                break;
            case 'stepStarted':
                streamSeq++;
                messages.value = startStep(messages.value, event.step);
                break;
            case 'stepFinished':
                streamSeq++;
                messages.value = updateStep({
                    messages: messages.value,
                    stepId: event.stepId,
                    change: step => ({ ...step, status: 'done' }),
                });
                break;
            case 'stepFailed':
                streamSeq++;
                messages.value = updateStep({
                    messages: messages.value,
                    stepId: event.stepId,
                    change: step => ({ ...step, status: 'failed', error: event.error }),
                });
                break;
            case 'runFinished':
                // What the agent stored is the truth: it carries what the stream may have missed, and the run's error.
                store.setRunning(event.conversationId, false);
                void load();
                break;
            case 'runningChanged':
            case 'conversationCreated':
            case 'conversationRenamed':
                // The store's.
                break;
            default:
                assertNever(event);
        }
    }
}

/** What the screen's items are made of. */
export interface ToItemsParams {
    messages: readonly ConversationMessage[];
    pending: readonly PendingMessage[];
    running: boolean;
}

/** The screen's items: replies merged from the agent's consecutive messages, errors where runs failed, and what was just sent. */
function toItems({ messages, pending, running }: ToItemsParams) {
    const items: ConversationItem[] = [];
    let lastUserText: string | undefined;
    let runError: ConversationError | undefined;
    let runErrorAt = 0;

    for (const message of messages) {
        switch (message.type) {
            case 'user':
                items.push({ type: 'user', key: message.id, text: message.text });
                lastUserText = message.text;
                break;
            case 'agent': {
                const last = items.at(-1);
                if (last?.type === 'agent') {
                    last.parts = [...last.parts, ...message.parts];
                } else if (message.parts.length > 0) {
                    items.push({ type: 'agent', key: message.id, parts: [...message.parts], running: false });
                }
                if (message.error) {
                    runError = message.error;
                    runErrorAt = message.createdAt;
                }
                break;
            }
            case 'runEnd': {
                const error = message.error ?? runError;
                if (message.outcome === 'failed' && error) {
                    items.push({
                        type: 'error',
                        key: message.id,
                        error,
                        at: message.createdAt,
                        retryText: lastUserText,
                    });
                }
                runError = undefined;
                break;
            }
            default:
                assertNever(message);
        }
    }
    if (runError && !running) {
        items.push({ type: 'error', key: 'run-error', error: runError, at: runErrorAt, retryText: lastUserText });
    }

    // A message that started the run comes before the reply; one queued for the agent's next step, after it.
    for (const message of pending.filter(item => !item.queued)) {
        items.push({ type: 'user', key: message.key, text: message.text });
    }
    if (running) {
        const last = items.at(-1);
        if (last?.type === 'agent') {
            last.running = true;
        } else {
            items.push({ type: 'agent', key: 'running', parts: [], running: true });
        }
    }
    for (const message of pending.filter(item => item.queued)) {
        items.push({ type: 'user', key: message.key, text: message.text });
    }
    return items;
}

/** Drops the messages just sent that the daemon now lists, by the id it took them under. */
function settlePending(pending: readonly PendingMessage[], messages: readonly ConversationMessage[]) {
    const listed = new Set(messages.filter(message => message.type === 'user').map(message => message.id));
    return pending.filter(item => item.messageId === undefined || !listed.has(item.messageId));
}

/** A piece of the agent's text and where it goes. */
export interface AppendTextParams {
    messages: readonly ConversationMessage[];
    messageId: string;
    delta: string;
}

/** Adds the agent's next piece of text to its message, created when it is not shown yet. */
function appendText({ messages, messageId, delta }: AppendTextParams) {
    const target = messages.find(message => message.id === messageId);
    if (target?.type !== 'agent') {
        const created: ConversationAgentMessage = {
            type: 'agent',
            id: messageId,
            createdAt: Date.now(),
            parts: [{ type: 'text', text: delta }],
        };
        return [...messages, created];
    }
    return messages.map(message => {
        if (message !== target) {
            return message;
        }
        const last = target.parts.at(-1);
        const parts: ConversationAgentPart[] =
            last?.type === 'text'
                ? [...target.parts.slice(0, -1), { type: 'text', text: last.text + delta }]
                : [...target.parts, { type: 'text', text: delta }];
        return { ...target, parts };
    });
}

/** Adds a step to the reply being written; a step with this id already shown is updated. */
function startStep(messages: readonly ConversationMessage[], step: ConversationStep): ConversationMessage[] {
    const shown = messages.some(
        message => message.type === 'agent' && message.parts.some(part => part.type === 'step' && part.id === step.id),
    );
    if (shown) {
        return updateStep({ messages, stepId: step.id, change: () => step });
    }
    const part: ConversationStepPart = { ...step, type: 'step' };
    const last = messages.at(-1);
    if (last?.type === 'agent') {
        return [...messages.slice(0, -1), { ...last, parts: [...last.parts, part] }];
    }
    const created: ConversationAgentMessage = {
        type: 'agent',
        id: `step-${step.id}`,
        createdAt: Date.now(),
        parts: [part],
    };
    return [...messages, created];
}

/** A change to a step shown in the agent's reply. */
export interface UpdateStepParams {
    messages: readonly ConversationMessage[];
    stepId: string;
    change: (step: ConversationStep) => ConversationStep;
}

/** Changes the step with this id, wherever it is shown. */
function updateStep({ messages, stepId, change }: UpdateStepParams): ConversationMessage[] {
    return messages.map(message => {
        if (message.type !== 'agent' || !message.parts.some(part => part.type === 'step' && part.id === stepId)) {
            return message;
        }
        return {
            ...message,
            parts: message.parts.map((part): ConversationAgentPart =>
                part.type === 'step' && part.id === stepId ? { ...change(part), type: 'step' } : part,
            ),
        };
    });
}
