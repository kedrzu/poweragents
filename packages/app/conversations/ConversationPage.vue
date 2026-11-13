<!-- A conversation open (screens 56, 57, 59–61): its messages with the agent's reply streaming, error lines, the banner when the agent cannot answer, and the composer with Stop. -->

<script lang="ts" setup>
import { LogIn } from '@lucide/vue';
import { assertNever } from '@nzyme/utils/assertNever.js';
import { useLanguage } from '@nzyme/vue-i18n/useLanguage.js';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { useLogger } from '@nzyme/vue-ioc/useLogger.js';
import { useService } from '@nzyme/vue-ioc/useService.js';
import { useRoute, useRouter } from 'nuxt/app';
import { computed, ref, useTemplateRef, watch } from 'vue';

import type { ConversationError } from '@poweragents/common/api/ConversationTypes.js';
import AgentMessage from '@poweragents/ui/AgentMessage.vue';
import Composer from '@poweragents/ui/Composer.vue';
import ConversationLayout from '@poweragents/ui/ConversationLayout.vue';
import MessageError from '@poweragents/ui/MessageError.vue';
import StatusBanner from '@poweragents/ui/StatusBanner.vue';
import UserMessage from '@poweragents/ui/UserMessage.vue';

import * as l from './ConversationPage.loc.js';
import * as lc from './Conversations.loc.js';
import { ConversationStore } from './ConversationStore.js';
import { useConversation } from './useConversation.js';

const route = useRoute();
const router = useRouter();
const store = useService(ConversationStore);
const t = useTranslate();
const language = useLanguage();
const logger = useLogger();

const projectId = computed(() => String(route.params['projectId']));
const conversationId = computed(() => String(route.params['conversationId']));
const conversation = useConversation({ projectId, conversationId });
const layout = useTemplateRef('layout');
/** What the person is writing. */
const message = ref('');

const title = computed(() => store.find(conversationId.value)?.title ?? t(lc.untitled));
const lastItemKey = computed(() => conversation.items.at(-1)?.key);

watch(
  () => conversation.notFound,
  notFound => {
    if (notFound) {
      void router.replace({ name: 'project', params: { projectId: projectId.value } });
    }
  },
);

async function send(text: string) {
  message.value = '';
  layout.value?.scrollToEnd();
  try {
    await conversation.send(text);
  } catch (error) {
    logger.warn('Message could not be sent', { conversationId: conversationId.value, error });
    message.value = text;
  }
}

/** Sends the unanswered message again. */
async function retry(text: string | undefined) {
  if (text !== undefined) {
    await send(text);
  }
}

async function stop() {
  const withdrawn = await conversation.stop();
  if (withdrawn.length > 0) {
    // A message waiting for the agent's step is not delivered after a stop: it returns here, ahead of anything typed since.
    message.value = [...withdrawn, message.value].filter(text => text.length > 0).join(' ');
  }
}

function describeError(error: ConversationError) {
  switch (error.kind) {
    case 'signedOut':
      return t(l.errorSignedOut);
    case 'usageLimit':
      return t(l.errorUsageLimit);
    case 'other':
      return t(l.errorOther);
    default:
      return assertNever(error);
  }
}

function describeReset(resetAt: number | undefined) {
  if (resetAt == null) {
    return t(l.usageLimitBodyUnknown);
  }
  const when = new Date(resetAt);
  return t(l.usageLimitBody, {
    date: when.toLocaleDateString(language.value, { day: 'numeric', month: 'long' }),
    time: when.toLocaleTimeString(language.value, { hour: '2-digit', minute: '2-digit' }),
  });
}
</script>

<template>
  <ConversationLayout
    ref="layout"
    @reach-top="conversation.loadOlder()"
  >
    <h1 :class="$style.conversationPage_title">
      {{ title }}
    </h1>
    <template
      v-for="item in conversation.items"
      :key="item.key"
    >
      <UserMessage
        v-if="item.type === 'user'"
        :text="item.text"
      />
      <AgentMessage
        v-else-if="item.type === 'agent'"
        :parts="item.parts"
        :running="item.running"
      />
      <MessageError
        v-else
        :class="$style.conversationPage_error"
        :text="describeError(item.error)"
        :retryable="item.key === lastItemKey && conversation.retryable"
        @retry="retry(item.retryText)"
      />
    </template>
    <template #footer>
      <StatusBanner
        v-if="conversation.blockingError?.kind === 'signedOut'"
        :title="t(l.signedOutTitle)"
        :body="t(l.signedOutBody)"
        :action-label="t(l.signIn)"
        :action-icon="LogIn"
        @action="router.push({ name: 'setupAi' })"
      />
      <StatusBanner
        v-else-if="conversation.blockingError?.kind === 'usageLimit'"
        :title="t(l.usageLimitTitle)"
        :body="describeReset(conversation.blockingError.resetAt)"
      />
      <Composer
        v-model="message"
        :placeholder="conversation.running ? t(l.placeholderRunning) : t(l.placeholder)"
        :running="conversation.running"
        @send="send"
        @stop="stop"
      />
    </template>
  </ConversationLayout>
</template>

<style lang="scss" module>
.conversationPage_title {
  @include visually-hidden;
}

.conversationPage_error {
  // Under the message it belongs to, closer than the gap between messages.
  margin-top: -$spacing-14;
}
</style>
