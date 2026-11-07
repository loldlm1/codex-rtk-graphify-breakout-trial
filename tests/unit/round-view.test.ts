import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createView } from '../../src/render';
import { createGameState } from '../../src/state';

const html = readFileSync('index.html', 'utf8');
const context = {
  setTransform: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(),
  roundRect: vi.fn(), fill: vi.fn(), arc: vi.fn(), fillText: vi.fn(),
};

function setup() {
  document.documentElement.innerHTML = html;
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  return document.querySelector('canvas')!;
}

afterEach(() => {
  window.dispatchEvent(new Event('pagehide'));
  vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.resetModules();
});

describe('round presentation and native controls', () => {
  it('announces pause, changes the same focused button to Resume, and restores playing feedback', () => {
    const view = createView(setup(), document); const state = createGameState();
    const pause = document.querySelector<HTMLButtonElement>('#pause')!;
    pause.focus(); state.status = 'paused'; view(state);
    expect(document.activeElement).toBe(pause);
    expect(pause.textContent).toBe('Resume');
    expect(document.querySelector('#status')?.textContent).toMatch(/paused.*resume/i);
    expect(document.querySelector('.live-label')?.textContent).toMatch(/paused/i);
    expect(context.fillText).toHaveBeenCalledWith('Paused.', 360, 252);
    state.status = 'playing'; view(state);
    expect(pause.textContent).toBe('Pause');
    expect(pause.disabled).toBe(false);
    expect(document.querySelector('#status')?.textContent).toMatch(/keep the ball/i);
  });

  for (const status of ['won', 'lost'] as const) {
    it(`explains Restart after ${status} and moves focus before disabling Pause`, () => {
      const view = createView(setup(), document); const state = createGameState();
      const pause = document.querySelector<HTMLButtonElement>('#pause')!;
      const restart = document.querySelector<HTMLButtonElement>('#restart')!;
      pause.focus(); state.status = status; view(state);
      expect(document.querySelector('#status')?.textContent).toMatch(/restart/i);
      expect(context.fillText).toHaveBeenCalledWith('Select Restart to play again.', 360, 290);
      expect(pause.disabled).toBe(true);
      expect(document.activeElement).toBe(restart);
      view(createGameState());
      expect(document.activeElement).toBe(restart);
      expect(pause.disabled).toBe(false);
    });
  }

  it('wires native commands and removes their handlers and the frame on page exit', async () => {
    setup(); const request = vi.fn().mockReturnValue(7); const cancel = vi.fn();
    vi.stubGlobal('requestAnimationFrame', request); vi.stubGlobal('cancelAnimationFrame', cancel);
    await import('../../src/main');
    const pause = document.querySelector<HTMLButtonElement>('#pause')!;
    const restart = document.querySelector<HTMLButtonElement>('#restart')!;
    pause.click(); expect(pause.textContent).toBe('Resume');
    pause.click(); expect(pause.textContent).toBe('Pause');
    pause.click(); restart.click(); expect(pause.textContent).toBe('Pause');
    window.dispatchEvent(new Event('pagehide'));
    expect(cancel).toHaveBeenCalledWith(7);
    const frames = request.mock.calls.length;
    pause.click(); restart.click();
    expect(request).toHaveBeenCalledTimes(frames);
  });

  it('shows the Canvas failure instead of registering unusable round controls', async () => {
    const canvas = setup(); vi.spyOn(canvas, 'getContext').mockReturnValue(null);
    await import('../../src/main');
    expect(document.querySelector('#status')?.textContent).toMatch(/Canvas 2D is unavailable/i);
    expect(document.querySelector<HTMLButtonElement>('#pause')?.disabled).toBe(true);
    expect(document.querySelector<HTMLButtonElement>('#restart')?.disabled).toBe(true);
  });
});
