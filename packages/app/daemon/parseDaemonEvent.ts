import { STEP_KINDS } from '@poweragents/common/api/ConversationTypes.js';
import type { ConversationStep, ConversationStepKind } from '@poweragents/common/api/ConversationTypes.js';
import type { DaemonEvent } from '@poweragents/common/api/DaemonEventTypes.js';
import { readString } from '@poweragents/common/utils/readString.js';

/**
 * One event of the daemon's stream (an SSE message's `data`), or `null` when it is not one this app knows: a newer
 * daemon may stream events an older app ignores. Checks the fields the app reads, so a malformed event never reaches the
 * screens half-typed.
 * @__NO_SIDE_EFFECTS__
 */
export function parseDaemonEvent(data: string): DaemonEvent | null {
    let value: unknown;
    try {
        value = JSON.parse(data);
    } catch {
        return null;
    }
    if (typeof value !== 'object' || value === null) {
        return null;
    }
    const type = readString(value, 'type');
    if (type === 'streamRestored') {
        return { type: 'streamRestored' };
    }
    const conversationId = readString(value, 'conversationId');
    if (conversationId === undefined) {
        return null;
    }

    switch (type) {
        case 'conversationCreated': {
            const projectId = readString(value, 'projectId');
            return projectId === undefined
                ? null
                : { type: 'conversationCreated', conversationId, projectId, title: readString(value, 'title') };
        }
        case 'conversationRenamed': {
            const title = readString(value, 'title');
            return title === undefined ? null : { type: 'conversationRenamed', conversationId, title };
        }
        case 'runningChanged':
            return 'running' in value && typeof value.running === 'boolean'
                ? { type: 'runningChanged', conversationId, running: value.running }
                : null;
        case 'textDelta': {
            const messageId = readString(value, 'messageId');
            const delta = readString(value, 'delta');
            return messageId === undefined || delta === undefined
                ? null
                : { type: 'textDelta', conversationId, messageId, delta };
        }
        case 'stepStarted': {
            const step = 'step' in value ? readStep(value.step) : null;
            return step ? { type: 'stepStarted', conversationId, step } : null;
        }
        case 'stepFinished': {
            const stepId = readString(value, 'stepId');
            return stepId === undefined ? null : { type: 'stepFinished', conversationId, stepId };
        }
        case 'stepFailed': {
            const stepId = readString(value, 'stepId');
            const error = readString(value, 'error');
            return stepId === undefined || error === undefined
                ? null
                : { type: 'stepFailed', conversationId, stepId, error };
        }
        case 'runFinished':
            return readRunFinished(value, conversationId);
        default:
            return null;
    }
}

function readStep(value: unknown): ConversationStep | null {
    if (typeof value !== 'object' || value === null) {
        return null;
    }
    const id = readString(value, 'id');
    if (id === undefined || !('kind' in value) || !('status' in value)) {
        return null;
    }
    const kind = readStepKind(value.kind);
    const status =
        value.status === 'running' || value.status === 'done' || value.status === 'failed' ? value.status : null;
    if (kind === null || status === null) {
        return null;
    }
    return { id, kind, status, target: readString(value, 'target') };
}

function readStepKind(kind: unknown): ConversationStepKind | null {
    if (typeof kind !== 'string') {
        return null;
    }
    // A tool kind added later still shows, as a generic step.
    return STEP_KINDS.find(known => known === kind) ?? 'other';
}

function readRunFinished(value: object, conversationId: string): DaemonEvent | null {
    if (!('outcome' in value)) {
        return null;
    }
    const outcome = value.outcome;
    if (outcome !== 'succeeded' && outcome !== 'failed' && outcome !== 'interrupted') {
        return null;
    }
    const error = 'error' in value ? readError(value.error) : undefined;
    return { type: 'runFinished', conversationId, outcome, error };
}

function readError(value: unknown) {
    if (typeof value !== 'object' || value === null || !('kind' in value)) {
        return undefined;
    }
    switch (value.kind) {
        case 'signedOut':
            return { kind: 'signedOut' } as const;
        case 'usageLimit':
            return {
                kind: 'usageLimit',
                resetAt: 'resetAt' in value && typeof value.resetAt === 'number' ? value.resetAt : undefined,
            } as const;
        default:
            return {
                kind: 'other',
                message: readString(value, 'message') ?? '',
            } as const;
    }
}
