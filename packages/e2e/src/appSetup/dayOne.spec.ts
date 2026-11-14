import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { ACCOUNT_EMAIL, APP_SETUP_ID, ONBOARDING_GREETING, StubDaemon } from '../StubDaemon.js';

test('day one opens App setup, pinned first, on the agent greeting; the projects it creates are new until opened', async ({
    page,
}) => {
    const daemon = await StubDaemon.install(page);
    daemon.claude = { connected: true, email: ACCOUNT_EMAIL, plan: 'max', planAllowed: true };
    daemon.appSetupPending = true;

    await page.goto('/');

    await expect(page).toHaveURL(new RegExp(`/projects/${APP_SETUP_ID}/conversations/c-1$`));
    await expect(page.getByRole('region', { name: 'Messages' }).getByText(ONBOARDING_GREETING)).toBeVisible();
    await expect(sidebarLink(page, 'Getting to know you')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('textbox', { name: 'Message to the agent' })).toHaveAttribute(
        'placeholder',
        // A no-break space glues the short word to the next.
        /^Write a\sfew words about yourself…$/,
    );
    await expect.poll(() => daemon.streaming).toBe(true);

    // The agent creates a project, whose name sorts before App setup's.
    daemon.projects = [{ id: 'p-accounting', name: 'Accounting' }, ...daemon.projects];
    daemon.emit({ type: 'projectsChanged' });

    const accounting = sidebarLink(page, 'Accounting');
    await expect(accounting).toHaveAccessibleName('Accounting new');
    const projects = page.getByRole('navigation', { name: 'Projects' }).locator(':scope > ul > li');
    await expect(projects.first()).toContainText('App setup');
    await expect(projects.nth(1)).toContainText('Accounting');

    await accounting.click();
    await expect(accounting).toHaveAccessibleName('Accounting');

    // App setup is asked for once per start; created, it is never started again.
    await page.goto('/');
    await expect(page).toHaveURL(/\/projects\/p-accounting$/);
    await expect(sidebarLink(page, 'Accounting')).toHaveAccessibleName('Accounting');
    expect(daemon.countCalls('appSetup/start')).toBe(2);
});

function sidebarLink(page: Page, name: string) {
    return page.getByRole('navigation', { name: 'Projects' }).getByRole('link', { name });
}
