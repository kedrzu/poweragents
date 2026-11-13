import { composeStories } from '@storybook/vue3-vite';
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import * as stories from './StepsSummary.stories.jsx';

const { Collapsed } = composeStories(stories);

test('the count opens the steps and closes them again', async () => {
    await Collapsed.run();

    const toggle = page.getByRole('button', { name: '4 steps' });
    const step = page.getByText('Writing plan.md');
    await expect.element(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect.element(step).not.toBeVisible();

    await userEvent.click(toggle);
    await expect.element(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect
        .element(page.getByRole('list', { name: "The agent's steps" }).getByText('Writing plan.md'))
        .toBeVisible();

    await userEvent.click(toggle);
    await expect.element(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect.element(step).not.toBeVisible();
});
