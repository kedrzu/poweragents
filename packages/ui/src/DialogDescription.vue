<!-- The quiet line of a Dialog saying what it is about, with an optional icon; the dialog's accessible description. -->

<script lang="ts">
import type { LucideIcon } from '@lucide/vue';
import { defineProp } from '@nzyme/vue-utils/defineProp.js';

export const DialogDescriptionProps = {
  /** An icon from `@lucide/vue` before the text. */
  icon: defineProp<LucideIcon>(),
} as const;
</script>

<script lang="ts" setup>
import { DialogDescription } from 'reka-ui';

const props = defineProps(DialogDescriptionProps);
defineSlots<{
  /** The text. */
  default(): unknown;
}>();
</script>

<template>
  <DialogDescription :class="$style.dialogDescription">
    <component
      :is="props.icon"
      v-if="props.icon"
      :class="$style.dialogDescription_icon"
      aria-hidden="true"
    />
    <span><slot /></span>
  </DialogDescription>
</template>

<style lang="scss" module>
.dialogDescription {
  display: flex;
  gap: $spacing-icon-gap;
  margin: 0;
  color: $color-ink-muted;
  font-size: $font-size-caption;
  line-height: $line-height-normal;
}

.dialogDescription_icon {
  flex: none;
  width: 14px;
  height: 14px;
  margin-top: $spacing-02;
}
</style>
