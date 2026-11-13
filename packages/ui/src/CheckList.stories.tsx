import type { Meta, StoryObj } from '@storybook/vue3-vite';

import CheckList from './CheckList.vue';

const meta: Meta<typeof CheckList> = { title: 'CheckList', component: CheckList, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof CheckList>;

/** Screen 40: the plans the agent works with. */
export const Default: Story = {
    render: () => (
        <CheckList
            label="Agent działa z planem:"
            items={['Claude Pro', 'Claude Max']}
        />
    ),
};
