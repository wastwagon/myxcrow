import { defineConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const outDir = process.env.PW_OUTPUT || path.join(dir, '../pen-drive-1/04-screen-recording/playwright-output');

export default defineConfig({
  testDir: dir,
  testMatch: 'demo.spec.ts',
  outputDir: outDir,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3017',
    video: { mode: 'on', size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 },
    launchOptions: { slowMo: 600 },
  },
  reporter: 'line',
});
