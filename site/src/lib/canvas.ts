import { onTheme } from './theme';

export const prefersReducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface Surface {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** CSS pixel size */
  w: number;
  h: number;
  dpr: number;
}

export interface SurfaceOpts {
  /** height / width */
  aspect: number;
  minH?: number;
  maxH?: number;
  /** Cap on device pixel ratio, for phone performance. */
  maxDpr?: number;
}

/** A HiDPI canvas that tracks its container width. */
export function surface(canvas: HTMLCanvasElement, opts: SurfaceOpts, onResize: (s: Surface) => void) {
  const ctx = canvas.getContext('2d')!;
  const s: Surface = { canvas, ctx, w: 0, h: 0, dpr: 1 };
  const fit = () => {
    const w = canvas.parentElement!.clientWidth;
    if (!w) return;
    const h = Math.round(Math.min(opts.maxH ?? 9999, Math.max(opts.minH ?? 0, w * opts.aspect)));
    const dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr ?? 2);
    if (w === s.w && h === s.h && dpr === s.dpr) return;
    s.w = w; s.h = h; s.dpr = dpr;
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    onResize(s);
  };
  const ro = new ResizeObserver(fit);
  ro.observe(canvas.parentElement!);
  // Defer the first fit so callers can finish wiring (their callbacks may reference
  // the returned handle or state declared after this call).
  queueMicrotask(fit);
  return { s, destroy: () => ro.disconnect(), fit };
}

/**
 * Animation loop: advances time only while playing, pauses when off-screen or the tab is
 * hidden, and starts paused when the user prefers reduced motion.
 */
export class Loop {
  t = 0;
  playing: boolean;
  private raf = 0;
  private last = 0;
  private dirty = true;
  private visible = true;
  private io?: IntersectionObserver;
  private unTheme: () => void;
  private listeners = new Set<(p: boolean) => void>();
  constructor(private draw: (t: number, dt: number) => void, watch?: Element, autoplay = true) {
    this.playing = autoplay && !prefersReducedMotion();
    if (watch && 'IntersectionObserver' in window) {
      this.io = new IntersectionObserver((es) => {
        this.visible = es.some((e) => e.isIntersecting);
        if (this.visible) this.kick();
      });
      this.io.observe(watch);
    }
    this.unTheme = onTheme(() => this.request());
    document.addEventListener('visibilitychange', this.onVis);
    this.kick();
  }
  private onVis = () => { if (!document.hidden) this.kick(); };
  private kick() {
    if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(this.tick); }
  }
  private tick = (now: number) => {
    this.raf = 0;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (!this.visible || document.hidden) return;
    if (this.playing) this.t += dt;
    if (this.playing || this.dirty) { this.dirty = false; this.draw(this.t, this.playing ? dt : 0); }
    if (this.playing) this.raf = requestAnimationFrame(this.tick);
  };
  request() { this.dirty = true; this.kick(); }
  play() { this.playing = true; this.listeners.forEach((f) => f(true)); this.kick(); }
  pause() { this.playing = false; this.listeners.forEach((f) => f(false)); }
  toggle() { this.playing ? this.pause() : this.play(); }
  onChange(f: (p: boolean) => void) { this.listeners.add(f); }
  destroy() {
    cancelAnimationFrame(this.raf);
    this.io?.disconnect();
    this.unTheme();
    document.removeEventListener('visibilitychange', this.onVis);
  }
}

/** Pointer position in CSS px relative to the canvas. */
export function pointerPos(e: PointerEvent, cv: HTMLCanvasElement) {
  const r = cv.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

/** Drag helper with pointer capture; returns a disposer. */
export function onDrag(
  cv: HTMLCanvasElement,
  h: { start?: (x: number, y: number) => boolean | void; move: (x: number, y: number, dx: number, dy: number) => void; end?: () => void },
) {
  let active = false;
  let lx = 0, ly = 0;
  const down = (e: PointerEvent) => {
    const p = pointerPos(e, cv);
    if (h.start && h.start(p.x, p.y) === false) return;
    active = true; lx = p.x; ly = p.y;
    cv.setPointerCapture(e.pointerId);
    h.move(p.x, p.y, 0, 0);
  };
  const move = (e: PointerEvent) => {
    if (!active) return;
    const p = pointerPos(e, cv);
    h.move(p.x, p.y, p.x - lx, p.y - ly);
    lx = p.x; ly = p.y;
  };
  const up = () => { if (active) { active = false; h.end?.(); } };
  cv.addEventListener('pointerdown', down);
  cv.addEventListener('pointermove', move);
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  return () => {
    cv.removeEventListener('pointerdown', down);
    cv.removeEventListener('pointermove', move);
    cv.removeEventListener('pointerup', up);
    cv.removeEventListener('pointercancel', up);
  };
}

/** Simple orthographic-ish 3D → 2D camera with yaw/pitch and mild perspective. */
export class Camera {
  constructor(public yaw = -0.6, public pitch = 0.35, public dist = 9, public scale = 60) {}
  cx = 0;
  cy = 0;
  project(x: number, y: number, z: number): [number, number, number] {
    const cyw = Math.cos(this.yaw), syw = Math.sin(this.yaw);
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    // rotate around vertical (y) axis then tilt
    const x1 = cyw * x + syw * z;
    const z1 = -syw * x + cyw * z;
    const y1 = cp * y - sp * z1;
    const z2 = sp * y + cp * z1;
    const p = this.dist / (this.dist - z2 * 0.6);
    return [this.cx + x1 * this.scale * p, this.cy - y1 * this.scale * p, z2];
  }
}

export function arrow(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, head = 7) {
  const dx = x1 - x0, dy = y1 - y0;
  const L = Math.hypot(dx, dy);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  if (L < 2) return;
  const ux = dx / L, uy = dy / L;
  const hh = Math.min(head, L * 0.5);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * hh - uy * hh * 0.5, y1 - uy * hh + ux * hh * 0.5);
  ctx.lineTo(x1 - ux * hh + uy * hh * 0.5, y1 - uy * hh - ux * hh * 0.5);
  ctx.closePath();
  ctx.fill();
}

/** Diverging colormap for signed fields in [-1, 1]: E-colour ↔ background ↔ H-colour. */
export function divergingLUT(pos: [number, number, number], neg: [number, number, number], mid: [number, number, number]) {
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const v = i / 127.5 - 1;
    const a = Math.min(1, Math.abs(v)) ** 0.8;
    const t = v >= 0 ? pos : neg;
    for (let k = 0; k < 3; k++) lut[i * 3 + k] = mid[k] + (t[k] - mid[k]) * a;
  }
  return lut;
}
