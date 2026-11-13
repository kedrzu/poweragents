<!-- First run, step 2: pasting the code Claude's sign-in page shows (screen 38), and a code Claude did not accept (screen 39). -->

<script lang="ts" setup>
import { ArrowLeft, ExternalLink, Link } from '@lucide/vue';
import { assertNever } from '@nzyme/utils/assertNever.js';
import Form from '@nzyme/vue-forms/components/Form.vue';
import { useForm } from '@nzyme/vue-forms/useForm.js';
import { useFormFields } from '@nzyme/vue-forms/useFormFields.js';
import { requiredValidator } from '@nzyme/vue-forms/validators/requiredValidator.js';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { useService } from '@nzyme/vue-ioc/useService.js';
import { useRouter } from 'nuxt/app';
import { computed, ref, watch } from 'vue';

import Button from '@poweragents/ui/Button.vue';
import CodeField from '@poweragents/ui/CodeField.vue';
import InstructionSteps from '@poweragents/ui/InstructionSteps.vue';

import { openExternalUrl } from '@/utils/openExternalUrl.js';

import * as l from './ClaudeCodePage.loc.js';
import { SetupStore } from './SetupStore.js';
import SetupShell from './SetupShell.vue';

const setup = useService(SetupStore);
const router = useRouter();
const t = useTranslate();

const form = useForm({ code: '' });
const fields = useFormFields(form, { code: [requiredValidator()] });
/** Why the daemon did not take the code; shown on the field until the code changes. */
const failure = ref<'rejected' | 'expired' | 'error' | null>(null);
const failureMessage = computed(() => {
  switch (failure.value) {
    case 'rejected':
      return [t(l.codeRejected)];
    case 'expired':
      return [t(l.loginExpired)];
    case 'error':
      return [t(l.connectFailed)];
    case null:
      return [];
    default:
      return assertNever(failure.value);
  }
});

watch(
  () => form.value.code,
  () => (failure.value = null),
);

// Only reached with a sign-in started (the Claude card, or another account on the plan screen); without one, say after
// a restart, the person starts it again from the provider choice.
if (setup.state.loginUrl == null) {
  void router.replace({ name: 'setupAi' });
}

async function connect() {
  if (!(await form.validate())) {
    return;
  }

  const code = form.value.code.trim();
  try {
    const result = await setup.completeLogin(code);
    switch (result.outcome) {
      case 'connected':
        await router.push({ name: 'setupDone' });
        break;
      case 'planNotAllowed':
        await router.push({ name: 'setupClaudePlan' });
        break;
      case 'codeRejected':
        failure.value = 'rejected';
        break;
      case 'expired':
        failure.value = 'expired';
        break;
      default:
        assertNever(result);
    }
  } catch {
    failure.value = 'error';
  }
}

/** Reopens the waiting sign-in's page: never a new sign-in, which would end the one whose code the person may hold. */
async function openAgain() {
  await openExternalUrl(setup.state.loginUrl ?? (await setup.startLogin()));
}

/** The waiting sign-in stays; the next start replaces it, and it ends by itself after a while. */
async function back() {
  await router.push({ name: 'setupAi' });
}
</script>

<template>
  <Form
    :class="$style.claudeCodePage"
    @submit="connect"
  >
    <SetupShell
      step="ai"
      :title="t(l.title)"
      :body="t(l.body)"
    >
      <InstructionSteps :steps="[t(l.signIn), t(l.copyCode), t(l.pasteCode)]" />
      <CodeField
        :field="fields.code"
        :errors="failureMessage"
        :label="t(l.codeLabel)"
        :placeholder="t(l.codePlaceholder)"
        :help="t(l.codeHelp)"
      />
      <template #back>
        <Button
          variant="ghost"
          :icon="ArrowLeft"
          @click="back"
        >
          {{ t(l.back) }}
        </Button>
      </template>
      <template #actions>
        <Button
          variant="secondary"
          :icon="ExternalLink"
          @click="openAgain"
        >
          {{ t(l.openAgain) }}
        </Button>
        <Button
          type="submit"
          :icon="Link"
        >
          {{ t(l.connect) }}
        </Button>
      </template>
    </SetupShell>
  </Form>
</template>

<style lang="scss" module>
// The form wraps the whole shell, so the actions' row submits it.
.claudeCodePage {
  display: contents;
}
</style>
