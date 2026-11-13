<!-- Home after the first run: the last opened project (or the first) when there are projects, else the invitation to create the first one (screen 51). -->

<script lang="ts" setup>
import { injectContext } from '@nzyme/vue-utils/context.js';
import { useService } from '@nzyme/vue-ioc/useService.js';
import { useRouter } from 'nuxt/app';
import { ref } from 'vue';

import NoProjectsState from '@poweragents/ui/NoProjectsState.vue';

import { MainShellContext } from './MainShellContext.js';
import { ProjectStore } from './ProjectStore.js';

const store = useService(ProjectStore);
const router = useRouter();
const shell = injectContext(MainShellContext);
/** Whether there are no projects; unknown until they are loaded, so a redirect never flashes the empty state. */
const empty = ref(false);

void openProject();

async function openProject() {
  let projects;
  try {
    projects = await store.getProjects();
  } catch {
    // The shell shows the failure and retries; the page is replaced by it meanwhile.
    return;
  }
  const project = store.getLastOpened(projects) ?? projects[0];
  if (project) {
    await router.replace({ name: 'project', params: { projectId: project.id } });
  } else {
    empty.value = true;
  }
}
</script>

<template>
  <NoProjectsState
    v-if="empty"
    @create="shell.newProjectOpen = true"
  />
</template>
