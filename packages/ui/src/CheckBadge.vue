<!-- A check in a brand-coloured circle: something done or connected; decorative unless given a label to announce. -->

<script lang="ts">
import { defineProp } from '@nzyme/vue-utils/defineProp.js';

export const CheckBadgeProps = {
  /** What the check means ("Connected"), announced to screen readers; without it the badge is decorative. */
  label: defineProp<string>(),
} as const;
</script>

<script lang="ts" setup>
import { Check } from '@lucide/vue';

const props = defineProps(CheckBadgeProps);
</script>

<template>
  <span
    :class="$style.checkBadge"
    :aria-hidden="props.label ? undefined : 'true'"
  >
    <Check
      :class="$style.checkBadge_icon"
      aria-hidden="true"
    />
    <span
      v-if="props.label"
      :class="$style.checkBadge_label"
      >{{ props.label }}</span
    >
  </span>
</template>

<style lang="scss" module>
.checkBadge {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: $color-brand-1-strong;
  color: $color-on-ink;
}

.checkBadge_icon {
  width: 13px;
  height: 13px;
}

.checkBadge_label {
  @include visually-hidden;
}
</style>
