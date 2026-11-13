<!-- A failure's technical message behind a "Show details" toggle, in a monospace box; the failure's own buttons go before the toggle. -->

<script lang="ts">
export const ErrorDetailsProps = {
  /** The technical message, as the failing tool printed it; line breaks are kept. */
  details: { type: String, required: true },
} as const;
</script>

<script lang="ts" setup>
import { ChevronDown, ChevronUp } from '@lucide/vue';
import Collapse from '@nzyme/vue/components/Collapse.vue';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { useId } from 'vue';

import Button from './Button.vue';
import * as l from './ErrorDetails.loc.js';

const props = defineProps(ErrorDetailsProps);
/** Whether the message shows; hidden until the person asks for it. */
const open = defineModel<boolean>('open', { default: false });
defineSlots<{
  /** What the person can do about the failure (Retry), at the start of the toggle's row. */
  actions?(): unknown;
}>();

const t = useTranslate();
const boxId = useId();

function toggle() {
  open.value = !open.value;
}
</script>

<template>
  <div :class="$style.errorDetails">
    <div :class="$style.errorDetails_row">
      <slot name="actions" />
      <Button
        variant="ghost"
        :icon="open ? ChevronUp : ChevronDown"
        :aria-expanded="open"
        :aria-controls="boxId"
        @click="toggle"
      >
        {{ open ? t(l.hide) : t(l.show) }}
      </Button>
    </div>
    <Collapse
      :show="open"
      render="always"
    >
      <pre
        :id="boxId"
        :class="$style.errorDetails_box"
        >{{ props.details }}</pre>
    </Collapse>
  </div>
</template>

<style lang="scss" module>
.errorDetails {
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.errorDetails_row {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-10;
  align-items: center;
}

.errorDetails_box {
  margin: 0;
  padding: $spacing-14 $spacing-16;
  overflow-x: auto;
  border-radius: $radius-m;
  background: $color-surface-soft;
  color: $color-ink-body;
  font-family: $font-family-mono;
  font-size: $font-size-small;
  line-height: $line-height-code;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
