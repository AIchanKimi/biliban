import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.js/,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1, // 扩展 + persistent context：串行保证稳定
  retries: 0,
  reporter: [['list']],
  use: {
    viewport: { width: 1280, height: 800 },
  },
});
