<!-- The dialog that names a new project: the name field, where its files will be, Cancel and Create; a failure above the field turns Create into Try again. -->

<script lang="ts">
import type { FormField } from '@nzyme/vue-forms/types.js';
import { defineProp } from '@nzyme/vue-utils/defineProp.js';
import type { PropType } from 'vue';

export const NewProjectDialogProps = {
  /** The name, bound to the form that owns it. */
  nameField: { type: Object as PropType<FormField<string>>, required: true },
  /** Why the name cannot be used (taken, not a valid name); shown on the field. */
  nameError: defineProp<string>(),
  /** Why the last try failed, when it failed for a reason other than the name; shown above the field. */
  failure: defineProp<string>(),
} as const;

/** What the dialog reports. */
export interface NewProjectDialogEvents {
  /** Create the project with the name; awaited, the dialog is busy until it settles. */
  submit: [];
}
</script>

<script lang="ts" setup>
import { FolderPlus, Folder, RefreshCw } from '@lucide/vue';
import Form from '@nzyme/vue-forms/components/Form.vue';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { useEmitAsync } from '@nzyme/vue-utils/useEmitAsync.js';
import { computed } from 'vue';

import Button from './Button.vue';
import Dialog from './Dialog.vue';
import DialogDescription from './DialogDescription.vue';
import ErrorNotice from './ErrorNotice.vue';
import * as l from './NewProjectDialog.loc.js';
import TextField from './TextField.vue';

const props = defineProps(NewProjectDialogProps);
defineEmits<NewProjectDialogEvents>();
/** Whether the dialog shows; Cancel and Escape close it. */
const open = defineModel<boolean>('open', { default: false });

const emitAsync = useEmitAsync<NewProjectDialogEvents>();
const t = useTranslate();
/** Create waits for a name the field does not already reject. */
const canSubmit = computed(
  () => !!props.nameField.value?.trim() && !props.nameError && props.nameField.errors.length === 0,
);

async function submit() {
  // Enter submits the form natively, past the disabled button.
  if (canSubmit.value) {
    await emitAsync('submit');
  }
}

function cancel() {
  open.value = false;
}
</script>

<template>
  <Dialog
    v-model:open="open"
    :title="t(l.title)"
  >
    <Form
      :class="$style.newProjectDialog"
      @submit="submit"
    >
      <ErrorNotice
        v-if="props.failure"
        :title="t(l.failedTitle)"
        :body="props.failure"
      />
      <TextField
        :field="props.nameField"
        :errors="props.nameError"
        :label="t(l.nameLabel)"
        :placeholder="t(l.namePlaceholder)"
      />
      <DialogDescription :icon="Folder">
        {{ t(l.where) }}
      </DialogDescription>
      <div :class="$style.newProjectDialog_actions">
        <Button
          variant="secondary"
          @click="cancel"
        >
          {{ t(l.cancel) }}
        </Button>
        <Button
          type="submit"
          :icon="props.failure ? RefreshCw : FolderPlus"
          :disabled="!canSubmit"
        >
          {{ props.failure ? t(l.retry) : t(l.create) }}
        </Button>
      </div>
    </Form>
  </Dialog>
</template>

<style lang="scss" module>
.newProjectDialog {
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.newProjectDialog_actions {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-08;
  justify-content: flex-end;
  margin-top: $spacing-08;
}
</style>
