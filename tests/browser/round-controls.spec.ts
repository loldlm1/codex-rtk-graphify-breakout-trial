import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T10:00:00Z') });
  await page.goto('/');
  await page.clock.pauseAt(new Date('2026-01-01T10:01:00Z'));
  await page.clock.runFor(32);
});

test('keyboard activation retains focus through pause, resume and restart with visible focus', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const pause = page.getByRole('button', { name: 'Pause', exact: true });
  await pause.focus(); await page.keyboard.press('Enter');
  const resume = page.getByRole('button', { name: 'Resume', exact: true });
  await expect(resume).toBeFocused();
  const focus = await resume.evaluate(element => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  });
  expect(focus.style).not.toBe('none'); expect(focus.width).toBeGreaterThanOrEqual(2);
  await page.keyboard.press('Enter');
  await expect(pause).toBeFocused();
  await page.keyboard.press('Tab');
  const restart = page.getByRole('button', { name: 'Restart', exact: true });
  await expect(restart).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(restart).toBeFocused();
  await expect(page.getByRole('status', { name: 'Round status' })).not.toHaveText(/paused|game over/i);
  expect(errors).toEqual([]);
});

test('terminal feedback explains Restart and keeps keyboard focus on an available command', async ({ page }) => {
  const pause = page.getByRole('button', { name: 'Pause', exact: true });
  await pause.focus();
  const arena = (await page.locator('canvas').boundingBox())!;
  await page.mouse.move(arena.x + 5, arena.y + arena.height - 30);
  await page.clock.runFor(24000);
  await expect(page.getByRole('status', { name: 'Round status' })).toHaveText(/game over.*restart/i);
  await expect(pause).toBeDisabled();
  const restart = page.getByRole('button', { name: 'Restart', exact: true });
  await expect(restart).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(restart).toBeFocused();
  await expect(pause).toBeEnabled();
  await expect(page.getByLabel('Lives', { exact: true })).toHaveText('3');
});
