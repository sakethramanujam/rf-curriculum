import { byId } from './registry';
import { explorerPage, card, equationsSection, notice } from '../lib/page';
import { eqFor } from '../equations';
import { el } from '../lib/dom';
import { Loop, surface } from '../lib/canvas';
import { slider, segmented, readout, playButton, toggle, focusControl } from '../lib/ui';
import { palette, alpha, rgb } from '../lib/theme';
import { dipoleField, dipoleMetrics } from '../lib/physics';

type Preset = '0.5' | '1' | '1.5' | 'custom';

export default function mount(root: HTMLElement) {
  const meta = byId('dipole')!;
  const { viz, controls, after } = explorerPage(root, meta,
    'Drive a thin wire with an alternating current and the field lines near it cannot keep up. Every half cycle a closed loop of E pinches off and travels outward at c. The picture below is not a cartoon: the lines are contours of ρH_φ, computed exactly for a dipole carrying the textbook sinusoidal current.');

  const st = { L: 0.5, db: false };
  const cf = card('Instantaneous E-field lines (x–z plane)', el('span', { class: 'muted' }, 'colour = sense of circulation'));
  const cp = card('E-plane pattern |F(θ)|', el('span', { class: 'legend-inline' }, el('span', {}, el('i', { style: 'background:var(--e)' }), 'current L'), el('span', { class: 'muted' }, 'faint: λ/2, λ, 1.5λ')));
  const ro = readout([
    { k: 'D', label: 'Directivity D0' }, { k: 'hp', label: 'HPBW' }, { k: 'rr', label: 'R_r (at I_max)' },
    { k: 'rin', label: 'R_in at feed' }, { k: 'lobes', label: 'Lobes, θ = 0…180°' }, { k: 'max', label: 'Max at θ' },
  ]);
  viz.append(cf.card, el('div', { class: 'two' }, cp.card, el('div', { class: 'card', style: 'padding:12px' }, ro.el)));

  // Phasor S(x,z) = e^{-jkR1} + e^{-jkR2} − 2cos(kL/2) e^{-jkr}; Re{S e^{jωt}} ∝ ρ·H_φ, whose contours are E lines.
  let nx = 0, ny = 0, Sr = new Float32Array(0), Si = new Float32Array(0), ext = 2, smax = 1;
  const buf = document.createElement('canvas');
  const bctx = buf.getContext('2d')!;
  let img: ImageData | null = null;
  let loop: Loop | null = null;
  const SF = surface(cf.canvas, { aspect: 0.7, minH: 300, maxH: 560, maxDpr: 2 }, () => { rebuild(); loop?.request(); });
  const SP = surface(cp.canvas, { aspect: 1, minH: 240, maxH: 340 }, () => loop?.request());

  function rebuild() {
    const w = SF.s.w || 600;
    nx = Math.round(Math.min(200, Math.max(110, w / 4)));
    ny = Math.round(nx * (SF.s.h / Math.max(1, SF.s.w)) || nx * 0.7);
    ext = Math.max(2, 0.75 * st.L + 1.2); // half-width in λ
    const k = 2 * Math.PI, h = st.L / 2, ck = Math.cos(k * h);
    Sr = new Float32Array(nx * ny); Si = new Float32Array(nx * ny);
    smax = 1e-9;
    const yext = ext * (ny / nx);
    for (let j = 0; j < ny; j++) {
      const z = yext - ((j + 0.5) / ny) * 2 * yext;
      for (let i = 0; i < nx; i++) {
        const x = Math.abs(-ext + ((i + 0.5) / nx) * 2 * ext);
        const R1 = Math.hypot(x, z - h), R2 = Math.hypot(x, z + h), r = Math.hypot(x, z);
        const re = Math.cos(k * R1) + Math.cos(k * R2) - 2 * ck * Math.cos(k * r);
        const im = -Math.sin(k * R1) - Math.sin(k * R2) + 2 * ck * Math.sin(k * r);
        Sr[j * nx + i] = re; Si[j * nx + i] = im;
        if (r > 0.6 * Math.max(h, 0.25)) smax = Math.max(smax, Math.hypot(re, im));
      }
    }
    buf.width = nx; buf.height = ny;
    img = bctx.createImageData(nx, ny);
  }

  const draw = (t: number) => {
    const P = palette();
    const wt = 2 * Math.PI * 0.4 * t;
    { const { ctx, w, h } = SF.s;
      ctx.clearRect(0, 0, w, h);
      if (!img) rebuild();
      const cw = Math.cos(wt), sw = Math.sin(wt);
      const pos = rgb(P.e), neg = rgb(P.h), bg = rgb(P.panel);
      const D = img!.data;
      const bands = 3.5; // contour spacing
      for (let p = 0; p < nx * ny; p++) {
        const v = (Sr[p] * cw - Si[p] * sw) / smax; // ∈ ~[-1,1] in the far zone
        const q = v * bands;
        const fr = Math.abs(q - Math.round(q));
        const line = Math.max(0, 1 - fr * 4.2); // bright thin bands at contour levels
        const mag = Math.min(1, Math.abs(v)) ** 0.7;
        const c = v >= 0 ? pos : neg;
        const a = 0.18 * mag + 0.82 * line * Math.min(1, 0.25 + mag);
        const o = p * 4;
        D[o] = bg[0] + (c[0] - bg[0]) * a; D[o + 1] = bg[1] + (c[1] - bg[1]) * a; D[o + 2] = bg[2] + (c[2] - bg[2]) * a; D[o + 3] = 255;
      }
      bctx.putImageData(img!, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(buf, 0, 0, w, h);
      // wire and current distribution
      const sc = w / (2 * ext), cx = w / 2, cy = h / 2, hz = (st.L / 2) * sc;
      ctx.strokeStyle = P.warn; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx, cy - hz); ctx.lineTo(cx, cy - 3); ctx.moveTo(cx, cy + 3); ctx.lineTo(cx, cy + hz); ctx.stroke();
      ctx.strokeStyle = alpha(P.warn, 0.8); ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) { const z = -st.L / 2 + (i / 60) * st.L; const I = Math.sin(2 * Math.PI * (st.L / 2 - Math.abs(z))) * Math.cos(wt); const x = cx + I * 0.28 * sc, y = cy - z * sc; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      ctx.fillStyle = P.faint; ctx.font = '11px ui-sans-serif, system-ui';
      ctx.fillText('I(z, t)', cx + 0.3 * sc + 4, cy - hz * 0.5);
      // λ scale bar
      ctx.strokeStyle = P.text; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(14, h - 14); ctx.lineTo(14 + sc, h - 14); ctx.stroke();
      ctx.fillStyle = P.text; ctx.fillText('1 λ', 14 + sc / 2 - 8, h - 20);
      ctx.fillStyle = P.faint; ctx.fillText('z ↑', cx + 6, 14);
    }
    { const { ctx, w, h } = SP.s;
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.42, cx = w / 2, cy = h / 2;
      ctx.strokeStyle = P.grid; ctx.lineWidth = 1;
      for (const r of [0.25, 0.5, 0.75, 1]) { ctx.beginPath(); ctx.arc(cx, cy, r * R, 0, 7); ctx.stroke(); }
      for (let a = 0; a < 180; a += 30) { const t = (a * Math.PI) / 180; ctx.beginPath(); ctx.moveTo(cx - R * Math.cos(t), cy - R * Math.sin(t)); ctx.lineTo(cx + R * Math.cos(t), cy + R * Math.sin(t)); ctx.stroke(); }
      const shape = (L: number) => {
        let mx = 0; for (let i = 1; i < 360; i++) mx = Math.max(mx, Math.abs(dipoleField(L, (i / 360) * Math.PI)));
        return (th: number) => {
          const v = Math.abs(dipoleField(L, th)) / mx;
          return st.db ? Math.max(0, 1 + (20 * Math.log10(Math.max(v, 1e-6))) / 30) : v;
        };
      };
      const plot = (L: number, col: string, lw: number) => {
        const f = shape(L);
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
        for (let i = 0; i <= 360; i++) { const th = (i / 360) * 2 * Math.PI; const r = f(th > Math.PI ? 2 * Math.PI - th : th) * R; const x = cx + r * Math.sin(th), y = cy - r * Math.cos(th); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.closePath(); ctx.stroke();
      };
      for (const L of [0.5, 1, 1.5]) if (Math.abs(L - st.L) > 1e-3) plot(L, alpha(P.muted, 0.35), 1.2);
      ctx.fillStyle = alpha(P.e, 0.15);
      plot(st.L, P.e, 2.6);
      ctx.strokeStyle = P.warn; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy + 14); ctx.stroke();
      ctx.fillStyle = P.faint; ctx.font = '11px ui-sans-serif, system-ui';
      ctx.fillText('θ = 0 (wire axis)', cx + 4, cy - R - 4);
      ctx.fillText(st.db ? 'dB scale, 30 dB range' : 'linear |E|', 8, h - 8);
    }
  };
  loop = new Loop(draw, cf.canvas);

  const update = () => {
    const m = dipoleMetrics(st.L);
    ro.set('D', `${m.D0.toFixed(3)} (${(10 * Math.log10(m.D0)).toFixed(2)} dBi)`);
    // HPBW and lobe count from a fine sweep
    const N = 3600;
    let mx = 0, thMax = 0;
    const v = new Float64Array(N + 1);
    for (let i = 0; i <= N; i++) { const th = (i / N) * Math.PI; v[i] = dipoleField(st.L, th) ** 2; if (v[i] > mx) { mx = v[i]; thMax = th; } }
    let lobes = 0;
    for (let i = 1; i < N; i++) if (v[i] > v[i - 1] && v[i] >= v[i + 1] && v[i] > mx * 1e-3) lobes++;
    const iM = Math.round((thMax / Math.PI) * N);
    let a = iM, b = iM;
    while (a > 0 && v[a] > mx / 2) a--;
    while (b < N && v[b] > mx / 2) b++;
    const hp = ((b - a) / N) * 180;
    ro.set('hp', `${hp.toFixed(1)}°`);
    ro.set('rr', `${m.Rr.toFixed(1)} Ω`);
    const s2 = Math.sin(Math.PI * st.L) ** 2;
    ro.set('rin', s2 < 1e-4 ? '→ ∞ (current null at feed)' : `${(m.Rr / s2).toFixed(1)} Ω`, s2 < 1e-4 ? 'badv' : undefined);
    ro.set('lobes', String(lobes));
    ro.set('max', `${((thMax * 180) / Math.PI).toFixed(1)}°`);
    rebuild();
    loop?.request();
  };

  const preset = segmented<Preset>({ id: 'preset', label: 'Length', value: '0.5', options: [{ value: '0.5', label: 'λ/2' }, { value: '1', label: 'λ' }, { value: '1.5', label: '1.5 λ' }, { value: 'custom', label: 'Custom' }],
    onChange: (p) => { if (p === 'custom') return; st.L = Number(p); sL.set(st.L); update(); } });
  const sL = slider({ id: 'len', label: 'Dipole length L', min: 0.05, max: 2, step: 0.01, value: st.L, fmt: (v) => `${v.toFixed(2)} λ`, onInput: (v) => { st.L = v; preset.set(([0.5, 1, 1.5].find((q) => Math.abs(q - v) < 1e-9)?.toString() as Preset) ?? 'custom'); update(); } });
  const tdB = toggle({ id: 'db', label: 'Pattern in dB', value: false, onChange: (v) => { st.db = v; loop?.request(); } });
  const play = playButton(loop); play.id = 'ctl-play';
  controls.append(el('div', { class: 'seg' }, play), preset.el, sL.el, tdB.el,
    el('small', { class: 'muted' }, 'R_r here is referred to the current maximum I0, as in the textbook. The resistance seen at the feed is R_r / sin²(kL/2), which blows up at L = λ, where the standing current has a null at the centre.'));

  const eqs = equationsSection(eqFor('dipole'), focusControl);
  after.append(notice([
    '<b>Loops pinch off every half period.</b> Near the wire the field lines are tied to charges sloshing between the arms. About λ/2π out they detach and close on themselves, which is radiation.',
    '<b>λ/2 gives 2.15 dBi and about 73 Ω</b>: a broad doughnut with nulls along the wire.',
    '<b>At L = λ the beam narrows (about 47° HPBW, D0 ≈ 2.4)</b>, but the feed sees a current null, so the input impedance gets very large.',
    '<b>Past about 1.25λ the broadside lobe shrinks and side lobes take over.</b> The two halves of the wire carry opposite-phase current segments, which interfere. At 1.5λ the main beam has moved off broadside.',
    'Short dipoles (L ≪ λ) all have the same sin θ pattern and D0 → 1.5. Only their radiation resistance changes, falling as L².',
  ]), eqs.el);
  update();
  return () => { loop?.destroy(); SF.destroy(); SP.destroy(); eqs.destroy(); };
}
