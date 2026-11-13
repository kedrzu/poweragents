<!-- Where a new conversation in a project starts: its folder on a tile in its colour, that it is ready (or, once it has conversations, that a new one starts here), and the composer. -->

<script lang="ts">
import type { PropType } from 'vue';

import type { ProjectColor } from './ProjectColor.js';

export const ProjectEmptyStateProps = {
  name: { type: String, required: true },
  color: { type: String as PropType<ProjectColor>, required: true },
  /** The project has conversations already, listed in the sidebar. */
  hasConversations: Boolean,
} as const;

export const ProjectEmptyStateEmits = {
  /** The person sent the first message of a new conversation (trimmed, never empty); the parent clears `message`. */
  send: (text: string) => typeof text === 'string',
};
</script>

<script lang="ts" setup>
import { FolderOpen } from '@lucide/vue';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { useEmitAsync } from '@nzyme/vue-utils/useEmitAsync.js';

import Composer from './Composer.vue';
import * as l from './ProjectEmptyState.loc.js';

const props = defineProps(ProjectEmptyStateProps);
defineEmits(ProjectEmptyStateEmits);
/** The message being written. */
const message = defineModel<string>('message', { default: '' });

const t = useTranslate();
const emitAsync = useEmitAsync(ProjectEmptyStateEmits);

function send(text: string) {
  return emitAsync('send', text);
}
</script>

<template>
  <div :class="[$style.projectEmptyState, $style[`projectEmptyState_${props.color}`]]">
    <span
      :class="$style.projectEmptyState_tile"
      aria-hidden="true"
    >
      <FolderOpen :class="$style.projectEmptyState_icon" />
    </span>
    <h1 :class="$style.projectEmptyState_title">
      {{ props.hasConversations ? t(l.newTitle, { name: props.name }) : t(l.title, { name: props.name }) }}
    </h1>
    <p :class="$style.projectEmptyState_body">
      {{ props.hasConversations ? t(l.newBody) : t(l.body) }}
    </p>
    <Composer
      v-model="message"
      :class="$style.projectEmptyState_composer"
      :placeholder="t(l.composerPlaceholder, { name: props.name })"
      @send="send"
    />
  </div>
</template>

<style lang="scss" module>
@include project-color-modifiers(projectEmptyState);

.projectEmptyState {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-48 $spacing-24;
  text-align: center;
}

.projectEmptyState_tile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  margin-bottom: $spacing-18;
  border-radius: $radius-s;
  background: var(--project-color-soft);
  color: var(--project-color);
}

.projectEmptyState_icon {
  width: 14px;
  height: 14px;
}

.projectEmptyState_title {
  margin: 0 0 $spacing-12;
  color: $color-ink;
  @include font-heading;
  font-size: $font-size-title-s;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
  text-wrap: balance;
  overflow-wrap: anywhere;
}

.projectEmptyState_body {
  max-width: 560px;
  margin: 0 0 $spacing-24;
  color: $color-ink-body;
  font-size: $font-size-body-l;
  line-height: $line-height-relaxed;
  text-wrap: pretty;
}

.projectEmptyState_composer {
  max-width: 560px;
}
</style>
