<!-- First run, step 2: choosing the AI account to connect (screen 45); Claude opens its sign-in page, ChatGPT comes later. -->

<script lang="ts" setup>
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { useService } from '@nzyme/vue-ioc/useService.js';
import { useRouter } from 'nuxt/app';
import { ref } from 'vue';

import ProviderCard from '@poweragents/ui/ProviderCard.vue';

import { openExternalUrl } from '@/utils/openExternalUrl.js';

import * as l from './ConnectAiPage.loc.js';
import { SetupStore } from './SetupStore.js';
import SetupShell from './SetupShell.vue';

const setup = useService(SetupStore);
const router = useRouter();
const t = useTranslate();

const failed = ref(false);

async function connectClaude() {
  failed.value = false;
  try {
    await openExternalUrl(await setup.startLogin());
  } catch {
    failed.value = true;
    return;
  }
  await router.push({ name: 'setupClaude' });
}
</script>

<template>
  <SetupShell
    step="ai"
    :title="t(l.title)"
    :body="t(l.body)"
  >
    <div :class="$style.connectAiPage_providers">
      <ProviderCard
        provider="claude"
        :name="t(l.claude)"
        :plans="t(l.claudePlans)"
        :connect-label="t(l.connectClaude)"
        @connect="connectClaude"
      />
      <ProviderCard
        provider="chatgpt"
        :name="t(l.chatgpt)"
        :plans="t(l.chatgptPlans)"
        :connect-label="t(l.connectChatgpt)"
        :unavailable-badge="t(l.soon)"
      />
    </div>
    <p
      v-if="failed"
      :class="$style.connectAiPage_error"
      role="alert"
    >
      {{ t(l.startFailed) }}
    </p>
  </SetupShell>
</template>

<style lang="scss" module>
.connectAiPage_providers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: $spacing-16;
}

.connectAiPage_error {
  margin: 0;
  color: $color-attention-ink;
  font-size: $font-size-body-s;
  line-height: $line-height-normal;
}
</style>
