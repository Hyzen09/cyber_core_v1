import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  // GLOBAL TIMEOUT: Extended to 120s specifically for heavy local LLM queries
  timeout: 120 * 1000, 
  
  expect: {
    // EXPECT TIMEOUT: Extended to 30s to wait for streaming/long generation
    timeout: 30 * 1000,
  },

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // Standard UI action timeout
    actionTimeout: 15 * 1000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Automatically spin up your Next.js dev server before testing
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
