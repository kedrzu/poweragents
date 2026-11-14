<!-- The app after the first run: Memory and the projects in the sidebar with the open project's conversations, the open screen's tab, the screen of the route inside, and the new-project dialog. Starts the daemon's event stream. -->

<script lang="ts" setup>
import { NuxtPage } from '#components';
import { Brain } from '@lucide/vue';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { provideContext } from '@nzyme/vue-utils/context.js';
import { useService } from '@nzyme/vue-ioc/useService.js';
import { useRoute } from 'nuxt/app';
import { computed, watch } from 'vue';

import AppShell from '@poweragents/ui/AppShell.vue';
import ConversationTab from '@poweragents/ui/ConversationTab.vue';
import ProjectSidebar from '@poweragents/ui/ProjectSidebar.vue';
import type { ProjectSidebarConversation, ProjectSidebarItem } from '@poweragents/ui/ProjectSidebar.vue';

import * as lc from '@/conversations/Conversations.loc.js';
import { ConversationStore } from '@/conversations/ConversationStore.js';
import { DaemonEventStream } from '@/daemon/DaemonEventStream.js';

import * as l from './MainShell.loc.js';

import { MainShellContext } from './MainShellContext.js';
import NewProjectDialog from './NewProjectDialog.vue';
import { projectColor } from './projectColor.js';
import { ProjectStore } from './ProjectStore.js';
import ProjectsLoadFailed from './ProjectsLoadFailed.vue';

const store = useService(ProjectStore);
const conversationStore = useService(ConversationStore);
const events = useService(DaemonEventStream);
const route = useRoute();
const shell = provideContext(MainShellContext);
const t = useTranslate();
const memoryOpen = computed(() => route.name === 'memory');

const items = computed(() =>
  (store.state.projects ?? []).map((project): ProjectSidebarItem => ({
    id: project.id,
    name: project.name,
    color: projectColor(project.id),
    to: { name: 'project', params: { projectId: project.id } },
  })),
);
const selected = computed(() => {
  const projectId = route.name === 'project' || route.name === 'conversation' ? route.params['projectId'] : undefined;
  return items.value.find(item => item.id === projectId);
});
const selectedConversationId = computed(() =>
  route.name === 'conversation' ? String(route.params['conversationId']) : undefined,
);
const conversations = computed(() =>
  conversationStore.state.projectId === selected.value?.id
    ? (conversationStore.state.conversations ?? []).map((conversation): ProjectSidebarConversation => ({
        id: conversation.id,
        title: conversation.title ?? t(lc.untitled),
        to: { name: 'conversation', params: { projectId: selected.value?.id, conversationId: conversation.id } },
        running: conversation.running,
      }))
    : [],
);
const tab = computed(() => {
  const open = conversations.value.find(conversation => conversation.id === selectedConversationId.value);
  if (selectedConversationId.value === undefined) {
    return { title: t(lc.newConversation), running: false };
  }
  return { title: open?.title ?? t(lc.untitled), running: open?.running ?? false };
});

watch(
  () => selected.value?.id,
  projectId => {
    if (projectId) {
      conversationStore.open(projectId);
    }
  },
  { immediate: true },
);

// The app's one connection to the daemon's events, for as long as the app runs; this shell shows only past the first
// run, when the daemon's sandbox is ready.
events.start();

// A failure is kept by the store and shown in place of the route's screen.
store.getProjects().catch(() => undefined);
</script>

<template>
  <AppShell>
    <template #sidebar>
      <ProjectSidebar
        :memory-to="{ name: 'memory' }"
        :memory-selected="memoryOpen"
        :projects="items"
        :selected-id="selected?.id"
        :conversations="conversations"
        :selected-conversation-id="selectedConversationId"
        @create="shell.newProjectOpen = true"
      />
    </template>
    <template
      v-if="memoryOpen"
      #header
    >
      <ConversationTab
        :title="t(l.memory)"
        color="violet"
        :icon="Brain"
      />
    </template>
    <template
      v-else-if="selected"
      #header
    >
      <ConversationTab
        :title="tab.title"
        :color="selected.color"
        :running="tab.running"
      />
    </template>
    <ProjectsLoadFailed v-if="store.state.projects === null && store.state.loadError !== null" />
    <NuxtPage v-else />
  </AppShell>
  <NewProjectDialog v-model:open="shell.newProjectOpen" />
</template>
