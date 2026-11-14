<!-- The Memory screen with files: a header (title, what Memory is, Show in Finder), the files on the left, newest first, and the open file's read-only formatted preview on the right, or why it cannot be shown. -->

<script lang="ts">
import type { PropType } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

/** A Memory file as the list shows it. */
export interface MemoryLayoutFile {
  /** Relative to the Memory folder; also the file's identity. */
  path: string;
  title: string;
  /** Epoch ms of the last change. */
  updatedAt: number;
  /** The file's screen. */
  to: RouteLocationRaw;
  /** The agent changed it a moment ago. */
  changed: boolean;
}

/** What the preview shows for the open file. */
export type MemoryLayoutPreview =
  | { state: 'loading' }
  | { state: 'file'; path: string; updatedAt: number; markdown: string }
  /** The file is gone (removed or renamed since the list was read). */
  | { state: 'notFound' }
  /** The file is over what the app reads. */
  | { state: 'tooLarge'; path: string }
  /** The daemon could not be asked; `details` is the technical message. */
  | { state: 'failed'; details: string };

/** Why Show in Finder did not show anything. */
export type MemoryLayoutRevealProblem = 'unsupported' | 'failed';

export const MemoryLayoutProps = {
  /** In the order they are listed. */
  files: { type: Array as PropType<readonly MemoryLayoutFile[]>, required: true },
  /** The path of the file open now. */
  selectedPath: { type: String, default: undefined },
  /** What shows beside the list; nothing while no file is open. */
  preview: { type: Object as PropType<MemoryLayoutPreview>, default: undefined },
  /** Epoch ms of now, which the files' changes are told against. */
  now: { type: Number, required: true },
  /** Why the last Show in Finder showed nothing, said under the button. */
  revealProblem: { type: String as PropType<MemoryLayoutRevealProblem>, default: undefined },
} as const;

export const MemoryLayoutEmits = {
  /** The person asked to see the Memory folder in Finder; the button is busy until the handler settles. */
  reveal: () => true,
  /** The person asked to load the open file again after it failed; the button is busy until the handler settles. */
  retry: () => true,
};
</script>

<script lang="ts" setup>
import { FileText, FolderOpen, RefreshCw } from '@lucide/vue';
import { useLanguage } from '@nzyme/vue-i18n/useLanguage.js';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { useEmitAsync } from '@nzyme/vue-utils/useEmitAsync.js';
import { computed } from 'vue';

import Button from './Button.vue';
import ErrorDetails from './ErrorDetails.vue';
import MemoryFileRow from './MemoryFileRow.vue';
import * as l from './MemoryLayout.loc.js';
import RichText from './RichText.vue';
import Spinner from './Spinner.vue';
import { formatChangedAt } from './utils/formatChangedAt.js';

const props = defineProps(MemoryLayoutProps);
defineEmits(MemoryLayoutEmits);

const t = useTranslate();
const language = useLanguage();
const emitAsync = useEmitAsync(MemoryLayoutEmits);
const changedLine = computed(() => {
  const preview = props.preview;
  if (preview?.state !== 'file') {
    return '';
  }
  const when = formatChangedAt({ changedAt: preview.updatedAt, now: props.now, language: language.value });
  return t(l.changedLine, { path: preview.path, when });
});

function reveal() {
  return emitAsync('reveal');
}

function retry() {
  return emitAsync('retry');
}
</script>

<template>
  <div :class="$style.memoryLayout">
    <header :class="$style.memoryLayout_header">
      <div :class="$style.memoryLayout_intro">
        <h1 :class="$style.memoryLayout_title">
          {{ t(l.title) }}
        </h1>
        <p :class="$style.memoryLayout_body">{{ t(l.body) }}</p>
      </div>
      <div :class="$style.memoryLayout_reveal">
        <Button
          variant="secondary"
          :icon="FolderOpen"
          @click="reveal"
        >
          {{ t(l.reveal) }}
        </Button>
        <p
          :class="$style.memoryLayout_revealProblem"
          role="status"
        >
          <template v-if="props.revealProblem === 'unsupported'">{{ t(l.revealUnsupported) }}</template>
          <template v-else-if="props.revealProblem === 'failed'">{{ t(l.revealFailed) }}</template>
        </p>
      </div>
    </header>
    <div :class="$style.memoryLayout_columns">
      <nav
        :class="$style.memoryLayout_files"
        :aria-label="t(l.files)"
      >
        <ul :class="$style.memoryLayout_list">
          <li
            v-for="file in props.files"
            :key="file.path"
          >
            <MemoryFileRow
              :title="file.title"
              :path="file.path"
              :updated-at="file.updatedAt"
              :now="props.now"
              :to="file.to"
              :selected="file.path === props.selectedPath"
              :changed="file.changed"
            />
          </li>
        </ul>
      </nav>
      <!-- A named, focusable region: the keyboard scrolls a long file even when it holds no link. -->
      <section
        v-if="props.preview"
        :class="$style.memoryLayout_preview"
        :aria-label="t(l.preview)"
        tabindex="0"
      >
        <template v-if="props.preview.state === 'file'">
          <p :class="$style.memoryLayout_changed">
            <FileText
              :class="$style.memoryLayout_changedIcon"
              aria-hidden="true"
            />
            {{ changedLine }}
          </p>
          <RichText
            :markdown="props.preview.markdown"
            document
          />
        </template>
        <Spinner
          v-else-if="props.preview.state === 'loading'"
          :class="$style.memoryLayout_spinner"
          :label="t(l.loading)"
        />
        <div
          v-else
          :class="$style.memoryLayout_problem"
        >
          <template v-if="props.preview.state === 'notFound'">
            <h2 :class="$style.memoryLayout_problemTitle">{{ t(l.notFoundTitle) }}</h2>
            <p :class="$style.memoryLayout_problemBody">{{ t(l.notFoundBody) }}</p>
          </template>
          <template v-else-if="props.preview.state === 'tooLarge'">
            <h2 :class="$style.memoryLayout_problemTitle">{{ t(l.tooLargeTitle) }}</h2>
            <p :class="$style.memoryLayout_problemBody">{{ t(l.tooLargeBody, { path: props.preview.path }) }}</p>
          </template>
          <template v-else>
            <h2 :class="$style.memoryLayout_problemTitle">{{ t(l.failedTitle) }}</h2>
            <p :class="$style.memoryLayout_problemBody">{{ t(l.failedBody) }}</p>
            <ErrorDetails :details="props.preview.details">
              <template #actions>
                <Button
                  :icon="RefreshCw"
                  @click="retry"
                >
                  {{ t(l.retry) }}
                </Button>
              </template>
            </ErrorDetails>
          </template>
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss" module>
$files-width: 300px;
$preview-max-width: 680px;

.memoryLayout {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 0 $spacing-28;
}

.memoryLayout_header {
  display: flex;
  flex: none;
  gap: $spacing-24;
  align-items: flex-end;
  justify-content: space-between;
  padding: $spacing-28 0 $spacing-22;
  border-bottom: 1px solid $color-border;
}

.memoryLayout_intro {
  display: flex;
  flex-direction: column;
  gap: $spacing-10;
  min-width: 0;
}

.memoryLayout_title {
  margin: 0;
  color: $color-ink;
  @include font-heading;
  font-size: $font-size-title-s;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
}

.memoryLayout_body {
  margin: 0;
  color: $color-ink-body;
  font-size: $font-size-body-l;
  line-height: $line-height-relaxed;
  text-wrap: pretty;
}

.memoryLayout_reveal {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: $spacing-06;
  align-items: flex-end;
}

.memoryLayout_revealProblem {
  max-width: 280px;
  margin: 0;
  color: $color-ink-muted;
  font-size: $font-size-caption;
  line-height: $line-height-snug;
  text-align: right;

  &:empty {
    display: none;
  }
}

.memoryLayout_columns {
  display: flex;
  flex: 1;
  min-height: 0;
}

.memoryLayout_files {
  flex: none;
  width: $files-width;
  padding: $spacing-14 $spacing-14 $spacing-14 0;
  overflow-y: auto;
  border-right: 1px solid $color-border;
}

.memoryLayout_list {
  display: flex;
  flex-direction: column;
  gap: $spacing-04;
  margin: 0;
  padding: 0;
  list-style: none;
}

.memoryLayout_preview {
  flex: 1;
  min-width: 0;
  padding: $spacing-28 $spacing-48;
  overflow-y: auto;

  @include focus-ring;

  > * {
    max-width: $preview-max-width;
  }
}

.memoryLayout_changed {
  display: flex;
  gap: $spacing-08;
  align-items: center;
  margin: 0 0 $spacing-18;
  color: $color-ink-muted;
  font-size: $font-size-badge;
  line-height: $line-height-snug;
}

.memoryLayout_changedIcon {
  flex: none;
  width: 14px;
  height: 14px;
}

.memoryLayout_spinner {
  font-size: $font-size-heading;
}

.memoryLayout_problem {
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
}

.memoryLayout_problemTitle {
  margin: 0;
  color: $color-ink;
  @include font-heading;
  font-size: $font-size-heading;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
}

.memoryLayout_problemBody {
  margin: 0;
  color: $color-ink-body;
  font-size: $font-size-body-l;
  line-height: $line-height-relaxed;
}
</style>
