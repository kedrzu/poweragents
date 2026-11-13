<!-- The agent's reply beside its mark: while it works, its text and steps in the order they come, with a caret; once done, the steps collapsed to their count above the text. -->

<script lang="ts">
import type { PropType } from 'vue';

import type { ConversationAgentPart } from '@poweragents/common/api/ConversationTypes.js';

export const AgentMessageProps = {
  /** The reply's text and steps, in the order the agent produced them. */
  parts: { type: Array as PropType<readonly ConversationAgentPart[]>, required: true },
  /** The agent is still writing this reply. */
  running: Boolean,
} as const;
</script>

<script lang="ts" setup>
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { computed } from 'vue';

import type { ConversationStepPart } from '@poweragents/common/api/ConversationTypes.js';

import * as l from './AgentMessage.loc.js';
import AgentMark from './AgentMark.vue';
import RichText from './RichText.vue';
import Step from './Step.vue';
import StepList from './StepList.vue';
import StepsSummary from './StepsSummary.vue';

/** A run of the reply: text, or the steps taken one after another. */
type Segment = { type: 'text'; text: string } | { type: 'steps'; steps: ConversationStepPart[] };

const props = defineProps(AgentMessageProps);

const t = useTranslate();
const segments = computed(() => toSegments(props.parts));
const steps = computed(() => props.parts.filter(part => part.type === 'step'));
const text = computed(() =>
  props.parts
    .filter(part => part.type === 'text')
    .map(part => part.text)
    .join('\n\n'),
);

function toSegments(parts: readonly ConversationAgentPart[]) {
  const result: Segment[] = [];
  for (const part of parts) {
    const last = result.at(-1);
    if (part.type === 'step' && last?.type === 'steps') {
      last.steps.push(part);
    } else if (part.type === 'step') {
      result.push({ type: 'steps', steps: [part] });
    } else if (last?.type === 'text') {
      last.text += part.text;
    } else {
      result.push({ type: 'text', text: part.text });
    }
  }
  return result;
}
</script>

<template>
  <div :class="$style.agentMessage">
    <AgentMark :class="$style.agentMessage_mark" />
    <div :class="$style.agentMessage_body">
      <span :class="$style.agentMessage_author">{{ t(l.author) }}</span>
      <template v-if="props.running">
        <template
          v-for="(segment, index) in segments"
          :key="index"
        >
          <RichText
            v-if="segment.type === 'text'"
            :markdown="segment.text"
            :caret="index === segments.length - 1"
          />
          <StepList v-else>
            <Step
              v-for="step in segment.steps"
              :key="step.id"
              :kind="step.kind"
              :target="step.target"
              :status="step.status"
            />
          </StepList>
        </template>
        <RichText
          v-if="segments.length === 0"
          markdown=""
          caret
        />
      </template>
      <template v-else>
        <StepsSummary
          v-if="steps.length"
          :count="steps.length"
        >
          <Step
            v-for="step in steps"
            :key="step.id"
            :kind="step.kind"
            :target="step.target"
            :status="step.status"
          />
        </StepsSummary>
        <RichText
          v-if="text"
          :markdown="text"
        />
      </template>
    </div>
  </div>
</template>

<style lang="scss" module>
.agentMessage {
  display: flex;
  gap: $spacing-14;
  align-items: flex-start;
}

.agentMessage_mark {
  margin-top: -$spacing-02;
}

.agentMessage_body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: $spacing-16;
  min-width: 0;
  padding-top: $spacing-02;
}

.agentMessage_author {
  @include visually-hidden;
}
</style>
