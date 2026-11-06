import { WIDTH, type Controls } from './state';

export function bindControls(canvas: HTMLCanvasElement, target: Window) {
  const held = new Set<string>();
  let pointerX: number | null = null;
  const movementKeys = ['ArrowLeft', 'ArrowRight', 'a', 'd'];
  const clear = () => { held.clear(); pointerX = null; };
  const keyDown = (event: KeyboardEvent) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (!movementKeys.includes(key)) return;
    event.preventDefault();
    pointerX = null;
    held.add(key);
  };
  const keyUp = (event: KeyboardEvent) => { held.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key); };
  const pointer = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect();
    pointerX = (event.clientX - bounds.left) / bounds.width * WIDTH;
  };
  target.addEventListener('keydown', keyDown);
  target.addEventListener('keyup', keyUp);
  target.addEventListener('blur', clear);
  canvas.addEventListener('pointermove', pointer);
  canvas.addEventListener('pointerdown', pointer);
  return {
    read: (): Controls => ({ left: held.has('ArrowLeft') || held.has('a'), right: held.has('ArrowRight') || held.has('d'), pointerX }),
    clear,
    dispose: () => {
      clear();
      target.removeEventListener('keydown', keyDown);
      target.removeEventListener('keyup', keyUp);
      target.removeEventListener('blur', clear);
      canvas.removeEventListener('pointermove', pointer);
      canvas.removeEventListener('pointerdown', pointer);
    },
  };
}
