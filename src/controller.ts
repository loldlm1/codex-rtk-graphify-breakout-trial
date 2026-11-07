import { stepGame } from './physics';
import { createGameState, type ControlSource, type GameState } from './state';

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
    this.previousTime = null;
    this.frame = this.scheduler.request(this.onFrame);
  }

  pause() {
    if (this.state.status !== 'playing') return;
    this.stop();
    this.controls.clear();
    this.state.status = 'paused';
    this.paint(this.state);
  }

  resume() {
    if (this.state.status !== 'paused') return;
    this.controls.clear();
    this.state.status = 'playing';
    this.paint(this.state);
    this.start();
  }

  restart() {
    this.stop();
    this.controls.clear();
    Object.assign(this.state, createGameState());
    this.paint(this.state);
    this.start();
  }

  private onFrame = (time: number) => {
    if (!this.running) return;
    this.frame = null;
    const dt = this.previousTime === null ? 0 : Math.max(0, Math.min((time - this.previousTime) / 1000, 0.05));
    this.previousTime = time;
    stepGame(this.state, this.controls.read(), dt);
    this.paint(this.state);
    if (this.state.status === 'playing') this.frame = this.scheduler.request(this.onFrame);
    else this.running = false;
  };

  private stop() {
    this.running = false;
    if (this.frame !== null) this.scheduler.cancel(this.frame);
    this.frame = null;
    this.previousTime = null;
  }

  dispose() {
    this.stop();
    this.controls.clear();
  }
}
