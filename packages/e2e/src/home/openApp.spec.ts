import { expect, test } from '@playwright/test';

test('the built app opens on the home screen', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
