import type { Meta, StoryObj } from '@storybook/vue3-vite';

import StepNumber from './StepNumber.vue';

const meta: Meta<typeof StepNumber> = { title: 'StepNumber', component: StepNumber, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof StepNumber>;

export const Default: Story = {
    render: () => <StepNumber value={1} />,
};

export const Done: Story = {
    render: () => (
        <StepNumber
            value={1}
            done
        />
    ),
};
