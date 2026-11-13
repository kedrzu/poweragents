<!-- Progress of a long task: a bar (filled to a fraction, or moving when unknown), what happens now and the time left. -->

<script lang="ts">
import { defineProp } from '@nzyme/vue-utils/defineProp.js';

export const ProgressBarProps = {
  /** Done so far, from 0 to 1; leave it unset while it is unknown and the bar moves instead. */
  value: defineProp<number>(),
  /** What is happening now; also the bar's accessible name. */
  label: { type: String, required: true },
  /** The time left or another short note, shown at the end of the label's line. */
  hint: defineProp<string>(),
} as const;
</script>

<script lang="ts" setup>
import { computed, useId } from 'vue';

const props = defineProps(ProgressBarProps);

const labelId = useId();
const hintId = useId();
const percent = computed(() => (props.value != null ? Math.round(Math.min(Math.max(props.value, 0), 1) * 100) : null));
</script>

<template>
  <div :class="$style.progressBar">
    <div
      :class="$style.progressBar_track"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="percent ?? undefined"
      :aria-labelledby="labelId"
      :aria-describedby="props.hint ? hintId : undefined"
    >
      <div
        :class="[$style.progressBar_fill, percent == null && $style.progressBar_fillIndeterminate]"
        :style="percent != null ? { width: `${percent}%` } : undefined"
      />
    </div>
    <div :class="$style.progressBar_labels">
      <span
        :id="labelId"
        :class="$style.progressBar_label"
        >{{ props.label }}</span
      >
      <span
        v-if="props.hint"
        :id="hintId"
        :class="$style.progressBar_hint"
        >{{ props.hint }}</span
      >
    </div>
  </div>
</template>

<style lang="scss" module>
.progressBar {
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
}

.progressBar_track {
  position: relative;
  height: 10px;
  overflow: hidden;
  border-radius: $radius-pill;
  background: $color-surface-soft;
}

.progressBar_fill {
  height: 100%;
  border-radius: inherit;
  background: $color-brand-1-strong;
  transition: width 400ms ease-out;

  @include reduced-motion {
    transition: none;
  }
}

.progressBar_fillIndeterminate {
  position: absolute;
  width: 40%;
  animation: progress-bar-move $duration-progress ease-in-out infinite;

  @include reduced-motion {
    animation-duration: calc(#{$duration-progress} * 3);
  }
}

.progressBar_labels {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-04 $spacing-16;
  justify-content: space-between;
  font-size: $font-size-label;
  line-height: 1.2;
}

.progressBar_label {
  min-width: 0;
  color: $color-ink;
  font-weight: $font-weight-semibold;
}

.progressBar_hint {
  color: $color-ink-muted;
}

@keyframes progress-bar-move {
  from {
    left: -40%;
  }

  to {
    left: 100%;
  }
}
</style>
