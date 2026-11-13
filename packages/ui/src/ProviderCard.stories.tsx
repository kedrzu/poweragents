import type { Meta, StoryObj } from '@storybook/vue3-vite';

import styles from './ProviderCard.stories.module.scss';
import ProviderCard from './ProviderCard.vue';

const meta: Meta<typeof ProviderCard> = { title: 'ProviderCard', component: ProviderCard, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof ProviderCard>;

export const Available: Story = {
    render: () => (
        <div class={styles['card']}>
            <ProviderCard
                provider="claude"
                name="Claude"
                plans="Jeśli masz plan Pro lub Max"
                connectLabel="Połącz z Claude"
            />
        </div>
    ),
};

export const Unavailable: Story = {
    render: () => (
        <div class={styles['card']}>
            <ProviderCard
                provider="chatgpt"
                name="ChatGPT"
                plans="Jeśli masz plan Plus lub Pro"
                connectLabel="Połącz z ChatGPT"
                unavailableBadge="Wkrótce"
            />
        </div>
    ),
};

/** Screen 45's row: both providers side by side. */
export const Choice: Story = {
    render: () => (
        <div class={styles['row']}>
            <ProviderCard
                provider="claude"
                name="Claude"
                plans="Jeśli masz plan Pro lub Max"
                connectLabel="Połącz z Claude"
            />
            <ProviderCard
                provider="chatgpt"
                name="ChatGPT"
                plans="Jeśli masz plan Plus lub Pro"
                connectLabel="Połącz z ChatGPT"
                unavailableBadge="Wkrótce"
            />
        </div>
    ),
};
