<!-- Pill button with an optional icon: primary, secondary or ghost; busy while its async click handler runs. -->

<script lang="ts">
import type { LucideIcon } from '@lucide/vue';
import { useButton } from '@nzyme/vue-forms/components/useButton.js';
import { defineProp } from '@nzyme/vue-utils/defineProp.js';

/**
 * How much a button stands out: one primary action per step, secondary beside it, ghost for a way back; attention for
 * the fix on an attention tint (a banner saying what went wrong).
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'attention';

export const ButtonProps = {
  ...useButton.props,
  variant: defineProp<ButtonVariant>(),
  /** An icon from `@lucide/vue` before the label. */
  icon: defineProp<LucideIcon>(),
};
export const ButtonEmits = useButton.emits;
</script>

<script lang="ts" setup>
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';

import * as l from './Button.loc.js';
import Spinner from './Spinner.vue';

const props = defineProps(ButtonProps);
defineEmits(ButtonEmits);

const { Button, busy } = useButton();
const t = useTranslate();
</script>

<template>
  <Button
    :class="[$style.button, $style[`button_${props.variant ?? 'primary'}`]]"
    :aria-busy="busy || undefined"
  >
    <span :class="$style.button_content">
      <component
        :is="props.icon"
        v-if="props.icon"
        :class="$style.button_icon"
        aria-hidden="true"
      />
      <slot />
    </span>
    <span
      v-if="busy"
      :class="$style.button_spinner"
    >
      <Spinner
        color="inherit"
        :label="t(l.busy)"
      />
    </span>
  </Button>
</template>

<style lang="scss" module>
.button {
  --button-background: transparent;
  --button-border: transparent;
  --button-text: #{$color-ink};

  position: relative;
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: calc($spacing-08 - 1px) calc($spacing-16 - 1px);
  border: 1px solid var(--button-border);
  border-radius: $radius-pill;
  background: var(--button-background);
  color: var(--button-text);
  font: inherit;
  font-size: $font-size-control;
  font-weight: $font-weight-semibold;
  line-height: 1.2;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color $duration-fast;

  @include focus-ring;

  &:disabled {
    --button-background: #{$color-border};
    --button-border: #{$color-border};
    --button-text: #{$color-ink-muted};

    cursor: default;
  }

  &[aria-busy='true'] {
    cursor: progress;
  }
}

.button_primary {
  --button-background: #{$color-ink};
  --button-border: #{$color-ink};
  --button-text: #{$color-on-ink};

  &:not(:disabled) {
    @include hover {
      --button-background: #{$color-ink-body};
      --button-border: #{$color-ink-body};
    }
  }
}

.button_secondary {
  --button-background: #{$color-surface};
  --button-border: #{$color-border-strong};

  &:not(:disabled) {
    @include hover {
      --button-background: #{$color-surface-soft};
    }
  }
}

.button_ghost {
  --button-text: #{$color-ink-muted};

  &:not(:disabled) {
    @include hover {
      --button-background: #{$color-surface-soft};
    }
  }
}

.button_attention {
  --button-background: #{$color-surface};
  --button-border: #{$color-attention-border};
  --button-text: #{$color-attention-ink};

  &:not(:disabled) {
    @include hover {
      --button-background: #{$color-attention-soft};
    }
  }
}

.button_content {
  display: inline-flex;
  gap: $spacing-icon-gap;
  align-items: center;

  [aria-busy='true'] > & {
    opacity: 0;
  }
}

.button_icon {
  flex: none;
  width: 14px;
  height: 14px;
}

.button_spinner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
</style>
