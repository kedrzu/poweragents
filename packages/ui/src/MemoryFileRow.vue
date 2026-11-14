<!-- A file of the person's Memory in its list: a page icon, the file's title, its name and when it changed, and a dot while the agent's change is fresh; a link to the file, open (selected) or not. -->

<script lang="ts">
import type { PropType } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

export const MemoryFileRowProps = {
  title: { type: String, required: true },
  /** The file's path in the Memory folder, shown as its name. */
  path: { type: String, required: true },
  /** Epoch ms of the file's last change. */
  updatedAt: { type: Number, required: true },
  /** Epoch ms of now, which `updatedAt` is told against ("just now", "yesterday"). */
  now: { type: Number, required: true },
  /** The file's screen. */
  to: { type: [String, Object] as PropType<RouteLocationRaw>, required: true },
  /** Open now: a tinted row, a stronger title and `aria-current="page"`. */
  selected: Boolean,
  /** The agent changed the file a moment ago: a dot at the row's end. */
  changed: Boolean,
} as const;
</script>

<script lang="ts" setup>
import { FileText } from '@lucide/vue';
import { useLanguage } from '@nzyme/vue-i18n/useLanguage.js';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import * as l from './MemoryFileRow.loc.js';
import { formatChangedAt } from './utils/formatChangedAt.js';

const props = defineProps(MemoryFileRowProps);

const t = useTranslate();
const language = useLanguage();
const when = computed(() => formatChangedAt({ changedAt: props.updatedAt, now: props.now, language: language.value }));
</script>

<template>
  <RouterLink
    :to="props.to"
    :class="[$style.memoryFileRow, props.selected && $style.memoryFileRow_selected]"
    :aria-current="props.selected ? 'page' : undefined"
  >
    <FileText
      :class="$style.memoryFileRow_icon"
      aria-hidden="true"
    />
    <span :class="$style.memoryFileRow_text">
      <span :class="$style.memoryFileRow_title">{{ props.title }}</span>
      <span :class="$style.memoryFileRow_meta">{{ props.path }} · {{ when }}</span>
    </span>
    <span
      v-if="props.changed"
      :class="$style.memoryFileRow_changed"
    >
      <span :class="$style.memoryFileRow_changedLabel">{{ t(l.changed) }}</span>
    </span>
  </RouterLink>
</template>

<style lang="scss" module>
.memoryFileRow {
  display: flex;
  gap: $spacing-14;
  align-items: center;
  padding: $spacing-10 $spacing-14;
  border-radius: $radius-m;
  color: $color-ink;
  text-decoration: none;
  transition: background-color $duration-fast;

  @include focus-ring;
  @include hover {
    background: $color-surface-soft;
  }
}

.memoryFileRow_selected {
  background: $color-surface-soft;

  .memoryFileRow_title {
    font-weight: $font-weight-semibold;
  }
}

.memoryFileRow_icon {
  flex: none;
  width: 16px;
  height: 16px;
  color: $color-ink-muted;
}

.memoryFileRow_text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: $spacing-02;
  min-width: 0;
}

.memoryFileRow_title,
.memoryFileRow_meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.memoryFileRow_title {
  font-size: $font-size-small;
  line-height: $line-height-snug;
}

.memoryFileRow_meta {
  color: $color-ink-muted;
  font-size: $font-size-badge;
  line-height: $line-height-snug;
}

.memoryFileRow_changed {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: $color-brand-1-strong;
}

.memoryFileRow_changedLabel {
  @include visually-hidden;
}
</style>
