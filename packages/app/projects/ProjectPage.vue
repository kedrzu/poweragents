<!-- A project open (screens 54, 58): where a new conversation starts — its first message creates the conversation, sends itself and opens it; an unknown project goes home. -->

<script lang="ts" setup>
import { useLogger } from '@nzyme/vue-ioc/useLogger.js';
import { useService } from '@nzyme/vue-ioc/useService.js';
import { useRoute, useRouter } from 'nuxt/app';
import { computed, ref, watch } from 'vue';

import { ConversationSendEndpoint } from '@poweragents/common/api/ConversationSendEndpoint.js';
import type { Conversation } from '@poweragents/common/api/ConversationTypes.js';
import ProjectEmptyState from '@poweragents/ui/ProjectEmptyState.vue';

import { ConversationStore } from '@/conversations/ConversationStore.js';
import { DaemonClient } from '@/daemon/DaemonClient.js';

import { projectColor } from './projectColor.js';
import { ProjectStore } from './ProjectStore.js';

const store = useService(ProjectStore);
const conversations = useService(ConversationStore);
const daemon = useService(DaemonClient);
const route = useRoute();
const router = useRouter();
const logger = useLogger();
/** The first message being written. */
const message = ref('');
/** A conversation created whose first message failed to send: sending again reuses it rather than leaving it empty. */
let unsent: { projectId: string; conversation: Conversation } | null = null;

const project = computed(() => store.state.projects?.find(candidate => candidate.id === route.params['projectId']));

watch(
  () => [store.state.projects, project.value] as const,
  ([projects, open]) => {
    if (open) {
      store.setLastOpened(open.id);
    } else if (projects) {
      void router.replace({ name: 'home' });
    }
  },
  { immediate: true },
);

async function start(text: string) {
  const projectId = project.value?.id;
  if (!projectId) {
    return;
  }
  try {
    const conversation = unsent?.projectId === projectId ? unsent.conversation : await conversations.create(projectId);
    unsent = { projectId, conversation };
    const { queued } = await daemon(ConversationSendEndpoint, {
      projectId,
      conversationId: conversation.id,
      text,
    });
    unsent = null;
    conversations.setRunning(conversation.id, !queued);
    message.value = '';
    await router.push({ name: 'conversation', params: { projectId, conversationId: conversation.id } });
  } catch (error) {
    // The text stays in the composer, to send again.
    logger.warn('Conversation could not be started', { projectId, error });
  }
}
</script>

<template>
  <ProjectEmptyState
    v-if="project"
    :key="project.id"
    v-model:message="message"
    :name="project.name"
    :color="projectColor(project.id)"
    :has-conversations="(conversations.state.conversations?.length ?? 0) > 0"
    @send="start"
  />
</template>
