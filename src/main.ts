import { GameController } from './controller';
import { bindControls } from './input';
import { createView } from './render';
import { createGameState } from './state';

const canvas = document.querySelector<HTMLCanvasElement>('canvas')!;
try {
  const view = createView(canvas, document);
  const controls = bindControls(canvas, window);
  const controller = new GameController(createGameState(), controls, view);
  controller.start();
  window.addEventListener('pagehide', () => {
    controller.dispose();
    controls.dispose();
  }, { once: true });
} catch (error) {
  document.querySelector('#status')!.textContent = error instanceof Error ? error.message : 'The game could not start.';
}
