import { defineConfig } from '@playwright/test'

// Smoke tests run against a local backend (dev mode, localhost:8200) through
// the Vite dev proxy. They only open pages; they never create or delete data.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.pw.js',
  timeout: 60_000,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3100',
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: 'npx vite --port 3100 --strictPort',
    url: 'http://localhost:3100',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
