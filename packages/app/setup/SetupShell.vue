<!-- The first run's split wizard: the story panel with the path, marked for the current step, beside the step's pane. -->

<script lang="ts">
import { defineProp } from '@nzyme/vue-utils/defineProp.js';
import type { PropType } from 'vue';

/** The first run's step a screen belongs to; the path, the eyebrow and the headline follow from it. */
export type SetupStep = 'environment' | 'environmentFailed' | 'ai' | 'aiFailed' | 'done';

export const SetupShellProps = {
  step: { type: String as PropType<SetupStep>, required: true },
  title: { type: String, required: true },
  body: defineProp<string>(),
} as const;
</script>

<script lang="ts" setup>
import { assertNever } from '@nzyme/utils/assertNever.js';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { computed } from 'vue';

import PathStage from '@poweragents/ui/PathStage.vue';
import type { PathStageStatus } from '@poweragents/ui/PathStage.vue';
import SplitWizardShell from '@poweragents/ui/SplitWizardShell.vue';

import * as l from './SetupShell.loc.js';

const props = defineProps(SetupShellProps);
const slots = defineSlots<{
  /** What the step shows under its body. */
  default?(): unknown;
  /** A way back, at the start of the actions' row. */
  back?(): unknown;
  /** The step's buttons, the primary one last. */
  actions?(): unknown;
}>();

const t = useTranslate();

const view = computed(() => {
  switch (props.step) {
    case 'environment':
      return path(['current', 'waiting', 'waiting'], t(l.stepOne));
    case 'environmentFailed':
      return path(['failed', 'waiting', 'waiting'], t(l.stepOne));
    case 'ai':
      return path(['done', 'current', 'waiting'], t(l.stepTwo));
    case 'aiFailed':
      return path(['done', 'failed', 'waiting'], t(l.stepTwo));
    case 'done':
      return path(['done', 'done', 'current'], t(l.ready));
    default:
      return assertNever(props.step);
  }
});

function path(stages: [PathStageStatus, PathStageStatus, PathStageStatus], eyebrow: string) {
  return { stages, eyebrow };
}
</script>

<template>
  <SplitWizardShell
    :headline="props.step === 'done' ? t(l.headlineDone) : t(l.headline)"
    :footnote="t(l.footnote)"
    :eyebrow="view.eyebrow"
    :title="props.title"
    :body="props.body"
  >
    <template #path>
      <PathStage
        :number="1"
        :title="t(l.environmentStage)"
        :hint="props.step === 'environmentFailed' ? t(l.stageFailedHint) : t(l.environmentStageHint)"
        :status="view.stages[0]"
      />
      <PathStage
        :number="2"
        :title="t(l.aiStage)"
        :hint="props.step === 'aiFailed' ? t(l.stageFailedHint) : t(l.aiStageHint)"
        :status="view.stages[1]"
      />
      <PathStage
        :number="3"
        :title="t(l.conversationStage)"
        :hint="t(l.conversationStageHint)"
        :status="view.stages[2]"
      />
    </template>
    <slot />
    <template
      v-if="slots.back"
      #back
    >
      <slot name="back" />
    </template>
    <template
      v-if="slots.actions"
      #actions
    >
      <slot name="actions" />
    </template>
  </SplitWizardShell>
</template>
