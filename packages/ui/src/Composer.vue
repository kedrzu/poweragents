<!-- Where the person writes to the agent: a rounded field lifted off the card; Enter sends. While the agent works, Stop sits in the field and a line above it says that writing on is fine. -->

<script lang="ts">
import { useTextInput } from '@nzyme/vue-forms/components/useTextInput.jsx';

export const ComposerProps = {
  ...useTextInput.props,
  /** The agent is working: Stop shows, and the hint that a message now waits for the agent's current step. */
  running: Boolean,
} as const;

export const ComposerEmits = {
  ...useTextInput.emits,
  /** The person sent the text (trimmed, never empty). The parent clears the field once it is taken. */
  send: (text: string) => typeof text === 'string',
  /** The person asked the agent to stop. Stop stays busy while an async listener runs. */
  stop: () => true,
};
</script>

<script lang="ts" setup>
import { Info, Square } from '@lucide/vue';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { useEmitAsync } from '@nzyme/vue-utils/useEmitAsync.js';
import { useId } from 'vue';

import Button from './Button.vue';
import * as l from './Composer.loc.js';

const props = defineProps(ComposerProps);
defineEmits(ComposerEmits);

const { TextInput, field } = useTextInput();
const t = useTranslate();
const emitAsync = useEmitAsync(ComposerEmits);
const hintId = useId();
/** A send in flight: Enter pressed again meanwhile does not send the text twice. */
let sending = false;

// Not `Form`: it blurs the field and makes it inert while the send runs, and a chat keeps the caret where it is.
async function send() {
  const text = field.value?.trim() ?? '';
  if (sending || props.disabled || text.length === 0) {
    return;
  }
  sending = true;
  try {
    await emitAsync('send', text);
  } finally {
    sending = false;
  }
}

function stop() {
  return emitAsync('stop');
}
</script>

<template>
  <form
    :class="$style.composer"
    novalidate
    @submit.prevent="send"
  >
    <p
      v-if="props.running"
      :id="hintId"
      :class="$style.composer_hint"
    >
      <Info
        :class="$style.composer_hintIcon"
        aria-hidden="true"
      />
      {{ t(l.runningHint) }}
    </p>
    <div :class="$style.composer_box">
      <label :class="$style.composer_field">
        <span :class="$style.composer_label">{{ props.label ?? t(l.label) }}</span>
        <TextInput
          :class="$style.composer_input"
          :aria-describedby="props.running ? hintId : undefined"
          enterkeyhint="send"
        />
      </label>
      <Button
        v-if="props.running"
        variant="secondary"
        :icon="Square"
        @click="stop"
      >
        {{ t(l.stop) }}
      </Button>
    </div>
  </form>
</template>

<style lang="scss" module>
.composer {
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
  width: 100%;
  margin: 0;
}

.composer_hint {
  display: flex;
  gap: $spacing-08;
  align-items: center;
  margin: 0;
  padding: 0 $spacing-06;
  color: $color-ink-muted;
  font-size: $font-size-control;
  line-height: $line-height-snug;
}

.composer_hintIcon {
  flex: none;
  width: 14px;
  height: 14px;
}

.composer_box {
  display: flex;
  gap: $spacing-10;
  align-items: center;
  width: 100%;
  min-height: 48px;
  padding: $spacing-04 $spacing-06 $spacing-04 calc($spacing-18 - 1px);
  border: 1px solid $color-border-strong;
  border-radius: 24px;
  background: $color-surface;
  box-shadow: $shadow-raised;

  &:focus-within {
    outline: 2px solid $color-focus;
    outline-offset: 2px;
  }
}

.composer_field {
  display: flex;
  flex: 1;
  min-width: 0;
}

.composer_label {
  @include visually-hidden;
}

.composer_input {
  flex: 1;
  min-width: 0;
  height: 38px;
  padding: 0;
  border: 0;
  background: transparent;
  color: $color-ink;
  font: inherit;
  font-size: $font-size-label;

  &::placeholder {
    color: $color-ink-muted;
    opacity: 1;
  }

  &:focus-visible {
    outline: none; // the box draws the ring (`:focus-within`)
  }

  &:disabled {
    cursor: not-allowed;
  }
}
</style>
