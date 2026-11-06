import { afterEach, describe, expect, it } from 'vitest';
import { bindControls } from '../../src/input';

let dispose: (() => void) | undefined;
afterEach(() => dispose?.());

function setup() {
  const canvas = document.createElement('canvas');
  canvas.getBoundingClientRect = () => ({ left: 100, width: 360 } as DOMRect);
  const controls = bindControls(canvas, window);
  dispose = controls.dispose;
  return { canvas, controls };
}

function key(type: string, key: string) {
  const event = new KeyboardEvent(type, { key, cancelable: true });
  window.dispatchEvent(event); return event;
}

describe('player controls', () => {
  it('supports arrows and A/D, prevents arrow scrolling, and releases independently', () => {
    const { controls } = setup();
    expect(key('keydown', 'ArrowLeft').defaultPrevented).toBe(true);
    key('keydown', 'd'); key('keyup', 'ArrowLeft');
    expect(controls.read()).toEqual({ left: false, right: true, pointerX: null });
    key('keyup', 'D');
    expect(controls.read().right).toBe(false);
    key('keydown', 'a'); expect(controls.read().left).toBe(true);
    key('keyup', 'a');
    expect(key('keydown', 'Escape').defaultPrevented).toBe(false);
  });

  it('maps scaled pointer coordinates and switches back to keyboard', () => {
    const { controls, canvas } = setup();
    canvas.dispatchEvent(new MouseEvent('pointermove', { clientX: 280 }));
    expect(controls.read().pointerX).toBe(360);
    key('keydown', 'ArrowRight');
    expect(controls.read().pointerX).toBeNull();
  });

  it('clears held input on blur and removes listeners when disposed', () => {
    const { controls, canvas } = setup();
    key('keydown', 'ArrowRight');
    window.dispatchEvent(new Event('blur'));
    expect(controls.read()).toEqual({ left: false, right: false, pointerX: null });
    canvas.dispatchEvent(new MouseEvent('pointerdown', { clientX: 280 }));
    controls.clear(); expect(controls.read().pointerX).toBeNull();
    controls.dispose(); key('keydown', 'ArrowLeft');
    expect(controls.read().left).toBe(false);
  });
});
