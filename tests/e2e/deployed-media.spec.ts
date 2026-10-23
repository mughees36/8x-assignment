import { test, expect } from '@playwright/test';
test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'Production verification runs only with an explicit deployed URL');
test('anonymous production serves ten meetings and playable seekable demo media', async ({ page }) => {
  await page.goto('/meetings');
  await expect(page.getByRole('link', { name: /^Open / })).toHaveCount(10);
  await page.getByRole('link', { name: 'Open Product Launch Planning', exact: true }).click();
  const media = page.locator('video').first();
  await expect.poll(() => media.evaluate((video: HTMLVideoElement) => Number.isFinite(video.duration) && video.duration > 2), { timeout: 30000 }).toBe(true);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect.poll(() => media.evaluate((video: HTMLVideoElement) => video.currentTime)).toBeGreaterThan(0);
  await page.getByLabel('Seek media').fill('2');
  await expect.poll(() => media.evaluate((video: HTMLVideoElement) => video.currentTime)).toBeGreaterThanOrEqual(2);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.screenshot({ path: `test-results/production-${test.info().project.name}.png`, fullPage: true });
});
