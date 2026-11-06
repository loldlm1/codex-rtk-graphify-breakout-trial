import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T10:00:00Z') });
  await page.goto('/');
  await page.clock.pauseAt(new Date('2026-01-01T10:01:00Z'));
  await page.clock.runFor(32);
});

test('keyboard accessible pause/resume freezes the rendered game and continues safely', async ({ page }, info) => {
  const pause = page.getByRole('button', { name: 'Pause', exact: true });
  await expect(pause).toBeVisible();
  await pause.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('status', { name: 'Round status' })).toHaveText(/paused/i);
  const image = await page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  const hud = await page.locator('.dashboard').innerText();
  await page.keyboard.down('ArrowRight'); await page.clock.runFor(60000); await page.keyboard.up('ArrowRight');
  expect(await page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())).toBe(image);
  expect(await page.locator('.dashboard').innerText()).toBe(hud);
  await page.screenshot({ path: info.outputPath('paused-desktop.png'), fullPage: true });
  const resume = page.getByRole('button', { name: 'Resume', exact: true });
  await resume.focus(); await page.keyboard.press('Enter'); await page.clock.runFor(160);
  await expect(page.getByRole('status', { name: 'Round status' })).not.toHaveText(/paused/i);
  expect(await page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())).not.toBe(image);
  await expect(page.getByLabel('Lives', { exact: true })).toHaveText('3');
});

test('Restart works from play, pause, repeated clicks, and game over', async ({ page }) => {
  const restart = page.getByRole('button', { name: 'Restart', exact: true });
  await expect(restart).toBeVisible();
  await page.clock.runFor(1500);
  await expect(page.getByLabel('Score', { exact: true })).not.toHaveText('000');
  for (let n = 0; n < 5; n++) await restart.click();
  await expect(page.getByLabel('Score', { exact: true })).toHaveText('000');
  await expect(page.getByLabel('Bricks left', { exact: true })).toHaveText('40');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await restart.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  const box = (await page.locator('canvas').boundingBox())!;
  await page.mouse.move(box.x + 5, box.y + box.height - 30); await page.clock.runFor(24000);
  await expect(page.getByRole('status', { name: 'Round status' })).toHaveText(/game over/i);
  await restart.click();
  await expect(page.getByLabel('Lives', { exact: true })).toHaveText('3');
  await expect(page.getByLabel('Score', { exact: true })).toHaveText('000');
  await expect(page.getByLabel('Bricks left', { exact: true })).toHaveText('40');
  await page.clock.runFor(1500);
  await expect(page.getByLabel('Score', { exact: true })).not.toHaveText('000');
});

test('mobile feature controls remain readable, operable and inside the viewport', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pause = page.getByRole('button', { name: 'Pause', exact: true });
  const restart = page.getByRole('button', { name: 'Restart', exact: true });
  await expect(pause).toBeVisible(); await expect(restart).toBeVisible();
  for (const control of [pause, restart]) {
    const box = (await control.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
  }
  await pause.click();
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('paused-mobile.png'), fullPage: true });
  await restart.click();
  await expect(page.getByLabel('Lives', { exact: true })).toHaveText('3');
});
