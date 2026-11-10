/** Theme palette shared by every canvas, refreshed when the user toggles light/dark. */
export interface Palette {
  bg: string; bg2: string; panel: string; panel2: string; line: string; grid: string;
  text: string; muted: string; faint: string; e: string; h: string; acc: string;
  ok: string; warn: string; bad: string; dark: boolean;
}

let cached: Palette | null = null;
const subs = new Set<() => void>();

export function palette(): Palette {
  if (cached) return cached;
  const s = getComputedStyle(document.documentElement);
  const v = (n: string) => s.getPropertyValue(`--${n}`).trim();
  cached = {
    bg: v('bg'), bg2: v('bg2'), panel: v('panel'), panel2: v('panel2'), line: v('line'), grid: v('grid'),
    text: v('text'), muted: v('muted'), faint: v('faint'), e: v('e'), h: v('h'), acc: v('acc'),
    ok: v('ok'), warn: v('warn'), bad: v('bad'),
    dark: document.documentElement.dataset.theme !== 'light',
  };
  return cached;
}

export function onTheme(cb: () => void): () => void {
  subs.add(cb);
  return () => subs.delete(cb);
}

export function setTheme(t: 'dark' | 'light') {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('rfc-theme', t); } catch { /* private mode */ }
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', t === 'dark' ? '#0a0e16' : '#f6f7fb');
  cached = null;
  subs.forEach((f) => f());
}

/** Parse "#rrggbb" into an [r,g,b] triple for pixel-level drawing. */
export function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function alpha(hex: string, a: number): string {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
