import { describe, expect, it, vi } from 'vitest';
import { GameController } from '../../src/controller';
import { createGameState, type Controls } from '../../src/state';
import { manualFrames } from '../helpers/frames';

function round() {
  const state = createGameState();
  let input: Controls = { left: false, right: false, pointerX: null };
  const controls = {
    read: () => input,
    clear: () => { input = { left: false, right: false, pointerX: null }; },
  };
  const frames = manualFrames();
  const paint = vi.fn();
  const controller = new GameController(state, controls, paint, frames.scheduler);
  return { state, controls, frames, paint, controller, hold: (value: Controls) => { input = value; } };
}

describe('round command boundaries', () => {
  it('paints pause immediately and discards input acquired during pause before resuming', () => {
    const r = round();
    r.controller.start(); r.frames.tick(1000); r.frames.tick(1020);
    r.controller.pause();
    expect(r.paint).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'paused' }));
    expect(r.frames.pending()).toBe(0);
    const paddle = r.state.paddle.x;
    r.hold({ left: false, right: true, pointerX: 700 });
    r.controller.resume();
    expect(r.controls.read()).toEqual({ left: false, right: false, pointerX: null });
    expect(r.paint).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'playing' }));
    r.frames.tick(100000); r.frames.tick(100020);
    expect(r.state.paddle.x).toBe(paddle);
    r.controller.dispose();
  });

  it('restarts a not-yet-started controller in place and advances normally after its fresh first frame', () => {
    const r = round(); const suppliedState = r.state;
    r.state.score = 50; r.state.bricks.splice(0, 10);
    r.hold({ left: true, right: true, pointerX: 10 });
    r.controller.restart();
    expect(r.state).toBe(suppliedState);
    expect(r.state).toEqual(createGameState());
    expect(r.paint).toHaveBeenLastCalledWith(suppliedState);
    expect(r.controls.read()).toEqual({ left: false, right: false, pointerX: null });
    r.controller.start();
    expect(r.frames.pending()).toBe(1);
    r.frames.tick(90000);
    const first = r.state.ball.x;
    r.frames.tick(90020);
    expect(r.state.ball.x - first).toBeCloseTo(150 * 0.02);
    r.controller.dispose();
  });

  it('clears newly held input and all pending work when disposed from pause', () => {
    const r = round(); r.controller.start(); r.controller.pause();
    r.hold({ left: true, right: false, pointerX: 50 });
    r.controller.dispose();
    const paints = r.paint.mock.calls.length;
    r.frames.tick(90000);
    expect(r.frames.pending()).toBe(0);
    expect(r.paint).toHaveBeenCalledTimes(paints);
    expect(r.controls.read()).toEqual({ left: false, right: false, pointerX: null });
  });
});
