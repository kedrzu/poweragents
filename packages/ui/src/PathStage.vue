<!-- One stage of the setup path on the wizard's dark story panel: waiting, current, done or failed. -->

<script lang="ts">
import type { PropType } from 'vue';

/** Where a stage of the setup path is. */
export type PathStageStatus = 'waiting' | 'current' | 'done' | 'failed';

export const PathStageProps = {
  /** The stage's place on the path, counted from 1. */
  number: { type: Number, required: true },
  title: { type: String, required: true },
  hint: { type: String, required: true },
  status: { type: String as PropType<PathStageStatus>, default: 'waiting' },
} as const;
</script>

<script lang="ts" setup>
import { Check, X } from '@lucide/vue';
import { assertNever } from '@nzyme/utils/assertNever.js';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { computed } from 'vue';

import * as l from './PathStage.loc.js';

const props = defineProps(PathStageProps);

const t = useTranslate();
const statusText = computed(() => {
  switch (props.status) {
    case 'done':
      return t(l.done);
    case 'failed':
      return t(l.failed);
    // `aria-current` announces the current stage; a waiting one needs no word.
    case 'current':
    case 'waiting':
      return null;
    default:
      return assertNever(props.status);
  }
});
</script>

<template>
  <!-- `SplitWizardShell` puts the stages in an `<ol>`. -->
  <li
    :class="[$style.pathStage, $style[`pathStage_${props.status}`]]"
    :aria-current="props.status === 'current' ? 'step' : undefined"
  >
    <span
      :class="$style.pathStage_rail"
      aria-hidden="true"
    >
      <span :class="$style.pathStage_dot">
        <Check
          v-if="props.status === 'done'"
          :class="$style.pathStage_icon"
        />
        <X
          v-else-if="props.status === 'failed'"
          :class="$style.pathStage_icon"
        />
        <template v-else>{{ props.number }}</template>
      </span>
      <span :class="$style.pathStage_line" />
    </span>
    <span :class="$style.pathStage_text">
      <span :class="$style.pathStage_title">{{ props.title }}</span>
      <span
        v-if="statusText"
        :class="$style.pathStage_status"
        >{{ statusText }}</span
      >
      <span :class="$style.pathStage_hint">{{ props.hint }}</span>
    </span>
  </li>
</template>

<style lang="scss" module>
.pathStage {
  --path-stage-dot: #{$color-on-ink-tint};
  --path-stage-number: #{$color-on-ink-number};
  --path-stage-line: #{$color-on-ink-line};
  --path-stage-title: #{$color-on-ink-dim};
  --path-stage-hint: #{$color-on-ink-faint};

  display: flex;
  gap: $spacing-16;
}

.pathStage_current {
  --path-stage-dot: #{$color-brand-1-strong};
  --path-stage-number: #{$color-on-ink};
  --path-stage-title: #{$color-on-ink};
  --path-stage-hint: #{$color-on-ink-strong};
}

.pathStage_done {
  --path-stage-dot: #{$color-brand-1-strong};
  --path-stage-line: #{$color-brand-1};
  --path-stage-title: #{$color-on-ink};
}

.pathStage_failed {
  --path-stage-dot: #{$color-attention};
  --path-stage-title: #{$color-on-ink};
  --path-stage-hint: #{$color-on-ink-strong};
}

.pathStage_rail {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: $spacing-06;
  align-items: center;
}

.pathStage_dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--path-stage-dot);
  color: var(--path-stage-number);
  font-size: $font-size-control;
  font-weight: $font-weight-bold;
  line-height: 1;

  .pathStage_current & {
    box-shadow: 0 0 0 1px $color-on-ink;
  }
}

.pathStage_icon {
  width: 14px;
  height: 14px;
  color: $color-on-ink;
}

.pathStage_line {
  width: 2px;
  flex: 1;
  min-height: 40px;
  background: var(--path-stage-line);

  .pathStage:last-child & {
    visibility: hidden;
  }
}

.pathStage_text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: $spacing-04;
  min-width: 0;
  padding: $spacing-path-stage-text-top 0 $spacing-28;
}

.pathStage_title {
  color: var(--path-stage-title);
  font-size: $font-size-body-l;
  font-weight: $font-weight-semibold;
  line-height: 1.25;
}

.pathStage_status {
  @include visually-hidden;
}

.pathStage_hint {
  color: var(--path-stage-hint);
  font-size: $font-size-body-s;
  line-height: $line-height-snug;
}
</style>
