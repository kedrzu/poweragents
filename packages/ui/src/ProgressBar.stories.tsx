import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ProgressBar from './ProgressBar.vue';

const meta: Meta<typeof ProgressBar> = { title: 'ProgressBar', component: ProgressBar, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = {
    render: () => (
        <ProgressBar
            value={0.41}
            label="Przygotowuję narzędzia…"
            hint="zostały około 2 minuty"
        />
    ),
};

export const Indeterminate: Story = {
    render: () => (
        <ProgressBar
            label="Pobieram środowisko…"
            hint="to potrwa kilka minut"
        />
    ),
};

export const WithoutHint: Story = {
    render: () => (
        <ProgressBar
            value={0.9}
            label="Uruchamiam miejsce pracy…"
        />
    ),
};
