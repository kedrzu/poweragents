import { ArrowLeft, ExternalLink, Link } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import Button from './Button.vue';

const meta: Meta<typeof Button> = { title: 'Button', component: Button, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
    render: () => <Button icon={Link}>Połącz</Button>,
};

export const Secondary: Story = {
    render: () => (
        <Button
            variant="secondary"
            icon={ExternalLink}
        >
            Otwórz stronę logowania ponownie
        </Button>
    ),
};

export const Ghost: Story = {
    render: () => (
        <Button
            variant="ghost"
            icon={ArrowLeft}
        >
            Wróć
        </Button>
    ),
};

export const WithoutIcon: Story = {
    render: () => <Button>Przejdź do aplikacji</Button>,
};

export const Disabled: Story = {
    render: () => (
        <Button
            icon={Link}
            disabled
        >
            Połącz z ChatGPT
        </Button>
    ),
};

export const Busy: Story = {
    render: () => (
        <Button
            icon={Link}
            busy
        >
            Połącz
        </Button>
    ),
};
