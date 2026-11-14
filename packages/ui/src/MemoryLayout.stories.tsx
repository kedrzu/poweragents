import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { MEMORY_FILES, MEMORY_NOW, WORK_MARKDOWN } from './MemoryLayout.fixtures.js';
import MemoryLayout from './MemoryLayout.vue';
import styles from './MemoryLayout.stories.module.scss';

const meta: Meta<typeof MemoryLayout> = {
    title: 'MemoryLayout',
    component: MemoryLayout,
    tags: ['autodocs'],
    parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof MemoryLayout>;

/** Screen 63: a file the agent has just changed, open. */
export const File: Story = {
    render: () => (
        <div class={styles['card']}>
            <MemoryLayout
                files={MEMORY_FILES}
                selectedPath="praca.md"
                preview={{ state: 'file', path: 'praca.md', updatedAt: MEMORY_NOW - 20_000, markdown: WORK_MARKDOWN }}
                now={MEMORY_NOW}
            />
        </div>
    ),
};

export const Loading: Story = {
    render: () => (
        <div class={styles['card']}>
            <MemoryLayout
                files={MEMORY_FILES}
                selectedPath="o-mnie.md"
                preview={{ state: 'loading' }}
                now={MEMORY_NOW}
            />
        </div>
    ),
};

/** The open file was removed since the list was read. */
export const NotFound: Story = {
    render: () => (
        <div class={styles['card']}>
            <MemoryLayout
                files={MEMORY_FILES}
                selectedPath="ludzie.md"
                preview={{ state: 'notFound' }}
                now={MEMORY_NOW}
            />
        </div>
    ),
};

export const TooLarge: Story = {
    render: () => (
        <div class={styles['card']}>
            <MemoryLayout
                files={MEMORY_FILES}
                selectedPath="instagram.md"
                preview={{ state: 'tooLarge', path: 'instagram.md' }}
                now={MEMORY_NOW}
            />
        </div>
    ),
};

export const Failed: Story = {
    render: () => (
        <div class={styles['card']}>
            <MemoryLayout
                files={MEMORY_FILES}
                selectedPath="skora.md"
                preview={{ state: 'failed', details: 'TypeError: Failed to fetch' }}
                now={MEMORY_NOW}
            />
        </div>
    ),
};

/** Show in Finder on a system the daemon cannot open the file manager on. */
export const RevealUnsupported: Story = {
    render: () => (
        <div class={styles['card']}>
            <MemoryLayout
                files={MEMORY_FILES}
                selectedPath="praca.md"
                preview={{ state: 'file', path: 'praca.md', updatedAt: MEMORY_NOW - 20_000, markdown: WORK_MARKDOWN }}
                now={MEMORY_NOW}
                revealProblem="unsupported"
            />
        </div>
    ),
};

export const RevealFailed: Story = {
    render: () => (
        <div class={styles['card']}>
            <MemoryLayout
                files={MEMORY_FILES}
                selectedPath="praca.md"
                preview={{ state: 'file', path: 'praca.md', updatedAt: MEMORY_NOW - 20_000, markdown: WORK_MARKDOWN }}
                now={MEMORY_NOW}
                revealProblem="failed"
            />
        </div>
    ),
};
