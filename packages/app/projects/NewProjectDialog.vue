<!-- Creating a project (screens 52, 53, 55): the name only; a taken or unusable name shows on the field, any other failure above it with Try again; a created project opens. -->

<script lang="ts" setup>
import { assertNever } from '@nzyme/utils/assertNever.js';
import { useForm } from '@nzyme/vue-forms/useForm.js';
import { useFormFields } from '@nzyme/vue-forms/useFormFields.js';
import { maxLengthValidator } from '@nzyme/vue-forms/validators/maxLengthValidator.js';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { useService } from '@nzyme/vue-ioc/useService.js';
import { useRouter } from 'nuxt/app';
import { computed, ref, watch } from 'vue';

import { PROJECT_NAME_MAX_LENGTH } from '@poweragents/common/api/ProjectTypes.js';
import NewProjectDialogView from '@poweragents/ui/NewProjectDialog.vue';

import * as l from './NewProjectDialog.loc.js';
import { ProjectStore } from './ProjectStore.js';

/** Whether the dialog shows; it starts empty each time it opens. */
const open = defineModel<boolean>('open', { default: false });

const store = useService(ProjectStore);
const router = useRouter();
const t = useTranslate();

const form = useForm({ name: '' });
const fields = useFormFields(form, { name: [maxLengthValidator({ maxLength: PROJECT_NAME_MAX_LENGTH })] });
/** Why the daemon did not take the name; shown on the field until the name changes. */
const nameRejected = ref<'nameTaken' | 'invalidName' | null>(null);
/** Whether the last try failed for another reason; Create turns into Try again. */
const failed = ref(false);
const nameError = computed(() => {
  switch (nameRejected.value) {
    case 'nameTaken':
      return t(l.nameTaken);
    case 'invalidName':
      return t(l.invalidName);
    case null:
      return undefined;
    default:
      return assertNever(nameRejected.value);
  }
});

watch(
  () => form.value.name,
  () => (nameRejected.value = null),
);
watch(open, isOpen => {
  if (isOpen) {
    form.value.name = '';
    form.reset();
    nameRejected.value = null;
    failed.value = false;
  }
});

async function create() {
  if (!(await form.validate())) {
    return;
  }

  try {
    const result = await store.create(form.value.name.trim());
    failed.value = false;
    if ('created' in result) {
      open.value = false;
      await router.push({ name: 'project', params: { projectId: result.created.id } });
    } else if ('nameTaken' in result) {
      nameRejected.value = 'nameTaken';
    } else {
      nameRejected.value = 'invalidName';
    }
  } catch {
    failed.value = true;
  }
}
</script>

<template>
  <NewProjectDialogView
    v-model:open="open"
    :name-field="fields.name"
    :name-error="nameError"
    :failure="failed ? t(l.failed) : undefined"
    @submit="create"
  />
</template>
