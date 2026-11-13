<!-- A modal dialog over a frosted scrim: a title and the dialog's content; keeps focus inside, closes on Escape and returns focus to what opened it. -->

<script lang="ts">
export const DialogProps = {
  /** The dialog's heading, also its accessible name. */
  title: { type: String, required: true },
} as const;
</script>

<script lang="ts" setup>
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui';

const props = defineProps(DialogProps);
/** Whether the dialog shows; Escape sets it to `false`. */
const open = defineModel<boolean>('open', { default: false });
defineSlots<{
  /** The dialog's content under its title, with a `DialogDescription` saying what the dialog is about. */
  default(): unknown;
}>();
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay :class="$style.dialog_scrim" />
      <DialogContent :class="$style.dialog">
        <DialogTitle :class="$style.dialog_title">
          {{ props.title }}
        </DialogTitle>
        <slot />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style lang="scss" module>
$dialog-width: 440px;

.dialog_scrim {
  position: fixed;
  inset: 0;
  background: $color-scrim;
  backdrop-filter: blur($blur-scrim);
}

.dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  gap: $spacing-22;
  width: min($dialog-width, calc(100vw - #{2 * $spacing-24}));
  max-height: calc(100vh - #{2 * $spacing-24});
  padding: calc($spacing-28 - 1px);
  overflow-y: auto;
  border: 1px solid $color-border;
  border-radius: $radius-l;
  background: $color-surface;
  box-shadow: $shadow-dialog;
  transform: translate(-50%, -50%);

  &:focus-visible {
    outline: none; // focus moves to the first field or button inside at once
  }
}

.dialog_title {
  margin: 0;
  color: $color-ink;
  @include font-heading;
  font-size: $font-size-dialog-title;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
}
</style>
