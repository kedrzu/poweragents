import { RefreshCw } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import Button from './Button.vue';
import ErrorDetails from './ErrorDetails.vue';

const meta: Meta<typeof ErrorDetails> = { title: 'ErrorDetails', component: ErrorDetails, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof ErrorDetails>;

const DETAILS = [
    'limactl start poweragents: exit status 1',
    'vz: failed to start the virtual machine: not enough free memory',
].join('\n');

export const Collapsed: Story = {
    render: () => <ErrorDetails details={DETAILS} />,
};

/** Screen 36: the details shown, after Retry. */
export const Expanded: Story = {
    render: () => (
        <ErrorDetails
            details={DETAILS}
            open
        >
            {{
                actions: () => <Button icon={RefreshCw}>Spróbuj ponownie</Button>,
            }}
        </ErrorDetails>
    ),
};
