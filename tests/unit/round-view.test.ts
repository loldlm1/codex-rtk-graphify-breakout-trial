import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createGameState } from '../../src/state';
import { createView } from '../../src/render';
import { manualFrames } from '../helpers/frames';

const html = readFileSync('index.html', 'utf8');
const context = {
  setTransform: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(), roundRect: vi.fn(),
  fill: vi.fn(), arc: vi.fn(), fillText: vi.fn(),
};
beforeEach(() => {
  document.documentElement.innerHTML = html;
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
});
afterEach(() => {
  window.dispatchEvent(new Event('pagehide'));
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});

describe('round presentation and native commands', () => {
  it('shows a distinct paused state and Resume command without changing the HUD', () => {
    const view = createView(document.querySelector('canvas')!, document);
    const state = createGameState(); state.score = 70; view(state);
    const hud = document.querySelector('.dashboard')!.textContent;
    Object.assign(state, { status: 'paused' }); view(state);
    expect(document.querySelector('#status')!.textContent).toMatch(/paused.*resume/i);
    expect(document.querySelector('.live-label')!.textContent).toMatch(/paused/i);
    expect(document.querySelector('#pause')!.textContent).toBe('Resume');
    expect(document.querySelector('.dashboard')!.textContent).toBe(hud);
    expect(context.fillText).toHaveBeenCalledWith('Paused.', expect.any(Number), expect.any(Number));
  });

  for (const terminal of ['won', 'lost'] as const) {
    it(`explains Restart after ${terminal} and transfers focus before disabling Pause`, () => {
      const view = createView(document.querySelector('canvas')!, document);
      const pause = document.querySelector<HTMLButtonElement>('#pause')!;
      const restart = document.querySelector<HTMLButtonElement>('#restart')!;
      const state = createGameState(); view(state); pause.focus();
      state.status = terminal; view(state);
      expect(document.querySelector('#status')!.textContent).toMatch(/restart/i);
      expect(pause.disabled).toBe(true);
      expect(document.activeElement).toBe(restart);
      view(createGameState());
      expect(pause.disabled).toBe(false);
      expect(document.activeElement).toBe(restart);
    });
  }

  it('wires both buttons to the running round and removes command listeners on page exit', async () => {
    vi.resetModules();
    const frames = manualFrames();
    vi.stubGlobal('requestAnimationFrame', frames.scheduler.request);
    vi.stubGlobal('cancelAnimationFrame', frames.scheduler.cancel);
    await import('../../src/main'); frames.tick(1000);
    const pause = document.querySelector<HTMLButtonElement>('#pause')!;
    const restart = document.querySelector<HTMLButtonElement>('#restart')!;
    pause.focus(); pause.click();
    expect(pause.textContent).toBe('Resume');
    expect(document.activeElement).toBe(pause);
    expect(frames.pending()).toBe(0);
    pause.click();
    expect(pause.textContent).toBe('Pause');
    expect(frames.pending()).toBe(1);
    restart.focus(); restart.click();
    expect(document.activeElement).toBe(restart);
    expect(document.querySelector('#score')!.textContent).toBe('000');
    expect(document.querySelector('#lives')!.textContent).toBe('3');
    expect(frames.pending()).toBe(1);
    window.dispatchEvent(new Event('pagehide'));
    pause.click(); restart.click();
    expect(frames.pending()).toBe(0);
  });
});
