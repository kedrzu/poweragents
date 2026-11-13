import type { Meta, StoryObj } from '@storybook/vue3-vite';

import Step from './Step.vue';
import StepList from './StepList.vue';

const meta: Meta<typeof StepList> = { title: 'StepList', component: StepList, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof StepList>;

/** Screen 56: three steps done, the fourth current. */
export const Working: Story = {
    render: () => (
        <StepList>
            <Step
                kind="readFile"
                target="notatki.md"
                status="done"
            />
            <Step
                kind="searchWeb"
                target="pielęgnacja skóry suchej zimą"
                status="done"
            />
            <Step
                kind="runCommand"
                status="done"
            />
            <Step
                kind="writeFile"
                target="plan.md"
                status="running"
            />
        </StepList>
    ),
};
