<!-- Field for a long one-time code copied from another page, with a Paste button that reads the clipboard. -->

<script lang="ts">
import { useTextInput } from '@nzyme/vue-forms/components/useTextInput.jsx';
import { defineProp } from '@nzyme/vue-utils/defineProp.js';

export const CodeFieldProps = {
  ...useTextInput.props,
  /** The visible label, also the input's accessible name. */
  label: { type: String, required: true },
  /** A line under the field saying what the code looks like; an error takes its place. */
  help: defineProp<string>(),
  /** The Paste button's text; "Paste" in the app's language when unset. */
  pasteLabel: defineProp<string>(),
} as const;
export const CodeFieldEmits = useTextInput.emits;
</script>

<script lang="ts" setup>
import { CircleAlert, ClipboardPaste, KeyRound } from '@lucide/vue';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { computed, useId } from 'vue';

import Button from './Button.vue';
import * as l from './CodeField.loc.js';

const props = defineProps(CodeFieldProps);
defineEmits(CodeFieldEmits);

const { TextInput, field, input } = useTextInput();
const t = useTranslate();
const inputId = useId();
const noteId = useId();
const error = computed(() => field.errors[0]);

async function paste() {
  try {
    const text = await navigator.clipboard.readText();
    field.value = text.trim();
  } catch {
    // The clipboard refused (no permission, nothing to read as text): the focused input below
    // still takes a paste from the keyboard or the context menu, which is all this button offers.
  }

  input.value?.focus();
}
</script>

<template>
  <div :class="[$style.codeField, error && $style.codeField_invalid]">
    <label
      :for="inputId"
      :class="$style.codeField_label"
      >{{ props.label }}</label
    >
    <div :class="$style.codeField_box">
      <KeyRound
        :class="$style.codeField_key"
        aria-hidden="true"
      />
      <TextInput
        :id="inputId"
        :class="$style.codeField_input"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="error || props.help ? noteId : undefined"
        autocapitalize="off"
        spellcheck="false"
      />
      <Button
        variant="ghost"
        :icon="ClipboardPaste"
        :disabled="props.disabled || props.readonly"
        @click="paste"
      >
        {{ props.pasteLabel ?? t(l.paste) }}
      </Button>
    </div>
    <p
      v-if="error"
      :id="noteId"
      :class="[$style.codeField_note, $style.codeField_error]"
      role="alert"
    >
      <CircleAlert
        :class="$style.codeField_noteIcon"
        aria-hidden="true"
      />
      <span>{{ error }}</span>
    </p>
    <p
      v-else-if="props.help"
      :id="noteId"
      :class="$style.codeField_note"
    >
      {{ props.help }}
    </p>
  </div>
</template>

<style lang="scss" module>
.codeField {
  display: flex;
  flex-direction: column;
  gap: $spacing-08;
}

.codeField_label {
  color: $color-ink;
  font-size: $font-size-control;
  font-weight: $font-weight-semibold;
  line-height: 1.2;
}

.codeField_box {
  display: flex;
  gap: $spacing-10;
  align-items: center;
  min-height: 48px;
  padding: 0 calc($spacing-06 - 1px) 0 calc($spacing-14 - 1px);
  border: 1px solid $color-border-strong;
  border-radius: $radius-m;
  background: $color-surface;

  &:focus-within {
    outline: 2px solid $color-focus;
    outline-offset: 2px;
  }

  .codeField_invalid & {
    border-color: $color-attention;
  }
}

.codeField_key {
  flex: none;
  width: 16px;
  height: 16px;
  color: $color-ink-muted;

  .codeField_invalid & {
    color: $color-attention-ink;
  }
}

.codeField_input {
  flex: 1;
  min-width: 0;
  height: 46px;
  padding: 0;
  border: 0;
  background: transparent;
  color: $color-ink;
  font-family: $font-family-mono;
  font-size: $font-size-body;
  text-overflow: ellipsis;

  &::placeholder {
    color: $color-ink-muted;
    font-family: $font-family-body;
    opacity: 1;
  }

  &:focus-visible {
    outline: none; // the box draws the ring (`:focus-within`)
  }
}

.codeField_note {
  display: flex;
  gap: $spacing-icon-gap;
  margin: 0;
  color: $color-ink-muted;
  font-size: $font-size-caption;
  line-height: $line-height-normal;
}

.codeField_error {
  color: $color-attention-ink;
}

.codeField_noteIcon {
  flex: none;
  width: 14px;
  height: 14px;
  margin-top: $spacing-02;
}
</style>
