import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { WINTER_ROUTINE_FINISHED } from './AgentMessage.fixtures.js';
import AgentMessage from './AgentMessage.vue';
import Composer from './Composer.vue';
import ConversationLayout from './ConversationLayout.vue';
import styles from './ConversationLayout.stories.module.scss';
import UserMessage from './UserMessage.vue';

const meta: Meta<typeof ConversationLayout> = {
    title: 'ConversationLayout',
    component: ConversationLayout,
    tags: ['autodocs'],
    parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof ConversationLayout>;

/** More messages than fit: the column scrolls, opened at the newest. */
export const Scrolling: Story = {
    render: () => (
        <div class={styles['card']}>
            <ConversationLayout>
                {{
                    default: () =>
                        [1, 2, 3].flatMap(round => [
                            <UserMessage
                                key={`u${round}`}
                                text={`Pytanie ${round}: ułóż mi poranną rutynę na zimę.`}
                            />,
                            <AgentMessage
                                key={`a${round}`}
                                parts={WINTER_ROUTINE_FINISHED}
                            />,
                        ]),
                    footer: () => <Composer placeholder="Napisz do agenta…" />,
                }}
            </ConversationLayout>
        </div>
    ),
};
