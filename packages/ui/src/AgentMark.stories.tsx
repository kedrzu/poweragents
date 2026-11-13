import type { Meta, StoryObj } from '@storybook/vue3-vite';

import AgentMark from './AgentMark.vue';

const meta: Meta<typeof AgentMark> = { title: 'AgentMark', component: AgentMark, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof AgentMark>;

export const Default: Story = { render: () => <AgentMark /> };
