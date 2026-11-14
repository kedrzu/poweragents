import { defineService } from '@nzyme/ioc/Service.js';
import { Logger } from '@nzyme/logging/Logger.js';
import { assertNever } from '@nzyme/utils/assertNever.js';
import { computed, reactive, ref } from 'vue';

import { ConversationCreateEndpoint } from '@poweragents/common/api/ConversationCreateEndpoint.js';
import { ConversationListEndpoint } from '@poweragents/common/api/ConversationListEndpoint.js';
import type { Conversation } from '@poweragents/common/api/ConversationTypes.js';
import type { DaemonEvent } from '@poweragents/common/api/DaemonEventTypes.js';

import { DaemonClient } from '@/daemon/DaemonClient.js';
import { DaemonEventStream } from '@/daemon/DaemonEventStream.js';

/**
 * The open project's conversations, newest first, as the sidebar lists them: loaded when a project opens and kept
 * current by the daemon's events (a conversation started elsewhere, a title the agent gave, the agent starting or
 * stopping). Only one project's list is held; opening another replaces it.
 */
export const ConversationStore = defineService({
    name: 'ConversationStore',
    deps: { daemon: DaemonClient, events: DaemonEventStream, logger: Logger },
    setup({ daemon, events, logger }) {
        const projectId = ref<string | null>(null);
        /** `null` until the open project's list is loaded. */
        const conversations = ref<Conversation[] | null>(null);
        /** Counts loads, so an answer for a project opened before is dropped. */
        let loadSeq = 0;

        const state = reactive({
            /** The project whose conversations these are. */
            projectId: computed(() => projectId.value),
            /** Newest first; `null` until loaded. */
            conversations: computed(() => conversations.value),
        });

        events.event.on(onEvent);

        return { state, open, create, find, setRunning };

        /** Loads a project's conversations, unless they are the ones held already. */
        function open(id: string) {
            if (projectId.value === id) {
                return;
            }
            projectId.value = id;
            conversations.value = null;
            void load();
        }

        /** Starts an empty conversation in the project and lists it first. */
        async function create(id: string) {
            const conversation = await daemon(ConversationCreateEndpoint, { projectId: id });
            if (projectId.value === id) {
                upsert(conversation);
            }
            return conversation;
        }

        /** A conversation of the open project, if it is listed. */
        function find(id: string) {
            return conversations.value?.find(conversation => conversation.id === id);
        }

        /** Marks a conversation running ahead of the daemon's event, when the app itself started its run. */
        function setRunning(id: string, running: boolean) {
            update(id, conversation => ({ ...conversation, running }));
        }

        async function load() {
            const id = projectId.value;
            if (id === null) {
                return;
            }
            const seq = ++loadSeq;
            try {
                const list = await daemon(ConversationListEndpoint, { projectId: id });
                if (seq === loadSeq) {
                    conversations.value = list;
                }
            } catch (error) {
                // The sidebar keeps showing the project alone; the next open or reconnect tries again.
                logger.warn('Conversations could not be loaded', { projectId: id, error });
                if (seq === loadSeq) {
                    conversations.value = [];
                }
            }
        }

        function onEvent(event: DaemonEvent) {
            switch (event.type) {
                case 'conversationCreated':
                    if (event.projectId === projectId.value && !find(event.conversationId)) {
                        upsert({ id: event.conversationId, title: event.title, updatedAt: Date.now(), running: false });
                    }
                    break;
                case 'conversationRenamed':
                    update(event.conversationId, conversation => ({ ...conversation, title: event.title }));
                    break;
                case 'runningChanged':
                    update(event.conversationId, conversation => ({ ...conversation, running: event.running }));
                    break;
                case 'streamRestored':
                    void load();
                    break;
                case 'textDelta':
                case 'stepStarted':
                case 'stepFinished':
                case 'stepFailed':
                case 'runFinished':
                    // The open conversation's.
                    break;
                case 'projectsChanged':
                case 'memoryChanged':
                    // Not about conversations.
                    break;
                default:
                    assertNever(event);
            }
        }

        function upsert(conversation: Conversation) {
            const others = (conversations.value ?? []).filter(item => item.id !== conversation.id);
            conversations.value = [conversation, ...others];
        }

        function update(id: string, change: (conversation: Conversation) => Conversation) {
            if (conversations.value?.some(conversation => conversation.id === id)) {
                conversations.value = conversations.value.map(conversation =>
                    conversation.id === id ? change(conversation) : conversation,
                );
            }
        }
    },
});
