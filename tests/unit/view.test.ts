import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createGameState } from '../../src/state';
import { createView } from '../../src/render';

const html = readFileSync('index.html', 'utf8');
const context = {
  setTransform: vi.fn(), clearRect: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(),
  roundRect: vi.fn(), fill: vi.fn(), arc: vi.fn(), fillText: vi.fn(),
};
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function setup() {
  document.documentElement.innerHTML = html;
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  return document.querySelector('canvas')!;
}

describe('game presentation', () => {
  it('shows score, lives, remaining bricks and terminal status as readable text', () => {
    const canvas = setup();
    const view = createView(canvas, document);
    const state = createGameState(); view(state);
    expect(document.querySelector('#score')?.textContent).toBe('000');
    expect(document.querySelector('#lives')?.textContent).toBe('3');
    expect(document.querySelector('#remaining')?.textContent).toBe('40');
    state.score = 70; state.lives = 1; state.bricks[0].alive = false; view(state);
    expect(document.querySelector('#score')?.textContent).toBe('070');
    expect(document.querySelector('#remaining')?.textContent).toBe('39');
    expect(document.querySelector('#lives')?.textContent).toBe('1');
    state.status = 'won'; view(state);
    expect(document.querySelector('#status')?.textContent).toMatch(/wave clear/i);
    state.status = 'lost'; view(state);
    expect(document.querySelector('#status')?.textContent).toMatch(/game over/i);
    expect(document.querySelector('#status')?.textContent).toMatch(/refresh/i);
  });

  it('reports unavailable Canvas support to the player', () => {
    const canvas = setup();
    vi.spyOn(canvas, 'getContext').mockReturnValue(null);
    expect(() => createView(canvas, document)).toThrow(/Canvas 2D/);
  });

  it('boots the external entry point, starts frames and disposes on page exit', async () => {
    setup(); const request = vi.fn().mockReturnValue(7); const cancel = vi.fn();
    vi.stubGlobal('requestAnimationFrame', request); vi.stubGlobal('cancelAnimationFrame', cancel);
    await import('../../src/main');
    expect(request).toHaveBeenCalledOnce();
    window.dispatchEvent(new Event('pagehide'));
    expect(cancel).toHaveBeenCalledWith(7);
  });
});
