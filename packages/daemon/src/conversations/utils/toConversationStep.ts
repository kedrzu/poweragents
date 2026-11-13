import path from 'node:path';

import { assertNever } from '@nzyme/utils/assertNever.js';

import type {
    ConversationStep,
    ConversationStepKind,
    ConversationStepStatus,
} from '@poweragents/common/api/ConversationTypes.js';
import { readString } from '@poweragents/common/utils/readString.js';

import { AGENT_PROJECTS_DIR } from '../../sandbox/buildAgentRunArgs.js';

/** Params of `toConversationStep()`. */
export interface ToConversationStepParams {
    callId: string;
    /** The tool's name as the agent reports it: OpenCode's own (`read`, `shell`, …) or Claude Code's (`Read`, `Bash`). */
    toolName: string | undefined;
    /** The tool's arguments; absent while they still stream in. */
    input: Record<string, unknown> | undefined;
    status: ConversationStepStatus;
    error?: string;
}

/**
 * A tool call as a step: its kind from the tool's name, its target from the arguments that kind takes. A path inside
 * a project folder is given within the project (`notes/plan.md`).
 * @util
 * @__NO_SIDE_EFFECTS__
 */
export function toConversationStep(params: ToConversationStepParams): ConversationStep {
    const kind = toStepKind(params.toolName);
    return {
        id: params.callId,
        kind,
        target: params.input && readTarget(kind, params.input),
        status: params.status,
        error: params.error,
    };
}

function toStepKind(toolName: string | undefined): ConversationStepKind {
    switch (toolName?.toLowerCase()) {
        case 'read':
        case 'view':
            return 'readFile';
        case 'write':
            return 'writeFile';
        case 'edit':
        case 'multiedit':
        case 'patch':
        case 'apply_patch':
            return 'editFile';
        case 'list':
        case 'ls':
            return 'listFiles';
        case 'glob':
        case 'grep':
            return 'searchFiles';
        case 'shell':
        case 'bash':
            return 'runCommand';
        case 'webfetch':
        case 'web_fetch':
            return 'fetchWeb';
        case 'websearch':
        case 'web_search':
            return 'searchWeb';
        default:
            return 'other';
    }
}

function readTarget(kind: ConversationStepKind, input: Record<string, unknown>) {
    switch (kind) {
        case 'readFile':
        case 'writeFile':
        case 'editFile':
        case 'listFiles': {
            const file = readFirstString(input, ['path', 'filePath', 'file_path']);
            return file && toProjectPath(file);
        }
        case 'searchFiles':
            return readFirstString(input, ['pattern', 'query']);
        case 'runCommand':
            return readFirstString(input, ['command']);
        case 'fetchWeb':
            return readFirstString(input, ['url']);
        case 'searchWeb':
            return readFirstString(input, ['query']);
        case 'other':
            return undefined;
        default:
            return assertNever(kind, 'Unknown step kind');
    }
}

/** The first non-empty string under one of the names a tool may give the argument. */
function readFirstString(input: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
        const value = readString(input, key);
        if (value) {
            return value;
        }
    }
    return undefined;
}

/** `/Poweragents/projects/<project>/notes/plan.md` → `notes/plan.md`; a path elsewhere stays whole. */
function toProjectPath(file: string) {
    const relative = path.posix.relative(AGENT_PROJECTS_DIR, file);
    if (relative.startsWith('..') || path.posix.isAbsolute(relative)) {
        return file;
    }
    const [, ...inProject] = relative.split('/');
    return inProject.length > 0 ? inProject.join('/') : file;
}
