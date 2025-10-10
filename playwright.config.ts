import { defineConfig, devices } from '@playwright/test';

// Config para Playwright con Cucumber
export default defineConfig({
    testDir: './features',
    timeout: 30000,
    expect: {
        timeout: 5000
    },
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0, // retry en CI, localmente no
    workers: process.env.CI ? 1 : 1,
    reporter: 'html',
    use: {
        baseURL: 'https://automationexercise.com',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        // headless: process.env.HEADLESS !== 'false', // no funciona bien con cucumber
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        // TODO: agregar más browsers cuando estabilice los tests
        // {
        //     name: 'firefox',
        //     use: { ...devices['Desktop Firefox'] },
        // },
    ],
});
