<script lang="ts" setup>
import { NuxtLayout, NuxtPage } from '#components';
import { useLanguage } from '@nzyme/vue-i18n/useLanguage.js';
import { ConfigProvider } from 'reka-ui';

import '@poweragents/ui/styles/main.scss';

const language = useLanguage();
</script>

<template>
  <ConfigProvider
    :locale="language"
    dir="ltr"
    :scroll-body="false"
  >
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </ConfigProvider>
</template>
