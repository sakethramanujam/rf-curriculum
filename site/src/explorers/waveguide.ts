import { byId } from './registry';
import { explorerPage, card, equationsSection, notice } from '../lib/page';
import { eqFor } from '../equations';
import { el } from '../lib/dom';
import { Loop, surface, arrow, divergingLUT } from '../lib/canvas';
import { slider, segmented, readout, playButton, toggle, focusControl, fmtSI } from '../lib/ui';
import { palette, alpha, rgb } from '../lib/theme';
import { waveguideCutoff, waveguideDispersion, modeFields, C0, type Mode } from '../lib/physics';

type ModeId = 'TE10' | 'TE20' | 'TE11' | 'TM11';
type Preset = 'WR90' | 'WR28' | 'WR3.4' | 'custom';
const MODES: Record<ModeId, Mode> = { TE10: { kind: 'TE', m: 1, n: 0 }, TE20: { kind: 'TE', m: 2, n: 0 }, TE11: { kind: 'TE', m: 1, n: 1 }, TM11: { kind: 'TM', m: 1, n: 1 } };
const PRESETS: Record<Exclude<Preset, 'custom'>, { a: number; b: number; f: number; label: string }> = {
  WR90: { a: 22.86e-3, b: 10.16e-3, f: 10e9, label: 'WR-90 (X band)' },
  WR28: { a: 7.112e-3, b: 3.556e-3, f: 35e9, label: 'WR-28 (Ka band)' },
  'WR3.4': { a: 0.864e-3, b: 0.432e-3, f: 275e9, label: 'WR-3.4 (220–330 GHz)' },
};

export default function mount(root: HTMLElement) {
  const meta = byId('waveguide')!;
  const { viz, controls, after } = explorerPage(root, meta,
    'A hollow metal pipe can only carry field patterns that vanish properly on its walls. Each pattern (mode) is a set of half-sine bumps across the guide, and each has a cutoff frequency below which it cannot propagate: it just decays. Above cutoff it propagates, but dispersively. Phase runs faster than light while energy runs slower.');

  const st = { mode: 'TE10' as ModeId, a: PRESETS.WR90.a, b: PRESETS.WR90.b, f: PRESETS.WR90.f, eps: 1, showH: true, rays: true };
  const cx = card('Cross-section (x–y) at z = 0', el('span', { class: 'legend-inline' }, el('span', {}, el('i', { style: 'background:var(--e)' }), 'E_t'), el('span', {}, el('i', { style: 'background:var(--h)' }), 'H_t'), el('span', { class: 'muted' }, 'shading: longitudinal H_z or E_z')));
  const ct = card('Top view (x–z): E_y travelling down the guide', el('span', { class: 'muted' }, 'shading = E_y(x, b/4, z, t)'));
  const cd = card('Dispersion: f vs β for each mode', el('span', { class: 'legend-inline' }, el('span', {}, el('i', { style: 'background:var(--acc)' }), 'v_p slope'), el('span', {}, el('i', { style: 'background:var(--ok)' }), 'v_g tangent')));
  const ro = readout([
    { k: 'fc', label: 'Cutoff f_c' }, { k: 'state', label: 'State' }, { k: 'lg', label: 'Guide wavelength λ_g' },
    { k: 'vp', label: 'Phase velocity v_p' }, { k: 'vg', label: 'Group velocity v_g' }, { k: 'band', label: 'Single-mode band' },
  ]);
  viz.append(el('div', { class: 'two' }, cx.card, el('div', { class: 'card', style: 'padding:12px' }, ro.el)), ct.card, cd.card);

  let loop: Loop | null = null;
  const SX = surface(cx.canvas, { aspect: 0.62, minH: 200, maxH: 320 }, () => loop?.request());
  const ST = surface(ct.canvas, { aspect: 0.36, minH: 170, maxH: 300 }, () => loop?.request());
  const SD = surface(cd.canvas, { aspect: 0.5, minH: 230, maxH: 360 }, () => loop?.request());

  // low-res offscreen buffer for the heat maps (fast on phones)
  const buf = document.createElement('canvas');
  const bctx = buf.getContext('2d')!;
  let lut = new Uint8ClampedArray(0);
  let lutKey = '';
  const getLut = () => {
    const P = palette();
    const k = P.e + P.h + P.panel;
    if (k !== lutKey) { lut = divergingLUT(rgb(P.e), rgb(P.h), rgb(P.panel)); lutKey = k; }
    return lut;
  };
  const heat = (ctx: CanvasRenderingContext2D, nx: number, ny: number, f: (i: number, j: number) => number, dx: number, dy: number, dw: number, dh: number) => {
    buf.width = nx; buf.height = ny;
    const img = bctx.createImageData(nx, ny);
    const L = getLut();
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const v = Math.max(-1, Math.min(1, f(i, j)));
      const li = Math.round((v + 1) * 127.5) * 3, p = (j * nx + i) * 4;
      img.data[p] = L[li]; img.data[p + 1] = L[li + 1]; img.data[p + 2] = L[li + 2]; img.data[p + 3] = 255;
    }
    bctx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(buf, dx, dy, dw, dh);
  };

  const draw = (t: number) => {
    const P = palette();
    const md = MODES[st.mode];
    const fc = waveguideCutoff(st.a, st.b, md.m, md.n, st.eps);
    const D = waveguideDispersion(st.f, fc, st.eps);
    const wt = 2 * Math.PI * 0.5 * t;
    // normalise field shapes
    let emax = 1e-12;
    for (let i = 0; i <= 12; i++) for (let j = 0; j <= 12; j++) { const F = modeFields(md, st.a, st.b, (i / 12) * st.a, (j / 12) * st.b); emax = Math.max(emax, Math.hypot(F.Ex, F.Ey)); }
    { // cross-section
      const { ctx, w, h } = SX.s;
      ctx.clearRect(0, 0, w, h);
      const pad = 18, ar = st.b / st.a;
      let gw = w - 2 * pad, gh = gw * ar;
      if (gh > h - 2 * pad) { gh = h - 2 * pad; gw = gh / ar; }
      const x0 = (w - gw) / 2, y0 = (h - gh) / 2;
      const lon = md.kind === 'TE' ? 'Hz' : 'Ez';
      heat(ctx, 48, Math.max(8, Math.round(48 * ar)), (i, j) => {
        const F = modeFields(md, st.a, st.b, ((i + 0.5) / 48) * st.a, (1 - (j + 0.5) / Math.max(8, Math.round(48 * ar))) * st.b);
        return 0.8 * (lon === 'Hz' ? -F.Hz : F.Ez) * Math.sin(wt);
      }, x0, y0, gw, gh);
      ctx.strokeStyle = P.text; ctx.lineWidth = 3; ctx.strokeRect(x0, y0, gw, gh);
      const nxA = 9, nyA = Math.max(3, Math.round(9 * ar));
      const sc = (Math.min(gw / nxA, gh / nyA) * 0.42) / emax;
      const ct = Math.cos(wt);
      for (let i = 0; i < nxA; i++) for (let j = 0; j < nyA; j++) {
        const x = ((i + 0.5) / nxA) * st.a, y = ((j + 0.5) / nyA) * st.b;
        const F = modeFields(md, st.a, st.b, x, y);
        const px = x0 + (x / st.a) * gw, py = y0 + gh - (y / st.b) * gh;
        ctx.strokeStyle = P.e; ctx.fillStyle = P.e; ctx.lineWidth = 2;
        if (Math.hypot(F.Ex, F.Ey) * Math.abs(ct) > emax * 0.04) arrow(ctx, px, py, px + F.Ex * sc * ct, py - F.Ey * sc * ct, 6);
        if (st.showH) {
          ctx.strokeStyle = alpha(P.h, 0.9); ctx.fillStyle = P.h; ctx.lineWidth = 1.5;
          if (Math.hypot(F.Hx, F.Hy) * Math.abs(ct) > emax * 0.04) arrow(ctx, px, py, px + F.Hx * sc * 0.8 * ct, py - F.Hy * sc * 0.8 * ct, 5);
        }
      }
      ctx.fillStyle = P.faint; ctx.font = '11px ui-sans-serif, system-ui';
      ctx.fillText(`a = ${fmtSI(st.a, 'm')}`, x0 + gw / 2 - 30, y0 + gh + 14);
      ctx.save(); ctx.translate(x0 - 6, y0 + gh / 2 + 24); ctx.rotate(-Math.PI / 2); ctx.fillText(`b = ${fmtSI(st.b, 'm')}`, 0, 0); ctx.restore();
    }
    { // top view
      const { ctx, w, h } = ST.s;
      ctx.clearRect(0, 0, w, h);
      const pad = 14, y0 = pad + 4, gh = h - 2 * pad - 12, x0 = 40, gw = w - x0 - pad;
      const len = Math.max(4 * st.a, D.propagating ? Math.min(3 * D.lambdaG, 12 * st.a) : 4 * st.a); // physical length shown
      const nx = Math.min(220, Math.round(gw / 3)), ny = 40;
      const yy = st.b / 4;
      heat(ctx, nx, ny, (i, j) => {
        const z = ((i + 0.5) / nx) * len, x = (1 - (j + 0.5) / ny) * st.a;
        const F = modeFields(md, st.a, st.b, x, yy);
        const s = F.Ey / emax;
        return D.propagating ? 0.95 * s * Math.cos(wt - D.beta * z) : 0.95 * s * Math.exp(-D.alpha * z) * Math.cos(wt);
      }, x0, y0, gw, gh);
      ctx.strokeStyle = P.text; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + gw, y0); ctx.moveTo(x0, y0 + gh); ctx.lineTo(x0 + gw, y0 + gh); ctx.stroke();
      // plane-wave "rays" for the propagating case
      if (st.rays && D.propagating) {
        const kx = (md.m * Math.PI) / st.a;
        const zb = (st.a * D.beta) / kx; // z distance per wall-to-wall crossing
        ctx.strokeStyle = alpha(P.warn, 0.85); ctx.lineWidth = 1.6; ctx.setLineDash([6, 5]);
        ctx.beginPath();
        const yAt = (k: number) => (k % 2 === 0 ? y0 + gh : y0);
        ctx.moveTo(x0, yAt(0));
        for (let k = 1; ; k++) {
          const z = k * zb;
          if (z >= len) {
            const fr = (len - (k - 1) * zb) / zb;
            ctx.lineTo(x0 + gw, yAt(k - 1) + (yAt(k) - yAt(k - 1)) * fr);
            break;
          }
          ctx.lineTo(x0 + (z / len) * gw, yAt(k));
        }
        ctx.stroke(); ctx.setLineDash([]);
        const ang = (Math.atan2(kx, D.beta) * 180) / Math.PI;
        ctx.fillStyle = P.warn; ctx.font = '11px ui-sans-serif, system-ui';
        ctx.fillText(`plane-wave bounce: ${ang.toFixed(1)}° from the axis${md.n === 0 ? ' (sin θ = f_c/f)' : ' (x–z projection)'}`, x0 + 4, h - 4);
      }
      ctx.fillStyle = P.faint; ctx.font = '11px ui-sans-serif, system-ui';
      ctx.fillText('x', 24, y0 + 10); ctx.fillText('z →', x0 + gw - 26, y0 + gh + 12);
      if (!D.propagating) { ctx.fillStyle = P.bad; ctx.font = '600 13px ui-sans-serif, system-ui'; ctx.fillText(`below cutoff: decays as e^(−αz), α = ${(D.alpha * 8.686).toFixed(1)} dB/m`, x0 + 8, y0 + 18); }
      else { ctx.fillStyle = P.faint; ctx.textAlign = 'right'; ctx.fillText(`length shown: ${fmtSI(len, 'm')}`, x0 + gw, y0 - 5); ctx.textAlign = 'start'; }
    }
    { // dispersion
      const { ctx, w, h } = SD.s;
      ctx.clearRect(0, 0, w, h);
      const l = 50, r = w - 14, tp = 14, bt = h - 34;
      const v = C0 / Math.sqrt(st.eps);
      const fmax = Math.max(st.f * 1.4, waveguideCutoff(st.a, st.b, 1, 1, st.eps) * 1.25);
      const bmax = (2 * Math.PI * fmax) / v;
      const X = (b: number) => l + (b / bmax) * (r - l), Y = (f: number) => bt - (f / fmax) * (bt - tp);
      ctx.strokeStyle = P.grid; ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) { const y = Y((i / 5) * fmax); ctx.beginPath(); ctx.moveTo(l, y); ctx.lineTo(r, y); ctx.stroke(); }
      ctx.fillStyle = P.faint; ctx.font = '11px ui-sans-serif, system-ui';
      for (let i = 0; i <= 5; i++) ctx.fillText(fmtSI((i / 5) * fmax, 'Hz', 2), 2, Y((i / 5) * fmax) + 4);
      ctx.fillText('β (rad/m) →', r - 70, h - 8);
      // light line
      ctx.strokeStyle = alpha(P.muted, 0.7); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(bmax), Y(fmax)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillText('light line (TEM)', X(bmax * 0.7) + 6, Y(fmax * 0.7) + 14);
      const all: [string, Mode][] = [['TE10', MODES.TE10], ['TE20', MODES.TE20], ['TE01', { kind: 'TE', m: 0, n: 1 }], ['TE11/TM11', MODES.TE11]];
      for (const [name, m] of all) {
        const fcm = waveguideCutoff(st.a, st.b, m.m, m.n, st.eps);
        if (fcm > fmax) continue;
        const sel = name.includes(st.mode);
        ctx.strokeStyle = sel ? P.e : alpha(P.muted, 0.55); ctx.lineWidth = sel ? 2.8 : 1.4;
        ctx.beginPath();
        for (let i = 0; i <= 120; i++) { const f = fcm + (i / 120) * (fmax - fcm); const b = Math.sqrt(Math.max(0, (2 * Math.PI * f / v) ** 2 - (2 * Math.PI * fcm / v) ** 2)); i ? ctx.lineTo(X(b), Y(f)) : ctx.moveTo(X(b), Y(f)); }
        ctx.stroke();
        ctx.fillStyle = sel ? P.e : P.faint; ctx.fillText(name, l + 4, Y(fcm) - 4);
      }
      // operating point and slopes
      ctx.strokeStyle = alpha(P.text, 0.4); ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(l, Y(st.f)); ctx.lineTo(r, Y(st.f)); ctx.stroke(); ctx.setLineDash([]);
      if (D.propagating) {
        const px = X(D.beta), py = Y(st.f);
        ctx.strokeStyle = P.acc; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(px, py); ctx.stroke();
        // tangent: df/dβ = vg/2π
        const dB = bmax * 0.18, dF = (D.vg * dB) / (2 * Math.PI);
        ctx.strokeStyle = P.ok; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(D.beta - dB), Y(st.f - dF)); ctx.lineTo(X(D.beta + dB), Y(st.f + dF)); ctx.stroke();
        ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fillStyle = P.e; ctx.fill(); ctx.strokeStyle = P.text; ctx.lineWidth = 2; ctx.stroke();
      } else {
        ctx.fillStyle = P.bad; ctx.fillText('operating point below this mode’s cutoff (β imaginary)', l + 8, Y(st.f) - 6);
      }
    }
  };
  loop = new Loop(draw, cx.canvas);

  const update = () => {
    const md = MODES[st.mode];
    const fc = waveguideCutoff(st.a, st.b, md.m, md.n, st.eps);
    const D = waveguideDispersion(st.f, fc, st.eps);
    const v = C0 / Math.sqrt(st.eps);
    ro.set('fc', fmtSI(fc, 'Hz', 4));
    ro.set('state', D.propagating ? 'Propagating' : 'Evanescent', D.propagating ? 'good' : 'badv');
    ro.set('lg', D.propagating ? fmtSI(D.lambdaG, 'm') : '—');
    ro.set('vp', D.propagating ? `${(D.vp / v).toFixed(3)} × v` : '—');
    ro.set('vg', D.propagating ? `${(D.vg / v).toFixed(3)} × v` : '0');
    const f10 = waveguideCutoff(st.a, st.b, 1, 0, st.eps);
    const next = Math.min(waveguideCutoff(st.a, st.b, 2, 0, st.eps), waveguideCutoff(st.a, st.b, 0, 1, st.eps));
    ro.set('band', `${fmtSI(f10, 'Hz', 3)} – ${fmtSI(next, 'Hz', 3)}`);
    loop?.request();
  };

  const modeSeg = segmented<ModeId>({ id: 'mode', label: 'Mode', value: st.mode, options: (Object.keys(MODES) as ModeId[]).map((m) => ({ value: m, label: m.replace(/(\d)(\d)/, '$1$2') })), onChange: (m) => { st.mode = m; update(); } });
  const sA = slider({ id: 'a', label: 'Broad wall a', min: 0.2e-3, max: 60e-3, log: true, value: st.a, fmt: (v) => fmtSI(v, 'm'), onInput: (v) => { st.a = v; if (st.b > v) { st.b = v; sB.set(v); } preset.set('custom'); update(); } });
  const sB = slider({ id: 'b', label: 'Narrow wall b', min: 0.1e-3, max: 60e-3, log: true, value: st.b, fmt: (v) => fmtSI(v, 'm'), onInput: (v) => { st.b = Math.min(v, st.a); preset.set('custom'); update(); } });
  const sF = slider({ id: 'f', label: 'Frequency f', min: 1e9, max: 1.2e12, log: true, value: st.f, fmt: (v) => fmtSI(v, 'Hz', 4), onInput: (v) => { st.f = v; update(); } });
  const sE = slider({ id: 'eps', label: 'Filling εr', min: 1, max: 10, step: 0.01, value: 1, fmt: (v) => v.toFixed(2), onInput: (v) => { st.eps = v; update(); } });
  const preset = segmented<Preset>({ id: 'preset', label: 'Standard guide', value: 'WR90', options: [
    { value: 'WR90', label: 'WR-90' }, { value: 'WR28', label: 'WR-28' }, { value: 'WR3.4', label: 'WR-3.4' }, { value: 'custom', label: 'Custom' }],
    onChange: (p) => { if (p === 'custom') return; const q = PRESETS[p]; st.a = q.a; st.b = q.b; st.f = q.f; sA.set(q.a); sB.set(q.b); sF.set(q.f); update(); } });
  const tH = toggle({ id: 'showh', label: 'Show H_t arrows', value: true, onChange: (v) => { st.showH = v; loop?.request(); } });
  const tR = toggle({ id: 'rays', label: 'Show plane-wave bounce picture', value: true, onChange: (v) => { st.rays = v; loop?.request(); } });
  controls.append(el('div', { class: 'seg' }, playButton(loop)), modeSeg.el, preset.el, sF.el, sA.el, sB.el, sE.el, tH.el, tR.el,
    el('small', { class: 'muted' }, 'WR-3.4 covers 220–330 GHz, the band of a typical THz VNA extender. Its TE10 cutoff sits near 173.5 GHz.'));

  const eqs = equationsSection(eqFor('waveguide'), focusControl);
  after.append(notice([
    '<b>TE10 is the workhorse</b>: one half-sine across a, uniform across b, so E points straight between the broad walls. It is the only mode between f_c,10 and the next cutoff (TE20 when b ≤ a/2).',
    '<b>Slide f down toward cutoff</b>: λ_g stretches to infinity, v_p shoots up, and v_g drops to zero. Their product stays v². The bounce angle steepens until the plane waves just hit the walls head-on and get nowhere.',
    '<b>Below cutoff the field still exists, it just does not travel</b>: the top view stops moving and decays exponentially. This is how waveguide-below-cutoff attenuators and vents work.',
    '<b>TE11 and TM11 share a cutoff (degenerate modes)</b> but look completely different. TM modes have E_z and no H_z, so they need n ≥ 1 and m ≥ 1.',
    'Filling the guide with dielectric lowers every cutoff by √εr, a common trick for shrinking guides.',
  ]), eqs.el);
  update();
  return () => { loop?.destroy(); SX.destroy(); ST.destroy(); SD.destroy(); eqs.destroy(); };
}
