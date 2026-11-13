<!-- Full-window wizard: a dark story panel (brand, headline, the path's stages, footnote) beside the white pane of the current step. -->

<script lang="ts">
import { defineProp } from '@nzyme/vue-utils/defineProp.js';

export const SplitWizardShellProps = {
  /** The story panel's large sentence about where the whole setup is. */
  headline: { type: String, required: true },
  /** A reassurance at the foot of the story panel. */
  footnote: { type: String, required: true },
  /** The small line above the step's title ("Step 1 of 2"). */
  eyebrow: { type: String, required: true },
  /** The step's title, the page's heading. */
  title: { type: String, required: true },
  /** The paragraph under the title. */
  body: defineProp<string>(),
} as const;
</script>

<script lang="ts" setup>
import { ShieldCheck } from '@lucide/vue';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';

import AgentMark from './AgentMark.vue';
import * as l from './SplitWizardShell.loc.js';

const props = defineProps(SplitWizardShellProps);
const slots = defineSlots<{
  /** The path's stages, `PathStage` each, in order. */
  path(): unknown;
  /** What the step shows under its body: progress, instructions, a field, details. */
  default?(): unknown;
  /** A way back, at the start of the actions' row. */
  back?(): unknown;
  /** The step's buttons, at the end of the actions' row, the primary one last. */
  actions?(): unknown;
}>();

const t = useTranslate();
</script>

<template>
  <div :class="$style.splitWizardShell">
    <aside :class="$style.splitWizardShell_story">
      <div :class="$style.splitWizardShell_top">
        <div :class="$style.splitWizardShell_brand">
          <AgentMark />
          <span :class="$style.splitWizardShell_brandName">{{ t(l.brand) }}</span>
        </div>
        <p :class="$style.splitWizardShell_headline">
          {{ props.headline }}
        </p>
        <ol :class="$style.splitWizardShell_path">
          <slot name="path" />
        </ol>
      </div>
      <p :class="$style.splitWizardShell_footnote">
        <ShieldCheck
          :class="$style.splitWizardShell_footnoteIcon"
          aria-hidden="true"
        />
        <span>{{ props.footnote }}</span>
      </p>
    </aside>
    <main :class="$style.splitWizardShell_step">
      <div :class="$style.splitWizardShell_stepContent">
        <p :class="$style.splitWizardShell_eyebrow">
          {{ props.eyebrow }}
        </p>
        <h1 :class="$style.splitWizardShell_title">
          {{ props.title }}
        </h1>
        <p
          v-if="props.body"
          :class="$style.splitWizardShell_body"
        >
          {{ props.body }}
        </p>
        <slot />
        <div
          v-if="slots.back || slots.actions"
          :class="$style.splitWizardShell_actions"
        >
          <slot name="back" />
          <div :class="$style.splitWizardShell_actionsEnd">
            <slot name="actions" />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style lang="scss" module>
$story-width: 540px;
$window-bar-height: 48px; // where the window's own buttons sit, over the story panel

.splitWizardShell {
  display: flex;
  min-height: 100vh;
  background: $color-surface;

  @media (width < 720px) {
    flex-direction: column;
  }
}

.splitWizardShell_story {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: $spacing-48;
  width: clamp(340px, 37.5vw, $story-width);
  padding: $window-bar-height $spacing-56 $spacing-48;
  background: $color-ink;
  color: $color-on-ink;

  @media (width < 720px) {
    width: auto;
    padding-inline: $spacing-24;
  }
}

.splitWizardShell_top {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: $spacing-56;
  padding-top: $spacing-48;
}

.splitWizardShell_brand {
  display: flex;
  gap: $spacing-10;
  align-items: center;
}

.splitWizardShell_brandName {
  @include font-heading;
  font-size: $font-size-brand;
  font-weight: $font-weight-bold;
  line-height: 1.2;
}

.splitWizardShell_headline {
  margin: 0;
  @include font-heading;
  font-size: $font-size-display;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
  text-wrap: pretty;
}

.splitWizardShell_path {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

.splitWizardShell_footnote {
  display: flex;
  gap: $spacing-10;
  margin: 0;
  color: $color-on-ink-strong;
  font-size: $font-size-small;
  line-height: $line-height-normal;
}

.splitWizardShell_footnoteIcon {
  flex: none;
  width: 16px;
  height: 16px;
  margin-top: $spacing-first-line-nudge;
}

.splitWizardShell_step {
  display: flex;
  flex: 1;
  align-items: center;
  min-width: 0;
  padding: $spacing-48 clamp(#{$spacing-24}, 8.4vw, #{$spacing-120});
}

.splitWizardShell_stepContent {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: $spacing-28;
  max-width: 660px;
}

.splitWizardShell_eyebrow {
  margin: 0;
  color: $color-brand-1-strong;
  font-size: $font-size-control;
  font-weight: $font-weight-bold;
  line-height: 1.2;
  letter-spacing: $letter-spacing-eyebrow;
  text-transform: uppercase;
}

.splitWizardShell_title {
  margin: 0;
  color: $color-ink;
  @include font-heading;
  font-size: $font-size-title;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
  text-wrap: balance;
}

.splitWizardShell_body {
  margin: 0;
  color: $color-ink-body;
  font-size: $font-size-lead;
  line-height: $line-height-relaxed;
}

.splitWizardShell_actions {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-10;
  align-items: center;
  justify-content: space-between;
}

.splitWizardShell_actionsEnd {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-10;
  align-items: center;
  margin-left: auto;
}
</style>
