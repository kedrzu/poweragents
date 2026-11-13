<!-- A finished reply's steps, collapsed to their count; the person opens them into a `StepList` and closes them again. -->

<script lang="ts">
export const StepsSummaryProps = {
  /** How many steps the default slot holds. */
  count: { type: Number, required: true },
} as const;
</script>

<script lang="ts" setup>
import { ChevronRight } from '@lucide/vue';
import Collapse from '@nzyme/vue/components/Collapse.vue';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { ref, useId } from 'vue';

import StepList from './StepList.vue';
import * as l from './StepsSummary.loc.js';

const props = defineProps(StepsSummaryProps);
defineSlots<{
  /** `Step` components. */
  default(): unknown;
}>();

const t = useTranslate();
const open = ref(false);
const listId = useId();
</script>

<template>
  <div :class="$style.stepsSummary">
    <button
      type="button"
      :class="$style.stepsSummary_toggle"
      :aria-expanded="open"
      :aria-controls="listId"
      @click="open = !open"
    >
      <ChevronRight
        :class="$style.stepsSummary_chevron"
        aria-hidden="true"
      />
      {{ t(l.steps, { count: props.count }) }}
    </button>
    <Collapse
      :id="listId"
      :show="open"
      render="always"
    >
      <StepList :class="$style.stepsSummary_list">
        <slot />
      </StepList>
    </Collapse>
  </div>
</template>

<style lang="scss" module>
.stepsSummary {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stepsSummary_toggle {
  display: inline-flex;
  gap: $spacing-06;
  align-items: center;
  min-height: 24px;
  margin-left: -$spacing-04;
  padding: $spacing-02 $spacing-06 $spacing-02 $spacing-04;
  border: 0;
  border-radius: $radius-s;
  background: transparent;
  color: $color-ink-muted;
  font: inherit;
  font-size: $font-size-small;
  line-height: $line-height-snug;
  cursor: pointer;

  @include focus-ring;
  @include hover {
    color: $color-ink;
  }
}

.stepsSummary_chevron {
  width: 14px;
  height: 14px;
  transition: transform $duration-fast;

  [aria-expanded='true'] > & {
    transform: rotate(90deg);
  }
}

.stepsSummary_list {
  margin-top: $spacing-08;
}
</style>
