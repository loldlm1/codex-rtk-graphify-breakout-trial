import { HEIGHT, WIDTH, type Controls, type GameState, type Rectangle } from './state';

function overlaps(ball: GameState['ball'], box: Rectangle) {
  const nearestX = Math.max(box.x, Math.min(ball.x, box.x + box.width));
  const nearestY = Math.max(box.y, Math.min(ball.y, box.y + box.height));
  return (ball.x - nearestX) ** 2 + (ball.y - nearestY) ** 2 <= ball.radius ** 2;
}

function advance(state: GameState, controls: Controls, dt: number) {
  const { ball, paddle } = state;
  const direction = Number(controls.right) - Number(controls.left);
  const target = controls.pointerX === null ? paddle.x + direction * 460 * dt : controls.pointerX - paddle.width / 2;
  paddle.x = Math.max(0, Math.min(WIDTH - paddle.width, target));
  const previousX = ball.x;
  const previousY = ball.y;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  if (ball.x < ball.radius || ball.x > WIDTH - ball.radius) {
    ball.x = Math.max(ball.radius, Math.min(WIDTH - ball.radius, ball.x));
    ball.vx *= -1;
  }
  if (ball.y < ball.radius) {
    ball.y = ball.radius;
    ball.vy = Math.abs(ball.vy);
  }

  if (ball.vy > 0 && previousY + ball.radius <= paddle.y && overlaps(ball, paddle)) {
    const contact = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
    const angle = Math.max(-1, Math.min(1, contact)) * 0.95;
    ball.vx = 310 * Math.sin(angle);
    ball.vy = -310 * Math.cos(angle);
    ball.y = paddle.y - ball.radius;
  }

  for (const brick of state.bricks) {
    if (!brick.alive || !overlaps(ball, brick)) continue;
    brick.alive = false;
    state.score += 10;
    if (previousX + ball.radius <= brick.x || previousX - ball.radius >= brick.x + brick.width) ball.vx *= -1;
    else ball.vy *= -1;
    if (state.bricks.every(b => !b.alive)) state.status = 'won';
    break;
  }

  if (ball.y - ball.radius > HEIGHT) {
    state.lives--;
    if (state.lives === 0) state.status = 'lost';
    else {
      paddle.x = (WIDTH - paddle.width) / 2;
      Object.assign(ball, { x: WIDTH / 2, y: 440, vx: 150, vy: -270 });
    }
  }
}

/** Seconds of simulation; small substeps keep the ball from skipping thin surfaces. */
export function stepGame(state: GameState, controls: Controls, seconds: number) {
  if (state.status !== 'playing' || !Number.isFinite(seconds) || seconds <= 0) return;
  const steps = Math.ceil(seconds / (1 / 240));
  const dt = seconds / steps;
  for (let n = 0; n < steps && state.status === 'playing'; n++) advance(state, controls, dt);
}
