import { composeStories } from '@storybook/vue3-vite';
import { expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import * as stories from './NewProjectDialog.stories.jsx';

const { Empty } = composeStories(stories);

test('Create waits for a name, Enter included, then submits once', async () => {
    const submit = vi.fn(async () => {});
    await Empty.run({ args: { ...Empty.args, onSubmit: submit } });

    const name = page.getByRole('textbox', { name: 'Project name' });
    const create = page.getByRole('button', { name: 'Create' });
    await expect.element(name).toHaveFocus();
    await expect.element(create).toBeDisabled();
    await userEvent.keyboard('   {Enter}');
    expect(submit).not.toHaveBeenCalled();

    await userEvent.fill(name, 'Zdrowie');
    await userEvent.click(create);
    expect(submit).toHaveBeenCalledTimes(1);
});

test('the dialog is named by its title and Escape closes it', async () => {
    await Empty.run();

    const dialog = page.getByRole('dialog', { name: 'New project' });
    await expect.element(dialog).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect.element(dialog).not.toBeInTheDocument();
});
