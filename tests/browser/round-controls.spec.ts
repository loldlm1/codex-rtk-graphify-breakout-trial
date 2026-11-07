import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T10:00:00Z') });
  await page.goto('/');
  await page.clock.pauseAt(new Date('2026-01-01T10:01:00Z'));
  await page.clock.runFor(32);
});

test('native round controls retain visible keyboard focus through pause, resume and restart', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const pause = page.getByRole('button', { name: 'Pause', exact: true });
  await pause.focus(); await page.keyboard.press('Enter');
  const resume = page.getByRole('button', { name: 'Resume', exact: true });
  await expect(resume).toBeFocused();
  expect(await resume.evaluate(button => getComputedStyle(button).outlineStyle)).toBe('solid');
  expect(await resume.evaluate(button => parseFloat(getComputedStyle(button).outlineWidth))).toBeGreaterThanOrEqual(2);
  const arena = page.locator('canvas');
  const frozen = await arena.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  const box = (await arena.boundingBox())!;
  await page.mouse.move(box.x + 4, box.y + box.height / 2);
  await page.clock.runFor(60000);
  expect(await arena.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())).toBe(frozen);
  await page.keyboard.press('Enter'); await page.clock.runFor(64);
  await expect(pause).toBeFocused();
  const restart = page.getByRole('button', { name: 'Restart', exact: true });
  await page.keyboard.press('Tab'); await expect(restart).toBeFocused();
  await page.keyboard.press('Enter'); await page.clock.runFor(32);
  await expect(restart).toBeFocused(); await expect(pause).toBeEnabled();
  await expect(page.getByLabel('Score', { exact: true })).toHaveText('000');
  await expect(page.getByLabel('Lives', { exact: true })).toHaveText('3');
  expect(errors).toEqual([]);
});

test('terminal feedback explains Restart and preserves a useful keyboard focus', async ({ page }) => {
  const arena = page.locator('canvas'); const box = (await arena.boundingBox())!;
  await page.mouse.move(box.x + 5, box.y + box.height - 30);
  await page.getByRole('button', { name: 'Pause', exact: true }).focus();
  await page.clock.runFor(24000);
  await expect(page.getByRole('status', { name: 'Round status' })).toHaveText(/game over.*restart/i);
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeDisabled();
  const restart = page.getByRole('button', { name: 'Restart', exact: true });
  await expect(restart).toBeFocused();
  await page.keyboard.press('Enter'); await page.clock.runFor(32);
  await expect(restart).toBeFocused();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeEnabled();
  await expect(page.getByLabel('Lives', { exact: true })).toHaveText('3');
});
