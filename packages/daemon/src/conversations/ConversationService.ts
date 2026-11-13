import { HttpError } from '@nzyme/fetch-utils/HttpError.js';
import { defineService } from '@nzyme/ioc/Service.js';
import { Logger } from '@nzyme/logging/Logger.js';

import type {
    Conversation,
    ConversationMessage,
    ConversationMessageListInput,
    ConversationMessagePage,
    ConversationRef,
    ConversationSendInput,
    ConversationSendResult,
    ConversationStopResult,
} from '@poweragents/common/api/ConversationTypes.js';
import { OpencodeMessageListCommand } from '@poweragents/opencode/OpencodeMessageListCommand.js';
import { OpencodeSessionActiveListCommand } from '@poweragents/opencode/OpencodeSessionActiveListCommand.js';
import { OpencodeSessionCreateCommand } from '@poweragents/opencode/OpencodeSessionCreateCommand.js';
import { OpencodeSessionGetCommand } from '@poweragents/opencode/OpencodeSessionGetCommand.js';
import { OpencodeSessionInboxClearCommand } from '@poweragents/opencode/OpencodeSessionInboxClearCommand.js';
import { OpencodeSessionInterruptCommand } from '@poweragents/opencode/OpencodeSessionInterruptCommand.js';
import { OpencodeSessionListCommand } from '@poweragents/opencode/OpencodeSessionListCommand.js';
import { OpencodeSessionPromptCommand } from '@poweragents/opencode/OpencodeSessionPromptCommand.js';
import type { OpencodeSession } from '@poweragents/opencode/OpencodeTypes.js';

import { CLAUDE_INTEGRATION } from '../claude/ClaudeSignInService.js';
import { ProjectService } from '../projects/ProjectService.js';
import { assertSandboxReady } from '../sandbox/assertSandboxReady.js';
import { Sandbox } from '../sandbox/Sandbox.js';
import { toAgentDir } from './utils/toAgentDir.js';
import { toConversationMessage } from './utils/toConversationMessage.js';

/**
 * The person's conversations with the agent, each bound to one project: OpenCode sessions whose working directory is
 * the project's folder in the sandbox. They live only in OpenCode's storage; the daemon keeps no copy. Every method
 * needs a ready sandbox (`HttpError` 409 `SandboxNotReady`), throws `HttpError` 404 `ProjectNotFound` for an unknown
 * project and `ConversationNotFound` for a conversation that is not in the given project's folder — never one of
 * another project.
 */
export interface ConversationServiceShape {
    /** The project's conversations, the most recently changed first. */
    list(projectId: string): Promise<Conversation[]>;
    /** Starts an empty conversation in the project, with the agent on Claude Sonnet (design D35). */
    create(projectId: string): Promise<Conversation>;
    /** Sends the person's message; the agent's work on it streams as events. */
    send(input: ConversationSendInput): Promise<ConversationSendResult>;
    /** Stops the agent's work on the conversation and withdraws the messages still waiting for it. */
    stop(ref: ConversationRef): Promise<ConversationStopResult>;
    /** A page of the conversation's messages, counting back from the newest. */
    listMessages(input: ConversationMessageListInput): Promise<ConversationMessagePage>;
}

/** The model a new conversation runs on (design D35). */
const AGENT_MODEL = 'sonnet';
/** Messages per page: a screen's worth and more, well under OpenCode's maximum of 200. */
const MESSAGE_PAGE_SIZE = 50;

/** The person's conversations with the agent, per project. */
export const ConversationService = defineService({
    name: 'ConversationService',
    deps: {
        logger: Logger,
        projects: ProjectService,
        sandbox: Sandbox,
        listSessions: OpencodeSessionListCommand,
        getSession: OpencodeSessionGetCommand,
        listActiveSessions: OpencodeSessionActiveListCommand,
        createSession: OpencodeSessionCreateCommand,
        prompt: OpencodeSessionPromptCommand,
        interrupt: OpencodeSessionInterruptCommand,
        clearInbox: OpencodeSessionInboxClearCommand,
        listMessages: OpencodeMessageListCommand,
    },
    setup(deps): ConversationServiceShape {
        const { logger, projects, sandbox } = deps;

        return { list, create, send, stop, listMessages };

        async function list(projectId: string) {
            const directory = await requireProjectDir(projectId);
            const [sessions, active] = await Promise.all([deps.listSessions(directory), deps.listActiveSessions()]);
            return (
                sessions
                    // OpenCode filters by the directory already; checked again, as a conversation must never show in
                    // another project.
                    .filter(session => session.directory === directory)
                    .toSorted((a, b) => b.updatedAt - a.updatedAt)
                    .map(session => toConversation(session, active.has(session.id)))
            );
        }

        async function create(projectId: string) {
            const directory = await requireProjectDir(projectId);
            const session = await deps.createSession({
                directory,
                providerId: CLAUDE_INTEGRATION,
                modelId: AGENT_MODEL,
            });
            logger.info('Conversation created', { projectId, conversationId: session.id });
            return toConversation(session, false);
        }

        async function send(input: ConversationSendInput) {
            await requireConversation(input);
            // OpenCode admits a message sent while the agent works too: it waits in the session's inbox and is given
            // to the agent at its next step, within the same run. A run ending in between starts a new one instead;
            // the message is reported as queued either way. A waiting message keeps its inbox id once delivered.
            const active = await deps.listActiveSessions();
            const receipt = await deps.prompt({ sessionId: input.conversationId, text: input.text });
            return { queued: active.has(input.conversationId), messageId: receipt.messageId };
        }

        async function stop(ref: ConversationRef) {
            await requireConversation(ref);
            const stopped = await deps.interrupt(ref.conversationId);
            // Interrupted, the session delivers nothing more, so every message still in its inbox is one the agent never
            // read. Left there, it would start the next run along with the person's next message.
            const withdrawn = await deps.clearInbox(ref.conversationId);
            return { stopped, withdrawn };
        }

        async function listMessages(input: ConversationMessageListInput) {
            await requireConversation(input);
            const page = await deps.listMessages({
                sessionId: input.conversationId,
                olderCursor: input.olderCursor,
                limit: MESSAGE_PAGE_SIZE,
            });
            const messages: ConversationMessage[] = [];
            for (const message of page.messages) {
                const mapped = toConversationMessage(message);
                if (mapped) {
                    messages.push(mapped);
                }
            }
            return { messages, olderCursor: page.olderCursor };
        }

        /** The project's folder as the agent sees it. */
        async function requireProjectDir(projectId: string) {
            assertSandboxReady(sandbox);
            const project = await projects.get(projectId);
            if (!project) {
                throw new HttpError(404, { error: 'ProjectNotFound', message: 'No project with this id' });
            }
            return toAgentDir(project.dir);
        }

        async function requireConversation(ref: ConversationRef) {
            const directory = await requireProjectDir(ref.projectId);
            const session = await deps.getSession(ref.conversationId);
            if (session?.directory !== directory) {
                throw new HttpError(404, {
                    error: 'ConversationNotFound',
                    message: 'No conversation with this id in the project',
                });
            }
        }
    },
});

function toConversation(session: OpencodeSession, running: boolean): Conversation {
    return { id: session.id, title: session.title, updatedAt: session.updatedAt, running };
}
