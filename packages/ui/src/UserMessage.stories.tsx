import type { Meta, StoryObj } from '@storybook/vue3-vite';

import UserMessage from './UserMessage.vue';

const meta: Meta<typeof UserMessage> = { title: 'UserMessage', component: UserMessage, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof UserMessage>;

export const Default: Story = {
    render: () => (
        <UserMessage text="Ułóż mi poranną rutynę pielęgnacyjną na zimę. Moje notatki o skórze są w pliku notatki.md." />
    ),
};

/** Line breaks the person typed stay; markup stays text. */
export const Multiline: Story = {
    render: () => <UserMessage text={'Dwie rzeczy:\n1. rano krótko\n2. wieczorem <b>dłużej</b>'} />,
};
