import { c, type C } from './complex';

/** Load shared between the transmission-line and Smith chart explorers. */
export type LoadMode = 'open' | 'short' | 'matched' | 'rx';
export const lineState = {
  mode: 'rx' as LoadMode,
  r: 100,
  x: 50,
  z0: 50,
  dist: 0.1, // probe distance from load, in λ
};
const subs = new Set<() => void>();
export const onLine = (f: () => void) => { subs.add(f); return () => subs.delete(f); };
export const emitLine = () => subs.forEach((f) => f());

export function loadZ(): C {
  switch (lineState.mode) {
    case 'open': return c(Infinity, 0);
    case 'short': return c(0, 0);
    case 'matched': return c(lineState.z0, 0);
    default: return c(lineState.r, lineState.x);
  }
}
