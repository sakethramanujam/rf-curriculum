import { byId } from './registry';
import { explorerPage, card, equationsSection, notice } from '../lib/page';
import { eqFor } from '../equations';
import { el } from '../lib/dom';
import { Loop, surface, arrow } from '../lib/canvas';
import { slider, segmented, playButton, readout, toggle, focusControl } from '../lib/ui';
import { palette, alpha } from '../lib/theme';
import { gamma, vswr, returnLossDb, zFromGamma, DEG } from '../lib/physics';
import { abs, arg, c, mul, expj, add, fmt } from '../lib/complex';
import { lineState as L, loadZ, emitLine, onLine, type LoadMode } from '../lib/store';

export default function mount(root: HTMLElement) {
  const meta = byId('tline')!;
  const { viz, controls, after } = explorerPage(root, meta,
    'A wave launched down a line reaches the load and has to satisfy V/I = Z_L. If the load is not Z0, the only way to manage that is to send part of the wave back. The incident and reflected waves then interfere into a standing-wave pattern. Its peak-to-trough ratio is the VSWR, and its position encodes the phase of Γ.');

  const LEN = 2; // wavelengths of line shown
  const st = { showI: false, showParts: true, lossDb: 0 };

  const cl = card('Voltage on the line', el('span', { class: 'legend-inline' },
    el('span', {}, el('i', { style: 'background:var(--e)' }), 'incident'), el('span', {}, el('i', { style: 'background:var(--h)' }), 'reflected'),
    el('span', {}, el('i', { style: 'background:var(--acc)' }), 'total v(z,t)'), el('span', {}, el('i', { style: 'background:var(--ok)' }), '|V(z)| envelope')));
  const cg = card('Γ at the load');
  const ro = readout([
    { k: 'g', label: 'Γ_L' }, { k: 'vswr', label: 'VSWR' }, { k: 'rl', label: 'Return loss' },
    { k: 'ml', label: 'Mismatch loss' }, { k: 'dmax', label: 'First |V| max' }, { k: 'zin', label: `Z_in at ${LEN}λ` },
  ]);
  viz.append(cl.card, el('div', { class: 'two' }, cg.card, el('div', { class: 'card', style: 'padding:12px' }, ro.el)));

  let loop: Loop | null = null;
  const SL = surface(cl.canvas, { aspect: 0.42, minH: 240, maxH: 380 }, () => loop?.request());
  const SG = surface(cg.canvas, { aspect: 0.8, minH: 200, maxH: 280 }, () => loop?.request());

  const draw = (t: number) => {
    const P = palette();
    const z0 = L.z0;
    const G = gamma(loadZ(), z0);
    const gm = abs(G), gth = arg(G);
    const a = st.lossDb / 8.686; // Np per wavelength
    const wt = 2 * Math.PI * 0.5 * t;
    { // line view
      const { ctx, w, h } = SL.s;
      ctx.clearRect(0, 0, w, h);
      const left = 54, right = w - 46, mid = h * 0.52;
      const amp = (h * 0.36) / (Math.exp(a * LEN) * (1 + gm) || 1);
      const X = (d: number) => right - (d / LEN) * (right - left);
      // conductors
      ctx.strokeStyle = alpha(P.muted, 0.5); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(left, mid - h * 0.43); ctx.lineTo(right, mid - h * 0.43); ctx.moveTo(left, mid + h * 0.43); ctx.lineTo(right, mid + h * 0.43); ctx.stroke();
      ctx.strokeStyle = P.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(left, mid); ctx.lineTo(right, mid); ctx.stroke();
      ctx.fillStyle = P.faint; ctx.font = '11px ui-sans-serif, system-ui'; ctx.textAlign = 'center';
      for (let q = 0; q <= LEN * 4; q++) {
        const x = X(q / 4);
        ctx.beginPath(); ctx.moveTo(x, mid - 4); ctx.lineTo(x, mid + 4); ctx.stroke();
        if (q % 2 === 0) ctx.fillText(q === 0 ? 'load' : `${q / 4}λ`, x, h - 6);
      }
      // generator and load glyphs
      ctx.strokeStyle = P.muted; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(left - 22, mid, 13, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(left - 30, mid); ctx.bezierCurveTo(left - 26, mid - 9, left - 18, mid + 9, left - 14, mid); ctx.stroke();
      ctx.fillText('gen', left - 22, mid + 30);
      ctx.fillStyle = alpha(P.e, 0.18); ctx.strokeStyle = P.e;
      ctx.beginPath(); ctx.rect(right + 8, mid - 26, 18, 52); ctx.fill(); ctx.stroke();
      ctx.fillStyle = P.e; ctx.fillText('Z_L', right + 17, mid - 32);
      ctx.textAlign = 'start';

      const N = Math.max(200, Math.round(w));
      const curve = (f: (d: number) => number, col: string, lw: number, dash?: number[]) => {
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash ?? []);
        ctx.beginPath();
        for (let i = 0; i <= N; i++) { const d = (i / N) * LEN; const y = mid - f(d) * amp; i ? ctx.lineTo(X(d), y) : ctx.moveTo(X(d), y); }
        ctx.stroke(); ctx.setLineDash([]);
      };
      // phasors: incident e^{αd} e^{jβd}, reflected Γ e^{−αd} e^{−jβd}; current uses (inc − ref)
      const inc = (d: number) => Math.exp(a * d) * Math.cos(wt + 2 * Math.PI * d);
      const ref = (d: number) => gm * Math.exp(-a * d) * Math.cos(wt - 2 * Math.PI * d + gth);
      const env = (d: number, sgn: number) => abs(add(mul(c(Math.exp(a * d)), expj(2 * Math.PI * d)), mul(c(sgn * gm * Math.exp(-a * d)), expj(gth - 2 * Math.PI * d))));
      ctx.fillStyle = alpha(P.ok, 0.07);
      ctx.beginPath();
      for (let i = 0; i <= N; i++) { const d = (i / N) * LEN; const y = mid - env(d, 1) * amp; i ? ctx.lineTo(X(d), y) : ctx.moveTo(X(d), y); }
      for (let i = N; i >= 0; i--) { const d = (i / N) * LEN; ctx.lineTo(X(d), mid + env(d, 1) * amp); }
      ctx.fill();
      curve((d) => env(d, 1), P.ok, 1.6, [6, 4]);
      curve((d) => -env(d, 1), P.ok, 1.6, [6, 4]);
      if (st.showI) {
        curve((d) => env(d, -1), alpha(P.warn, 0.9), 1.4, [2, 4]);
        curve((d) => -env(d, -1), alpha(P.warn, 0.9), 1.4, [2, 4]);
      }
      if (st.showParts) { curve(inc, alpha(P.e, 0.75), 1.4); if (gm > 1e-3) curve(ref, alpha(P.h, 0.85), 1.4); }
      curve((d) => inc(d) + ref(d), P.acc, 2.6);
      // travelling-direction hints
      ctx.fillStyle = P.e; ctx.strokeStyle = P.e; ctx.lineWidth = 2;
      arrow(ctx, left + 10, 16, left + 60, 16, 7); ctx.font = '11px ui-sans-serif, system-ui'; ctx.fillText('toward load', left + 66, 20);
      if (gm > 1e-3) { ctx.fillStyle = P.h; ctx.strokeStyle = P.h; arrow(ctx, right - 10, 16, right - 60, 16, 7); ctx.textAlign = 'right'; ctx.fillText('reflected', right - 66, 20); ctx.textAlign = 'start'; }
      if (st.showI) { ctx.fillStyle = P.warn; ctx.fillText('|I| envelope (dotted) peaks where |V| dips', left, h - 22); }
    }
    { // Γ phasor plot
      const { ctx, w, h } = SG.s;
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.4, cx = w / 2, cy = h / 2;
      ctx.strokeStyle = P.grid; ctx.lineWidth = 1;
      for (const r of [0.25, 0.5, 0.75, 1]) { ctx.beginPath(); ctx.arc(cx, cy, r * R, 0, 7); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
      ctx.fillStyle = P.faint; ctx.font = '11px ui-sans-serif, system-ui';
      ctx.fillText('Re', cx + R + 4, cy + 4); ctx.fillText('Im', cx + 4, cy - R - 4); ctx.fillText('|Γ| = 1', cx + R * 0.7, cy - R * 0.78);
      ctx.strokeStyle = P.acc; ctx.fillStyle = P.acc; ctx.lineWidth = 3;
      arrow(ctx, cx, cy, cx + G.re * R, cy - G.im * R, 10);
      ctx.fillStyle = P.text; ctx.font = '600 12px ui-sans-serif, system-ui';
      ctx.fillText(`${gm.toFixed(3)} ∠ ${(gth / DEG).toFixed(1)}°`, 10, h - 10);
    }
  };
  loop = new Loop(draw, cl.canvas);

  const update = () => {
    const G = gamma(loadZ(), L.z0);
    const gm = abs(G);
    ro.set('g', `${gm.toFixed(3)} ∠${(arg(G) / DEG).toFixed(1)}°`);
    const s = vswr(G);
    ro.set('vswr', Number.isFinite(s) ? s.toFixed(2) : '∞', s < 1.5 ? 'good' : s < 3 ? 'warnv' : 'badv');
    ro.set('rl', gm < 1e-6 ? '∞ dB' : `${returnLossDb(G).toFixed(2)} dB`);
    ro.set('ml', gm >= 1 ? '∞ dB' : `${(-10 * Math.log10(1 - gm * gm)).toFixed(2)} dB`);
    let th = arg(G); if (th < 0) th += 2 * Math.PI;
    ro.set('dmax', gm < 1e-6 ? 'none (flat)' : `${(th / (4 * Math.PI)).toFixed(3)} λ`);
    // Lossy line: Γ(d) = Γ_L e^{−2γd}
    const a = st.lossDb / 8.686;
    const Gd = mul(G, mul(c(Math.exp(-2 * a * LEN)), expj(-4 * Math.PI * LEN)));
    ro.set('zin', fmt(zFromGamma(Gd, L.z0), 1, 'Ω'));
    loop?.request();
  };

  const sR = slider({ id: 'r', label: 'Load resistance R', min: 0, max: 500, step: 1, value: L.r, fmt: (v) => `${v.toFixed(0)} Ω`, onInput: (v) => { L.r = v; L.mode = 'rx'; seg.set('rx'); emitLine(); } });
  const sX = slider({ id: 'x', label: 'Load reactance X', min: -500, max: 500, step: 1, value: L.x, fmt: (v) => `${v >= 0 ? '+' : '−'}j${Math.abs(v).toFixed(0)} Ω`, onInput: (v) => { L.x = v; L.mode = 'rx'; seg.set('rx'); emitLine(); } });
  const seg = segmented<LoadMode>({ id: 'load', label: 'Load', value: L.mode, options: [
    { value: 'open', label: 'Open' }, { value: 'short', label: 'Short' }, { value: 'matched', label: 'Matched' }, { value: 'rx', label: 'R + jX' }],
    onChange: (m) => { L.mode = m; emitLine(); } });
  const sZ0 = slider({ id: 'z0', label: 'Characteristic impedance Z0', min: 10, max: 150, step: 1, value: L.z0, fmt: (v) => `${v.toFixed(0)} Ω`, onInput: (v) => { L.z0 = v; emitLine(); } });
  const sLoss = slider({ id: 'loss', label: 'Line loss (R, G)', min: 0, max: 2, step: 0.05, value: 0, fmt: (v) => `${v.toFixed(2)} dB/λ`, onInput: (v) => { st.lossDb = v; update(); },
    hint: 'Loss shrinks the reflected wave on its way back, so the VSWR you measure at the generator looks better than it is at the load.' });
  const tI = toggle({ id: 'showi', label: 'Show current envelope |I(z)|', value: false, onChange: (v) => { st.showI = v; loop?.request(); } });
  const tP = toggle({ id: 'parts', label: 'Show incident and reflected parts', value: true, onChange: (v) => { st.showParts = v; loop?.request(); } });
  controls.append(el('div', { class: 'seg' }, playButton(loop), el('a', { class: 'btn', href: '#/smith' }, 'Open on Smith chart →')),
    el('h3', {}, 'Termination'), seg.el, sR.el, sX.el, el('h3', {}, 'Line'), sZ0.el, sLoss.el, tP.el, tI.el);

  const off = onLine(() => { sR.set(Math.min(500, L.r)); sX.set(Math.max(-500, Math.min(500, L.x))); sZ0.set(L.z0); seg.set(L.mode); update(); });

  const eqs = equationsSection(eqFor('tline'), focusControl);
  after.append(notice([
    '<b>Short and open both give |Γ| = 1</b>, a full standing wave with true nulls. They differ only in where the nulls sit: at the load for a short, λ/4 back for an open.',
    '<b>Adjacent voltage minima are always λ/2 apart</b>, whatever the load. The VSWR tells you |Γ|, and the position of the first minimum tells you its phase. That is how slotted-line measurements worked before network analysers.',
    '<b>A matched load leaves only the incident wave</b>: the envelope is flat and the VSWR is 1.',
    '<b>Voltage maxima sit at current minima.</b> Turn on the current envelope: at a |V| peak the line looks like a real impedance Z0·VSWR, and at a dip it looks like Z0/VSWR.',
    'Inductive loads (+jX) put the first voltage maximum within λ/4 of the load; capacitive ones put a minimum there first.',
  ]), eqs.el);
  update();
  return () => { loop?.destroy(); SL.destroy(); SG.destroy(); off(); eqs.destroy(); };
}
