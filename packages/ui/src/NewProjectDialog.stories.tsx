import { useForm } from '@nzyme/vue-forms/useForm.js';
import { useFormFields } from '@nzyme/vue-forms/useFormFields.js';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, ref } from 'vue';

import NewProjectDialog from './NewProjectDialog.vue';

const meta: Meta<typeof NewProjectDialog> = {
    title: 'NewProjectDialog',
    component: NewProjectDialog,
    tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof NewProjectDialog>;

/** Screen 52: the name empty, Create disabled. */
export const Empty: Story = {
    render: args => renderDialog({ name: '', onSubmit: args.onSubmit }),
};

export const Named: Story = {
    render: () => renderDialog({ name: 'Dziennik snu' }),
};

/** Screen 53: the name is another project's. */
export const NameTaken: Story = {
    render: () => renderDialog({ name: 'Zdrowie', nameError: 'Masz już projekt o tej nazwie.' }),
};

/** Screen 55: the project could not be created; the name stays, Create turns into Try again. */
export const Failed: Story = {
    render: () =>
        renderDialog({
            name: 'Dziennik snu',
            failure:
                'Na dysku skończyło się miejsce. Zwolnij trochę miejsca, na przykład opróżniając Kosz, i spróbuj ponownie.',
        }),
};

/** Creating: the form is locked and Create busy until the creation settles. */
export const Creating: Story = {
    render: () => renderDialog({ name: 'Dziennik snu', onSubmit: () => new Promise<void>(() => {}) }),
};

interface RenderDialogParams {
    name: string;
    nameError?: string;
    failure?: string;
    onSubmit?: () => Promise<void>;
}

function renderDialog(params: RenderDialogParams) {
    return defineComponent({
        setup() {
            const open = ref(true);
            const form = useForm({ name: params.name });
            const fields = useFormFields(form, { name: [] });
            return () => (
                <NewProjectDialog
                    v-model:open={open.value}
                    nameField={fields.name}
                    nameError={params.nameError}
                    failure={params.failure}
                    onSubmit={params.onSubmit}
                />
            );
        },
    });
}
