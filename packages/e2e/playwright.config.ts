import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

// The built app, served as it is deployed. Every test creates its own data, so tests run in parallel.
export default defineConfig({
    testDir: './src',
    testMatch: /\.spec\.ts$/,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    // A flaky test is a red to fix, not to retry away.
    retries: 0,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${PORT}`,
        // The same test-id attribute the component tests use (`vitest.config.ts`).
        testIdAttribute: 'tid',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    webServer: {
        // Always this worktree's build, through Nx (a cache hit is safe: `references/nx.md`). A reused
        // server may be another worktree's, or a stale build.
        command: `bun nx run @poweragents/app:build && PORT=${PORT} bun src/serveApp.ts`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: false,
        timeout: 180_000,
        stdout: 'ignore',
        stderr: 'pipe',
    },
});
