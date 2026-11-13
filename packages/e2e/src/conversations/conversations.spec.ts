import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import type { ConversationError, ConversationMessage } from '@poweragents/common/api/ConversationTypes.js';

import { ACCOUNT_EMAIL, GOOD_CODE, StubDaemon } from '../StubDaemon.js';

test("a conversation starts from the project's empty state, and the agent's text and steps stream in", async ({
    page,
}) => {
    const daemon = await connected(page);
    daemon.projects = [{ id: 'p-health', name: 'Health' }];

    await page.goto('/projects/p-health');
    await expect(heading(page)).toHaveText('Health is ready');
    await expect.poll(() => daemon.streaming).toBe(true);
    await composer(page).fill('Write a morning plan to plan.md');
    await composer(page).press('Enter');

    await expect(page).toHaveURL(/\/projects\/p-health\/conversations\/c-1$/);
    await expect(messages(page).getByText('Write a morning plan to plan.md')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
    await expect(sidebarLink(page, 'Untitled conversation')).toHaveAttribute('aria-current', 'page');
    expect(daemon.sent).toEqual([{ conversationId: 'c-1', text: 'Write a morning plan to plan.md', queued: false }]);

    daemon.emit({ type: 'conversationRenamed', conversationId: 'c-1', title: 'Morning plan' });
    await expect(sidebarLink(page, 'Morning plan')).toHaveAttribute('aria-current', 'page');

    daemon.emit({ type: 'textDelta', conversationId: 'c-1', messageId: 'a-1', delta: 'First I read your ' });
    daemon.emit({ type: 'textDelta', conversationId: 'c-1', messageId: 'a-1', delta: '**notes**.' });
    await expect(messages(page).getByText('First I read your notes.')).toBeVisible();
    await expect(messages(page).locator('strong')).toHaveText('notes');

    const step = { id: 's-1', kind: 'writeFile', target: 'plan.md', status: 'running' } as const;
    daemon.emit({ type: 'stepStarted', conversationId: 'c-1', step });
    await expect(messages(page).getByText('Writing plan.md (in progress)')).toBeVisible();
    daemon.emit({ type: 'stepFinished', conversationId: 'c-1', stepId: 's-1' });
    await expect(messages(page).getByText('Writing plan.md', { exact: true })).toBeVisible();

    // The run ends: the app reads what the agent stored.
    daemon.messages['c-1'] = [
        user('m-1', 'Write a morning plan to plan.md'),
        {
            type: 'agent',
            id: 'a-1',
            createdAt: 2,
            parts: [
                { type: 'text', text: 'First I read your **notes**.' },
                { type: 'step', ...step, status: 'done' },
                { type: 'text', text: 'Done: three points are in plan.md.' },
            ],
        },
        { type: 'runEnd', id: 'e-1', createdAt: 3, outcome: 'succeeded' },
    ];
    daemon.setRunning('c-1', false);
    daemon.emit({ type: 'runFinished', conversationId: 'c-1', outcome: 'succeeded' });
    await expect(messages(page).getByText('Done: three points are in plan.md.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Stop' })).toBeHidden();
    const summary = messages(page).getByRole('button', { name: 'one step' });
    await expect(summary).toHaveAttribute('aria-expanded', 'false');
    await summary.click();
    await expect(messages(page).getByText('Writing plan.md', { exact: true })).toBeVisible();
});

test('the reply to a follow-up message streams under it, not into the reply before', async ({ page }) => {
    const daemon = await conversation(page, [user('m-1', 'Hello'), agent('a-1', 'First answer')]);

    await composer(page).fill('Read notes.md');
    await composer(page).press('Enter');
    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
    // As the daemon does, the step is stored as it starts: a page read meanwhile shows it too.
    const started = { id: 's-1', kind: 'readFile', target: 'notes.md', status: 'running' } as const;
    daemon.messages['c-1'] = [
        ...(daemon.messages['c-1'] ?? []),
        { type: 'agent', id: 'a-2', createdAt: 3, parts: [{ type: 'step', ...started }] },
    ];
    daemon.emit({ type: 'stepStarted', conversationId: 'c-1', step: started });

    const step = messages(page).getByText('Reading notes.md (in progress)');
    await expect(step).toBeVisible();
    const question = await messages(page).getByText('Read notes.md', { exact: true }).boundingBox();
    const answer = await messages(page).getByText('First answer').boundingBox();
    const stepBox = await step.boundingBox();
    expect(question && answer && stepBox && answer.y < question.y && question.y < stepBox.y).toBe(true);
});

test('a message sent while the agent works waits for it, and comes back to the composer when the agent is stopped', async ({
    page,
}) => {
    const daemon = await conversation(page, [user('m-1', 'Run sleep 60')], true);

    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
    await expect(composer(page)).toHaveAttribute('placeholder', 'Add something while the agent works…');
    await composer(page).fill('And add a fourth point');
    await composer(page).press('Enter');
    await expect(messages(page).getByText('And add a fourth point')).toBeVisible();
    await expect(composer(page)).toHaveValue('');
    expect(daemon.sent).toEqual([{ conversationId: 'c-1', text: 'And add a fourth point', queued: true }]);

    await page.getByRole('button', { name: 'Stop' }).click();
    await expect(composer(page)).toHaveValue('And add a fourth point');
    await expect(messages(page).getByText('And add a fourth point')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Stop' })).toBeHidden();
    await expect(messages(page).getByText('Run sleep 60')).toBeVisible();
});

test("an error on Claude's side offers to send the message again", async ({ page }) => {
    const daemon = await conversation(page, failedRun({ kind: 'other', message: 'Overloaded' }));

    await expect(
        messages(page).getByText("The agent didn't answer: Claude reported an error on its side."),
    ).toBeVisible();
    await expect(page.getByRole('alert')).toBeHidden();
    await messages(page).getByRole('button', { name: 'Try again' }).click();

    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
    expect(daemon.sent).toEqual([{ conversationId: 'c-1', text: 'Add an evening routine', queued: false }]);
});

test('signed out of Claude: the banner leads to signing in again, after which the message can be sent again', async ({
    page,
}) => {
    const daemon = await conversation(page, failedRun({ kind: 'signedOut' }));

    await expect(messages(page).getByText('No answer: you were signed out of Claude.')).toBeVisible();
    await expect(messages(page).getByRole('button', { name: 'Try again' })).toBeHidden();
    const banner = page.getByRole('alert');
    await expect(banner).toContainText('You were signed out of Claude');
    await banner.getByRole('button', { name: 'Sign in again' }).click();

    await expect(page).toHaveURL(/\/setup\/ai$/);
    await page.getByRole('button', { name: 'Connect Claude' }).click();
    await page.getByRole('textbox', { name: 'Code from Claude' }).fill(GOOD_CODE);
    await page.getByRole('button', { name: 'Connect', exact: true }).click();
    await page.getByRole('button', { name: 'Go to the app' }).click();
    await page.getByRole('navigation', { name: 'Projects' }).getByRole('link', { name: 'Health' }).click();
    await sidebarLink(page, 'Morning plan').click();

    // Signed in again: the banner goes, and the message can be sent again.
    await expect(messages(page).getByText('No answer: you were signed out of Claude.')).toBeVisible();
    await expect(page.getByRole('alert')).toBeHidden();
    await messages(page).getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
    expect(daemon.sent).toEqual([{ conversationId: 'c-1', text: 'Add an evening routine', queued: false }]);
});

test('the usage limit says when it resets, or that Claude did not say, and offers to try again once it may have', async ({
    page,
}) => {
    const resetAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const daemon = await conversation(page, failedRun({ kind: 'usageLimit', resetAt }));

    const banner = page.getByRole('alert');
    await expect(banner).toContainText('Claude usage limit reached');
    const expected = new Date(resetAt).toLocaleDateString('en', { day: 'numeric', month: 'long' });
    await expect(banner).toContainText(`The limit resets on ${expected} at`);
    await expect(messages(page).getByText('No answer: your Claude usage limit is used up.')).toBeVisible();
    await expect(messages(page).getByRole('button', { name: 'Try again' })).toBeHidden();

    // Claude did not say when: the banner stays, and trying again is up to the person.
    daemon.messages['c-1'] = failedRun({ kind: 'usageLimit' });
    daemon.emit({ type: 'streamRestored' });
    await expect(banner).toContainText("The limit will reset after a while; Claude didn't say when.");
    await expect(messages(page).getByRole('button', { name: 'Try again' })).toBeVisible();

    // The limit resets while the conversation is open: the banner goes and the message can be sent again.
    daemon.messages['c-1'] = failedRun({ kind: 'usageLimit', resetAt: Date.now() + 2000 });
    daemon.emit({ type: 'streamRestored' });
    await expect(banner).toContainText('Claude usage limit reached');
    await expect(messages(page).getByRole('button', { name: 'Try again' })).toBeHidden();
    await expect(banner).toBeHidden({ timeout: 10_000 });
    await expect(messages(page).getByRole('button', { name: 'Try again' })).toBeVisible();
});

test('a run that ends before its message is answered leaves the conversation not running', async ({ page }) => {
    const daemon = await conversation(page, [user('m-1', 'Hello'), agent('a-1', 'Hi')]);
    const release = daemon.hold('conversations/send');

    await composer(page).fill('Write the plan');
    await composer(page).press('Enter');
    await expect.poll(() => daemon.countCalls('conversations/send')).toBe(1);
    // The run fails at once (signed out), and the daemon says so before it answers the send.
    daemon.messages['c-1'] = [
        ...(daemon.messages['c-1'] ?? []),
        { type: 'runEnd', id: 'e-1', createdAt: Date.now(), outcome: 'failed', error: { kind: 'signedOut' } },
    ];
    daemon.setRunning('c-1', false);
    daemon.emit({ type: 'runFinished', conversationId: 'c-1', outcome: 'failed', error: { kind: 'signedOut' } });
    await expect(page.getByRole('alert')).toContainText('You were signed out of Claude');

    const reads = daemon.countCalls('conversations/messages');
    release();
    // Answered, the app reads the messages again.
    await expect.poll(() => daemon.countCalls('conversations/messages')).toBeGreaterThan(reads);
    await expect(page.getByRole('button', { name: 'Stop' })).toBeHidden();
    await expect(composer(page)).not.toHaveAttribute('placeholder', 'Add something while the agent works…');
});

test("the messages are read while the agent's text streams without a pause", async ({ page }) => {
    const daemon = await conversation(page, [user('m-1', 'Write the plan')], true);
    daemon.messagesDelayMs = 150;
    const writing = setInterval(() => {
        daemon.emit({ type: 'textDelta', conversationId: 'c-1', messageId: 'a-1', delta: 'word ' });
    }, 20);

    try {
        daemon.messages['c-1'] = [user('m-1', 'Write the plan'), user('m-2', 'And the evening too')];
        daemon.emit({ type: 'streamRestored' });
        await expect(messages(page).getByText('And the evening too')).toBeVisible();
    } finally {
        clearInterval(writing);
    }
});

test('the open conversation is read again when the stream had a gap, or the connection came back', async ({ page }) => {
    const first = [user('m-1', 'Hello'), agent('a-1', 'First answer')];
    const daemon = await conversation(page, first);
    await expect(messages(page).getByText('First answer')).toBeVisible();

    const second = [...first, user('m-2', 'More'), agent('a-2', 'Second answer')];
    daemon.messages['c-1'] = second;
    daemon.emit({ type: 'streamRestored' });
    await expect(messages(page).getByText('Second answer')).toBeVisible();

    daemon.messages['c-1'] = [...second, user('m-3', 'And more'), agent('a-3', 'Third answer')];
    daemon.closeStreams();
    await expect(messages(page).getByText('Third answer')).toBeVisible();
});

test('a message sent again while the agent works stays shown until the agent takes it', async ({ page }) => {
    const said: ConversationMessage = { type: 'user', id: 'm-1', createdAt: Date.now(), text: 'Yes' };
    const daemon = await conversation(page, [said], true);

    await composer(page).fill('Yes');
    await composer(page).press('Enter');
    await expect(messages(page).getByText('Yes', { exact: true })).toHaveCount(2);

    // Read again: the earlier "Yes" the daemon lists is not the one waiting.
    daemon.messages['c-1'] = [said, agent('a-1', 'Working on it')];
    daemon.emit({ type: 'streamRestored' });
    await expect(messages(page).getByText('Working on it')).toBeVisible();
    await expect(messages(page).getByText('Yes', { exact: true })).toHaveCount(2);

    // Taken: listed under the id the send was answered with, it shows once.
    daemon.messages['c-1'] = [said, agent('a-1', 'Working on it'), user('sent-1', 'Yes'), agent('a-2', 'Done')];
    daemon.emit({ type: 'streamRestored' });
    await expect(messages(page).getByText('Done')).toBeVisible();
    await expect(messages(page).getByText('Yes', { exact: true })).toHaveCount(2);
});

test("a page of messages read while the agent's steps streamed is read again, not shown stale", async ({ page }) => {
    const daemon = await conversation(page, [user('m-1', 'Write the plan')], true);
    const step = { id: 's-1', kind: 'writeFile', target: 'plan.md', status: 'running' } as const;
    daemon.emit({ type: 'stepStarted', conversationId: 'c-1', step });
    await expect(messages(page).getByText('Writing plan.md (in progress)')).toBeVisible();

    daemon.messages['c-1'] = [
        user('m-1', 'Write the plan'),
        { type: 'agent', id: 'a-1', createdAt: 2, parts: [{ type: 'step', ...step }] },
    ];
    const release = daemon.hold('conversations/messages');
    const reads = daemon.countCalls('conversations/messages');
    daemon.emit({ type: 'streamRestored' });
    await expect.poll(() => daemon.countCalls('conversations/messages')).toBe(reads + 1);
    daemon.emit({ type: 'stepFinished', conversationId: 'c-1', stepId: 's-1' });
    await expect(messages(page).getByText('Writing plan.md', { exact: true })).toBeVisible();
    daemon.messages['c-1'] = [
        user('m-1', 'Write the plan'),
        {
            type: 'agent',
            id: 'a-1',
            createdAt: 2,
            parts: [
                { type: 'step', ...step, status: 'done' },
                { type: 'text', text: 'Plan written.' },
            ],
        },
    ];
    release();

    await expect(messages(page).getByText('Plan written.')).toBeVisible();
    await expect(messages(page).getByText('Writing plan.md (in progress)')).toBeHidden();
});

test('the open conversation is read again when the event stream opens after the daemon first refused it', async ({
    page,
}) => {
    const daemon = await connected(page);
    daemon.eventsRefused = true;
    daemon.projects = [{ id: 'p-health', name: 'Health' }];
    daemon.conversations['p-health'] = [{ id: 'c-1', title: 'Morning plan', updatedAt: 1, running: false }];
    daemon.messages['c-1'] = [user('m-1', 'Hello'), agent('a-1', 'First answer')];
    await page.goto('/projects/p-health/conversations/c-1');
    await expect(messages(page).getByText('First answer')).toBeVisible();

    daemon.messages['c-1'] = [user('m-1', 'Hello'), agent('a-1', 'First answer'), agent('a-2', 'Second answer')];
    daemon.eventsRefused = false;

    // The app tries the refused stream again a few seconds later.
    await expect(messages(page).getByText('Second answer')).toBeVisible({ timeout: 10_000 });
});

/** The stub daemon with the sandbox ready and Claude connected: the first run is done. */
async function connected(page: Page) {
    const daemon = await StubDaemon.install(page);
    daemon.claude = { connected: true, email: ACCOUNT_EMAIL, plan: 'max', planAllowed: true };
    return daemon;
}

/** Opens conversation `c-1` of project Health, holding `history`, with the agent working on it or not. */
async function conversation(page: Page, history: ConversationMessage[], running = false) {
    const daemon = await connected(page);
    daemon.projects = [{ id: 'p-health', name: 'Health' }];
    daemon.conversations['p-health'] = [{ id: 'c-1', title: 'Morning plan', updatedAt: 1, running }];
    daemon.messages['c-1'] = history;

    await page.goto('/projects/p-health/conversations/c-1');
    await expect(heading(page)).toHaveText('Morning plan');
    await expect.poll(() => daemon.streaming).toBe(true);
    return daemon;
}

/** A finished reply, then a message whose run failed with `error`. */
function failedRun(error: ConversationError): ConversationMessage[] {
    return [
        user('m-1', 'Write a morning plan'),
        agent('a-1', 'Done: plan.md has the plan.'),
        user('m-2', 'Add an evening routine'),
        { type: 'runEnd', id: 'e-2', createdAt: 5, outcome: 'failed', error },
    ];
}

function user(id: string, text: string): ConversationMessage {
    return { type: 'user', id, createdAt: 1, text };
}

function agent(id: string, text: string): ConversationMessage {
    return { type: 'agent', id, createdAt: 2, parts: [{ type: 'text', text }] };
}

function heading(page: Page) {
    return page.getByRole('heading', { level: 1 });
}

function composer(page: Page) {
    return page.getByRole('textbox', { name: 'Message to the agent' });
}

function messages(page: Page) {
    return page.getByRole('region', { name: 'Messages' });
}

function sidebarLink(page: Page, name: string) {
    return page.getByRole('navigation', { name: 'Projects' }).getByRole('link', { name });
}
