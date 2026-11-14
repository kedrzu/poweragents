import type { AppLanguage } from '../appLanguages.js';
import type { ConversationRef } from './ConversationTypes.js';

/** What the app asks App setup to start with. */
export interface AppSetupStartInput {
    /** The app's language: the agent greets the person in it. */
    language: AppLanguage;
    /** The onboarding conversation's title, in the app's language. */
    conversationTitle: string;
}

/** How asking for App setup ended. */
export interface AppSetupStartResult {
    /**
     * The onboarding conversation, the agent already greeting the person in it, when App setup was created just now;
     * `null` when it had been created before (even if the person has deleted it since) or could not be.
     */
    onboarding: ConversationRef | null;
}
