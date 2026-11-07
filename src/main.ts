import { GameController } from './controller';
import { bindControls } from './input';
import { createView } from './render';
import { createGameState } from './state';

const canvas = document.querySelector<HTMLCanvasElement>('canvas')!;
try {
  const view = createView(canvas, document);
  const controls = bindControls(canvas, window);
  const state = createGameState();
  const controller = new GameController(state, controls, view);
  const pause = document.querySelector<HTMLButtonElement>('#pause')!;
  const restart = document.querySelector<HTMLButtonElement>('#restart')!;
  const togglePause = () => state.status === 'paused' ? controller.resume() : controller.pause();
  const restartRound = () => controller.restart();
  pause.addEventListener('click', togglePause);
  restart.addEventListener('click', restartRound);
  controller.start();
  window.addEventListener('pagehide', () => {
    controller.dispose();
    controls.dispose();
    pause.removeEventListener('click', togglePause);
    restart.removeEventListener('click', restartRound);
  }, { once: true });
} catch (error) {
  document.querySelector('#status')!.textContent = error instanceof Error ? error.message : 'The game could not start.';
}
