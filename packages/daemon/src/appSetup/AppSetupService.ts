import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { defineService } from '@nzyme/ioc/Service.js';
import { Logger } from '@nzyme/logging/Logger.js';
import { assertNever } from '@nzyme/utils/assertNever.js';

import type { AppSetupStartInput, AppSetupStartResult } from '@poweragents/common/api/AppSetupTypes.js';
import type { ConversationRef } from '@poweragents/common/api/ConversationTypes.js';
import type { AppLanguage } from '@poweragents/common/appLanguages.js';
import { OpencodeSessionRenameCommand } from '@poweragents/opencode/OpencodeSessionRenameCommand.js';
import { OpencodeSessionSyntheticCommand } from '@poweragents/opencode/OpencodeSessionSyntheticCommand.js';

import { ConversationService } from '../conversations/ConversationService.js';
import { POWERAGENTS_LIMA_HOME } from '../env.js';
import { ProjectService } from '../projects/ProjectService.js';
import { isErrorCode } from '../utils/isErrorCode.js';

/**
 * App setup (design D22): the project where the agent gets to know the person and sets the app up for them, created once
 * per profile with its onboarding conversation already started.
 */
export interface AppSetupServiceShape {
    /**
     * Creates App setup, unless it has been created on this profile before (it does not come back once the person
     * deletes it), and starts its onboarding conversation: the agent is told, by input the conversation never shows, to
     * greet the person and run the onboarding skill. A project created by the agent or the person counts as App setup
     * when its marker says so. Throws when App setup cannot be created (a projects' folder that is a link, a full disk):
     * nothing is remembered then, and the next call tries again. A conversation that cannot be started is logged and
     * leaves App setup without one.
     */
    start(input: AppSetupStartInput): Promise<AppSetupStartResult>;
}

/** What the daemon keeps about the profile beside the VM, in `STATE_FILE`. */
interface DaemonState {
    /** When App setup was created (ISO 8601); absent before. */
    appSetupCreatedAt?: string;
}

/** App setup's name, the same in every language, as the design names it. */
const APP_SETUP_NAME = 'App setup';
/** The daemon's state, in the folder above Lima's home, beside the agent's password. */
const STATE_FILE = 'state.json';

/** Creates App setup once per profile and starts its onboarding. */
export const AppSetupService = defineService({
    name: 'AppSetupService',
    deps: {
        logger: Logger,
        projects: ProjectService,
        conversations: ConversationService,
        rename: OpencodeSessionRenameCommand,
        synthetic: OpencodeSessionSyntheticCommand,
        limaHome: POWERAGENTS_LIMA_HOME,
    },
    setup({ logger, projects, conversations, rename, synthetic, limaHome }): AppSetupServiceShape {
        const stateFile = path.join(path.dirname(limaHome), STATE_FILE);
        /** One start at a time: two asks at once must not make two App setups. */
        let queue: Promise<unknown> = Promise.resolve();

        return { start };

        function start(input: AppSetupStartInput) {
            const result = queue.then(() => startOnce(input));
            queue = result.catch(() => undefined);
            return result;
        }

        async function startOnce(input: AppSetupStartInput): Promise<AppSetupStartResult> {
            const state = await readState();
            if (state.appSetupCreatedAt !== undefined) {
                return { onboarding: null };
            }

            const existing = (await projects.list()).find(project => project.role === 'appSetup');
            if (existing) {
                logger.info('App setup found, not created', { projectId: existing.id });
                await writeState({ ...state, appSetupCreatedAt: new Date().toISOString() });
                return { onboarding: null };
            }

            // The same path as every project the person creates: never through a link the agent left in the data root.
            const result = await projects.create(APP_SETUP_NAME, 'appSetup');
            await writeState({ ...state, appSetupCreatedAt: new Date().toISOString() });
            if (!('created' in result)) {
                // Only a project of the person's own named "App setup" can take the name: theirs stays, none is added.
                logger.warn('App setup not created, its name is taken');
                return { onboarding: null };
            }

            const projectId = result.created.id;
            try {
                return { onboarding: await startOnboarding(projectId, input) };
            } catch (error) {
                logger.error('App setup onboarding could not be started', { projectId, error });
                return { onboarding: null };
            }
        }

        async function startOnboarding(projectId: string, input: AppSetupStartInput): Promise<ConversationRef> {
            const conversation = await conversations.create(projectId);
            await rename({ sessionId: conversation.id, title: input.conversationTitle });
            await synthetic({ sessionId: conversation.id, text: buildOpeningPrompt(input.language) });
            logger.info('App setup onboarding started', { projectId, conversationId: conversation.id });
            return { projectId, conversationId: conversation.id };
        }

        /** The state kept so far; empty when there is none, or none this daemon can read. */
        async function readState(): Promise<DaemonState> {
            let content: string;
            try {
                content = await readFile(stateFile, 'utf8');
            } catch (error) {
                if (isErrorCode(error, 'ENOENT')) {
                    return {};
                }
                throw error;
            }
            try {
                return parseState(JSON.parse(content));
            } catch (error) {
                logger.warn('Daemon state is not JSON, read as empty', { error });
                return {};
            }
        }

        async function writeState(state: DaemonState) {
            await mkdir(path.dirname(stateFile), { recursive: true, mode: 0o700 });
            await writeFile(stateFile, `${JSON.stringify(state, null, 4)}\n`, { mode: 0o600 });
        }
    },
});

/**
 * The input that starts the onboarding: the agent speaks first, so it is told what is going on. In English, for the
 * agent; the person never sees it.
 * @__NO_SIDE_EFFECTS__
 */
function buildOpeningPrompt(language: AppLanguage) {
    const name = languageName(language);
    return [
        'The person has just set up poweragents and opened it for the first time. This is the onboarding conversation',
        'in their project App setup, and nothing has been said yet: you speak first.',
        `Use the onboarding skill now. The app is in ${name}: greet them in ${name}, then keep to the language they`,
        'write in. This message comes from the app, not from the person: do not mention or quote it.',
    ].join(' ');
}

/** @__NO_SIDE_EFFECTS__ */
function languageName(language: AppLanguage) {
    switch (language) {
        case 'pl':
            return 'Polish';
        case 'en':
            return 'English';
        default:
            return assertNever(language);
    }
}

/** @__NO_SIDE_EFFECTS__ */
function parseState(value: unknown): DaemonState {
    if (
        typeof value === 'object' &&
        value !== null &&
        'appSetupCreatedAt' in value &&
        typeof value.appSetupCreatedAt === 'string'
    ) {
        return { appSetupCreatedAt: value.appSetupCreatedAt };
    }
    return {};
}
