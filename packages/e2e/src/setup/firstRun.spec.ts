import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { ACCOUNT_EMAIL, FREE_PLAN_CODE, GOOD_CODE, StubDaemon } from '../StubDaemon.js';

test('home shows only once the sandbox is ready and Claude connected', async ({ page }) => {
    const daemon = await StubDaemon.install(page);
    daemon.sandbox = { status: 'startingVm' };

    await test.step('sandbox starting: the environment screen, whatever the link', async () => {
        await page.goto('/');
        await expect(heading(page)).toHaveText("Preparing the agent's workplace");
        await expect(page.getByRole('progressbar', { name: "Starting the agent's computer…" })).toBeVisible();

        await page.goto('/setup/done');
        await expect(heading(page)).toHaveText("Preparing the agent's workplace");
        await expect(page).toHaveURL(/\/setup\/environment$/);
    });

    await test.step('sandbox ready, Claude not connected: the provider choice', async () => {
        daemon.sandbox = { status: 'ready' };
        await expect(heading(page)).toHaveText('Connect your AI account');

        await page.goto('/');
        await expect(heading(page)).toHaveText('Connect your AI account');
    });

    await test.step('Claude on a plan the agent cannot use: the plan screen', async () => {
        daemon.claude = { connected: true, email: ACCOUNT_EMAIL, plan: 'free', planAllowed: false };
        await page.goto('/');
        await expect(heading(page)).toHaveText('This account has neither the Pro nor the Max plan');
    });

    await test.step('connected: home', async () => {
        daemon.claude = { connected: true, email: ACCOUNT_EMAIL, plan: 'max', planAllowed: true };
        await page.goto('/');
        await expect(heading(page)).toHaveText('Start with your first project');
    });

    await test.step('the sandbox stops being ready: back to the environment screen', async () => {
        daemon.sandbox = { status: 'startingAgent' };
        await expect(heading(page)).toHaveText("Preparing the agent's workplace");
        await expect(page.getByRole('progressbar', { name: 'Starting the agent…' })).toBeVisible();
    });
});

test('a failed start shows its details and retries', async ({ page }) => {
    const daemon = await StubDaemon.install(page);
    daemon.sandbox = { status: 'failed', message: 'vz: not enough free memory' };

    await page.goto('/');
    await expect(heading(page)).toHaveText("Couldn't prepare the agent's workplace");
    const details = page.getByText('vz: not enough free memory');
    await expect(details).toBeHidden();
    await page.getByRole('button', { name: 'Show details' }).click();
    await expect(details).toBeVisible();

    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(heading(page)).toHaveText("Preparing the agent's workplace");
    expect(daemon.countCalls('sandbox/start')).toBe(1);
});

test("a failed check of Claude's status shows its details and retries", async ({ page }) => {
    const daemon = await StubDaemon.install(page);
    daemon.claudeStatusError = 'OpenCode has no claude-agent integration';

    await page.goto('/');
    await expect(heading(page)).toHaveText("Couldn't check the connection to your AI");
    await page.getByRole('button', { name: 'Show details' }).click();
    await expect(page.getByText('OpenCode has no claude-agent integration')).toBeVisible();

    daemon.claudeStatusError = 'claude auth status printed no JSON';
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByText('claude auth status printed no JSON')).toBeVisible();

    daemon.claudeStatusError = null;
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(heading(page)).toHaveText('Connect your AI account');
});

test('connecting Claude: a rejected code, the sign-in page again, connected', async ({ page }) => {
    const daemon = await StubDaemon.install(page);
    await page.goto('/');

    await test.step('the Claude card opens the sign-in page', async () => {
        const signIn = page.waitForEvent('popup');
        await page.getByRole('button', { name: 'Connect Claude' }).click();
        expect((await signIn).url()).toBe('https://claude.ai/oauth/authorize?attempt=1');
        await expect(heading(page)).toHaveText('Finish signing in to Claude');
    });

    await test.step('opening it again reuses the waiting sign-in', async () => {
        const signIn = page.waitForEvent('popup');
        await openSignInAgain(page);
        expect((await signIn).url()).toBe('https://claude.ai/oauth/authorize?attempt=1');
        expect(daemon.countCalls('claude/login/start')).toBe(1);
    });

    await test.step('a rejected code: opening again opens the sign-in the daemon started instead', async () => {
        await codeField(page).fill('wrong-code#state');
        await page.getByRole('button', { name: 'Connect', exact: true }).click();
        await expect(page.getByRole('alert')).toContainText("This code didn't work.");

        const signIn = page.waitForEvent('popup');
        await openSignInAgain(page);
        expect((await signIn).url()).toBe('https://claude.ai/oauth/authorize?attempt=2');
        expect(daemon.countCalls('claude/login/start')).toBe(1);
    });

    await test.step('a good code: connected, then home', async () => {
        await codeField(page).fill(GOOD_CODE);
        await page.getByRole('button', { name: 'Connect', exact: true }).click();
        await expect(heading(page)).toHaveText('All set, Claude is connected');
        await expect(page.getByText(ACCOUNT_EMAIL)).toBeVisible();

        await page.getByRole('button', { name: 'Go to the app' }).click();
        await expect(heading(page)).toHaveText('Start with your first project');
    });
});

test('a plan the agent cannot use offers another account', async ({ page }) => {
    const daemon = await StubDaemon.install(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Connect Claude' }).click();
    await codeField(page).fill(FREE_PLAN_CODE);
    await page.getByRole('button', { name: 'Connect', exact: true }).click();

    await expect(heading(page)).toHaveText('This account has neither the Pro nor the Max plan');
    await expect(page.getByText(ACCOUNT_EMAIL)).toBeVisible();

    daemon.loginStartFails = true;
    await page.getByRole('button', { name: 'Sign in with another account' }).click();
    await expect(page.getByRole('alert')).toHaveText("Couldn't open Claude's sign-in. Try again.");

    daemon.loginStartFails = false;
    const signIn = page.waitForEvent('popup');
    await page.getByRole('button', { name: 'Sign in with another account' }).click();
    expect((await signIn).url()).toBe('https://claude.ai/oauth/authorize?attempt=2');
    await expect(heading(page)).toHaveText('Finish signing in to Claude');
    expect(daemon.countCalls('claude/login/start')).toBe(3);
});

function heading(page: Page) {
    return page.getByRole('heading', { level: 1 });
}

function codeField(page: Page) {
    return page.getByRole('textbox', { name: 'Code from Claude' });
}

async function openSignInAgain(page: Page) {
    await page.getByRole('button', { name: 'Open the sign-in page again' }).click();
}
