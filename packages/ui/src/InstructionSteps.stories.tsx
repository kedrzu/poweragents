import type { Meta, StoryObj } from '@storybook/vue3-vite';

import styles from './InstructionSteps.stories.module.scss';
import InstructionSteps from './InstructionSteps.vue';

const meta: Meta<typeof InstructionSteps> = {
    title: 'InstructionSteps',
    component: InstructionSteps,
    tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof InstructionSteps>;

export const Default: Story = {
    render: () => (
        <InstructionSteps
            steps={['Zaloguj się w otwartej karcie przeglądarki', 'Skopiuj kod, który pokaże Claude', 'Wklej go tutaj']}
        />
    ),
};

export const LongText: Story = {
    render: () => (
        <div class={styles['narrow']}>
            <InstructionSteps
                steps={[
                    'Zaloguj się w otwartej karcie przeglądarki na konto, którego używasz na co dzień',
                    'Skopiuj kod, który pokaże Claude',
                ]}
            />
        </div>
    ),
};
