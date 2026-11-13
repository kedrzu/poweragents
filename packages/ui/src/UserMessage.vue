<!-- What the person wrote, in a soft bubble on the right; line breaks kept, nothing formatted. -->

<script lang="ts">
export const UserMessageProps = {
  text: { type: String, required: true },
} as const;
</script>

<script lang="ts" setup>
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';

import * as l from './UserMessage.loc.js';

const props = defineProps(UserMessageProps);

const t = useTranslate();
</script>

<template>
  <div :class="$style.userMessage">
    <p :class="$style.userMessage_bubble">
      <span :class="$style.userMessage_author">{{ t(l.author) }}</span>
      <span :class="$style.userMessage_text">{{ props.text }}</span>
    </p>
  </div>
</template>

<style lang="scss" module>
.userMessage {
  display: flex;
  justify-content: flex-end;
}

.userMessage_bubble {
  max-width: 85%;
  margin: 0;
  padding: $spacing-10 $spacing-16;
  border-radius: $radius-l;
  background: $color-surface-soft;
  color: $color-ink;
  font-size: $font-size-body;
  line-height: $line-height-relaxed;
  overflow-wrap: anywhere;
}

.userMessage_text {
  white-space: pre-wrap;
}

.userMessage_author {
  @include visually-hidden;
}
</style>
