import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { ACCOUNT_EMAIL, StubDaemon } from '../StubDaemon.js';

test('a project shows only once the sandbox is ready and Claude connected', async ({ page }) => {
    const daemon = await StubDaemon.install(page);
    daemon.projects = [{ id: 'p-health', name: 'Health' }];
    daemon.sandbox = { status: 'startingVm' };

    await page.goto('/projects/p-health');
    await expect(heading(page)).toHaveText("Preparing the agent's workplace");
    await expect(page).toHaveURL(/\/setup\/environment$/);

    daemon.sandbox = { status: 'ready' };
    await page.goto('/projects/p-health');
    await expect(heading(page)).toHaveText('Connect your AI account');

    daemon.claude = { connected: true, email: ACCOUNT_EMAIL, plan: 'max', planAllowed: true };
    await page.goto('/projects/p-health');
    await expect(heading(page)).toHaveText('Health is ready');
});

test('no projects: the first one is created and opens', async ({ page }) => {
    const daemon = await connected(page);

    await page.goto('/');
    await expect(heading(page)).toHaveText('Start with your first project');
    await expect(page.getByText('You have no projects yet.')).toBeVisible();

    await page.getByRole('button', { name: 'Create your first project' }).click();
    const dialog = page.getByRole('dialog', { name: 'New project' });
    const create = dialog.getByRole('button', { name: 'Create' });
    await expect(create).toBeDisabled();
    await dialog.getByRole('textbox', { name: 'Project name' }).fill('  Health  ');
    await create.click();

    await expect(dialog).toBeHidden();
    await expect(heading(page)).toHaveText('Health is ready');
    const [project] = daemon.projects;
    await expect(page).toHaveURL(new RegExp(`/projects/${project?.id}$`));
    await expect(sidebarProject(page, 'Health')).toHaveAttribute('aria-current', 'page');
});

test('a name already used shows on the field until it changes', async ({ page }) => {
    const daemon = await connected(page);
    daemon.projects = [{ id: 'p-health', name: 'Health' }];

    await page.goto('/');
    await expect(heading(page)).toHaveText('Health is ready');
    await page.getByRole('button', { name: 'New project' }).click();
    const dialog = page.getByRole('dialog', { name: 'New project' });
    const name = dialog.getByRole('textbox', { name: 'Project name' });
    const create = dialog.getByRole('button', { name: 'Create' });

    await name.fill('health');
    await create.click();
    await expect(dialog.getByText('You already have a project with this name.')).toBeVisible();
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(create).toBeDisabled();

    await name.fill('Sleep diary');
    await expect(dialog.getByText('You already have a project with this name.')).toBeHidden();
    await create.click();
    await expect(heading(page)).toHaveText('Sleep diary is ready');
    expect(daemon.projects.map(project => project.name)).toEqual(['Health', 'Sleep diary']);
});

test('a project that could not be created keeps its name and is tried again', async ({ page }) => {
    const daemon = await connected(page);
    daemon.projectCreateFails = true;

    await page.goto('/');
    await page.getByRole('button', { name: 'New project' }).click();
    const dialog = page.getByRole('dialog', { name: 'New project' });
    await dialog.getByRole('textbox', { name: 'Project name' }).fill('Sleep diary');
    await dialog.getByRole('button', { name: 'Create' }).click();

    await expect(dialog.getByRole('alert')).toContainText("Couldn't create the project");
    await expect(dialog.getByRole('textbox', { name: 'Project name' })).toHaveValue('Sleep diary');

    daemon.projectCreateFails = false;
    await dialog.getByRole('button', { name: 'Try again' }).click();
    await expect(heading(page)).toHaveText('Sleep diary is ready');
});

test('the project opened last opens again after a restart', async ({ page }) => {
    const daemon = await connected(page);
    daemon.projects = [
        { id: 'p-health', name: 'Health' },
        { id: 'p-job', name: 'Job search' },
    ];

    await page.goto('/');
    await expect(heading(page)).toHaveText('Health is ready');
    await sidebarProject(page, 'Job search').click();
    await expect(heading(page)).toHaveText('Job search is ready');

    await page.goto('/');
    await expect(heading(page)).toHaveText('Job search is ready');
    await expect(page).toHaveURL(/\/projects\/p-job$/);

    await page.goto('/projects/p-gone');
    await expect(heading(page)).toHaveText('Job search is ready');
});

test("moving between projects asks Claude's status only on entry, so its failure after does not eject", async ({
    page,
}) => {
    const daemon = await connected(page);
    daemon.projects = [
        { id: 'p-health', name: 'Health' },
        { id: 'p-job', name: 'Job search' },
    ];

    await page.goto('/projects/p-health');
    await expect(heading(page)).toHaveText('Health is ready');
    expect(daemon.countCalls('claude/status')).toBe(1);

    daemon.claudeStatusError = 'claude auth status printed no JSON';
    await sidebarProject(page, 'Job search').click();
    await expect(heading(page)).toHaveText('Job search is ready');
    await sidebarProject(page, 'Health').click();
    await expect(heading(page)).toHaveText('Health is ready');
    expect(daemon.countCalls('claude/status')).toBe(1);
});

test('projects that could not be loaded show why and are tried again', async ({ page }) => {
    const daemon = await connected(page);
    daemon.projects = [{ id: 'p-health', name: 'Health' }];
    daemon.projectListFails = true;

    await page.goto('/');
    await expect(heading(page)).toHaveText("Couldn't load your projects");
    await page.getByRole('button', { name: 'Show details' }).click();
    await expect(page.getByText('EACCES: permission denied')).toBeVisible();

    daemon.projectListFails = false;
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(heading(page)).toHaveText('Health is ready');
});

/** The stub daemon with the sandbox ready and Claude connected: the first run is done. */
async function connected(page: Page) {
    const daemon = await StubDaemon.install(page);
    daemon.claude = { connected: true, email: ACCOUNT_EMAIL, plan: 'max', planAllowed: true };
    return daemon;
}

function heading(page: Page) {
    return page.getByRole('heading', { level: 1 });
}

function sidebarProject(page: Page, name: string) {
    return page.getByRole('navigation', { name: 'Projects' }).getByRole('link', { name });
}
