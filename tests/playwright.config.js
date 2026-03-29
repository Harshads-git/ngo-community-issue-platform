// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './specs',
    timeout: 60_000,
    expect: {
        timeout: 8_000,
    },
    fullyParallel: false, // Run sequentially so state (register -> login) is consistent
    reporter: [['list'], ['html', { outputFolder: '../tests/playwright-report', open: 'never' }]],
    use: {
        baseURL: 'http://127.0.0.1:3000',
        headless: false, // Show the browser so the user can watch
        viewport: { width: 1280, height: 720 },
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    webServer: {
        command: 'npx http-server ../frontend/website -p 3000 -c-1 --silent',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: true,
        timeout: 30_000,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
