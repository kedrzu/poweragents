import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ConversationTab from './ConversationTab.vue';

const meta: Meta<typeof ConversationTab> = {
    title: 'ConversationTab',
    component: ConversationTab,
    tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ConversationTab>;

/** Screen 57: a finished conversation. */
export const Default: Story = {
    render: () => (
        <ConversationTab
            title="Poranna rutyna na zimę"
            color="pink"
        />
    ),
};

/** Screen 56: the agent at work. */
export const Running: Story = {
    render: () => (
        <ConversationTab
            title="Poranna rutyna na zimę"
            color="pink"
            running
        />
    ),
};

export const LongTitle: Story = {
    render: () => (
        <ConversationTab
            title="Przeprowadzka do Wrocławia i wszystko, co trzeba przy niej załatwić"
            color="violet"
        />
    ),
};
