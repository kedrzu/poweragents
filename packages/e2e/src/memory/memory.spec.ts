import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import type { MemoryFileContent } from '@poweragents/common/api/MemoryTypes.js';

import { ACCOUNT_EMAIL, StubDaemon } from '../StubDaemon.js';

const HOUR = 60 * 60 * 1000;

test('Memory lists the files newest first and shows the open one formatted', async ({ page }) => {
    const daemon = await connected(page);
    daemon.projects = [{ id: 'p-health', name: 'Health' }];
    daemon.memory = [
        file('o-mnie.md', '# About me\n\nAn architect who likes short answers.', Date.now() - 30 * HOUR),
        file('praca.md', '# Work\n\n## What I look for\n\n- **Role:** senior architect', Date.now() - 2 * HOUR),
    ];

    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Health is ready');
    await memoryLink(page).click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Memory');
    await expect(page).toHaveURL(/\/memory\?file=praca\.md$/);
    await expect(memoryLink(page)).toHaveAttribute('aria-current', 'page');
    await expect(fileLinks(page)).toHaveText([/^Work\s*praca\.md · today at/, /^About me\s*o-mnie\.md · yesterday/]);
    await expect(fileLink(page, 'Work')).toHaveAttribute('aria-current', 'page');
    await expect(preview(page).getByRole('heading', { name: 'What I look for' })).toBeVisible();
    await expect(preview(page).getByText('Role:')).toHaveCSS('font-weight', '600');
    await expect(preview(page)).toContainText('praca.md · changed today at');

    await fileLink(page, 'About me').click();
    await expect(preview(page)).toContainText('An architect who likes short answers.');
    await expect(page).toHaveURL(/\/memory\?file=o-mnie\.md$/);
    await expect(page.getByRole('tab')).toHaveCount(0);
});

test('an empty Memory says what will fill it', async ({ page }) => {
    await connected(page);

    await page.goto('/memory');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Memory is empty for now');
    await expect(page.getByRole('button', { name: 'Show in Finder' })).toBeHidden();
});

test("the agent's changes show without a reload: a new file marked, the open file read again", async ({ page }) => {
    const daemon = await connected(page);
    daemon.memory = [file('praca.md', '# Work\n\nArchitect.', Date.now() - 2 * HOUR)];

    await page.goto('/memory?file=praca.md');
    await expect(preview(page)).toContainText('Architect.');
    await expect(page.getByText('Fresh change by the agent')).toHaveCount(0);

    daemon.memory = [
        file('praca.md', '# Work\n\nArchitect, looking for a new team.', Date.now() - 2 * HOUR),
        file('zdrowie.md', '# Health\n\nRuns twice a week.', Date.now()),
    ];
    daemon.emit({ type: 'memoryChanged' });

    await expect(fileLinks(page)).toHaveText([/^Health\s*zdrowie\.md · just now/, /^Work/]);
    await expect(fileLink(page, 'Health').getByText('Fresh change by the agent')).toBeAttached();
    await expect(preview(page)).toContainText('Architect, looking for a new team.');
    await expect(page).toHaveURL(/\/memory\?file=praca\.md$/);
});

test('the first file the agent writes replaces the empty state', async ({ page }) => {
    const daemon = await connected(page);

    await page.goto('/memory');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Memory is empty for now');

    daemon.memory = [file('o-mnie.md', '# About me\n\nLikes short answers.', Date.now())];
    daemon.emit({ type: 'memoryChanged' });

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Memory');
    await expect(preview(page)).toContainText('Likes short answers.');
});

test('Show in Finder shows the open file', async ({ page }) => {
    const daemon = await connected(page);
    daemon.memory = [file('praca.md', '# Work', Date.now() - HOUR)];

    await page.goto('/memory');
    await expect(preview(page)).toContainText('Work');
    await page.getByRole('button', { name: 'Show in Finder' }).click();

    await expect.poll(() => daemon.revealed).toEqual(['praca.md']);
});

test('a file that is gone says so', async ({ page }) => {
    const daemon = await connected(page);
    daemon.memory = [file('praca.md', '# Work', Date.now() - HOUR)];

    await page.goto('/memory?file=stary.md');

    await expect(preview(page).getByRole('heading', { name: 'This file is gone' })).toBeVisible();
    await expect(fileLink(page, 'Work')).toBeVisible();
});

test('a project created outside the app appears in the sidebar without a reload', async ({ page }) => {
    const daemon = await connected(page);
    daemon.projects = [{ id: 'p-health', name: 'Health' }];

    await page.goto('/projects/p-health');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Health is ready');
    await expect.poll(() => daemon.streaming).toBe(true);

    daemon.projects = [
        { id: 'p-health', name: 'Health' },
        { id: 'p-job', name: 'Job search' },
    ];
    daemon.emit({ type: 'projectsChanged' });

    await expect(page.getByRole('navigation', { name: 'Projects' }).getByRole('link')).toHaveText([
        'Health',
        'New conversation',
        'Job search',
    ]);
});

/** The stub daemon with the sandbox ready and Claude connected: the first run is done. */
async function connected(page: Page) {
    const daemon = await StubDaemon.install(page);
    daemon.claude = { connected: true, email: ACCOUNT_EMAIL, plan: 'max', planAllowed: true };
    return daemon;
}

function file(path: string, content: string, updatedAt: number): MemoryFileContent {
    const title = /^# (.+)$/m.exec(content)?.[1] ?? path;
    return { path, title, updatedAt, content };
}

function memoryLink(page: Page) {
    return page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Memory' });
}

function fileLinks(page: Page) {
    return page.getByRole('navigation', { name: 'Memory files' }).getByRole('link');
}

function fileLink(page: Page, title: string) {
    return fileLinks(page).filter({ hasText: title });
}

function preview(page: Page) {
    return page.getByRole('region', { name: 'Open file' });
}
