import type { ConversationError, ConversationRunOutcome, ConversationStep } from './ConversationTypes.js';

/**
 * Where the daemon streams its events as server-sent events (`GET`): each event's `data` is one {@link DaemonEvent} as
 * JSON. Served to the app's origins only, like the rest of the API.
 */
export const DAEMON_EVENTS_PATH = '/api/events';

/** An event the daemon streams, discriminated by `type`. */
export type DaemonEvent = ConversationEvent | DaemonStreamRestoredEvent;

/**
 * The daemon lost its own feed of the agent's events and got it back: whatever happened meanwhile was not streamed, so
 * the app reloads what it shows.
 */
export interface DaemonStreamRestoredEvent {
    type: 'streamRestored';
}

/** Something happened in a conversation. */
export type ConversationEvent =
    | ConversationCreatedEvent
    | ConversationRenamedEvent
    | ConversationRunningChangedEvent
    | ConversationTextDeltaEvent
    | ConversationStepStartedEvent
    | ConversationStepFinishedEvent
    | ConversationStepFailedEvent
    | ConversationRunFinishedEvent;

/** A conversation was started in a project, by this app or another client. */
export interface ConversationCreatedEvent {
    type: 'conversationCreated';
    conversationId: string;
    projectId: string;
    title?: string;
}

/** A conversation got its title. */
export interface ConversationRenamedEvent {
    type: 'conversationRenamed';
    conversationId: string;
    title: string;
}

/** The agent started or stopped working on a conversation. */
export interface ConversationRunningChangedEvent {
    type: 'runningChanged';
    conversationId: string;
    running: boolean;
}

/** The next piece of text the agent is writing. */
export interface ConversationTextDeltaEvent {
    type: 'textDelta';
    conversationId: string;
    /** The agent message the text belongs to, as listed in the conversation's messages. */
    messageId: string;
    delta: string;
}

/** The agent began a step. */
export interface ConversationStepStartedEvent {
    type: 'stepStarted';
    conversationId: string;
    step: ConversationStep;
}

/** A step finished. */
export interface ConversationStepFinishedEvent {
    type: 'stepFinished';
    conversationId: string;
    stepId: string;
}

/** A step failed; the agent usually goes on. */
export interface ConversationStepFailedEvent {
    type: 'stepFailed';
    conversationId: string;
    stepId: string;
    /** As the tool said. */
    error: string;
}

/** A run ended. */
export interface ConversationRunFinishedEvent {
    type: 'runFinished';
    conversationId: string;
    outcome: ConversationRunOutcome;
    /** Why, when `outcome` is `failed`. */
    error?: ConversationError;
}
