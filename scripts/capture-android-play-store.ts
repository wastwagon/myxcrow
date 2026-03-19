/**
 * Capture Android Play Store assets at required dimensions.
 * Generates: app icon (512×512), feature graphic (1024×500), phone and tablet screenshots.
 *
 * Prerequisites:
 *   1. pnpm install && pnpm exec playwright install chromium
 *   2. For mockup screenshots: start web app (cd apps/web && pnpm dev)
 *   3. Run: pnpm play-store-assets
 *
 * Output: /Users/OceanCyber/Downloads/MYXCROW-PlayStore-Assets/
 */

import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';

const DOWNLOADS = process.env.HOME
  ? path.join(process.env.HOME, 'Downloads')
  : path.join(process.cwd(), 'Downloads');
const OUTPUT_DIR = process.env.PLAY_STORE_OUTPUT || path.join(DOWNLOADS, 'MYXCROW-PlayStore-Assets');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const REPO_ROOT = process.cwd();
const PUBLIC_DIR = path.join(REPO_ROOT, 'apps', 'web', 'public');

// Google Play Store exact requirements
const ANDROID_SIZES = {
  appIcon: { width: 512, height: 512 },
  featureGraphic: { width: 1024, height: 500 },
  phone: {
    portrait: { width: 1080, height: 1920 },  // 9:16, min 1080 for promotion
    landscape: { width: 1920, height: 1080 }, // 16:9
  },
  tablet7: {
    portrait: { width: 1080, height: 1920 },
    landscape: { width: 1920, height: 1080 },
  },
  tablet10: {
    portrait: { width: 1440, height: 2560 },
    landscape: { width: 2560, height: 1440 },
  },
} as const;

const MOCKUP_PAGES = [
  { path: '/mockup/home', name: 'home', label: 'Home' },
  { path: '/mockup/login', name: 'login', label: 'Login' },
  { path: '/mockup/register', name: 'register', label: 'Register' },
];

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function capture(
  page: import('@playwright/test').Page,
  viewport: { width: number; height: number },
  filepath: string,
  options?: { fullPage?: boolean }
) {
  await page.setViewportSize(viewport);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
  await page.screenshot({
    path: filepath,
    ...(options?.fullPage !== false
      ? { clip: { x: 0, y: 0, width: viewport.width, height: viewport.height } }
      : {}),
  });
  console.log(`  ✓ ${path.basename(filepath)}`);
}

async function main() {
  console.log('MYXCROW Android Play Store Assets');
  console.log('=================================');
  console.log(`Output: ${OUTPUT_DIR}\n`);

  ensureDir(OUTPUT_DIR);
  ensureDir(path.join(OUTPUT_DIR, 'phone'));
  ensureDir(path.join(OUTPUT_DIR, 'tablet-7inch'));
  ensureDir(path.join(OUTPUT_DIR, 'tablet-10inch'));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    viewport: null,
  });
  const page = await context.newPage();
  page.on('requestfailed', () => {});
  page.on('console', () => {});

  try {
    // —— App icon 512×512 (from static HTML, no server needed)
    const iconHtml = path.join(PUBLIC_DIR, 'play-store-icon.html');
    if (fs.existsSync(iconHtml)) {
      console.log('Capturing: App icon (512×512)');
      const fileUrl = pathToFileURL(iconHtml).href;
      await page.goto(fileUrl, { waitUntil: 'load', timeout: 10000 });
      await capture(page, ANDROID_SIZES.appIcon, path.join(OUTPUT_DIR, 'app-icon-512.png'));
    } else {
      console.warn('  Skip app icon (missing apps/web/public/play-store-icon.html)');
    }

    // —— Feature graphic 1024×500 (from static HTML)
    const featureHtml = path.join(PUBLIC_DIR, 'play-store-feature-graphic.html');
    if (fs.existsSync(featureHtml)) {
      console.log('\nCapturing: Feature graphic (1024×500)');
      const fileUrl = pathToFileURL(featureHtml).href;
      await page.goto(fileUrl, { waitUntil: 'load', timeout: 10000 });
      await capture(page, ANDROID_SIZES.featureGraphic, path.join(OUTPUT_DIR, 'feature-graphic-1024x500.png'));
    } else {
      console.warn('  Skip feature graphic (missing play-store-feature-graphic.html)');
    }

    // —— Phone & tablet screenshots (require BASE_URL)
    let serverOk = false;
    try {
      const r = await page.goto(BASE_URL + '/mockup/home', { waitUntil: 'domcontentloaded', timeout: 8000 });
      serverOk = r && r.ok();
    } catch {
      serverOk = false;
    }

    if (serverOk) {
      for (const { path: route, name, label } of MOCKUP_PAGES) {
        console.log(`\nCapturing: ${label} (${route})`);
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: 15000 });

        const vp = ANDROID_SIZES.phone;
        await capture(
          page,
          vp.portrait,
          path.join(OUTPUT_DIR, 'phone', `phone-${name}-portrait-1080x1920.png`)
        );
        await capture(
          page,
          vp.landscape,
          path.join(OUTPUT_DIR, 'phone', `phone-${name}-landscape-1920x1080.png`)
        );
      }

      console.log('\nCapturing: 7-inch tablet screenshots');
      await page.goto(`${BASE_URL}/mockup/home`, { waitUntil: 'networkidle', timeout: 15000 });
      const t7 = ANDROID_SIZES.tablet7;
      await capture(
        page,
        t7.portrait,
        path.join(OUTPUT_DIR, 'tablet-7inch', 'tablet-7-home-portrait-1080x1920.png')
      );
      await capture(
        page,
        t7.landscape,
        path.join(OUTPUT_DIR, 'tablet-7inch', 'tablet-7-home-landscape-1920x1080.png')
      );

      console.log('\nCapturing: 10-inch tablet screenshots');
      await page.goto(`${BASE_URL}/mockup/home`, { waitUntil: 'networkidle', timeout: 15000 });
      const t10 = ANDROID_SIZES.tablet10;
      await capture(
        page,
        t10.portrait,
        path.join(OUTPUT_DIR, 'tablet-10inch', 'tablet-10-home-portrait-1440x2560.png')
      );
      await capture(
        page,
        t10.landscape,
        path.join(OUTPUT_DIR, 'tablet-10inch', 'tablet-10-home-landscape-2560x1440.png')
      );
    } else {
      console.log('\nSkipping phone/tablet screenshots (start web app: cd apps/web && pnpm dev)');
    }
  } catch (err) {
    console.error('\nError:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }

  console.log('\nDone. Assets saved to:', OUTPUT_DIR);
}

main();
