import { composeStories } from '@storybook/vue3-vite';
import { afterEach, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import * as stories from './CodeField.stories.jsx';

const { Empty } = composeStories(stories);

afterEach(() => {
    vi.restoreAllMocks();
});

test('Paste puts the clipboard text, trimmed, into the field and focuses it', async () => {
    vi.spyOn(navigator.clipboard, 'readText').mockResolvedValue('  Xq7mVb9Kd2pL0aR4\n');
    await Empty.run();

    await userEvent.click(page.getByRole('button', { name: 'Paste' }));

    const input = page.getByRole('textbox', { name: 'Kod z Claude' });
    await expect.element(input).toHaveValue('Xq7mVb9Kd2pL0aR4');
    await expect.element(input).toHaveFocus();
});

test('Paste refused by the clipboard leaves the field empty and focused for a keyboard paste', async () => {
    vi.spyOn(navigator.clipboard, 'readText').mockRejectedValue(new DOMException('Denied', 'NotAllowedError'));
    await Empty.run();

    await userEvent.click(page.getByRole('button', { name: 'Paste' }));

    const input = page.getByRole('textbox', { name: 'Kod z Claude' });
    await expect.element(input).toHaveFocus();
    await expect.element(input).toHaveValue('');
});
