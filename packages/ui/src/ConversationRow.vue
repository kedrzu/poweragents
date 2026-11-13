<!-- A row under the open project in the sidebar: a conversation (a speech bubble, its title, a spinner while the agent works) or New conversation (a plus); a link, white when open. -->

<script lang="ts">
import type { PropType } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

/** What the row opens: a conversation, or the project's empty state to start a new one. */
export type ConversationRowKind = 'conversation' | 'new';

export const ConversationRowProps = {
  label: { type: String, required: true },
  to: { type: [String, Object] as PropType<RouteLocationRaw>, required: true },
  kind: { type: String as PropType<ConversationRowKind>, default: 'conversation' },
  /** Open now: white, a stronger label and `aria-current="page"`. */
  selected: Boolean,
  /** The agent is working on the conversation. */
  running: Boolean,
} as const;
</script>

<script lang="ts" setup>
import { MessageCircle, Plus } from '@lucide/vue';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { RouterLink } from 'vue-router';

import * as l from './ConversationRow.loc.js';
import Spinner from './Spinner.vue';

const props = defineProps(ConversationRowProps);

const t = useTranslate();
</script>

<template>
  <RouterLink
    :to="props.to"
    :class="[$style.conversationRow, props.selected && $style.conversationRow_selected]"
    :aria-current="props.selected ? 'page' : undefined"
  >
    <component
      :is="props.kind === 'new' ? Plus : MessageCircle"
      :class="$style.conversationRow_icon"
      aria-hidden="true"
    />
    <span :class="$style.conversationRow_label">{{ props.label }}</span>
    <Spinner
      v-if="props.running"
      :class="$style.conversationRow_spinner"
      :label="t(l.running)"
    />
  </RouterLink>
</template>

<style lang="scss" module>
.conversationRow {
  display: flex;
  gap: $spacing-10;
  align-items: center;
  min-height: 26px;
  padding: $spacing-04 $spacing-10;
  border-radius: $radius-s;
  color: $color-ink-body;
  font-size: $font-size-small;
  line-height: $line-height-snug;
  text-decoration: none;
  transition: background-color $duration-fast;

  @include focus-ring;
  @include hover {
    background: $color-surface-glass;
  }
}

.conversationRow_selected {
  background: $color-surface;
  color: $color-ink;
  font-weight: $font-weight-semibold;

  @include hover {
    background: $color-surface;
  }
}

.conversationRow_icon {
  flex: none;
  width: 14px;
  height: 14px;
  color: $color-ink-muted;
}

.conversationRow_label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversationRow_spinner {
  font-size: $font-size-body-s;
}
</style>
