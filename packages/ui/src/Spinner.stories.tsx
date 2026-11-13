import type { Meta, StoryObj } from '@storybook/vue3-vite';

import Spinner from './Spinner.vue';

const meta: Meta<typeof Spinner> = { title: 'Spinner', component: Spinner, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof Spinner>;

/** The only sign of the work, so named for screen readers. */
export const Labelled: Story = { render: () => <Spinner label="Agent pracuje" /> };

/** Beside text that already says it: decoration. */
export const Decorative: Story = { render: () => <Spinner /> };
