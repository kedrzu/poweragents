<!-- Under a message the agent did not answer: why, in a line on the right, with Try again when trying again can help. -->

<script lang="ts">
export const MessageErrorProps = {
  /** Why the agent did not answer, in a sentence. */
  text: { type: String, required: true },
  /** Shows Try again; without it the fix is elsewhere (a banner). */
  retryable: Boolean,
} as const;

export const MessageErrorEmits = {
  /** The person asked to send the message again. The button stays busy while an async listener runs. */
  retry: () => true,
};
</script>

<script lang="ts" setup>
import { CircleAlert, RotateCcw } from '@lucide/vue';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { useEmitAsync } from '@nzyme/vue-utils/useEmitAsync.js';

import Button from './Button.vue';
import * as l from './MessageError.loc.js';

const props = defineProps(MessageErrorProps);
defineEmits(MessageErrorEmits);

const t = useTranslate();
const emitAsync = useEmitAsync(MessageErrorEmits);

function retry() {
  return emitAsync('retry');
}
</script>

<template>
  <div
    :class="$style.messageError"
    role="status"
  >
    <CircleAlert
      :class="$style.messageError_icon"
      aria-hidden="true"
    />
    <p :class="$style.messageError_text">
      {{ props.text }}
    </p>
    <Button
      v-if="props.retryable"
      variant="ghost"
      :icon="RotateCcw"
      @click="retry"
    >
      {{ t(l.retry) }}
    </Button>
  </div>
</template>

<style lang="scss" module>
.messageError {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-08 $spacing-10;
  align-items: center;
  justify-content: flex-end;
}

.messageError_icon {
  flex: none;
  width: 16px;
  height: 16px;
  color: $color-attention;
}

.messageError_text {
  margin: 0;
  color: $color-ink-body;
  font-size: $font-size-control;
  line-height: $line-height-snug;
}
</style>
