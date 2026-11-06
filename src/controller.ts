import { stepGame } from './physics';
import type { ControlSource, GameState } from './state';

export interface FrameScheduler {
  request(callback: FrameRequestCallback): number;
  cancel(id: number): void;
}

export const browserFrames: FrameScheduler = {
  request: callback => requestAnimationFrame(callback),
  cancel: id => cancelAnimationFrame(id),
};

export class GameController {
  private frame: number | null = null;
  private previousTime: number | null = null;
  private running = false;

  constructor(
    private state: GameState,
    private controls: ControlSource,
    private paint: (state: GameState) => void,
    private scheduler: FrameScheduler = browserFrames,
  ) {}

  start() {
    if (this.running) return;
    this.running = true;
    this.frame = this.scheduler.request(this.onFrame);
  }

  private onFrame = (time: number) => {
    if (!this.running) return;
    const dt = this.previousTime === null ? 0 : Math.max(0, Math.min((time - this.previousTime) / 1000, 0.05));
    this.previousTime = time;
    stepGame(this.state, this.controls.read(), dt);
    this.paint(this.state);
    this.frame = this.state.status === 'playing' ? this.scheduler.request(this.onFrame) : null;
  };

  dispose() {
    this.running = false;
    this.controls.clear();
    if (this.frame !== null) this.scheduler.cancel(this.frame);
    this.frame = null;
  }
}
