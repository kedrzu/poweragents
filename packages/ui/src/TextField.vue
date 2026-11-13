<!-- A labelled one-line text field with an optional help line under it; an error takes the help line's place. -->

<script lang="ts">
import { useTextInput } from '@nzyme/vue-forms/components/useTextInput.jsx';
import { defineProp } from '@nzyme/vue-utils/defineProp.js';

export const TextFieldProps = {
  ...useTextInput.props,
  /** The visible label, also the input's accessible name. */
  label: { type: String, required: true },
  /** A line under the field; an error takes its place. */
  help: defineProp<string>(),
} as const;
export const TextFieldEmits = useTextInput.emits;
</script>

<script lang="ts" setup>
import { CircleAlert } from '@lucide/vue';
import { computed, useId } from 'vue';

const props = defineProps(TextFieldProps);
defineEmits(TextFieldEmits);

const { TextInput, field } = useTextInput();
const inputId = useId();
const noteId = useId();
const error = computed(() => field.errors[0]);
</script>

<template>
  <div :class="[$style.textField, error && $style.textField_invalid]">
    <label
      :for="inputId"
      :class="$style.textField_label"
      >{{ props.label }}</label
    >
    <TextInput
      :id="inputId"
      :class="$style.textField_input"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="error || props.help ? noteId : undefined"
    />
    <p
      v-if="error"
      :id="noteId"
      :class="[$style.textField_note, $style.textField_error]"
      role="alert"
    >
      <CircleAlert
        :class="$style.textField_noteIcon"
        aria-hidden="true"
      />
      <span>{{ error }}</span>
    </p>
    <p
      v-else-if="props.help"
      :id="noteId"
      :class="$style.textField_note"
    >
      {{ props.help }}
    </p>
  </div>
</template>

<style lang="scss" module>
.textField {
  display: flex;
  flex-direction: column;
  gap: $spacing-08;
}

.textField_label {
  color: $color-ink;
  font-size: $font-size-control;
  font-weight: $font-weight-semibold;
  line-height: 1.2;
}

.textField_input {
  width: 100%;
  height: 48px;
  padding: 0 calc($spacing-14 - 1px);
  border: 1px solid $color-border-strong;
  border-radius: $radius-m;
  background: $color-surface;
  color: $color-ink;
  font: inherit;
  font-size: $font-size-body;

  &::placeholder {
    color: $color-ink-muted;
    opacity: 1;
  }

  &:disabled {
    background: $color-surface-soft;
    color: $color-ink-muted;
  }

  .textField_invalid & {
    border-color: $color-attention;
  }
}

.textField_note {
  display: flex;
  gap: $spacing-icon-gap;
  margin: 0;
  color: $color-ink-muted;
  font-size: $font-size-caption;
  line-height: $line-height-normal;
}

.textField_error {
  color: $color-attention-ink;
}

.textField_noteIcon {
  flex: none;
  width: 14px;
  height: 14px;
  margin-top: $spacing-02;
}
</style>
