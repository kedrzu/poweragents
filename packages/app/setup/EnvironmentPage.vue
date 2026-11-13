<!-- First run, step 1: the agent's sandbox starting (screen 44), or its failure with a retry (screen 36). -->

<script lang="ts" setup>
import { RefreshCw } from '@lucide/vue';
import { assertNever } from '@nzyme/utils/assertNever.js';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { useService } from '@nzyme/vue-ioc/useService.js';
import { useRouter } from 'nuxt/app';
import { computed, watch } from 'vue';

import Button from '@poweragents/ui/Button.vue';
import ErrorDetails from '@poweragents/ui/ErrorDetails.vue';
import ProgressBar from '@poweragents/ui/ProgressBar.vue';

import * as l from './EnvironmentPage.loc.js';
import { SetupStore } from './SetupStore.js';
import SetupShell from './SetupShell.vue';

const setup = useService(SetupStore);
const router = useRouter();
const t = useTranslate();

const sandbox = computed(() => setup.state.sandbox);
const failure = computed(() => (sandbox.value?.status === 'failed' ? sandbox.value.message : null));
/** What the sandbox does now; the bar moves without a fraction, since no phase reports how far it is. */
const phaseLabel = computed(() => {
  const status = sandbox.value?.status;
  switch (status) {
    case 'startingVm':
      return t(l.startingVm);
    case 'buildingImage':
      return t(l.buildingImage);
    case 'startingAgent':
      return t(l.startingAgent);
    // Ready while the first run's next step is being found out.
    case 'ready':
      return t(l.almostReady);
    // Not reached yet, or between two starts.
    case undefined:
    case 'stopped':
    case 'stopping':
    case 'failed':
      return t(l.starting);
    default:
      return assertNever(status);
  }
});

watch(
  () => sandbox.value?.status,
  status => {
    switch (status) {
      case 'ready':
        // The guard decides where the first run continues.
        void router.replace({ name: 'home' });
        break;
      case 'stopped':
        void setup.startSandbox();
        break;
    }
  },
  { immediate: true },
);

async function retry() {
  await setup.startSandbox();
}
</script>

<template>
  <SetupShell
    v-if="failure != null"
    step="environmentFailed"
    :title="t(l.failedTitle)"
    :body="t(l.failedBody)"
  >
    <ErrorDetails :details="failure">
      <template #actions>
        <Button
          :icon="RefreshCw"
          @click="retry"
        >
          {{ t(l.retry) }}
        </Button>
      </template>
    </ErrorDetails>
  </SetupShell>
  <SetupShell
    v-else
    step="environment"
    :title="t(l.preparingTitle)"
    :body="t(l.preparingBody)"
  >
    <ProgressBar :label="phaseLabel" />
    <p :class="$style.environmentPage_hint">
      {{ t(l.preparingHint) }}
    </p>
  </SetupShell>
</template>

<style lang="scss" module>
.environmentPage_hint {
  margin: 0;
  color: $color-ink-muted;
  font-size: $font-size-body-s;
  line-height: $line-height-normal;
}
</style>
