<!-- The agent's steps in a soft box, in the order it took them: `Step` items in the default slot. -->

<script lang="ts" setup>
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';

import * as l from './StepList.loc.js';

defineSlots<{
  /** `Step` components. */
  default(): unknown;
}>();

const t = useTranslate();
</script>

<template>
  <ul
    :class="$style.stepList"
    :aria-label="t(l.label)"
  >
    <slot />
  </ul>
</template>

<style lang="scss" module>
.stepList {
  display: flex;
  flex-direction: column;
  gap: $spacing-08;
  margin: 0;
  padding: $spacing-12 $spacing-14;
  border-radius: $radius-panel;
  background: $color-surface-soft;
  list-style: none;
}
</style>
