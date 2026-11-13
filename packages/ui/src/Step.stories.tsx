import type { Meta, StoryObj } from '@storybook/vue3-vite';

import Step from './Step.vue';
import StepList from './StepList.vue';

const meta: Meta<typeof Step> = { title: 'Step', component: Step, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof Step>;

export const Done: Story = {
    render: () => (
        <StepList>
            <Step
                kind="readFile"
                target="notatki.md"
                status="done"
            />
        </StepList>
    ),
};

export const Current: Story = {
    render: () => (
        <StepList>
            <Step
                kind="writeFile"
                target="plan.md"
                status="running"
            />
        </StepList>
    ),
};

export const Failed: Story = {
    render: () => (
        <StepList>
            <Step
                kind="fetchWeb"
                target="https://example.com/zima/porady"
                status="failed"
            />
        </StepList>
    ),
};

/** Every kind's sentence, with and without what it worked on. */
export const Kinds: Story = {
    render: () => (
        <StepList>
            <Step
                kind="readFile"
                target="notatki.md"
                status="done"
            />
            <Step
                kind="writeFile"
                target="plan.md"
                status="done"
            />
            <Step
                kind="editFile"
                target="plan.md"
                status="done"
            />
            <Step
                kind="listFiles"
                status="done"
            />
            <Step
                kind="searchFiles"
                target="krem"
                status="done"
            />
            <Step
                kind="runCommand"
                target="ls -la"
                status="done"
            />
            <Step
                kind="fetchWeb"
                target="https://example.com/zima"
                status="done"
            />
            <Step
                kind="searchWeb"
                target="pielęgnacja skóry suchej zimą"
                status="done"
            />
            <Step
                kind="other"
                status="done"
            />
        </StepList>
    ),
};
