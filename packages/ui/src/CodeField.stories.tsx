import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, ref } from 'vue';

import CodeField from './CodeField.vue';

const meta: Meta<typeof CodeField> = { title: 'CodeField', component: CodeField, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof CodeField>;

const HELP = 'Kod to długi ciąg liter i cyfr. Wklej go w całości.';

export const Empty: Story = {
    render: () =>
        defineComponent({
            setup() {
                const code = ref('');
                return () => (
                    <CodeField
                        v-model={code.value}
                        label="Kod z Claude"
                        placeholder="Wklej tutaj kod z Claude"
                        help={HELP}
                    />
                );
            },
        }),
};

export const Filled: Story = {
    render: () => (
        <CodeField
            label="Kod z Claude"
            placeholder="Wklej tutaj kod z Claude"
            help={HELP}
            modelValue="Xq7mVb9Kd2pL0aR4tWn8Hj3sF6gYc81f"
        />
    ),
};

export const Rejected: Story = {
    render: () => (
        <CodeField
            label="Kod z Claude"
            placeholder="Wklej tutaj kod z Claude"
            help={HELP}
            modelValue="Xq7mVb9Kd2pL0aR4tWn8Hj3sF6gYc81f"
            errors="Ten kod nie zadziałał. Kody są jednorazowe — otwórz stronę logowania ponownie i skopiuj nowy."
        />
    ),
};

export const Disabled: Story = {
    render: () => (
        <CodeField
            label="Kod z Claude"
            placeholder="Wklej tutaj kod z Claude"
            help={HELP}
            modelValue="Xq7mVb9Kd2pL0aR4tWn8Hj3sF6gYc81f"
            disabled
        />
    ),
};
