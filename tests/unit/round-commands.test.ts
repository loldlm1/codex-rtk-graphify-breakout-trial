import { describe, expect, it, vi } from 'vitest';
import { GameController } from '../../src/controller';
import { createGameState, type Controls } from '../../src/state';
import { manualFrames } from '../helpers/frames';

function setup() {
  const state = createGameState();
  let input: Controls = { left: false, right: false, pointerX: null };
  const controls = {
    read: () => input,
    clear: vi.fn(() => { input = { left: false, right: false, pointerX: null }; }),
  };
  const frames = manualFrames();
  const paint = vi.fn();
  const game = new GameController(state, controls, paint, frames.scheduler);
  return { state, controls, frames, paint, game, hold: () => { input = { left: true, right: true, pointerX: 40 }; } };
}

describe('round commands', () => {
  it('pauses and paints before the first frame, then resumes with fresh input and timing', () => {
    const r = setup();
    r.game.start(); r.hold(); r.game.pause(); r.game.pause();
    expect(r.state.status).toBe('paused');
    expect(r.paint).toHaveBeenLastCalledWith(r.state);
    expect(r.controls.read()).toEqual({ left: false, right: false, pointerX: null });
    const paused = structuredClone(r.state);
    r.hold(); r.frames.tick(100000);
    expect(r.state).toEqual(paused);
    r.game.resume(); r.game.resume();
    expect(r.controls.read()).toEqual({ left: false, right: false, pointerX: null });
    expect(r.frames.pending()).toBe(1);
    r.frames.tick(100020); r.frames.tick(100040);
    expect(r.state.paddle.x).toBe(createGameState().paddle.x);
    expect(r.state.ball.x).toBeCloseTo(createGameState().ball.x + 150 * 0.02);
    r.game.dispose();
  });

  for (const status of ['playing', 'paused', 'won', 'lost'] as const) {
    it(`restarts ${status} in place and resets all model fields before painting`, () => {
      const r = setup();
      r.game.start(); r.frames.tick(1000); r.frames.tick(1020);
      r.state.status = status;
      r.state.score = 90; r.state.lives = 1; r.state.bricks.splice(0, 10);
      Object.assign(r.state.ball, { x: 20, y: 300, vx: -50, vy: 40, radius: 9 });
      Object.assign(r.state.paddle, { x: 20, y: 400, width: 80, height: 10 });
      r.hold();
      r.game.restart(); r.game.start();
      expect(r.state).toEqual(createGameState());
      expect(r.paint).toHaveBeenLastCalledWith(r.state);
      expect(r.controls.read()).toEqual({ left: false, right: false, pointerX: null });
      expect(r.frames.pending()).toBe(1);
      r.frames.tick(100000); r.frames.tick(100020);
      expect(r.state.ball.x).toBeCloseTo(363);
      expect(r.state.paddle.x).toBe(305);
      r.game.dispose();
      expect(r.frames.pending()).toBe(0);
    });
  }

  for (const status of ['won', 'lost'] as const) {
    it(`leaves a ${status} round unchanged when pause and resume are requested`, () => {
      const r = setup(); r.game.start(); r.state.status = status; r.frames.tick(1000);
      const terminal = structuredClone(r.state);
      r.game.pause(); r.game.resume();
      expect(r.state).toEqual(terminal);
      expect(r.frames.pending()).toBe(0);
      r.game.dispose();
    });
  }

  it('keeps one chain after repeated transitions and clears it and input on disposal', () => {
    const r = setup(); r.game.start();
    for (let n = 0; n < 30; n++) {
      r.game.pause(); r.game.resume(); r.game.restart(); r.game.start();
      expect(r.frames.pending()).toBe(1);
    }
    const before = r.paint.mock.calls.length;
    r.frames.tick(1000); r.frames.tick(1020);
    expect(r.paint.mock.calls.length - before).toBe(2);
    r.hold(); r.game.dispose(); r.frames.tick(1040);
    expect(r.controls.read()).toEqual({ left: false, right: false, pointerX: null });
    expect(r.frames.pending()).toBe(0);
    expect(r.paint.mock.calls.length - before).toBe(2);
  });

  it('clears the elapsed-time baseline when active play resumes after a long pause', () => {
    const r = setup(); r.game.start(); r.frames.tick(1000); r.frames.tick(1020);
    r.game.pause(); const before = r.state.ball.x;
    r.game.resume(); r.frames.tick(100000); r.frames.tick(100020);
    expect(r.state.ball.x - before).toBeCloseTo(150 * 0.02);
    r.game.dispose();
  });
});
