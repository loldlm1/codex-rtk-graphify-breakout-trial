import { expect, test, type Page } from '@playwright/test';

async function paddleCenter(page: Page) {
  return page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    const scale = canvas.width / 720;
    const ctx = canvas.getContext('2d')!;
    const row = ctx.getImageData(0, Math.round(483 * scale), canvas.width, 1).data;
    const xs: number[] = [];
    for (let x = 0; x < canvas.width; x++) {
      if (row[x * 4] === 197 && row[x * 4 + 1] === 181 && row[x * 4 + 2] === 238) xs.push(x / scale);
    }
    return xs.reduce((a, b) => a + b, 0) / xs.length;
  });
}

async function openControlledGame(page: Page) {
  await page.clock.install({ time: new Date('2026-01-01T10:00:00Z') });
  await page.goto('/');
  await page.clock.pauseAt(new Date('2026-01-01T10:01:00Z'));
  await page.clock.runFor(32);
}

test('real Canvas paints the game and keyboard input moves the visible paddle', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await openControlledGame(page);
  await expect(page.getByRole('heading', { name: 'Make a little space.' })).toBeVisible();
  await expect(page.getByLabel('Bricks left', { exact: true })).toHaveText('40');
  const start = await paddleCenter(page);
  await page.getByLabel('Breakout arena').focus();
  await page.keyboard.down('ArrowRight'); await page.clock.runFor(200); await page.keyboard.up('ArrowRight');
  expect(await paddleCenter(page)).toBeGreaterThan(start + 80);
  await page.keyboard.down('a'); await page.clock.runFor(200); await page.keyboard.up('a');
  expect(Math.abs((await paddleCenter(page)) - start)).toBeLessThanOrEqual(9);
  const settled = await paddleCenter(page); await page.clock.runFor(100);
  expect(await paddleCenter(page)).toBe(settled);
  await page.clock.runFor(1500);
  await expect(page.getByLabel('Score', { exact: true })).not.toHaveText('000');
  await page.screenshot({ path: info.outputPath('desktop-gameplay.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('an unattended round reaches game over and page refresh starts a fresh round', async ({ page }) => {
  await openControlledGame(page);
  const arena = page.getByLabel('Breakout arena');
  const box = (await arena.boundingBox())!;
  await page.mouse.move(box.x + 5, box.y + box.height - 30);
  await page.clock.runFor(24000);
  await expect(page.getByRole('status', { name: 'Round status' })).toHaveText(/Game over. Refresh/);
  await expect(page.getByLabel('Lives', { exact: true })).toHaveText('0');
  await page.reload(); await page.clock.runFor(32);
  await expect(page.getByLabel('Lives', { exact: true })).toHaveText('3');
  await expect(page.getByLabel('Score', { exact: true })).toHaveText('000');
});

test('mobile layout fits the screen and touch steers the visible paddle', async ({ browser }, info) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await openControlledGame(page);
    const arena = page.getByLabel('Breakout arena'); const box = (await arena.boundingBox())!;
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.touchscreen.tap(box.x + box.width * 0.25, box.y + box.height * 0.8);
    await page.clock.runFor(32);
    expect(await paddleCenter(page)).toBeCloseTo(180, 0);
    await expect(page.getByText('Move your pointer or drag to steer')).toBeVisible();
    await page.screenshot({ path: info.outputPath('mobile-gameplay.png'), fullPage: true });
  } finally { await context.close(); }
});
