import type { Meta, StoryObj } from '@storybook/vue3-vite';

import CheckBadge from './CheckBadge.vue';

const meta: Meta<typeof CheckBadge> = { title: 'CheckBadge', component: CheckBadge, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof CheckBadge>;

/** Beside text that already says what the check means (a list of plans). */
export const Decorative: Story = {
    render: () => <CheckBadge />,
};

/** On its own: the label is announced instead of the icon. */
export const Labelled: Story = {
    render: () => <CheckBadge label="Connected" />,
};
