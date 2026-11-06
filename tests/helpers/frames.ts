import type { FrameScheduler } from '../../src/controller';

export function manualFrames() {
  let next = 0;
  const callbacks = new Map<number, FrameRequestCallback>();
  const scheduler: FrameScheduler = {
    request: callback => { callbacks.set(++next, callback); return next; },
    cancel: id => { callbacks.delete(id); },
  };
  return {
    scheduler,
    pending: () => callbacks.size,
    tick: (time: number) => {
      const batch = [...callbacks.values()]; callbacks.clear();
      batch.forEach(callback => callback(time));
    },
  };
}
