import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ProviderTile from './ProviderTile.vue';

const meta: Meta<typeof ProviderTile> = { title: 'ProviderTile', component: ProviderTile, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof ProviderTile>;

export const Claude: Story = {
    render: () => <ProviderTile provider="claude" />,
};

export const Muted: Story = {
    render: () => (
        <ProviderTile
            provider="chatgpt"
            muted
        />
    ),
};
