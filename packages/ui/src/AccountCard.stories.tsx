import type { Meta, StoryObj } from '@storybook/vue3-vite';

import AccountCard from './AccountCard.vue';
import styles from './AccountCard.stories.module.scss';

const meta: Meta<typeof AccountCard> = { title: 'AccountCard', component: AccountCard, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof AccountCard>;

/** Screen 40: signed in, but the agent cannot work with the account. */
export const SignedIn: Story = {
    render: () => (
        <div class={styles['card']}>
            <AccountCard
                provider="claude"
                name="Claude"
                email="ania@example.com"
            />
        </div>
    ),
};

/** Screen 41: the agent works with the account. */
export const Connected: Story = {
    render: () => (
        <div class={styles['card']}>
            <AccountCard
                provider="claude"
                name="Claude"
                email="ania@example.com"
                connected
            />
        </div>
    ),
};

export const WithoutEmail: Story = {
    render: () => (
        <div class={styles['card']}>
            <AccountCard
                provider="claude"
                name="Claude"
                connected
            />
        </div>
    ),
};
