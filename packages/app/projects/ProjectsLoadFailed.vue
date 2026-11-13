<!-- The main area when the daemon could not list the projects: what happened, its technical message and Try again. -->

<script lang="ts" setup>
import { RefreshCw } from '@lucide/vue';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { useService } from '@nzyme/vue-ioc/useService.js';

import Button from '@poweragents/ui/Button.vue';
import ErrorDetails from '@poweragents/ui/ErrorDetails.vue';

import { ProjectStore } from './ProjectStore.js';
import * as l from './ProjectsLoadFailed.loc.js';

const store = useService(ProjectStore);
const t = useTranslate();

async function retry() {
  try {
    await store.getProjects();
  } catch {
    // The store keeps the new failure, which this screen shows.
  }
}
</script>

<template>
  <section :class="$style.projectsLoadFailed">
    <h1 :class="$style.projectsLoadFailed_title">{{ t(l.title) }}</h1>
    <p :class="$style.projectsLoadFailed_body">{{ t(l.body) }}</p>
    <ErrorDetails :details="store.state.loadError ?? ''">
      <template #actions>
        <Button
          variant="primary"
          :icon="RefreshCw"
          @click="retry"
        >
          {{ t(l.retry) }}
        </Button>
      </template>
    </ErrorDetails>
  </section>
</template>

<style lang="scss" module>
.projectsLoadFailed {
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
  max-width: 500px;
  margin: auto;
  padding: $spacing-24;
}

.projectsLoadFailed_title {
  @include font-heading;

  margin: 0;
  font-size: $font-size-title-s;
  color: $color-ink;
}

.projectsLoadFailed_body {
  margin: 0;
  color: $color-ink-body;
}
</style>
