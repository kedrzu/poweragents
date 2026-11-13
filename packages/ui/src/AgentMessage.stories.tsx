import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { WINTER_ROUTINE_FINISHED, WINTER_ROUTINE_RUNNING, WINTER_ROUTINE_STEPS } from './AgentMessage.fixtures.js';
import AgentMessage from './AgentMessage.vue';

const meta: Meta<typeof AgentMessage> = { title: 'AgentMessage', component: AgentMessage, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof AgentMessage>;

/** Screen 56: text and steps as they come, the caret after the last word. */
export const Running: Story = {
    render: () => (
        <AgentMessage
            parts={WINTER_ROUTINE_RUNNING}
            running
        />
    ),
};

/** The agent has started, with nothing written yet. */
export const Starting: Story = {
    render: () => (
        <AgentMessage
            parts={[]}
            running
        />
    ),
};

/** Working on a step, between two pieces of text. */
export const RunningStep: Story = {
    render: () => (
        <AgentMessage
            parts={[
                ...WINTER_ROUTINE_STEPS.slice(0, 2),
                { type: 'step', id: 's3', kind: 'runCommand', status: 'running' },
            ]}
            running
        />
    ),
};

/** Screen 57: the steps collapsed above the formatted reply. */
export const Finished: Story = { render: () => <AgentMessage parts={WINTER_ROUTINE_FINISHED} /> };

/** A short answer, with no steps. */
export const NoSteps: Story = {
    render: () => <AgentMessage parts={[{ type: 'text', text: 'Jasne, zrobione. Coś jeszcze?' }]} />,
};
