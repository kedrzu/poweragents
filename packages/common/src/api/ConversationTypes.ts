/** A conversation with the agent in a project: the agent's working directory is the project's folder. */
export interface Conversation {
    id: string;
    /** The agent names a conversation during its first run; absent until then. */
    title?: string;
    /** When anything in it last changed (epoch ms). */
    updatedAt: number;
    /** Whether the agent is working on it now. */
    running: boolean;
}

/** Points at one of a project's conversations. */
export interface ConversationRef {
    projectId: string;
    conversationId: string;
}

/** A project whose conversations to list, or to start one in. */
export interface ConversationProjectInput {
    projectId: string;
}

/** A message the person sends. */
export interface ConversationSendInput extends ConversationRef {
    text: string;
}

/** How a sent message was taken. */
export interface ConversationSendResult {
    /**
     * The agent was working: the message waits and the agent reads it once it finishes its current step, in the same
     * run. `false`: the message started a run.
     */
    queued: boolean;
    /**
     * The id the message is listed under among the conversation's messages, once the agent has it: at once when it
     * started a run; when the agent takes it, when it waits.
     */
    messageId: string;
}

/** A message the person sent that the agent never read, taken back by a stop. */
export interface ConversationWithdrawnMessage {
    /** The id it was sent under (`ConversationSendResult.messageId`). */
    id: string;
    text: string;
}

/** How a stop ended. */
export interface ConversationStopResult {
    /** `false` when the agent was not working. */
    stopped: boolean;
    /**
     * The person's messages that were still waiting for the agent (sent while it worked), oldest first: withdrawn, so
     * the agent never reads them, and given back for the person to send again or drop.
     */
    withdrawn: ConversationWithdrawnMessage[];
}

/** A page of a conversation's messages to read. */
export interface ConversationMessageListInput extends ConversationRef {
    /** `olderCursor` of the page read before; absent for the newest page. */
    olderCursor?: string;
}

/** A page of a conversation's messages, counting back from the newest. */
export interface ConversationMessagePage {
    /** Oldest first, as they are shown. */
    messages: ConversationMessage[];
    /** Reads the page of older messages; absent when this page holds the first message. */
    olderCursor?: string;
}

/** A message of a conversation, discriminated by `type`. */
export type ConversationMessage = ConversationUserMessage | ConversationAgentMessage | ConversationRunEndMessage;

/** What the person wrote. */
export interface ConversationUserMessage {
    type: 'user';
    id: string;
    /** Epoch ms. */
    createdAt: number;
    text: string;
}

/** A piece of the agent's answer; one run brings one per model step, so a reply spans consecutive agent messages. */
export interface ConversationAgentMessage {
    type: 'agent';
    id: string;
    /** Epoch ms. */
    createdAt: number;
    parts: ConversationAgentPart[];
    /** Why this step of the agent failed. */
    error?: ConversationError;
}

/** The end of a run: how it ended and, when it failed, why. */
export interface ConversationRunEndMessage {
    type: 'runEnd';
    id: string;
    /** Epoch ms. */
    createdAt: number;
    outcome: ConversationRunOutcome;
    error?: ConversationError;
}

/** How a run ended: as the agent meant to, on an error, or stopped (by the person or otherwise). */
export type ConversationRunOutcome = 'succeeded' | 'failed' | 'interrupted';

/** A piece of an agent message. */
export type ConversationAgentPart = ConversationTextPart | ConversationStepPart;

/** Text the agent wrote, in Markdown. */
export interface ConversationTextPart {
    type: 'text';
    text: string;
}

/** A step the agent took. */
export interface ConversationStepPart extends ConversationStep {
    type: 'step';
}

/** Something the agent did with a tool, shown as a sentence. */
export interface ConversationStep {
    /** Stable across the step's events. */
    id: string;
    kind: ConversationStepKind;
    /** What it did it to: a file's name or path within the project, a command, a URL, a search phrase. */
    target?: string;
    status: ConversationStepStatus;
    /** Why it failed, as the tool said, when `status` is `failed`. */
    error?: string;
}

/** Every kind of step, for checking a kind read from outside. */
export const STEP_KINDS = [
    'readFile',
    'writeFile',
    'editFile',
    'listFiles',
    'searchFiles',
    'runCommand',
    'fetchWeb',
    'searchWeb',
    'other',
] as const;

/** What kind of thing a step did; `other` for a tool none of the rest describes. */
export type ConversationStepKind = (typeof STEP_KINDS)[number];

/** Where a step is. */
export type ConversationStepStatus = 'running' | 'done' | 'failed';

/** Why the agent could not answer, discriminated by `kind`. */
export type ConversationError =
    /** Signed out of the AI provider: the person signs in again. */
    | { kind: 'signedOut' }
    /** The plan's usage limit is reached; `resetAt` (epoch ms) when the provider said when it resets. */
    | { kind: 'usageLimit'; resetAt?: number }
    /** Anything else; `message` as the provider or the agent put it, for "Show details". */
    | { kind: 'other'; message: string };
