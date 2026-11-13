import type { Meta, StoryObj } from '@storybook/vue3-vite';

import NoProjectsState from './NoProjectsState.vue';

const meta: Meta<typeof NoProjectsState> = {
    title: 'NoProjectsState',
    component: NoProjectsState,
    tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof NoProjectsState>;

export const Default: Story = {
    render: () => <NoProjectsState />,
};
