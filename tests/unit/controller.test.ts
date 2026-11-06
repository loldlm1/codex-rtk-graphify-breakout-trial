import { describe, expect, it, vi } from 'vitest';
import { GameController } from '../../src/controller';
import { manualFrames } from '../helpers/frames';
import { createGameState } from '../../src/state';


const idle = () => ({ left: false, right: false, pointerX: null });

describe('animation lifecycle', () => {
  it('uses elapsed frame time, paints the initial frame, and bounds long gaps', () => {
    const frames = manualFrames(); const state = createGameState(); const paint = vi.fn();
    const clear = vi.fn();
    const game = new GameController(state, { read: idle, clear }, paint, frames.scheduler);
    game.start(); game.start();
    expect(frames.pending()).toBe(1);
    frames.tick(1000);
    expect(paint).toHaveBeenCalledWith(state);
    const first = state.ball.x;
    frames.tick(1020);
    expect(state.ball.x - first).toBeCloseTo(state.ball.vx * 0.02);
    const second = state.ball.x;
    frames.tick(50000);
    expect(state.ball.x - second).toBeLessThanOrEqual(Math.abs(state.ball.vx) * 0.05 + 0.001);
    game.dispose();
    expect(frames.pending()).toBe(0);
    expect(clear).toHaveBeenCalledOnce();
    frames.tick(50020);
    expect(paint).toHaveBeenCalledTimes(3);
  });

  it('finishes terminal rounds without scheduling another frame', () => {
    const frames = manualFrames(); const state = createGameState(); state.status = 'won';
    const game = new GameController(state, { read: idle, clear: vi.fn() }, vi.fn(), frames.scheduler);
    game.start(); frames.tick(0);
    expect(frames.pending()).toBe(0);
    game.dispose(); game.dispose();
  });
});
