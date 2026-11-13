import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { HOSTILE_MARKDOWN, WINTER_ROUTINE_MARKDOWN } from './AgentMessage.fixtures.js';
import RichText from './RichText.vue';

const meta: Meta<typeof RichText> = { title: 'RichText', component: RichText, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof RichText>;

/** Screen 57's reply. */
export const Formatted: Story = { render: () => <RichText markdown={WINTER_ROUTINE_MARKDOWN} /> };

/** Screen 56: the agent still writing. */
export const Streaming: Story = {
    render: () => (
        <RichText
            markdown="Rano wystarczą cztery kroki: łagodny żel, serum z witaminą C, krem z"
            caret
        />
    ),
};

export const Table: Story = {
    render: () => (
        <RichText
            markdown={[
                '| Pora | Krok |',
                '| --- | --- |',
                '| Rano | Serum z witaminą C |',
                '| Wieczór | Krem z ceramidami |',
                '',
                'Tekst z `kodem` i ~~skreśleniem~~, a potem cytat:',
                '',
                '> Skóra zimą potrzebuje więcej tłuszczu.',
            ].join('\n')}
        />
    ),
};

/** Markup and script in the model's output show as text; only the https link is a link. */
export const Hostile: Story = { render: () => <RichText markdown={HOSTILE_MARKDOWN} /> };
