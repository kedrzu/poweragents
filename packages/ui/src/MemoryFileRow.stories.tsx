import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { MEMORY_NOW } from './MemoryLayout.fixtures.js';
import MemoryFileRow from './MemoryFileRow.vue';
import styles from './MemoryFileRow.stories.module.scss';

const meta: Meta<typeof MemoryFileRow> = { title: 'MemoryFileRow', component: MemoryFileRow, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof MemoryFileRow>;

export const Default: Story = {
    render: () => (
        <div class={styles['column']}>
            <MemoryFileRow
                title="O mnie"
                path="o-mnie.md"
                updatedAt={new Date(2026, 10, 13, 18, 30).getTime()}
                now={MEMORY_NOW}
                to="/memory?file=o-mnie.md"
            />
        </div>
    ),
};

/** Screen 63's open file, which the agent has just changed. */
export const SelectedChanged: Story = {
    render: () => (
        <div class={styles['column']}>
            <MemoryFileRow
                title="Praca i szukanie pracy"
                path="praca.md"
                updatedAt={MEMORY_NOW - 20_000}
                now={MEMORY_NOW}
                to="/memory?file=praca.md"
                selected
                changed
            />
        </div>
    ),
};

export const Changed: Story = {
    render: () => (
        <div class={styles['column']}>
            <MemoryFileRow
                title="Skóra i pielęgnacja"
                path="zdrowie/skora.md"
                updatedAt={MEMORY_NOW - 5_000}
                now={MEMORY_NOW}
                to="/memory?file=zdrowie/skora.md"
                changed
            />
        </div>
    ),
};

export const LongTitle: Story = {
    render: () => (
        <div class={styles['column']}>
            <MemoryFileRow
                title="Przeprowadzka do Wrocławia i wszystko, co trzeba przy niej załatwić"
                path="przeprowadzka-do-wroclawia-i-wszystko-co-trzeba-zalatwic.md"
                updatedAt={new Date(2025, 11, 31, 12, 0).getTime()}
                now={MEMORY_NOW}
                to="/memory?file=przeprowadzka.md"
            />
        </div>
    ),
};
