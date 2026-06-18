import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3017';

test.use({
  video: { mode: 'on', size: { width: 1280, height: 720 } },
  viewport: { width: 1280, height: 720 },
  launchOptions: { slowMo: 500 },
});

test('MYXCROW registration demo', async ({ page }) => {
  test.setTimeout(90000);

  await page.goto(`${BASE}/login`);
  await page.waitForSelector('#identifier', { timeout: 30000 });

  await page.fill('#identifier', 'buyer1@test.com');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 30000 });
  await page.waitForTimeout(2000);

  await page.goto(`${BASE}/escrows`);
  await page.waitForTimeout(2000);

  await page.goto(`${BASE}/wallet`);
  await page.waitForTimeout(2000);

  await page.goto(`${BASE}/login`);
  await page.fill('#identifier', 'admin@myxcrow.com');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  await page.goto(`${BASE}/admin`);
  await page.waitForTimeout(3000);

  await expect(page.locator('body')).toBeVisible();
});
