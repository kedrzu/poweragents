<!-- First run, step 2: the daemon could not tell Claude's status; its error with a retry (screen 36's failure, for step 2). -->

<script lang="ts" setup>
import { RefreshCw } from '@lucide/vue';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { useService } from '@nzyme/vue-ioc/useService.js';
import { useRouter } from 'nuxt/app';

import Button from '@poweragents/ui/Button.vue';
import ErrorDetails from '@poweragents/ui/ErrorDetails.vue';

import * as l from './AiCheckFailedPage.loc.js';
import { SetupStore } from './SetupStore.js';
import SetupShell from './SetupShell.vue';

const setup = useService(SetupStore);
const router = useRouter();
const t = useTranslate();

async function retry() {
  // The guard asks again and goes on from where the first run stands, or stays here with the new error.
  await router.replace({ name: 'home' });
}
</script>

<template>
  <SetupShell
    step="aiFailed"
    :title="t(l.title)"
    :body="t(l.body)"
  >
    <ErrorDetails :details="setup.state.claudeError ?? ''">
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
</template>
