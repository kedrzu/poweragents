import type { Meta, StoryObj } from '@storybook/vue3-vite';

import MessageError from './MessageError.vue';

const meta: Meta<typeof MessageError> = { title: 'MessageError', component: MessageError, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof MessageError>;

/** Screen 59: an error on Claude's side; trying again can help. */
export const Retryable: Story = {
    render: () => (
        <MessageError
            text="Agent nie odpowiedział: Claude zgłosił błąd po swojej stronie."
            retryable
        />
    ),
};

/** Screen 60: the fix is the banner's. */
export const WithoutRetry: Story = {
    render: () => <MessageError text="Bez odpowiedzi: wylogowano Cię z Claude." />,
};
