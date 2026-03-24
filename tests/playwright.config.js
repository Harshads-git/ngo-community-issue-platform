// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './specs',
    timeout: 30_000,
    expect: {
        timeout: 5_000,
    },
    fullyParallel: false, // Run sequentially so state (register -> login) is consistent
    reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
    use: {
        baseURL: 'http://127.0.0.1:3000',
        headless: false, // Show the browser so the user can watch
        viewport: { width: 1280, height: 720 },
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
