import { byId } from './registry';
import { explorerPage, card, equationsSection, notice } from '../lib/page';
import { eqFor } from '../equations';
import { el } from '../lib/dom';
import { Loop, surface, onDrag, Camera, arrow } from '../lib/canvas';
import { slider, segmented, playButton, readout, focusControl, fmtSI } from '../lib/ui';
import { palette, alpha } from '../lib/theme';
import { propagation, polarization, lossTangent, ETA0, DEG, C0, type Medium } from '../lib/physics';
import { abs, arg } from '../lib/complex';

type Pol = 'linear' | 'rhcp' | 'lhcp' | 'elliptical' | 'custom';
type Med = 'vacuum' | 'glass' | 'seawater' | 'copper' | 'custom';

export default function mount(root: HTMLElement) {
  const meta = byId('planewave')!;
  const { viz, controls, after } = explorerPage(root, meta,
    'A uniform plane wave is the simplest solution of Maxwell’s equations: E and H perpendicular to each other and to the direction of travel, locked together by the medium’s impedance η. Rotate the view, change the polarization, then make the medium conductive and watch the wave die inside a few skin depths.');

  const st = { ax: 1, ay: 0, delta: 0, f: 1e9, epsr: 1, sigma: 0 };
  const medium = (): Medium => ({ epsR: st.epsr, muR: 1, sigma: st.sigma });

  const c3 = card('E and H along z', el('span', { class: 'legend-inline' }, el('span', {}, el('i', { style: 'background:var(--e)' }), 'E'), el('span', {}, el('i', { style: 'background:var(--h)' }), 'H (scaled by |η|)'), el('span', { class: 'muted' }, 'drag to rotate')));
  c3.canvas.classList.add('drag');
  c3.canvas.style.touchAction = 'pan-y';
  const cE = card('Polarization at z = 0', el('span', { class: 'muted' }, 'z out of the screen (wave coming toward you)'));
  const wrapTwo = el('div', { class: 'two' }, cE.card, el('div', { class: 'card', style: 'padding:12px' }));
  const ro = readout([
    { k: 'lam', label: 'λ in medium' }, { k: 'alpha', label: 'Attenuation α' }, { k: 'delta', label: 'Skin depth δ' },
    { k: 'eta', label: 'η = |η|∠θη' }, { k: 'tand', label: 'Loss tangent σ/ωε' }, { k: 'pol', label: 'Polarization' },
  ]);
  (wrapTwo.lastChild as HTMLElement).append(ro.el);
  viz.append(c3.card, wrapTwo);

  const cam = new Camera(-0.75, 0.38, 14, 50);
  let loop: Loop | null = null;
  const S3 = surface(c3.canvas, { aspect: 0.55, minH: 260, maxH: 460 }, (s) => { cam.scale = Math.min(s.w / 8.4, s.h / 3.6); cam.cx = s.w / 2; cam.cy = s.h / 2; loop?.request(); });
  const SE = surface(cE.canvas, { aspect: 1, minH: 220, maxH: 320 }, () => loop?.request());
  const undrag = onDrag(c3.canvas, { move: (_x, _y, dx, dy) => { cam.yaw += dx * 0.01; cam.pitch = Math.max(-1.2, Math.min(1.2, cam.pitch + dy * 0.01)); loop?.request(); } });

  const draw = (t: number) => {
    const P = palette();
    const pr = propagation(st.f, medium());
    const lam = (2 * Math.PI) / pr.beta;
    const etaAng = arg(pr.eta);
    const wt = 2 * Math.PI * 0.45 * t; // displayed temporal phase: one cycle ≈ 2.2 s
    const span = 3; // wavelengths shown
    const Lw = 6.4; // world length
    const zOf = (u: number) => u * span * lam; // u ∈ [0,1] → metres
    const decay = (u: number) => Math.exp(-pr.alpha * zOf(u));
    const ph = (u: number) => wt - pr.beta * zOf(u);
    const amp = 1.25;
    const norm = Math.max(st.ax, st.ay, 1e-6);
    const Ax = (st.ax / norm) * amp, Ay = (st.ay / norm) * amp;
    const E = (u: number): [number, number] => [Ax * decay(u) * Math.cos(ph(u)), Ay * decay(u) * Math.cos(ph(u) + st.delta)];
    // H = (1/η) ẑ×E, lagging E by θη; drawn scaled by |η| so its size is comparable.
    const H = (u: number): [number, number] => [-Ay * decay(u) * Math.cos(ph(u) + st.delta - etaAng), Ax * decay(u) * Math.cos(ph(u) - etaAng)];
    const W = (u: number, fx: number, fy: number) => cam.project(-Lw / 2 + u * Lw, fx, fy);

    /* 3-D view */
    {
      const { ctx, w, h } = S3.s;
      ctx.clearRect(0, 0, w, h);
      // axis and wavelength ticks
      ctx.strokeStyle = P.faint; ctx.lineWidth = 1;
      const [a0x, a0y] = W(0, 0, 0), [a1x, a1y] = W(1.04, 0, 0);
      ctx.fillStyle = P.faint;
      arrow(ctx, a0x, a0y, a1x, a1y, 8);
      ctx.font = '12px ui-sans-serif, system-ui'; ctx.fillText('z', a1x + 6, a1y + 4);
      for (let i = 0; i <= span; i++) {
        const [tx, ty] = W(i / span, 0, 0);
        ctx.beginPath(); ctx.arc(tx, ty, 2.5, 0, 7); ctx.fill();
        ctx.fillText(i ? `${i}λ` : '0', tx - 6, ty + 16);
      }
      // x and y reference axes at z=0
      const [ox, oy] = W(0, 0, 0);
      ctx.strokeStyle = alpha(P.faint, 0.7);
      const [xx, xy] = W(0, 1.6, 0); arrow(ctx, ox, oy, xx, xy, 6); ctx.fillText('x', xx + 4, xy);
      const [yx, yy] = W(0, 0, 1.6); arrow(ctx, ox, oy, yx, yy, 6); ctx.fillText('y', yx + 4, yy);
      // skin-depth plane
      if (pr.alpha > 0) {
        const uD = 1 / pr.alpha / (span * lam);
        const env = (u: number) => decay(u) * amp;
        if (uD <= 1) {
          const q = [W(uD, -1.4, -1.4), W(uD, 1.4, -1.4), W(uD, 1.4, 1.4), W(uD, -1.4, 1.4)];
          ctx.beginPath(); q.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
          ctx.fillStyle = alpha(P.warn, 0.08); ctx.fill(); ctx.strokeStyle = alpha(P.warn, 0.6); ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
          const [lx, ly] = W(uD, 1.5, 0); ctx.fillStyle = P.warn; ctx.fillText('z = δ (1/e)', lx + 4, ly);
        }
        // envelopes ±e^{−αz}
        ctx.strokeStyle = alpha(P.ok, 0.8); ctx.setLineDash([5, 5]); ctx.lineWidth = 1.2;
        for (const sg of [1, -1]) {
          ctx.beginPath();
          for (let i = 0; i <= 80; i++) { const u = i / 80; const [x, y] = W(u, sg * env(u) * Math.max(Ax, Ay) / amp * amp, 0); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }
      const N = Math.round(Math.min(110, Math.max(48, w / 7)));
      const drawField = (f: (u: number) => [number, number], col: string) => {
        ctx.strokeStyle = alpha(col, 0.45); ctx.lineWidth = 1.2;
        for (let i = 0; i <= N; i++) {
          const u = i / N; const [fx, fy] = f(u);
          if (Math.hypot(fx, fy) < 0.02) continue;
          const [x0, y0] = W(u, 0, 0), [x1, y1] = W(u, fx, fy);
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        }
        ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.beginPath();
        for (let i = 0; i <= N * 2; i++) { const u = i / (N * 2); const [fx, fy] = f(u); const [x, y] = W(u, fx, fy); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
        const [fx, fy] = f(0); const [x0, y0] = W(0, 0, 0), [x1, y1] = W(0, fx, fy);
        ctx.fillStyle = col; ctx.lineWidth = 3; arrow(ctx, x0, y0, x1, y1, 9);
      };
      drawField(H, P.h);
      drawField(E, P.e);
    }

    /* Polarization ellipse at z = 0 (x right, y up, z out of screen) */
    {
      const { ctx, w, h } = SE.s;
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.36, cx = w / 2, cy = h / 2;
      ctx.strokeStyle = P.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - R * 1.2, cy); ctx.lineTo(cx + R * 1.2, cy); ctx.moveTo(cx, cy - R * 1.2); ctx.lineTo(cx, cy + R * 1.2); ctx.stroke();
      ctx.fillStyle = P.faint; ctx.font = '12px ui-sans-serif, system-ui';
      ctx.fillText('x', cx + R * 1.2 + 4, cy + 4); ctx.fillText('y', cx - 3, cy - R * 1.2 - 6);
      const s = R / amp;
      ctx.strokeStyle = alpha(P.e, 0.5); ctx.lineWidth = 1.6; ctx.beginPath();
      for (let i = 0; i <= 120; i++) { const p = (i / 120) * 2 * Math.PI; const x = Ax * Math.cos(p), y = Ay * Math.cos(p + st.delta); i ? ctx.lineTo(cx + x * s, cy - y * s) : ctx.moveTo(cx + x * s, cy - y * s); }
      ctx.stroke();
      // trail
      for (let k = 14; k >= 0; k--) {
        const p = wt - k * 0.12;
        ctx.fillStyle = alpha(P.e, 0.06 + (0.5 * (14 - k)) / 14);
        ctx.beginPath(); ctx.arc(cx + Ax * Math.cos(p) * s, cy - Ay * Math.cos(p + st.delta) * s, 3, 0, 7); ctx.fill();
      }
      const [ex, ey] = E(0);
      ctx.strokeStyle = P.e; ctx.fillStyle = P.e; ctx.lineWidth = 3;
      arrow(ctx, cx, cy, cx + ex * s, cy - ey * s, 10);
      const pol = polarization(st.ax, st.ay, st.delta);
      if (pol.hand) {
        ctx.fillStyle = P.text; ctx.font = '600 13px ui-sans-serif, system-ui';
        ctx.fillText(pol.hand === 'RH' ? '↺ rotates CCW here = RH (IEEE)' : '↻ rotates CW here = LH (IEEE)', 10, h - 12);
      }
    }
  };
  loop = new Loop(draw, c3.canvas);

  const update = () => {
    const pr = propagation(st.f, medium());
    const lam = (2 * Math.PI) / pr.beta;
    ro.set('lam', fmtSI(lam, 'm'));
    ro.set('alpha', pr.alpha === 0 ? '0 dB/m' : `${(8.686 * pr.alpha).toPrecision(3)} dB/m`, pr.alpha > 0 ? 'warnv' : undefined);
    ro.set('delta', pr.alpha === 0 ? '∞ (lossless)' : fmtSI(1 / pr.alpha, 'm'));
    ro.set('eta', `${abs(pr.eta) < 1 ? abs(pr.eta).toExponential(2) : abs(pr.eta).toFixed(1)} Ω ∠${(arg(pr.eta) / DEG).toFixed(1)}°`);
    const lt = lossTangent(st.f, medium());
    ro.set('tand', lt === 0 ? '0' : lt < 0.01 || lt > 1000 ? lt.toExponential(2) : lt.toFixed(3), lt > 10 ? 'badv' : lt > 0.1 ? 'warnv' : 'good');
    const pol = polarization(st.ax, st.ay, st.delta);
    ro.set('pol', pol.kind === 'linear' ? 'Linear' : `${pol.hand}${pol.kind === 'circular' ? 'CP' : ' elliptical'}${pol.kind === 'elliptical' ? `, AR ${pol.axialRatio.toFixed(2)}` : ''}`);
    loop?.request();
  };

  /* controls */
  const sAy = slider({ id: 'ay', label: 'Amplitude ratio Ey/Ex', min: 0, max: 1.5, step: 0.01, value: st.ay, fmt: (v) => v.toFixed(2), onInput: (v) => { st.ay = v; polSeg.set('custom'); update(); } });
  const sDelta = slider({ id: 'delta', label: 'Phase δ of Ey vs Ex', min: -180, max: 180, step: 1, value: 0, fmt: (v) => `${v.toFixed(0)}°`, onInput: (v) => { st.delta = v * DEG; polSeg.set('custom'); update(); } });
  const setPol = (p: Pol) => {
    const presets: Record<Exclude<Pol, 'custom'>, [number, number]> = { linear: [0, 0], rhcp: [1, -90], lhcp: [1, 90], elliptical: [0.5, -60] };
    if (p === 'custom') return;
    const [ay, d] = presets[p];
    st.ay = ay; st.delta = d * DEG; sAy.set(ay); sDelta.set(d); update();
  };
  const polSeg = segmented<Pol>({ id: 'pol', label: 'Polarization', value: 'linear', options: [
    { value: 'linear', label: 'Linear' }, { value: 'rhcp', label: 'RHCP' }, { value: 'lhcp', label: 'LHCP' }, { value: 'elliptical', label: 'Elliptical' }, { value: 'custom', label: 'Custom' }], onChange: setPol });

  const sF = slider({ id: 'f', label: 'Frequency f', min: 1e6, max: 3e11, log: true, value: st.f, fmt: (v) => fmtSI(v, 'Hz'), onInput: (v) => { st.f = v; update(); } });
  const sEps = slider({ id: 'epsr', label: 'Relative permittivity εr', min: 1, max: 100, log: true, value: 1, fmt: (v) => v.toFixed(v < 10 ? 2 : 1), onInput: (v) => { st.epsr = v; medSeg.set('custom'); update(); } });
  const SMIN = 1e-6;
  const sSig = slider({ id: 'sigma', label: 'Conductivity σ', min: SMIN, max: 6e7, log: true, value: SMIN, fmt: (v) => (v <= SMIN * 1.001 ? '0 S/m' : `${v < 0.01 || v >= 1e4 ? v.toExponential(1) : v.toPrecision(2)} S/m`), onInput: (v) => { st.sigma = v <= SMIN * 1.001 ? 0 : v; medSeg.set('custom'); update(); } });
  const setMed = (m: Med) => {
    const p: Record<Exclude<Med, 'custom'>, [number, number, number]> = {
      vacuum: [1, 0, 1e9], glass: [4, 1e-4, 1e9], seawater: [81, 4, 1e8], copper: [1, 5.8e7, 1e6],
    };
    if (m === 'custom') return;
    const [e, s, f] = p[m];
    st.epsr = e; st.sigma = s; st.f = f;
    sEps.set(e); sSig.set(Math.max(SMIN, s)); sF.set(f); update();
  };
  const medSeg = segmented<Med>({ id: 'medium', label: 'Medium', value: 'vacuum', options: [
    { value: 'vacuum', label: 'Vacuum' }, { value: 'glass', label: 'Glass' }, { value: 'seawater', label: 'Seawater' }, { value: 'copper', label: 'Copper' }, { value: 'custom', label: 'Custom' }], onChange: setMed });

  const play = playButton(loop);
  play.id = 'ctl-play';
  controls.append(
    el('div', { class: 'seg' }, play),
    el('h3', {}, 'Polarization'), polSeg.el, sAy.el, sDelta.el,
    el('h3', {}, 'Medium'), medSeg.el, sF.el, sEps.el, sSig.el,
    el('small', { class: 'muted' }, `The view always spans three wavelengths in the medium. Free-space λ at this frequency: `, el('span', { id: 'lam0' }, '')),
  );
  const lam0 = controls.querySelector('#lam0')!;
  const upd0 = () => { lam0.textContent = fmtSI(C0 / st.f, 'm'); };
  sF.input.addEventListener('input', upd0); medSeg.el.addEventListener('click', upd0); upd0();

  const eqs = equationsSection(eqFor('planewave'), focusControl);
  after.append(notice([
    '<b>E and H are in phase in a lossless medium.</b> Add conductivity and H starts to lag E by the angle of η, reaching 45° in a good conductor.',
    '<b>Circular polarization is two linear waves in quadrature.</b> Set Ey/Ex = 1 and slide δ from 0° to −90°: the line opens into an ellipse, then a circle.',
    `<b>Skin depth is about λ/2π in a good conductor.</b> In the copper preset (1 MHz) the wave is gone within one wavelength. That wavelength is only about 0.4 mm, against ${(C0 / 1e6).toFixed(0)} m in free space.`,
    `<b>η sets the E/H ratio.</b> Free space: ${ETA0.toFixed(1)} Ω. Water at εr = 81 is nine times lower, so H is relatively stronger.`,
    'Handedness here follows the IEEE convention (thumb along propagation, fingers curl with the rotation). Some optics texts use the opposite.',
  ]), eqs.el);

  update();
  return () => { loop?.destroy(); S3.destroy(); SE.destroy(); undrag(); eqs.destroy(); };
}
