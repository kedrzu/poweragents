import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, ref } from 'vue';

import Composer from './Composer.vue';

const meta: Meta<typeof Composer> = { title: 'Composer', component: Composer, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof Composer>;

/** The composer as a story's args drive it: `onSend` and `onStop` see what it emits; sending clears the field. */
function renderComposer(placeholder: string) {
    return ({ onSend, ...args }: Record<string, unknown>) =>
        defineComponent({
            setup() {
                const message = ref('');
                return () => (
                    <Composer
                        {...args}
                        v-model={message.value}
                        placeholder={placeholder}
                        // One listener only: JSX would merge a second `onSend` with the one in `args`.
                        onSend={async (text: string) => {
                            await (typeof onSend === 'function' ? onSend(text) : undefined);
                            message.value = '';
                        }}
                    />
                );
            },
        });
}

export const Enabled: Story = { render: renderComposer('Napisz do agenta…') };

/** Screen 56: Stop in the field and the hint above it. */
export const Running: Story = {
    args: { running: true },
    render: renderComposer('Dopisz coś, gdy agent pracuje…'),
};

export const Disabled: Story = {
    args: { disabled: true },
    render: renderComposer('Co robimy w projekcie Zdrowie?'),
};
