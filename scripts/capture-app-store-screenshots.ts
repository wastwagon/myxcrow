/**
 * Capture App Store–ready screenshots of premium MYXCROW mockups.
 * Uses exact dimensions from App Store Connect for iPhone and iPad.
 * Mockups include device frames, benefit headlines, and marketing copy.
 *
 * Prerequisites:
 *   1. Run `pnpm install` and `pnpm exec playwright install chromium`
 *   2. Start the web app: `cd apps/web && pnpm dev`
 *   3. Run this script: `pnpm screenshots`
 *
 * Output: Screenshots saved to project root in app-store-previews/
 */

import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.join(process.cwd(), 'app-store-previews');

// App Store Connect exact dimensions (from Apple's requirements)
const SIZES = {
  // iPhone 6.5" Display
  iphone: {
    portrait_6_5: { width: 1242, height: 2688 },
    landscape_6_5: { width: 2688, height: 1242 },
    portrait_6_7: { width: 1284, height: 2778 },
    landscape_6_7: { width: 2778, height: 1284 },
  },
  // iPad 12.9" / 13" Display
  ipad: {
    portrait_12_9: { width: 2064, height: 2752 },
    landscape_12_9: { width: 2752, height: 2064 },
    portrait_12_9_alt: { width: 2048, height: 2732 },
    landscape_12_9_alt: { width: 2732, height: 2048 },
  },
} as const;

// Premium mockup pages (device frames, marketing copy)
const PAGES = [
  { path: '/mockup/home', name: 'home', label: 'Home (Hero + Features)' },
  { path: '/mockup/login', name: 'login', label: 'Login' },
  { path: '/mockup/register', name: 'register', label: 'Register' },
];

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function captureScreenshot(
  page: import('@playwright/test').Page,
  viewport: { width: number; height: number },
  device: string,
  pageName: string,
  orientation: string
) {
  const filename = `${device}-${pageName}-${orientation}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);

  await page.setViewportSize(viewport);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Allow animations/transitions

  await page.screenshot({
    path: filepath,
    clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
  });

  console.log(`  ✓ ${filename}`);
}

async function main() {
  console.log('MYXCROW App Store Screenshot Capture');
  console.log('====================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  ensureDir(OUTPUT_DIR);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: null,
  });

  const page = await context.newPage();

  // Ignore API errors (home page health check may fail)
  page.on('requestfailed', () => {});
  page.on('console', () => {});

  try {
    for (const { path: route, name, label } of PAGES) {
      console.log(`\nCapturing: ${label} (${route})`);

      await page.goto(`${BASE_URL}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      // iPhone sizes
      for (const [key, viewport] of Object.entries(SIZES.iphone)) {
        const orientation = key.includes('landscape') ? 'landscape' : 'portrait';
        await captureScreenshot(page, viewport, 'iphone', name, key);
      }

      // iPad sizes
      for (const [key, viewport] of Object.entries(SIZES.ipad)) {
        const orientation = key.includes('landscape') ? 'landscape' : 'portrait';
        await captureScreenshot(page, viewport, 'ipad', name, key);
      }
    }
  } catch (err) {
    console.error('\nError:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }

  console.log('\n✓ Done! Screenshots saved to app-store-previews/');
}

main();
