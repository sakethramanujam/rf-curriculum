/** Minimal immutable complex arithmetic. Pure, no DOM. */
export interface C {
  re: number;
  im: number;
}

export const c = (re: number, im = 0): C => ({ re, im });
export const add = (a: C, b: C): C => c(a.re + b.re, a.im + b.im);
export const sub = (a: C, b: C): C => c(a.re - b.re, a.im - b.im);
export const mul = (a: C, b: C): C => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
export const scale = (a: C, k: number): C => c(a.re * k, a.im * k);
export const conj = (a: C): C => c(a.re, -a.im);
export const abs = (a: C): number => Math.hypot(a.re, a.im);
export const arg = (a: C): number => Math.atan2(a.im, a.re);
export const polar = (r: number, th: number): C => c(r * Math.cos(th), r * Math.sin(th));
export const expj = (th: number): C => polar(1, th);

export function div(a: C, b: C): C {
  const d = b.re * b.re + b.im * b.im;
  if (d === 0) return c(a.re === 0 && a.im === 0 ? NaN : Infinity, 0);
  return c((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
}

export function sqrt(a: C): C {
  const r = abs(a);
  const re = Math.sqrt((r + a.re) / 2);
  const im = Math.sign(a.im || 1) * Math.sqrt(Math.max(0, (r - a.re) / 2));
  return c(re, a.im === 0 && a.re >= 0 ? 0 : im);
}

export const isFiniteC = (a: C): boolean => Number.isFinite(a.re) && Number.isFinite(a.im);

export function fmt(a: C, digits = 2, unit = ''): string {
  if (!isFiniteC(a)) return '∞';
  const z = (v: number) => (Math.abs(v) < 0.5 * 10 ** -digits ? 0 : v);
  a = c(z(a.re), z(a.im));
  const re = a.re.toFixed(digits);
  const s = a.im < 0 ? '−' : '+';
  return `${re} ${s} j${Math.abs(a.im).toFixed(digits)}${unit ? ' ' + unit : ''}`;
}
