import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ConversationRow from './ConversationRow.vue';
import styles from './ProjectSidebar.stories.module.scss';

const meta: Meta<typeof ConversationRow> = { title: 'ConversationRow', component: ConversationRow, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof ConversationRow>;

export const Conversation: Story = {
    render: () => (
        <div class={styles['backdrop']}>
            <ConversationRow
                label="Krem z filtrem — co wybrać"
                to="/projects/p2/conversations/c2"
            />
        </div>
    ),
};

export const Selected: Story = {
    render: () => (
        <div class={styles['backdrop']}>
            <ConversationRow
                label="Poranna rutyna na zimę"
                to="/projects/p2/conversations/c1"
                selected
            />
        </div>
    ),
};

/** Screen 56: the agent working on the open conversation. */
export const Running: Story = {
    render: () => (
        <div class={styles['backdrop']}>
            <ConversationRow
                label="Poranna rutyna na zimę"
                to="/projects/p2/conversations/c1"
                selected
                running
            />
        </div>
    ),
};

export const NewConversation: Story = {
    render: () => (
        <div class={styles['backdrop']}>
            <ConversationRow
                kind="new"
                label="Nowa rozmowa"
                to="/projects/p2"
            />
        </div>
    ),
};

export const LongTitle: Story = {
    render: () => (
        <div class={styles['backdrop']}>
            <ConversationRow
                label="Przeprowadzka do Wrocławia i wszystko, co trzeba przy niej załatwić"
                to="/projects/p2/conversations/c3"
                running
            />
        </div>
    ),
};
