import { el } from './dom';
import type { Loop } from './canvas';

let uid = 0;

export interface SliderOpts {
  id: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  /** Logarithmic mapping (min, max must be > 0). */
  log?: boolean;
  fmt?: (v: number) => string;
  onInput: (v: number) => void;
  hint?: string;
}

export interface Slider {
  el: HTMLElement;
  input: HTMLInputElement;
  get(): number;
  set(v: number, fire?: boolean): void;
}

export function slider(o: SliderOpts): Slider {
  const inputId = `in-${o.id}-${++uid}`;
  const N = 1000;
  const toPos = (v: number) => (o.log ? (Math.log(v / o.min) / Math.log(o.max / o.min)) * N : v);
  const fromPos = (p: number) => (o.log ? o.min * (o.max / o.min) ** (p / N) : p);
  const input = el('input', {
    type: 'range', id: inputId,
    min: o.log ? 0 : o.min, max: o.log ? N : o.max, step: o.log ? 1 : o.step ?? 'any',
    value: toPos(o.value),
    'aria-describedby': o.hint ? `${inputId}-hint` : undefined,
  });
  const out = el('output', { for: inputId });
  const fmt = o.fmt ?? ((v: number) => v.toFixed(2));
  let value = o.value;
  const paint = () => {
    const p = (Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min));
    input.style.setProperty('--pct', `${(p * 100).toFixed(1)}%`);
    out.textContent = fmt(value);
    input.setAttribute('aria-valuetext', fmt(value));
  };
  input.addEventListener('input', () => {
    value = fromPos(Number(input.value));
    paint();
    o.onInput(value);
  });
  const wrap = el('div', { class: 'ctl', id: `ctl-${o.id}` },
    el('label', { for: inputId }, el('span', {}, o.label), out),
    input,
    o.hint ? el('small', { class: 'muted', id: `${inputId}-hint` }, o.hint) : null,
  );
  paint();
  return {
    el: wrap, input,
    get: () => value,
    set(v, fire = false) {
      value = v;
      input.value = String(toPos(v));
      paint();
      if (fire) o.onInput(v);
    },
  };
}

export interface SegOpts<T extends string> {
  id: string;
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

export function segmented<T extends string>(o: SegOpts<T>) {
  let value = o.value;
  const lblId = `seg-${o.id}-${++uid}`;
  const group = el('div', { class: 'seg', role: 'radiogroup', 'aria-labelledby': lblId });
  const btns = o.options.map((op) => {
    const b = el('button', { type: 'button', role: 'radio', 'aria-checked': String(op.value === value), 'data-v': op.value }, op.label);
    b.addEventListener('click', () => api.set(op.value, true));
    b.addEventListener('keydown', (e) => {
      const i = o.options.findIndex((x) => x.value === value);
      const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const nx = o.options[(i + d + o.options.length) % o.options.length].value;
      api.set(nx, true);
      btns.find((x) => x.dataset.v === nx)?.focus();
    });
    group.append(b);
    return b;
  });
  const sync = () => btns.forEach((b) => {
    const on = b.dataset.v === value;
    b.setAttribute('aria-checked', String(on));
    b.tabIndex = on ? 0 : -1;
  });
  const wrap = el('div', { class: 'ctl', id: `ctl-${o.id}` }, el('span', { class: 'lbl', id: lblId }, o.label), group);
  const api = {
    el: wrap,
    get: () => value,
    set(v: T, fire = false) { value = v; sync(); if (fire) o.onChange(v); },
  };
  sync();
  return api;
}

export function toggle(o: { id: string; label: string; value: boolean; onChange: (v: boolean) => void }) {
  const input = el('input', { type: 'checkbox' }) as HTMLInputElement;
  input.checked = o.value;
  input.addEventListener('change', () => o.onChange(input.checked));
  return { el: el('div', { class: 'ctl', id: `ctl-${o.id}` }, el('label', { class: 'toggle' }, input, el('span', {}, o.label))), input };
}

export function playButton(loop: Loop) {
  const b = el('button', { type: 'button', class: 'btn', 'aria-pressed': String(loop.playing) });
  const sync = (p: boolean) => {
    b.textContent = p ? '❚❚ Pause' : '▶ Play';
    b.setAttribute('aria-pressed', String(p));
    b.setAttribute('aria-label', p ? 'Pause animation' : 'Play animation');
  };
  sync(loop.playing);
  loop.onChange(sync);
  b.addEventListener('click', () => loop.toggle());
  return b;
}

/** A grid of labelled numeric readouts that can be updated by key. */
export function readout(keys: { k: string; label: string }[]) {
  const cells = new Map<string, HTMLElement>();
  const boxes = new Map<string, HTMLElement>();
  const root = el('div', { class: 'readout', role: 'status', 'aria-live': 'polite' });
  for (const { k, label } of keys) {
    const b = el('b', {}, '—');
    const box = el('div', {}, el('span', {}, label), b);
    cells.set(k, b);
    boxes.set(k, box);
    root.append(box);
  }
  return {
    el: root,
    set(k: string, v: string, tone?: 'good' | 'warnv' | 'badv') {
      const c = cells.get(k);
      if (c && c.textContent !== v) c.textContent = v;
      const bx = boxes.get(k);
      if (bx) bx.className = tone ?? '';
    },
  };
}

/** Scroll to a control and flash it (used by equation term links). */
export function focusControl(id: string) {
  const t = document.getElementById(`ctl-${id}`) ?? document.getElementById(id);
  if (!t) return;
  t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  t.classList.remove('pulse');
  void t.offsetWidth;
  t.classList.add('pulse');
  const f = t.querySelector<HTMLElement>('input, button');
  f?.focus({ preventScroll: true });
}

export const fmtNum = (v: number, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '∞');
export function fmtSI(v: number, unit: string, d = 3): string {
  if (!Number.isFinite(v)) return '∞';
  if (v === 0) return `0 ${unit}`;
  const pre: [number, string][] = [[1e12, 'T'], [1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']];
  const a = Math.abs(v);
  for (const [s, p] of pre) if (a >= s * 0.9995) return `${(v / s).toPrecision(d)} ${p}${unit}`;
  return `${v.toExponential(2)} ${unit}`;
}
