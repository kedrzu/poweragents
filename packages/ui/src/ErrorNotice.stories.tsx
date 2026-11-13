import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ErrorNotice from './ErrorNotice.vue';

const meta: Meta<typeof ErrorNotice> = { title: 'ErrorNotice', component: ErrorNotice, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof ErrorNotice>;

export const Default: Story = {
    render: () => (
        <ErrorNotice
            title="Nie udało się utworzyć projektu"
            body="Na dysku skończyło się miejsce. Zwolnij trochę miejsca, na przykład opróżniając Kosz, i spróbuj ponownie."
        />
    ),
};
