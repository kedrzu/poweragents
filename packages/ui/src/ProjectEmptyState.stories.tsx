import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ProjectEmptyState from './ProjectEmptyState.vue';

const meta: Meta<typeof ProjectEmptyState> = {
    title: 'ProjectEmptyState',
    component: ProjectEmptyState,
    tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ProjectEmptyState>;

export const Default: Story = {
    render: () => (
        <ProjectEmptyState
            name="Zdrowie"
            color="pink"
        />
    ),
};

export const LongName: Story = {
    render: () => (
        <ProjectEmptyState
            name="Przeprowadzka do Wrocławia i wszystko, co trzeba przy niej załatwić"
            color="teal"
        />
    ),
};

/** Screen 58: a project with conversations, where a new one starts. */
export const HasConversations: Story = {
    render: () => (
        <ProjectEmptyState
            name="Zdrowie"
            color="pink"
            hasConversations
        />
    ),
};
