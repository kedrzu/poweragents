<!-- The Memory screen: the files the agent keeps about the person, newest first, the open one (`?file=`) previewed read-only, Show in Finder, and the empty state; follows the agent's changes live. -->

<script lang="ts" setup>
import { RefreshCw } from '@lucide/vue';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { useLogger } from '@nzyme/vue-ioc/useLogger.js';
import { useService } from '@nzyme/vue-ioc/useService.js';
import { useDataSource } from '@nzyme/vue-utils/useDataSource.js';
import { useRoute, useRouter } from 'nuxt/app';
import { computed, onScopeDispose, ref, watch } from 'vue';

import { MemoryFileGetEndpoint } from '@poweragents/common/api/MemoryFileGetEndpoint.js';
import { MemoryRevealEndpoint } from '@poweragents/common/api/MemoryRevealEndpoint.js';
import Button from '@poweragents/ui/Button.vue';
import ErrorDetails from '@poweragents/ui/ErrorDetails.vue';
import MemoryEmptyState from '@poweragents/ui/MemoryEmptyState.vue';
import MemoryLayout from '@poweragents/ui/MemoryLayout.vue';
import type {
  MemoryLayoutFile,
  MemoryLayoutPreview,
  MemoryLayoutRevealProblem,
} from '@poweragents/ui/MemoryLayout.vue';

import { DaemonClient } from '@/daemon/DaemonClient.js';

import * as l from './MemoryPage.loc.js';
import { MemoryStore } from './MemoryStore.js';

/** For this long after the agent changed a file, its row carries the "changed" dot. */
const CHANGED_MARK_MS = 60_000;
/** How often "now" moves on, so "just now" and the dot age without a reload. */
const CLOCK_TICK_MS = 10_000;

const store = useService(MemoryStore);
const daemon = useService(DaemonClient);
const route = useRoute();
const router = useRouter();
const t = useTranslate();
const logger = useLogger();

const now = ref(Date.now());
const revealProblem = ref<MemoryLayoutRevealProblem>();
const selectedPath = computed(() => (typeof route.query['file'] === 'string' ? route.query['file'] : undefined));
const files = computed(() =>
  (store.state.files ?? []).map((file): MemoryLayoutFile => ({
    path: file.path,
    title: file.title,
    updatedAt: file.updatedAt,
    to: { name: 'memory', query: { file: file.path } },
    changed: now.value - file.updatedAt < CHANGED_MARK_MS,
  })),
);
const opened = useDataSource({
  params: () => ({ path: selectedPath.value, revision: store.state.revision }),
  load: ({ path }) => (path === undefined ? Promise.resolve(null) : daemon(MemoryFileGetEndpoint, { path })),
  default: () => null,
  behavior: 'eager',
  onError: error => logger.warn('Memory file could not be read', { error }),
});
const preview = computed((): MemoryLayoutPreview | undefined => {
  const result = opened.value;
  if (selectedPath.value === undefined) {
    return undefined;
  }
  if (opened.error !== undefined && opened.error !== null) {
    return { state: 'failed', details: opened.error instanceof Error ? opened.error.message : String(opened.error) };
  }
  if (result === null) {
    return { state: 'loading' };
  }
  if ('file' in result) {
    return { state: 'file', path: result.file.path, updatedAt: result.file.updatedAt, markdown: result.file.content };
  }
  if ('tooLarge' in result) {
    return { state: 'tooLarge', path: selectedPath.value };
  }
  return { state: 'notFound' };
});

const clock = setInterval(() => (now.value = Date.now()), CLOCK_TICK_MS);
onScopeDispose(() => clearInterval(clock));

// Another file: its text is not the last one's, so the last one never shows under the new name.
watch(selectedPath, () => {
  opened.clear();
  revealProblem.value = undefined;
});

// With no file asked for, the newest opens.
watch(
  [selectedPath, () => store.state.files],
  ([path, list]) => {
    const newest = list?.[0];
    if (path === undefined && newest) {
      void router.replace({ name: 'memory', query: { file: newest.path } });
    }
  },
  { immediate: true },
);

void store.load();

/** Shows the open file in Finder, or the Memory folder when none is open. */
async function reveal() {
  revealProblem.value = undefined;
  try {
    const result = await daemon(MemoryRevealEndpoint, { path: selectedPath.value });
    if ('unsupported' in result) {
      revealProblem.value = 'unsupported';
    } else if ('notFound' in result && selectedPath.value !== undefined) {
      // The file is gone since: its folder still is where the person looks.
      const folder = await daemon(MemoryRevealEndpoint, {});
      if (!('revealed' in folder)) {
        revealProblem.value = 'failed';
      }
    } else if ('notFound' in result) {
      revealProblem.value = 'failed';
    }
  } catch (error) {
    logger.warn('Memory could not be shown in Finder', { error });
    revealProblem.value = 'failed';
  }
}

async function retryList() {
  await store.load();
}

async function retryFile() {
  await opened.reload();
}
</script>

<template>
  <section
    v-if="store.state.files === null && store.state.loadError !== null"
    :class="$style.memoryPage_failed"
  >
    <h1 :class="$style.memoryPage_failedTitle">{{ t(l.loadFailedTitle) }}</h1>
    <p :class="$style.memoryPage_failedBody">{{ t(l.loadFailedBody) }}</p>
    <ErrorDetails :details="store.state.loadError">
      <template #actions>
        <Button
          :icon="RefreshCw"
          @click="retryList"
        >
          {{ t(l.retry) }}
        </Button>
      </template>
    </ErrorDetails>
  </section>
  <MemoryEmptyState v-else-if="store.state.files?.length === 0" />
  <MemoryLayout
    v-else-if="store.state.files !== null"
    :files="files"
    :selected-path="selectedPath"
    :preview="preview"
    :now="now"
    :reveal-problem="revealProblem"
    @reveal="reveal"
    @retry="retryFile"
  />
</template>

<style lang="scss" module>
.memoryPage_failed {
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
  max-width: 500px;
  margin: auto;
  padding: $spacing-24;
}

.memoryPage_failedTitle {
  margin: 0;
  color: $color-ink;
  @include font-heading;
  font-size: $font-size-title-s;
}

.memoryPage_failedBody {
  margin: 0;
  color: $color-ink-body;
}
</style>
