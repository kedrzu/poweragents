import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { WINTER_ROUTINE_STEPS } from './AgentMessage.fixtures.js';
import Step from './Step.vue';
import StepsSummary from './StepsSummary.vue';

const meta: Meta<typeof StepsSummary> = { title: 'StepsSummary', component: StepsSummary, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof StepsSummary>;

/** Screen 57: a finished reply's four steps, collapsed. */
export const Collapsed: Story = {
    render: () => (
        <StepsSummary count={WINTER_ROUTINE_STEPS.length}>
            {WINTER_ROUTINE_STEPS.map(step => (
                <Step
                    key={step.id}
                    kind={step.kind}
                    target={step.target}
                    status={step.status}
                />
            ))}
        </StepsSummary>
    ),
};

export const OneStep: Story = {
    render: () => (
        <StepsSummary count={1}>
            <Step
                kind="readFile"
                target="notatki.md"
                status="done"
            />
        </StepsSummary>
    ),
};
