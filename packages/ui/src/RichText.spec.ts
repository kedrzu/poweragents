import { composeStories } from '@storybook/vue3-vite';
import { assert, expect, test } from 'vitest';
import { page } from 'vitest/browser';

import * as stories from './RichText.stories.jsx';

const { Hostile, Formatted } = composeStories(stories);

declare global {
    interface Window {
        /** Set by the hostile Markdown's payloads, were any of them to run. */
        __injected?: boolean;
    }
}

test("the model's HTML, scripts and unsafe links render as text, never as elements", async () => {
    await Hostile.run();

    const intro = page.getByText('Zwykły tekst, potem próby:');
    await expect.element(intro).toBeVisible();
    const root = intro.element().parentElement;
    assert(root);
    expect(root.querySelector('img, script, iframe, b, [onerror], [onclick]')).toBeNull();
    expect(root.textContent).toContain('<img src="x" onerror="window.__injected = true">');
    expect(root.textContent).toContain('<script>window.__injected = true</script>');

    const links = [...root.querySelectorAll('a')].map(link => ({ text: link.textContent, href: link.href }));
    expect(links).toEqual([
        { text: 'obrazek', href: 'https://example.com/tracker.png' },
        { text: 'bezpieczny link', href: 'https://example.com/bezpieczny' },
    ]);
    await expect.element(page.getByText('link ze skryptem')).toBeVisible();
    await expect.element(page.getByText('link bez szyfrowania')).toBeVisible();
    expect(window.__injected).toBeUndefined();
});

test('a link opens outside the app, without access back to it', async () => {
    await Formatted.run();

    const link = page.getByRole('link', { name: 'zalecenia dermatologów na zimę' });
    await expect.element(link).toHaveAttribute('target', '_blank');
    await expect.element(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect.element(page.getByRole('heading', { level: 2, name: 'Poranna rutyna na zimę' })).toBeVisible();
});
