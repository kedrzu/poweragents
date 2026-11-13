<!-- The agent at work: a turning circle in the palette's brand colour or its parent's text colour, sized by its parent's font. Named by `label` when it is the only sign of the work. -->

<script lang="ts">
import { defineProp } from '@nzyme/vue-utils/defineProp.js';

/** The spinner's colour: the brand's (the default), or the text colour around it (`inherit`, on a button). */
export type SpinnerColor = 'brand' | 'inherit';

export const SpinnerProps = {
  /** Read by screen readers in its place; without it the spinner is decoration. */
  label: defineProp<string>(),
  color: defineProp<SpinnerColor>(),
} as const;
</script>

<script lang="ts" setup>
import { LoaderCircle } from '@lucide/vue';

const props = defineProps(SpinnerProps);
</script>

<template>
  <span :class="[$style.spinner, props.color === 'inherit' && $style.spinner_inherit]">
    <LoaderCircle
      :class="$style.spinner_icon"
      aria-hidden="true"
    />
    <span
      v-if="props.label"
      :class="$style.spinner_label"
      >{{ props.label }}</span
    >
  </span>
</template>

<style lang="scss" module>
.spinner {
  display: inline-flex;
  flex: none;
  color: $color-brand-1-strong;
}

.spinner_inherit {
  color: inherit;
}

.spinner_icon {
  width: 1em;
  height: 1em;
  animation: spinner-turn 0.9s linear infinite;

  @include reduced-motion {
    animation-duration: 2.7s;
  }
}

.spinner_label {
  @include visually-hidden;
}

@keyframes spinner-turn {
  to {
    transform: rotate(360deg);
  }
}
</style>
