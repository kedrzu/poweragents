import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, h } from 'vue';

import styles from './PathStage.stories.module.scss';
import PathStage from './PathStage.vue';
import type { PathStageStatus } from './PathStage.vue';

const meta: Meta<typeof PathStage> = {
    title: 'PathStage',
    component: PathStage,
    tags: ['autodocs'],
    decorators: [
        story => {
            const Story = story();
            return defineComponent({
                setup: () => () => <ol class={styles['panel']}>{h(Story)}</ol>,
            });
        },
    ],
};
export default meta;
type Story = StoryObj<typeof PathStage>;

export const Waiting: Story = { render: () => renderStage('waiting') };

export const Current: Story = { render: () => renderStage('current') };

export const Done: Story = { render: () => renderStage('done') };

export const Failed: Story = {
    render: () => (
        <PathStage
            number={1}
            title="Bezpieczne miejsce pracy"
            hint="Nie udało się — spróbuj ponownie"
            status="failed"
        />
    ),
};

/** The three stages of the first run as screen 45 shows them: one done, one current, one waiting. */
export const Path: Story = {
    render: () => (
        <>
            <PathStage
                number={1}
                title="Bezpieczne miejsce pracy"
                hint="Osobny komputer agenta w tej aplikacji"
                status="done"
            />
            <PathStage
                number={2}
                title="Połączenie z AI"
                hint="Twoje konto Claude lub ChatGPT"
                status="current"
            />
            <PathStage
                number={3}
                title="Pierwsza rozmowa"
                hint="Agent pozna Ciebie i Twoje sprawy"
            />
        </>
    ),
};

function renderStage(status: PathStageStatus) {
    return (
        <PathStage
            number={1}
            title="Bezpieczne miejsce pracy"
            hint="Osobny komputer agenta w tej aplikacji"
            status={status}
        />
    );
}
