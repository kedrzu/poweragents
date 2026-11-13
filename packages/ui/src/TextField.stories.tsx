import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, ref } from 'vue';

import TextField from './TextField.vue';

const meta: Meta<typeof TextField> = { title: 'TextField', component: TextField, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof TextField>;

export const Empty: Story = {
    render: () =>
        defineComponent({
            setup() {
                const name = ref('');
                return () => (
                    <TextField
                        v-model={name.value}
                        label="Nazwa projektu"
                        placeholder="np. Szukanie pracy"
                    />
                );
            },
        }),
};

export const WithHelp: Story = {
    render: () => (
        <TextField
            label="Nazwa projektu"
            placeholder="np. Szukanie pracy"
            help="Tak będzie się nazywał folder projektu."
            modelValue="Zdrowie"
        />
    ),
};

export const Invalid: Story = {
    render: () => (
        <TextField
            label="Nazwa projektu"
            modelValue="Zdrowie"
            errors="Masz już projekt o tej nazwie."
        />
    ),
};

export const Disabled: Story = {
    render: () => (
        <TextField
            label="Nazwa projektu"
            modelValue="Zdrowie"
            disabled
        />
    ),
};
