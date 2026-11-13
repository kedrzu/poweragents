import { composeStories } from '@storybook/vue3-vite';
import { expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import * as stories from './Composer.stories.jsx';

const { Enabled, Running } = composeStories(stories);

test('Enter sends the trimmed text once and keeps the caret in the field; blank text is not sent', async () => {
    const send = vi.fn(async (_text: string) => {});
    await Enabled.run({ args: { ...Enabled.args, onSend: send } });

    const field = page.getByRole('textbox', { name: 'Message to the agent' });
    await userEvent.click(field);
    await userEvent.keyboard('   {Enter}');
    expect(send).not.toHaveBeenCalled();

    await userEvent.fill(field, '  Dopisz czwarty punkt  ');
    await userEvent.keyboard('{Enter}');
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith('Dopisz czwarty punkt');
    await expect.element(field).toHaveValue('');
    await expect.element(field).toHaveFocus();
});

test('while the agent works, the field still sends and Stop asks it to stop', async () => {
    const send = vi.fn(async (_text: string) => {});
    const stop = vi.fn(async () => {});
    await Running.run({ args: { ...Running.args, onSend: send, onStop: stop } });

    const field = page.getByRole('textbox', { name: 'Message to the agent' });
    await expect.element(field).toHaveAccessibleDescription(/You can keep writing/);
    await userEvent.fill(field, 'I piąty');
    await userEvent.keyboard('{Enter}');
    expect(send).toHaveBeenCalledWith('I piąty');

    await userEvent.click(page.getByRole('button', { name: 'Stop' }));
    expect(stop).toHaveBeenCalledTimes(1);
});
