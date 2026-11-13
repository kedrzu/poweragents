import { Info } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, ref } from 'vue';

import Button from './Button.vue';
import Dialog from './Dialog.vue';
import DialogDescription from './DialogDescription.vue';

const meta: Meta<typeof Dialog> = { title: 'Dialog', component: Dialog, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof Dialog>;

export const Open: Story = {
    render: () =>
        defineComponent({
            setup() {
                const open = ref(true);
                return () => (
                    <Dialog
                        v-model:open={open.value}
                        title="Nowy projekt"
                    >
                        <DialogDescription icon={Info}>Tak wygląda okno dialogowe nad aplikacją.</DialogDescription>
                        <Button onClick={() => (open.value = false)}>Zamknij</Button>
                    </Dialog>
                );
            },
        }),
};

export const Closed: Story = {
    render: () =>
        defineComponent({
            setup() {
                const open = ref(false);
                return () => (
                    <>
                        <Button onClick={() => (open.value = true)}>Otwórz</Button>
                        <Dialog
                            v-model:open={open.value}
                            title="Nowy projekt"
                        >
                            <DialogDescription>Tak wygląda okno dialogowe nad aplikacją.</DialogDescription>
                            <Button onClick={() => (open.value = false)}>Zamknij</Button>
                        </Dialog>
                    </>
                );
            },
        }),
};
