<!-- Small numbered circle of a step in a list; a check on the brand colour once the step is done. -->

<script lang="ts">
export const StepNumberProps = {
  /** The step's number, counted from 1. */
  value: { type: Number, required: true },
  done: Boolean,
} as const;
</script>

<script lang="ts" setup>
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';

import CheckBadge from './CheckBadge.vue';
import * as l from './StepNumber.loc.js';

const props = defineProps(StepNumberProps);

const t = useTranslate();
</script>

<template>
  <CheckBadge
    v-if="props.done"
    :label="t(l.done)"
  />
  <span
    v-else
    :class="$style.stepNumber"
    >{{ props.value }}</span
  >
</template>

<style lang="scss" module>
.stepNumber {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 1px solid $color-attention-border;
  border-radius: 50%;
  background: $color-surface;
  color: $color-attention-ink;
  font-size: $font-size-micro;
  font-weight: $font-weight-bold;
  line-height: 1;
}
</style>
