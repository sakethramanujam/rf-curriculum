import { byId } from './registry';
import { explorerPage, card, equationsSection, notice } from '../lib/page';
import { eqFor } from '../equations';
import { el, clamp } from '../lib/dom';
import { Loop, surface, onDrag, prefersReducedMotion } from '../lib/canvas';
import { slider, segmented, readout, toggle, focusControl, fmtSI } from '../lib/ui';
import { palette, alpha } from '../lib/theme';
import { gamma, gammaAt, zFromGamma, vswr, lMatch, shuntStub, standingWave, DEG, type LSolution, type StubSolution } from '../lib/physics';
import { abs, arg, c, div, add, fmt, type C } from '../lib/complex';
import { lineState as L, loadZ, emitLine, onLine } from '../lib/store';
import { drawSmithGrid, toXY, fromXY, dot, type SmithGeom } from '../lib/smithdraw';

type Net = 'open-stub' | 'short-stub' | 'lsec';

export default function mount(root: HTMLElement) {
  const meta = byId('smith')!;
  const { viz, controls, after } = explorerPage(root, meta,
    'The Smith chart is the Γ-plane with impedance coordinates drawn on top. Walking along a lossless line only changes the phase of Γ, so the point travels on a circle centred on the chart. Toward the generator it turns clockwise, one full turn every half wavelength. Matching means finding a path back to the centre.');

  const ch = card('Smith chart', el('span', { class: 'muted' }, 'drag the orange load · drag the violet point to move along the line'));
  ch.canvas.classList.add('drag');
  ch.card.id = 'ctl-chart';
  const cl = card('Standing wave vs. distance from load', el('span', { class: 'muted' }, 'drag along the line'));
  cl.canvas.classList.add('drag');
  cl.canvas.style.touchAction = 'pan-y';
  const ro = readout([
    { k: 'zl', label: 'z_L = Z_L/Z0' }, { k: 'zd', label: 'Z_in at ℓ' }, { k: 'yd', label: 'y_in at ℓ (normalised)' },
    { k: 'g', label: 'Γ(ℓ)' }, { k: 'vswr', label: 'VSWR' }, { k: 'rot', label: 'Rotation 2βℓ' },
  ]);
  viz.append(ch.card, cl.card, el('div', { class: 'card', style: 'padding:12px' }, ro.el));

  const geom: SmithGeom = { cx: 0, cy: 0, R: 1 };
  let loop: Loop | null = null;
  const SC = surface(ch.canvas, { aspect: 1, minH: 280, maxH: 620 }, (s) => { geom.cx = s.w / 2; geom.cy = s.h / 2; geom.R = Math.min(s.w, s.h) * 0.42; loop?.request(); });
  const SLn = surface(cl.canvas, { aspect: 0.26, minH: 130, maxH: 200 }, () => loop?.request());

  const st = { admittance: true, net: 'open-stub' as Net, sol: 0, step: 0, prog: 1, fGHz: 2 };

  /* ── matching walkthrough model ── */
  interface Plan { ok: boolean; why?: string; paths: C[][]; notes: string[]; table: [string, string][] }
  const sweep = (n: number, f: (u: number) => C) => Array.from({ length: n + 1 }, (_, i) => f(i / n));
  const zToG = (z: C) => div(add(z, c(-1)), add(z, c(1)));
  const yToG = (y: C) => zToG(div(c(1), y));

  function plan(): Plan {
    const z0 = L.z0;
    const ZL = loadZ();
    const GL = gamma(ZL, z0);
    const zl = div(ZL, c(z0));
    const p: Plan = { ok: true, paths: [], notes: [], table: [] };
    if (abs(GL) > 0.995) return { ok: false, why: 'A purely reactive load (|Γ| = 1) absorbs no power, so a lossless network cannot match it.', paths: [], notes: [], table: [] };
    if (abs(GL) < 1e-4) return { ok: false, why: 'Already matched: Γ = 0. Drag the load off-centre to give the walkthrough something to do.', paths: [], notes: [], table: [] };
    const w = 2 * Math.PI * st.fGHz * 1e9;
    const part = (X: number) => (X >= 0 ? `L = ${fmtSI(X / w, 'H')}` : `C = ${fmtSI(-1 / (w * X), 'F')}`);
    const partB = (B: number) => (B >= 0 ? `C = ${fmtSI(B / w, 'F')}` : `L = ${fmtSI(-1 / (w * B), 'H')}`);
    p.notes.push(`<b>Step 1.</b> Plot the normalised load z_L = ${fmt(zl, 2)}. Γ_L = ${abs(GL).toFixed(3)} ∠${(arg(GL) / DEG).toFixed(1)}°. The highlighted (blue) circle is g = 1 on the admittance grid: every point a shunt element could move straight to the centre.`);
    if (st.net !== 'lsec') {
      const sols: StubSolution[] = shuntStub(ZL, z0);
      const s = sols[Math.min(st.sol, sols.length - 1)];
      const rot = sweep(60, (u) => gammaAt(GL, u * s.d));
      const bN = s.B * z0;
      const shunt = sweep(40, (u) => yToG(c(1, bN * (1 - u))));
      p.paths.push(rot, shunt);
      const len = st.net === 'open-stub' ? s.lOpen : s.lShort;
      p.notes.push(`<b>Step 2.</b> Move d = ${s.d.toFixed(4)} λ toward the generator (clockwise on the |Γ| circle) until the point lands on g = 1. There y = 1 ${bN >= 0 ? '+' : '−'} j${Math.abs(bN).toFixed(3)}.`);
      p.notes.push(`<b>Step 3.</b> ${st.net === 'open-stub' ? 'An open' : 'A short'}-circuited shunt stub of length ℓ = ${len.toFixed(4)} λ adds ${bN >= 0 ? '−' : '+'}j${Math.abs(bN).toFixed(3)}, sliding along g = 1 to the centre. Matched.`);
      p.table = [['Stub position d', `${s.d.toFixed(4)} λ`], ['Stub length ℓ', `${len.toFixed(4)} λ`], ['Line susceptance at d', `${bN.toFixed(3)} (normalised)`], ['Solutions available', String(sols.length)]];
      return p;
    }
    const sols: LSolution[] = lMatch(ZL, z0);
    if (!sols.length) return { ok: false, why: 'This load cannot be matched with an L-section.', paths: [], notes: [], table: [] };
    const s = sols[Math.min(st.sol, sols.length - 1)];
    const x = s.X / z0, b = s.B * z0;
    if (s.order === 'shunt-then-series') {
      const yl = div(c(1), zl);
      const afterShunt = add(yl, c(0, b));
      const z1 = div(c(1), afterShunt);
      p.paths.push(sweep(50, (u) => yToG(add(yl, c(0, b * u)))), sweep(50, (u) => zToG(add(z1, c(0, x * u)))));
      p.notes.push(`<b>Step 2.</b> r_L > 1, so the shunt element goes next to the load. Add jb = ${b >= 0 ? '+' : '−'}j${Math.abs(b).toFixed(3)} and slide along the load’s constant-g circle until you reach the r = 1 circle.`);
      p.notes.push(`<b>Step 3.</b> A series jx = ${x >= 0 ? '+' : '−'}j${Math.abs(x).toFixed(3)} slides along r = 1 to the centre. Matched.`);
    } else {
      const z1 = add(zl, c(0, x));
      p.paths.push(sweep(50, (u) => zToG(add(zl, c(0, x * u)))), sweep(50, (u) => yToG(add(div(c(1), z1), c(0, b * u)))));
      p.notes.push(`<b>Step 2.</b> r_L < 1, so the series element goes next to the load. Add jx = ${x >= 0 ? '+' : '−'}j${Math.abs(x).toFixed(3)} along the constant-r circle until you reach g = 1.`);
      p.notes.push(`<b>Step 3.</b> A shunt jb = ${b >= 0 ? '+' : '−'}j${Math.abs(b).toFixed(3)} slides along g = 1 to the centre. Matched.`);
    }
    p.table = [['Order (from load)', s.order === 'shunt-then-series' ? 'shunt, then series' : 'series, then shunt'],
      ['Series X', `${s.X.toFixed(2)} Ω → ${part(s.X)}`], ['Shunt B', `${(s.B * 1000).toFixed(3)} mS → ${partB(s.B)}`], ['At frequency', `${st.fGHz.toFixed(2)} GHz`]];
    return p;
  }

  let P0 = plan();

  const draw = () => {
    const P = palette();
    const z0 = L.z0;
    const GL = gamma(loadZ(), z0);
    const Gd = gammaAt(GL, L.dist);
    { // chart
      const { ctx, w, h } = SC.s;
      ctx.clearRect(0, 0, w, h);
      drawSmithGrid(ctx, geom, { admittance: st.admittance, labels: true });
      const { cx, cy, R } = geom;
      // g = 1 circle highlighted (admittance)
      ctx.strokeStyle = alpha(P.h, 0.7); ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.arc(cx - R / 2, cy, R / 2, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      // constant |Γ| circle
      const gm = abs(GL);
      ctx.strokeStyle = alpha(P.ok, 0.6); ctx.lineWidth = 1.4; ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.arc(cx, cy, gm * R, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      // rotation arc toward generator (clockwise)
      const th0 = arg(GL);
      const dth = 4 * Math.PI * L.dist;
      ctx.strokeStyle = P.acc; ctx.lineWidth = 3.2;
      ctx.beginPath(); ctx.arc(cx, cy, gm * R, -th0, -th0 + dth, false); ctx.stroke();
      // matching path
      if (P0.ok && st.step > 0) {
        P0.paths.forEach((path, i) => {
          if (i + 2 > st.step) return; // step 1 only plots the load
          const frac = i + 2 === st.step ? st.prog : 1;
          const n = Math.max(1, Math.round(frac * (path.length - 1)));
          ctx.strokeStyle = i === 0 ? P.warn : P.h; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
          ctx.beginPath();
          for (let k = 0; k <= n; k++) { const [x, y] = toXY(geom, path[k]); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
          ctx.stroke();
          const [ex, ey] = toXY(geom, path[n]);
          dot(ctx, ex, ey, 5, i === 0 ? P.warn : P.h);
        });
        if (st.step >= P0.paths.length + 1 && st.prog >= 1) { dot(ctx, cx, cy, 9, alpha(P.ok, 0.35), P.ok); }
      }
      // points
      const [gx, gy] = toXY(geom, GL);
      dot(ctx, gx, gy, 9, P.e, P.text);
      const [dx, dy] = toXY(geom, Gd);
      dot(ctx, dx, dy, 8, P.acc, P.text);
      ctx.font = '600 12px ui-sans-serif, system-ui'; ctx.fillStyle = P.text;
      ctx.fillText('Z_L', gx + 12, gy - 8);
      ctx.fillText(`Z_in(${L.dist.toFixed(3)}λ)`, dx + 12, dy + 16);
      // WTG arrow hint on rim
      ctx.fillStyle = P.faint; ctx.font = '11px ui-sans-serif, system-ui';
      ctx.fillText('↻ toward generator', cx + R * 0.52, cy - R * 0.92);
    }
    { // line strip
      const { ctx, w, h } = SLn.s;
      ctx.clearRect(0, 0, w, h);
      const left = 16, right = w - 16, base = h - 24, top = 14;
      const X = (d: number) => right - (d / 0.5) * (right - left);
      const vmax = 1 + abs(GL);
      ctx.strokeStyle = P.grid; ctx.beginPath(); ctx.moveTo(left, base); ctx.lineTo(right, base); ctx.stroke();
      ctx.fillStyle = alpha(P.ok, 0.12); ctx.strokeStyle = P.ok; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X(0), base);
      for (let i = 0; i <= 200; i++) { const d = (i / 200) * 0.5; ctx.lineTo(X(d), base - (standingWave(GL, d) / Math.max(vmax, 1e-6)) * (base - top)); }
      ctx.lineTo(X(0.5), base); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = P.faint; ctx.font = '11px ui-sans-serif, system-ui'; ctx.textAlign = 'center';
      for (const q of [0, 0.125, 0.25, 0.375, 0.5]) ctx.fillText(q === 0 ? 'load' : `${q}λ`, X(q), h - 6);
      ctx.textAlign = 'start';
      const xp = X(L.dist);
      ctx.strokeStyle = P.acc; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(xp, top - 6); ctx.lineTo(xp, base); ctx.stroke();
      dot(ctx, xp, base - (standingWave(GL, L.dist) / vmax) * (base - top), 7, P.acc, P.text);
      ctx.fillStyle = P.faint; ctx.fillText('|V(ℓ)|', left, top + 2);
    }
  };
  loop = new Loop(draw, ch.canvas, false);

  /* ── interaction ── */
  let dragWhat: 'load' | 'probe' | null = null;
  const undrag = onDrag(ch.canvas, {
    start: (x, y) => {
      const z0 = L.z0;
      const GL = gamma(loadZ(), z0);
      const [px, py] = toXY(geom, gammaAt(GL, L.dist));
      const [lx, ly] = toXY(geom, GL);
      const dp = Math.hypot(x - px, y - py), dl = Math.hypot(x - lx, y - ly);
      dragWhat = dp < 26 && dp < dl ? 'probe' : 'load';
      return Math.hypot(x - geom.cx, y - geom.cy) < geom.R * 1.08 || dp < 30;
    },
    move: (x, y) => {
      const G = fromXY(geom, x, y);
      if (dragWhat === 'probe') {
        const GL = gamma(loadZ(), L.z0);
        let d = (arg(GL) - arg(G)) / (4 * Math.PI);
        d = ((d % 0.5) + 0.5) % 0.5;
        L.dist = d;
      } else {
        const m = abs(G);
        const Gc = m > 0.985 ? { re: (G.re / m) * 0.985, im: (G.im / m) * 0.985 } : G;
        const Z = zFromGamma(Gc, L.z0);
        L.mode = 'rx'; L.r = Z.re; L.x = Z.im;
      }
      emitLine();
    },
  });
  const undrag2 = onDrag(cl.canvas, {
    move: (x) => {
      const { w } = SLn.s;
      L.dist = clamp(((w - 16 - x) / (w - 32)) * 0.5, 0, 0.5);
      emitLine();
    },
  });

  const sDist = slider({ id: 'dist', label: 'Distance toward generator ℓ', min: 0, max: 0.5, step: 0.001, value: L.dist, fmt: (v) => `${v.toFixed(3)} λ`, onInput: (v) => { L.dist = v; emitLine(); } });
  const sZ0 = slider({ id: 'z0', label: 'Z0', min: 10, max: 150, step: 1, value: L.z0, fmt: (v) => `${v.toFixed(0)} Ω`, onInput: (v) => { L.z0 = v; emitLine(); } });
  const tA = toggle({ id: 'adm', label: 'Show admittance grid', value: true, onChange: (v) => { st.admittance = v; loop?.request(); } });

  // walkthrough UI
  const note = el('div', { class: 'stepnote', 'aria-live': 'polite' });
  const table = el('table', { class: 'mini' });
  const netSeg = segmented<Net>({ id: 'net', label: 'Matching network', value: st.net, options: [
    { value: 'open-stub', label: 'Open stub' }, { value: 'short-stub', label: 'Short stub' }, { value: 'lsec', label: 'L-section' }],
    onChange: (v) => { st.net = v; st.step = 0; refreshPlan(); } });
  const solSeg = segmented<'0' | '1'>({ id: 'sol', label: 'Solution', value: '0', options: [{ value: '0', label: 'Solution 1' }, { value: '1', label: 'Solution 2' }],
    onChange: (v) => { st.sol = Number(v); refreshPlan(); } });
  const sF = slider({ id: 'fghz', label: 'Design frequency (for L, C values)', min: 0.1, max: 100, log: true, value: st.fGHz, fmt: (v) => `${v.toPrecision(3)} GHz`, onInput: (v) => { st.fGHz = v; refreshPlan(); } });
  const bPrev = el('button', { type: 'button', class: 'btn' }, '← Back');
  const bNext = el('button', { type: 'button', class: 'btn primary' }, 'Next step →');
  const bReset = el('button', { type: 'button', class: 'btn' }, 'Reset');
  let anim = 0;
  const animateStep = () => {
    cancelAnimationFrame(anim);
    if (prefersReducedMotion()) { st.prog = 1; loop?.request(); return; }
    const t0 = performance.now();
    const tick = (now: number) => {
      st.prog = Math.min(1, (now - t0) / 900);
      loop?.request();
      if (st.prog < 1) anim = requestAnimationFrame(tick);
    };
    st.prog = 0;
    anim = requestAnimationFrame(tick);
  };
  const renderWalk = () => {
    if (!P0.ok) { note.innerHTML = P0.why ?? ''; table.innerHTML = ''; bNext.toggleAttribute('disabled', true); return; }
    bNext.toggleAttribute('disabled', st.step >= 3);
    bPrev.toggleAttribute('disabled', st.step <= 0);
    note.innerHTML = st.step === 0 ? 'Press <b>Next step</b> to walk the match on the chart.' : P0.notes[st.step - 1] ?? '';
    table.innerHTML = P0.table.map(([k, v]) => `<tr><th>${k}</th><td class="num">${v}</td></tr>`).join('');
  };
  function refreshPlan() { P0 = plan(); renderWalk(); loop?.request(); }
  bNext.addEventListener('click', () => { st.step = Math.min(3, st.step + 1); if (st.step >= 2) animateStep(); else st.prog = 1; renderWalk(); loop?.request(); });
  bPrev.addEventListener('click', () => { st.step = Math.max(0, st.step - 1); st.prog = 1; renderWalk(); loop?.request(); });
  bReset.addEventListener('click', () => { st.step = 0; renderWalk(); loop?.request(); });

  controls.append(
    el('div', { class: 'seg' }, el('a', { class: 'btn', href: '#/tline' }, '← Line view')),
    el('h3', {}, 'Line'), sDist.el, sZ0.el, tA.el,
    el('h3', {}, 'Matching walkthrough'), netSeg.el, solSeg.el,
    el('div', { class: 'walk', id: 'ctl-walk' }, note, el('div', { class: 'seg' }, bPrev, bNext, bReset), table), sF.el,
  );

  const update = () => {
    const z0 = L.z0;
    const ZL = loadZ();
    const GL = gamma(ZL, z0);
    const Gd = gammaAt(GL, L.dist);
    const zd = zFromGamma(Gd, z0);
    ro.set('zl', Number.isFinite(ZL.re) ? fmt(div(ZL, c(z0)), 2) : '∞ (open)');
    ro.set('zd', fmt(zd, 1, 'Ω'));
    ro.set('yd', fmt(div(c(z0), zd), 2));
    ro.set('g', `${abs(Gd).toFixed(3)} ∠${(arg(Gd) / DEG).toFixed(1)}°`);
    const s = vswr(GL);
    ro.set('vswr', Number.isFinite(s) ? s.toFixed(2) : '∞');
    ro.set('rot', `${(720 * L.dist).toFixed(1)}° clockwise`);
    sDist.set(L.dist); sZ0.set(z0);
    refreshPlan();
  };
  const off = onLine(update);
  update();

  const eqs = equationsSection([...eqFor('smith'), ...eqFor('tline').filter((e) => e.id === 'gamma')], focusControl);
  after.append(notice([
    '<b>Half a wavelength is one full turn.</b> Any impedance repeats every λ/2 along a lossless line. A quarter wave lands diametrically opposite: z becomes 1/z.',
    '<b>The admittance grid is the impedance grid rotated 180°.</b> That is why shunt elements, which add susceptance, slide along the blue constant-g circles.',
    '<b>Every lossless matching network is a path to the centre made of arcs</b>: line sections rotate about the centre, series reactances follow constant-r circles, and shunt susceptances follow constant-g circles.',
    '<b>There are always two stub solutions</b>, the two places the |Γ| circle crosses g = 1. The one closer to the load is usually more broadband.',
    'Drag the load near the rim: matching gets fragile, because a small error in d or ℓ near |Γ| ≈ 1 leaves a large residual reflection.',
  ]), eqs.el);

  return () => { loop?.destroy(); SC.destroy(); SLn.destroy(); undrag(); undrag2(); off(); eqs.destroy(); cancelAnimationFrame(anim); };
}
