import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run sequentially for auth state predictability
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --port 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      NEXT_PUBLIC_E2E_TEST_MODE: 'true',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
