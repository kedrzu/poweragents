import type { Meta, StoryObj } from '@storybook/vue3-vite';

import MemoryEmptyState from './MemoryEmptyState.vue';

const meta: Meta<typeof MemoryEmptyState> = {
    title: 'MemoryEmptyState',
    component: MemoryEmptyState,
    tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof MemoryEmptyState>;

/** Screen 64. */
export const Default: Story = { render: () => <MemoryEmptyState /> };
