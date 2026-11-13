<!-- One thing the agent did, as a sentence (a list item of `StepList`): ticked when done, spinning while current, crossed when it failed. -->

<script lang="ts">
import { defineProp } from '@nzyme/vue-utils/defineProp.js';
import type { PropType } from 'vue';

import type { ConversationStepKind, ConversationStepStatus } from '@poweragents/common/api/ConversationTypes.js';

export const StepProps = {
  kind: { type: String as PropType<ConversationStepKind>, required: true },
  /** What the step worked on: a file's path, a search phrase, a page's address. */
  target: defineProp<string>(),
  status: { type: String as PropType<ConversationStepStatus>, required: true },
} as const;
</script>

<script lang="ts" setup>
import { Check, CircleX } from '@lucide/vue';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { assertNever } from '@nzyme/utils/assertNever.js';
import { computed } from 'vue';

import Spinner from './Spinner.vue';
import * as l from './Step.loc.js';

const props = defineProps(StepProps);

const t = useTranslate();
const sentence = computed(() => describeStep());

function describeStep() {
  const target = props.target?.trim() || undefined;
  switch (props.kind) {
    case 'readFile':
      return target ? t(l.readFile, { target }) : t(l.readFileAny);
    case 'writeFile':
      return target ? t(l.writeFile, { target }) : t(l.writeFileAny);
    case 'editFile':
      return target ? t(l.editFile, { target }) : t(l.editFileAny);
    case 'listFiles':
      return target ? t(l.listFiles, { target }) : t(l.listFilesAny);
    case 'searchFiles':
      return target ? t(l.searchFiles, { target }) : t(l.searchFilesAny);
    case 'runCommand':
      // A command line means nothing to most people; the sentence alone says what happens.
      return t(l.runCommand);
    case 'fetchWeb':
      return target ? t(l.fetchWeb, { target: toHost(target) }) : t(l.fetchWebAny);
    case 'searchWeb':
      return target ? t(l.searchWeb, { target }) : t(l.searchWebAny);
    case 'other':
      return t(l.other);
    default:
      return assertNever(props.kind);
  }
}

/** A page by its site's name: the full address is long and says little more. */
function toHost(url: string) {
  try {
    return new URL(url).host || url;
  } catch {
    return url;
  }
}
</script>

<template>
  <li :class="[$style.step, $style[`step_${props.status}`]]">
    <Spinner
      v-if="props.status === 'running'"
      :class="$style.step_icon"
    />
    <CircleX
      v-else-if="props.status === 'failed'"
      :class="$style.step_icon"
      aria-hidden="true"
    />
    <Check
      v-else
      :class="$style.step_icon"
      aria-hidden="true"
    />
    <span :class="$style.step_label">
      {{ sentence }}
      <span
        v-if="props.status !== 'done'"
        :class="$style.step_status"
        >({{ props.status === 'running' ? t(l.running) : t(l.failed) }})</span
      >
    </span>
  </li>
</template>

<style lang="scss" module>
.step {
  display: flex;
  gap: $spacing-10;
  align-items: flex-start;
  color: $color-ink-muted;
  font-size: $font-size-small;
  line-height: $line-height-snug;
}

.step_icon {
  flex: none;
  width: 14px;
  height: 14px;
  margin-top: 0.15em;
  font-size: $font-size-body-s; // the spinner's size: 14px
  color: $color-ink-faint;
}

.step_running {
  color: $color-ink;
  font-weight: $font-weight-semibold;

  .step_icon {
    color: $color-brand-1-strong;
  }
}

.step_failed .step_icon {
  color: $color-attention;
}

.step_label {
  min-width: 0;
  overflow-wrap: anywhere;
}

.step_status {
  @include visually-hidden;
}
</style>
