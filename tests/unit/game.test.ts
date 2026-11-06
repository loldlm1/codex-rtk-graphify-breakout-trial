import { describe, expect, it } from 'vitest';
import { createGameState, HEIGHT, WIDTH, type Controls } from '../../src/state';
import { stepGame } from '../../src/physics';

const idle: Controls = { left: false, right: false, pointerX: null };

describe('a round of Breakout', () => {
  it('starts independent rounds with forty bricks, three lives and a moving ball', () => {
    const state = createGameState();
    const other = createGameState();
    expect(state.status).toBe('playing');
    expect(state.lives).toBe(3);
    expect(state.score).toBe(0);
    expect(state.bricks.filter(b => b.alive)).toHaveLength(40);
    state.bricks[0].alive = false;
    expect(other.bricks[0].alive).toBe(true);
    const { x, y } = state.ball;
    stepGame(state, idle, 0.02);
    expect(state.ball.x).toBeGreaterThan(x);
    expect(state.ball.y).toBeLessThan(y);
  });

  it('moves the paddle by elapsed time, clamps both edges and maps pointer targets', () => {
    const state = createGameState();
    const x = state.paddle.x;
    stepGame(state, { ...idle, right: true }, 0.1);
    expect(state.paddle.x - x).toBeCloseTo(46);
    stepGame(state, { ...idle, left: true }, 1);
    expect(state.paddle.x).toBe(0);
    stepGame(state, { ...idle, pointerX: WIDTH + 100 }, 0.01);
    expect(state.paddle.x).toBe(WIDTH - state.paddle.width);
    stepGame(state, { ...idle, pointerX: -100 }, 0.01);
    expect(state.paddle.x).toBe(0);
  });

  it('bounces on both walls and the ceiling without escaping the arena', () => {
    const state = createGameState();
    Object.assign(state.ball, { x: 8, y: 250, vx: -300, vy: 0 });
    stepGame(state, idle, 0.02);
    expect(state.ball.vx).toBeGreaterThan(0);
    expect(state.ball.x).toBeGreaterThanOrEqual(state.ball.radius);
    Object.assign(state.ball, { x: WIDTH - 8, vx: 300 });
    stepGame(state, idle, 0.02);
    expect(state.ball.vx).toBeLessThan(0);
    Object.assign(state.ball, { x: 20, y: 8, vx: 0, vy: -300 });
    stepGame(state, idle, 0.02);
    expect(state.ball.vy).toBeGreaterThan(0);
  });

  it('reflects a falling ball off the paddle and aims it from the contact point', () => {
    const state = createGameState();
    Object.assign(state.ball, { x: state.paddle.x + 90, y: state.paddle.y - 9, vx: 0, vy: 300 });
    stepGame(state, idle, 0.02);
    expect(state.ball.vy).toBeLessThan(0);
    expect(state.ball.vx).toBeGreaterThan(0);
    expect(Math.hypot(state.ball.vx, state.ball.vy)).toBeCloseTo(310);
  });

  it('breaks and scores a brick once, reflects from its face, then wins on the last brick', () => {
    const state = createGameState();
    const brick = state.bricks[32];
    Object.assign(state.ball, { x: brick.x + brick.width / 2, y: brick.y + brick.height + 8, vx: 0, vy: -300 });
    stepGame(state, idle, 0.02);
    expect(brick.alive).toBe(false);
    expect(state.score).toBe(10);
    expect(state.ball.vy).toBeGreaterThan(0);
    stepGame(state, idle, 0.02);
    expect(state.score).toBe(10);
    for (const b of state.bricks) b.alive = false;
    const last = state.bricks[1]; last.alive = true;
    Object.assign(state.ball, { x: last.x - 8, y: last.y + last.height / 2, vx: 300, vy: 0 });
    stepGame(state, idle, 0.02);
    expect(state.ball.vx).toBeLessThan(0);
    expect(state.status).toBe('won');
    expect(state.score).toBe(20);
  });

  it('spends a life on a miss, serves again, then stops after the third miss', () => {
    const state = createGameState();
    for (let remaining = 2; remaining >= 0; remaining--) {
      Object.assign(state.ball, { x: 10, y: HEIGHT + 10, vx: 0, vy: 300 });
      stepGame(state, idle, 0.01);
      expect(state.lives).toBe(remaining);
    }
    expect(state.status).toBe('lost');
    const terminal = structuredClone(state);
    stepGame(state, { ...idle, right: true }, 1);
    expect(state).toEqual(terminal);
  });

  it('does not tunnel through bricks at high speed and ignores invalid or negative deltas', () => {
    const state = createGameState();
    const brick = state.bricks[0];
    Object.assign(state.ball, { x: brick.x + 20, y: brick.y + 50, vx: 0, vy: -700 });
    const before = structuredClone(state);
    for (const dt of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) stepGame(state, idle, dt);
    expect(state).toEqual(before);
    stepGame(state, idle, 0.1);
    expect(brick.alive).toBe(false);
  });

  it('has comparable motion at 30 and 120 updates per second', () => {
    const a = createGameState(); const b = createGameState();
    for (let n = 0; n < 15; n++) stepGame(a, idle, 1 / 30);
    for (let n = 0; n < 60; n++) stepGame(b, idle, 1 / 120);
    expect(a.ball.x).toBeCloseTo(b.ball.x, 5);
    expect(a.ball.y).toBeCloseTo(b.ball.y, 5);
  });
});
