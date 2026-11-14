<!-- The tab of the open screen in the app shell's tab bar: a conversation's speech bubble (or another screen's icon) in its colour, or a spinner while the agent works, and its title. -->

<script lang="ts">
import type { LucideIcon } from '@lucide/vue';
import { defineProp } from '@nzyme/vue-utils/defineProp.js';
import type { PropType } from 'vue';

import type { ProjectColor } from './ProjectColor.js';

export const ConversationTabProps = {
  title: { type: String, required: true },
  /** The colour of the conversation's project, or of the screen (Memory's violet). */
  color: { type: String as PropType<ProjectColor>, required: true },
  /** Another screen's icon from `@lucide/vue` in place of the speech bubble (Memory's brain). */
  icon: defineProp<LucideIcon>(),
  /** The agent is working on the conversation. */
  running: Boolean,
} as const;
</script>

<script lang="ts" setup>
import { MessageCircle } from '@lucide/vue';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';

import * as l from './ConversationTab.loc.js';
import Spinner from './Spinner.vue';

const props = defineProps(ConversationTabProps);

const t = useTranslate();
</script>

<template>
  <span :class="[$style.conversationTab, $style[`conversationTab_${props.color}`]]">
    <Spinner
      v-if="props.running"
      :class="$style.conversationTab_spinner"
      :label="t(l.running)"
    />
    <component
      :is="props.icon ?? MessageCircle"
      v-else
      :class="$style.conversationTab_icon"
      aria-hidden="true"
    />
    <span :class="$style.conversationTab_title">{{ props.title }}</span>
  </span>
</template>

<style lang="scss" module>
@include project-color-modifiers(conversationTab);

.conversationTab {
  display: inline-flex;
  gap: $spacing-10;
  align-items: center;
  max-width: 320px;
  min-height: 28px;
  padding: $spacing-04 $spacing-12;
  border-radius: $radius-s;
  background: $color-surface-soft;
  color: $color-ink;
  font-size: $font-size-body-s;
  font-weight: $font-weight-semibold;
  line-height: $line-height-snug;
}

.conversationTab_icon {
  flex: none;
  width: 14px;
  height: 14px;
  color: var(--project-color);
}

.conversationTab_spinner {
  font-size: $font-size-body-s; // 14px
}

.conversationTab_title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
