import { describe, expect, it, vi } from 'vitest';
import { GameController } from '../../../src/controller';
import { createGameState, type Controls } from '../../../src/state';
import { manualFrames } from '../../helpers/frames';

type FutureController = GameController & { pause(): void; resume(): void; restart(): void };

function round() {
  const state = createGameState();
  let input: Controls = { left: false, right: false, pointerX: null };
  const controls = {
    read: () => input,
    clear: () => { input = { left: false, right: false, pointerX: null }; },
  };
  const frames = manualFrames();
  const paint = vi.fn();
  const controller = new GameController(state, controls, paint, frames.scheduler) as FutureController;
  controller.start(); frames.tick(1000); frames.tick(1020);
  return { state, controls, frames, paint, controller, hold: () => { input = { left: true, right: false, pointerX: 40 }; } };
}

function requireFeature(controller: FutureController) {
  for (const method of ['pause', 'resume', 'restart'] as const) {
    expect(typeof controller[method], `The frozen future task requires ${method}()`).toBe('function');
  }
}

describe('frozen pause/resume/restart acceptance', () => {
  it('holds every simulation value unchanged throughout pause, even with movement input', () => {
    const r = round(); requireFeature(r.controller);
    r.hold(); r.controller.pause();
    expect(r.state.status).toBe('paused');
    expect(r.controls.read()).toEqual({ left: false, right: false, pointerX: null });
    const paused = structuredClone(r.state);
    r.hold();
    for (const time of [1040, 5000, 100000]) r.frames.tick(time);
    expect(r.state).toEqual(paused);
    r.controller.dispose();
  });

  it('resumes after a long pause without catching up paused time or creating extra loops', () => {
    const r = round(); requireFeature(r.controller);
    r.controller.pause(); r.controller.pause();
    r.frames.tick(100000);
    const before = structuredClone(r.state.ball);
    r.controller.resume(); r.controller.resume();
    expect(r.state.status).toBe('playing');
    expect(r.frames.pending()).toBe(1);
    r.frames.tick(100020);
    expect(Math.abs(r.state.ball.x - before.x)).toBeLessThanOrEqual(Math.abs(before.vx) * 0.05 + 0.001);
    expect(Math.abs(r.state.ball.y - before.y)).toBeLessThanOrEqual(Math.abs(before.vy) * 0.05 + 0.001);
    const after = r.state.ball.x;
    r.frames.tick(100040);
    expect(r.state.ball.x).toBeGreaterThan(after);
    expect(r.frames.pending()).toBe(1);
    r.controller.dispose();
  });

  for (const status of ['won', 'lost'] as const) {
    it(`does not revive a ${status} round through pause or resume`, () => {
      const r = round(); requireFeature(r.controller);
      r.state.status = status; r.frames.tick(1040);
      const terminal = structuredClone(r.state);
      r.controller.pause(); r.controller.resume(); r.controller.resume();
      r.frames.tick(100000);
      expect(r.state).toEqual(terminal);
      expect(r.frames.pending()).toBe(0);
      r.controller.dispose();
    });
  }

  for (const status of ['playing', 'paused', 'won', 'lost'] as const) {
    it(`restarts from ${status} with fresh score, lives, bricks, ball, paddle and input`, () => {
      const r = round(); requireFeature(r.controller);
      if (status === 'paused') r.controller.pause();
      else r.state.status = status;
      r.state.score = 170; r.state.lives = 1; r.state.bricks[0].alive = false;
      Object.assign(r.state.ball, { x: 52, y: 190, vx: -220, vy: 180 });
      r.state.paddle.x = 30; r.hold();
      r.controller.restart();
      expect(r.state).toEqual(createGameState());
      expect(r.controls.read()).toEqual({ left: false, right: false, pointerX: null });
      expect(r.paint).toHaveBeenLastCalledWith(r.state);
      expect(r.frames.pending()).toBe(1);
      r.frames.tick(90000); r.frames.tick(90020);
      expect(r.state.paddle.x).toBe(createGameState().paddle.x);
      expect(r.state.ball.x - createGameState().ball.x).toBeLessThanOrEqual(150 * 0.07 + 0.001);
      r.controller.dispose();
    });
  }

  it('keeps exactly one live animation loop through repeated restarts and terminal recovery', () => {
    const r = round(); requireFeature(r.controller);
    for (let n = 0; n < 30; n++) {
      if (n % 3 === 0) r.controller.pause();
      if (n % 3 === 1) r.state.status = 'lost';
      r.controller.restart(); r.controller.start();
      expect(r.frames.pending()).toBe(1);
    }
    const paints = r.paint.mock.calls.length;
    r.frames.tick(100000); r.frames.tick(100020);
    expect(r.paint.mock.calls.length - paints).toBe(2);
    expect(r.frames.pending()).toBe(1);
    r.controller.dispose();
    expect(r.frames.pending()).toBe(0);
  });
});
