import { LogIn } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import StatusBanner from './StatusBanner.vue';

const meta: Meta<typeof StatusBanner> = { title: 'StatusBanner', component: StatusBanner, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof StatusBanner>;

/** Screen 60: signed out of Claude. */
export const SignedOut: Story = {
    render: () => (
        <StatusBanner
            title="Wylogowano Cię z Claude"
            body="Agent nie odpowie, dopóki nie zalogujesz się ponownie. Twoja wiadomość zostaje w rozmowie."
            actionLabel="Zaloguj się ponownie"
            actionIcon={LogIn}
        />
    ),
};

/** Screen 61: the usage limit, nothing to do but wait. */
export const UsageLimit: Story = {
    render: () => (
        <StatusBanner
            title="Wykorzystano limit Claude"
            body="Limit odnowi się w czwartek o 14:00. Wtedy agent znów odpowie."
        />
    ),
};
