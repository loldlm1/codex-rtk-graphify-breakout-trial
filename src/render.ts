import { HEIGHT, WIDTH, type GameState } from './state';

const brickColors = ['#e9a1aa', '#e8bc7e', '#b4a2de', '#8ebfda', '#91cabb'];

export function createView(canvas: HTMLCanvasElement, root: Document) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable. Please try a browser with Canvas support.');
  const ctx = context;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = WIDTH * ratio;
  canvas.height = HEIGHT * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const score = root.querySelector<HTMLOutputElement>('#score')!;
  const lives = root.querySelector<HTMLOutputElement>('#lives')!;
  const remaining = root.querySelector<HTMLOutputElement>('#remaining')!;
  const status = root.querySelector<HTMLElement>('#status')!;
  const label = root.querySelector<HTMLElement>('.live-label')!;
  const pause = root.querySelector<HTMLButtonElement>('#pause')!;
  const restart = root.querySelector<HTMLButtonElement>('#restart')!;

  function rounded(x: number, y: number, width: number, height: number, radius: number, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); ctx.fill();
  }

  return (state: GameState) => {
    ctx.fillStyle = '#181e32'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#2c3348';
    for (let x = 24; x < WIDTH; x += 24) {
      for (let y = 18; y < HEIGHT; y += 24) ctx.fillRect(x, y, 1, 1);
    }
    for (const brick of state.bricks) {
      if (brick.alive) {
        rounded(brick.x, brick.y, brick.width, brick.height, 4, brickColors[brick.row]);
        rounded(brick.x + 5, brick.y + 3, brick.width - 10, 2, 1, '#ffffff28');
      }
    }
    const { paddle, ball } = state;
    rounded(paddle.x, paddle.y, paddle.width, paddle.height, 7, '#c5b5ee');
    rounded(paddle.x + 9, paddle.y + 3, paddle.width - 18, 2, 1, '#eee6ff');
    ctx.shadowBlur = 14; ctx.shadowColor = '#fcf7e775';
    ctx.fillStyle = '#fcf7e7'; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    const message = state.status === 'paused' ? 'Paused. Choose Resume to continue this round.'
      : state.status === 'won' ? 'Wave clear! Choose Restart to play again.'
      : state.status === 'lost' ? 'Game over. Refresh or choose Restart to play again.'
      : 'Keep the ball in play. Clear the wave.';
    score.textContent = String(state.score).padStart(3, '0');
    lives.textContent = String(state.lives);
    remaining.textContent = String(state.bricks.filter(brick => brick.alive).length);
    if (status.textContent !== message) status.textContent = message;
    label.textContent = state.status === 'playing' ? '● IN PLAY' : state.status === 'paused' ? '● PAUSED' : '● ROUND COMPLETE';
    pause.textContent = state.status === 'paused' ? 'Resume' : 'Pause';
    const terminal = state.status === 'won' || state.status === 'lost';
    if (terminal && root.activeElement === pause) restart.focus();
    pause.disabled = terminal;
    if (state.status !== 'playing') {
      ctx.fillStyle = '#181e32dc'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fcf7e7'; ctx.font = '600 42px system-ui';
      ctx.fillText(state.status === 'paused' ? 'Paused.' : state.status === 'won' ? 'Wave clear.' : 'Another time, another wave.', WIDTH / 2, HEIGHT / 2 - 8);
      ctx.fillStyle = '#bfc4da'; ctx.font = '16px system-ui';
      ctx.fillText(state.status === 'paused' ? 'Choose Resume when you’re ready.' : 'Choose Restart to play again.', WIDTH / 2, HEIGHT / 2 + 30);
    }
  };
}
