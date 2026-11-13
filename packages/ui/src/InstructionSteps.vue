<!-- Numbered list of short things the person does outside the app, in order (sign in, copy the code, paste it). -->

<script lang="ts">
import type { PropType } from 'vue';

export const InstructionStepsProps = {
  /** One line of text per step, in order. */
  steps: { type: Array as PropType<readonly string[]>, required: true },
} as const;
</script>

<script lang="ts" setup>
import StepNumber from './StepNumber.vue';

const props = defineProps(InstructionStepsProps);
</script>

<template>
  <ol :class="$style.instructionSteps">
    <li
      v-for="(step, index) in props.steps"
      :key="index"
      :class="$style.instructionSteps_step"
    >
      <!-- The list already numbers its items for a screen reader. -->
      <StepNumber
        :value="index + 1"
        aria-hidden="true"
      />
      <span :class="$style.instructionSteps_text">{{ step }}</span>
    </li>
  </ol>
</template>

<style lang="scss" module>
.instructionSteps {
  display: flex;
  flex-direction: column;
  gap: $spacing-10;
  margin: 0;
  padding: 0;
  list-style: none;
}

.instructionSteps_step {
  display: flex;
  gap: $spacing-12;
  align-items: flex-start;
}

.instructionSteps_text {
  min-width: 0;
  padding-top: $spacing-first-line-nudge;
  color: $color-ink-body;
  font-size: $font-size-body;
  line-height: $line-height-snug;
}
</style>
