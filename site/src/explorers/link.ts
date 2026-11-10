import { byId } from './registry';
import { explorerPage, card, equationsSection, notice } from '../lib/page';
import { eqFor } from '../equations';
import { el } from '../lib/dom';
import { Loop, surface } from '../lib/canvas';
import { slider, segmented, readout, focusControl, fmtSI } from '../lib/ui';
import { palette, alpha } from '../lib/theme';
import { fsplDb, noiseFloorDbm, db10, C0 } from '../lib/physics';

type Mode = 'link' | 'radar';
type Preset = 'wifi' | 'geo' | 'thz' | 'xradar' | 'custom';

interface Step { label: string; db: number; kind: 'start' | 'gain' | 'loss' | 'end' }

export default function mount(root: HTMLElement) {
  const meta = byId('link')!;
  const { viz, controls, after } = explorerPage(root, meta,
    'A link budget is bookkeeping in decibels: start with transmit power, add the antenna gains, subtract every loss, and compare what is left with the noise floor. In dB, Friis’ product of terms becomes a sum you can draw as a waterfall. Switch to radar mode to see why echoes are so faint: the R² spreading loss is paid twice.');

  const st = { mode: 'link' as Mode, pt: 20, gt: 3, gr: 3, f: 5.5e9, R: 15, lt: 1, lr: 1, misc: 8, nf: 6, bw: 20e6, snr: 25, rcs: 0 };
  const cw = card('dB waterfall', el('span', { class: 'legend-inline' }, el('span', {}, el('i', { style: 'background:var(--ok)' }), 'gain'), el('span', {}, el('i', { style: 'background:var(--bad)' }), 'loss'), el('span', {}, el('i', { style: 'background:var(--warn)' }), 'noise floor')));
  const cr = card('Received power vs. range', el('span', { class: 'muted' }, 'one-way −20 dB/decade · radar −40 dB/decade'));
  const ro = readout([
    { k: 'eirp', label: 'EIRP' }, { k: 'fspl', label: 'Free-space path loss' }, { k: 'pr', label: 'Received P_r' },
    { k: 'nf', label: 'Noise floor kTB + NF' }, { k: 'snr', label: 'SNR' }, { k: 'margin', label: 'Margin vs required' },
    { k: 'rmax', label: 'Max range (margin = 0)' }, { k: 'lam', label: 'Wavelength λ' }, { k: 'ae', label: 'Rx aperture A_e' },
  ]);
  viz.append(cw.card, el('div', { class: 'card', style: 'padding:12px' }, ro.el), cr.card);

  let loop: Loop | null = null;
  const SW = surface(cw.canvas, { aspect: 0.5, minH: 280, maxH: 440 }, () => loop?.request());
  const SR = surface(cr.canvas, { aspect: 0.42, minH: 220, maxH: 340 }, () => loop?.request());

  const lam = () => C0 / st.f;
  const steps = (R = st.R): Step[] => {
    if (st.mode === 'link') {
      return [
        { label: 'P_t', db: st.pt, kind: 'start' },
        { label: 'Tx line', db: -st.lt, kind: 'loss' },
        { label: 'G_t', db: st.gt, kind: 'gain' },
        { label: 'Path (FSPL)', db: -fsplDb(st.f, R), kind: 'loss' },
        { label: 'Other', db: -st.misc, kind: 'loss' },
        { label: 'G_r', db: st.gr, kind: 'gain' },
        { label: 'Rx line', db: -st.lr, kind: 'loss' },
      ];
    }
    const spread = -db10(4 * Math.PI * R * R);
    return [
      { label: 'P_t', db: st.pt, kind: 'start' },
      { label: 'Tx line', db: -st.lt, kind: 'loss' },
      { label: 'G', db: st.gt, kind: 'gain' },
      { label: '1/4πR² out', db: spread, kind: 'loss' },
      { label: 'σ', db: st.rcs, kind: st.rcs >= 0 ? 'gain' : 'loss' },
      { label: '1/4πR² back', db: spread, kind: 'loss' },
      { label: 'A_e = Gλ²/4π', db: st.gt + db10((lam() * lam()) / (4 * Math.PI)), kind: 'loss' },
      { label: 'Other', db: -st.misc, kind: 'loss' },
      { label: 'Rx line', db: -st.lr, kind: 'loss' },
    ];
  };
  const prAt = (R: number) => steps(R).reduce((s, x) => s + x.db, 0);
  const noise = () => noiseFloorDbm(st.bw, st.nf);
  const rMax = () => {
    // P_r is monotone in R: bisection in log space
    const need = noise() + st.snr;
    let lo = Math.log10(1e-3), hi = Math.log10(1e12);
    if (prAt(10 ** hi) > need) return Infinity;
    if (prAt(10 ** lo) < need) return 0;
    for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (prAt(10 ** m) > need) lo = m; else hi = m; }
    return 10 ** lo;
  };

  const draw = () => {
    const P = palette();
    const S = steps();
    { const { ctx, w, h } = SW.s;
      ctx.clearRect(0, 0, w, h);
      const levels: number[] = [];
      let run = 0;
      for (const s of S) { run += s.db; levels.push(run); }
      const pr = run, nfl = noise();
      const all = [...levels, 0, nfl, nfl + st.snr, st.pt];
      const top = Math.ceil((Math.max(...all) + 10) / 10) * 10, bot = Math.floor((Math.min(...all) - 10) / 10) * 10;
      const l = 54, r = w - 12, tp = 14, bt = h - 54;
      const Y = (d: number) => tp + ((top - d) / (top - bot)) * (bt - tp);
      ctx.strokeStyle = P.grid; ctx.fillStyle = P.faint; ctx.font = '11px ui-sans-serif, system-ui'; ctx.lineWidth = 1;
      const stepDb = (top - bot) > 200 ? 40 : (top - bot) > 100 ? 20 : 10;
      for (let d = bot; d <= top; d += stepDb) { const y = Y(d); ctx.beginPath(); ctx.moveTo(l, y); ctx.lineTo(r, y); ctx.stroke(); ctx.fillText(`${d}`, 6, y + 4); }
      ctx.save(); ctx.translate(12, tp + 40); ctx.fillText('dBm', 0, 0); ctx.restore();
      const n = S.length + 1, gap = 6, bw = (r - l) / n - gap;
      let prev = 0;
      S.forEach((s, i) => {
        const x = l + i * (bw + gap) + gap / 2;
        const a = s.kind === 'start' ? 0 : prev, b = levels[i];
        const y0 = Y(Math.max(a, b)), y1 = Y(Math.min(a, b));
        ctx.fillStyle = s.kind === 'start' ? P.acc : s.db >= 0 ? P.ok : P.bad;
        ctx.globalAlpha = s.kind === 'start' ? 0.85 : 0.75;
        if (s.kind === 'start') ctx.fillRect(x, Y(b), bw, Y(bot) - Y(b)); else ctx.fillRect(x, y0, bw, Math.max(2, y1 - y0));
        ctx.globalAlpha = 1;
        if (i < S.length - 1) { ctx.strokeStyle = alpha(P.text, 0.5); ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(x + bw, Y(b)); ctx.lineTo(x + bw + gap, Y(b)); ctx.stroke(); ctx.setLineDash([]); }
        ctx.fillStyle = P.text; ctx.font = '600 11px ui-sans-serif, system-ui'; ctx.textAlign = 'center';
        ctx.fillText(`${s.db >= 0 && s.kind !== 'start' ? '+' : ''}${s.db.toFixed(1)}`, x + bw / 2, Math.max(tp + 10, y0 - 4));
        ctx.save(); ctx.translate(x + bw / 2, bt + 8); ctx.rotate(-Math.PI / 5); ctx.textAlign = 'right'; ctx.fillStyle = P.muted; ctx.font = '11px ui-sans-serif, system-ui'; ctx.fillText(s.label, 0, 8); ctx.restore();
        prev = b;
      });
      // final P_r bar
      const x = l + S.length * (bw + gap) + gap / 2;
      ctx.fillStyle = P.e; ctx.globalAlpha = 0.85; ctx.fillRect(x, Y(pr), bw, Y(bot) - Y(pr)); ctx.globalAlpha = 1;
      ctx.fillStyle = P.text; ctx.textAlign = 'center'; ctx.font = '600 11px ui-sans-serif, system-ui';
      ctx.fillText(`${pr.toFixed(1)}`, x + bw / 2, Y(pr) - 4);
      ctx.save(); ctx.translate(x + bw / 2, bt + 8); ctx.rotate(-Math.PI / 5); ctx.textAlign = 'right'; ctx.fillStyle = P.muted; ctx.font = '11px ui-sans-serif, system-ui'; ctx.fillText('P_r', 0, 8); ctx.restore();
      ctx.textAlign = 'start';
      // noise floor and SNR requirement
      ctx.strokeStyle = P.warn; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(l, Y(nfl)); ctx.lineTo(r, Y(nfl)); ctx.stroke();
      ctx.strokeStyle = alpha(P.warn, 0.5); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(l, Y(nfl + st.snr)); ctx.lineTo(r, Y(nfl + st.snr)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = P.warn; ctx.font = '11px ui-sans-serif, system-ui';
      ctx.fillText(`noise floor ${nfl.toFixed(1)} dBm`, l + 4, Y(nfl) + 13);
      ctx.fillText(`required: +${st.snr} dB SNR`, l + 4, Y(nfl + st.snr) - 4);
      // SNR bracket on the P_r bar
      const bx = x - 4;
      ctx.strokeStyle = pr - nfl >= st.snr ? P.ok : P.bad; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx, Y(pr)); ctx.lineTo(bx - 5, Y(pr)); ctx.lineTo(bx - 5, Y(nfl)); ctx.lineTo(bx, Y(nfl)); ctx.stroke();
    }
    { const { ctx, w, h } = SR.s;
      ctx.clearRect(0, 0, w, h);
      const l = 50, r = w - 12, tp = 12, bt = h - 30;
      const r0 = Math.max(1e-2, st.R / 1e3), r1 = st.R * 1e3;
      const X = (R: number) => l + (Math.log10(R / r0) / Math.log10(r1 / r0)) * (r - l);
      const vals: number[] = []; for (let i = 0; i <= 100; i++) vals.push(prAt(r0 * (r1 / r0) ** (i / 100)));
      const top = Math.ceil(Math.max(...vals, noise() + st.snr) / 20) * 20 + 10, bot = Math.floor(Math.min(...vals, noise()) / 20) * 20 - 10;
      const Y = (d: number) => tp + ((top - d) / (top - bot)) * (bt - tp);
      ctx.strokeStyle = P.grid; ctx.fillStyle = P.faint; ctx.font = '11px ui-sans-serif, system-ui'; ctx.lineWidth = 1;
      for (let d = bot; d <= top; d += (top - bot) > 150 ? 40 : 20) { ctx.beginPath(); ctx.moveTo(l, Y(d)); ctx.lineTo(r, Y(d)); ctx.stroke(); ctx.fillText(`${d}`, 6, Y(d) + 4); }
      ctx.textAlign = 'center';
      for (let e = Math.ceil(Math.log10(r0)); e <= Math.log10(r1); e++) { const x = X(10 ** e); ctx.beginPath(); ctx.moveTo(x, tp); ctx.lineTo(x, bt); ctx.stroke(); ctx.fillText(fmtSI(10 ** e, 'm', 1), x, bt + 14); }
      ctx.textAlign = 'start';
      ctx.strokeStyle = P.warn; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(l, Y(noise())); ctx.lineTo(r, Y(noise())); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = alpha(P.warn, 0.5); ctx.beginPath(); ctx.moveTo(l, Y(noise() + st.snr)); ctx.lineTo(r, Y(noise() + st.snr)); ctx.stroke();
      ctx.strokeStyle = P.acc; ctx.lineWidth = 2.4; ctx.beginPath();
      vals.forEach((v, i) => { const x = l + (i / 100) * (r - l); i ? ctx.lineTo(x, Y(v)) : ctx.moveTo(x, Y(v)); });
      ctx.stroke();
      const xr = X(st.R), yr = Y(prAt(st.R));
      ctx.beginPath(); ctx.arc(xr, yr, 6, 0, 7); ctx.fillStyle = P.e; ctx.fill(); ctx.strokeStyle = P.text; ctx.lineWidth = 2; ctx.stroke();
      const rm = rMax();
      if (Number.isFinite(rm) && rm > r0 && rm < r1) { ctx.strokeStyle = P.ok; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X(rm), tp); ctx.lineTo(X(rm), bt); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = P.ok; ctx.fillText(`R_max ${fmtSI(rm, 'm')}`, X(rm) + 4, tp + 12); }
      ctx.fillStyle = P.faint; ctx.fillText('dBm', 6, tp + 6);
    }
  };
  loop = new Loop(draw, cw.canvas, false);

  const update = () => {
    const S = steps();
    const pr = S.reduce((s, x) => s + x.db, 0);
    const n = noise();
    ro.set('eirp', `${(st.pt - st.lt + st.gt).toFixed(1)} dBm (${fmtSI(10 ** ((st.pt - st.lt + st.gt - 30) / 10), 'W')})`);
    ro.set('fspl', `${fsplDb(st.f, st.R).toFixed(1)} dB${st.mode === 'radar' ? ' (one way)' : ''}`);
    ro.set('pr', `${pr.toFixed(1)} dBm`);
    ro.set('nf', `${n.toFixed(1)} dBm`);
    const snr = pr - n;
    ro.set('snr', `${snr.toFixed(1)} dB`, snr >= st.snr ? 'good' : 'badv');
    ro.set('margin', `${(snr - st.snr >= 0 ? '+' : '')}${(snr - st.snr).toFixed(1)} dB`, snr - st.snr >= 3 ? 'good' : snr >= st.snr ? 'warnv' : 'badv');
    const rm = rMax();
    ro.set('rmax', Number.isFinite(rm) ? fmtSI(rm, 'm') : '> 10¹² m');
    ro.set('lam', fmtSI(lam(), 'm'));
    ro.set('ae', `${fmtSI((10 ** ((st.mode === 'link' ? st.gr : st.gt) / 10) * lam() ** 2) / (4 * Math.PI), 'm²')}`);
    grRow.hidden = st.mode === 'radar';
    rcsRow.hidden = st.mode === 'link';
    gtLabel.textContent = st.mode === 'radar' ? 'Antenna gain G (Tx = Rx)' : 'Tx antenna gain G_t';
    loop?.request();
  };

  const S: Record<string, ReturnType<typeof slider>> = {};
  const mk = (id: keyof typeof st, label: string, min: number, max: number, step: number, fmt: (v: number) => string, log = false) => {
    S[id] = slider({ id, label, min, max, step, log, value: st[id] as number, fmt, onInput: (v) => { (st[id] as number) = v; preset.set('custom'); update(); } });
    return S[id];
  };
  const dB = (u: string) => (v: number) => `${v.toFixed(1)} ${u}`;
  mk('pt', 'Transmit power P_t', -30, 90, 0.5, (v) => `${v.toFixed(1)} dBm (${fmtSI(10 ** ((v - 30) / 10), 'W')})`);
  mk('gt', 'Tx antenna gain G_t', -5, 60, 0.5, dB('dBi'));
  mk('gr', 'Rx antenna gain G_r', -5, 60, 0.5, dB('dBi'));
  mk('rcs', 'Radar cross-section σ', -40, 50, 0.5, (v) => `${v.toFixed(1)} dBsm (${fmtSI(10 ** (v / 10), 'm²')})`);
  mk('f', 'Frequency f', 1e8, 1e12, 0, (v) => fmtSI(v, 'Hz'), true);
  mk('R', 'Range R', 1, 4e7, 0, (v) => fmtSI(v, 'm'), true);
  mk('lt', 'Tx line loss', 0, 10, 0.1, dB('dB'));
  mk('lr', 'Rx line loss', 0, 10, 0.1, dB('dB'));
  mk('misc', 'Other losses (walls, rain, pointing, polarisation)', 0, 60, 0.5, dB('dB'));
  mk('nf', 'Receiver noise figure', 0, 20, 0.1, dB('dB'));
  mk('bw', 'Bandwidth B', 1e3, 1e10, 0, (v) => fmtSI(v, 'Hz'), true);
  mk('snr', 'Required SNR', -10, 40, 0.5, dB('dB'));
  // ids used by equation links
  S.R.el.id = 'ctl-range';
  const grRow = S.gr.el, rcsRow = S.rcs.el;
  const gtLabel = S.gt.el.querySelector('label span') as HTMLElement;

  const presets: Record<Exclude<Preset, 'custom'>, Partial<typeof st> & { mode: Mode }> = {
    wifi: { mode: 'link', pt: 20, gt: 3, gr: 3, f: 5.5e9, R: 15, lt: 1, lr: 1, misc: 8, nf: 6, bw: 20e6, snr: 25 },
    geo: { mode: 'link', pt: 43, gt: 40, gr: 38, f: 12e9, R: 3.6e7, lt: 1, lr: 0.5, misc: 3, nf: 1, bw: 30e6, snr: 8 },
    thz: { mode: 'link', pt: 0, gt: 40, gr: 40, f: 300e9, R: 20, lt: 2, lr: 2, misc: 1, nf: 12, bw: 10e9, snr: 15 },
    xradar: { mode: 'radar', pt: 60, gt: 33, f: 9.4e9, R: 7e3, lt: 1, lr: 1, misc: 3, nf: 3, bw: 1e6, snr: 13, rcs: 0 },
  };
  const modeSeg = segmented<Mode>({ id: 'mode', label: 'Equation', value: 'link', options: [{ value: 'link', label: 'Friis (one-way link)' }, { value: 'radar', label: 'Radar (monostatic)' }], onChange: (m) => { st.mode = m; preset.set('custom'); update(); } });
  const preset = segmented<Preset>({ id: 'preset', label: 'Scenario', value: 'wifi', options: [
    { value: 'wifi', label: 'Wi-Fi, 15 m' }, { value: 'geo', label: 'GEO Ku downlink' }, { value: 'thz', label: '300 GHz link' }, { value: 'xradar', label: 'X-band radar' }, { value: 'custom', label: 'Custom' }],
    onChange: (p) => {
      if (p === 'custom') return;
      Object.assign(st, presets[p]);
      for (const k of Object.keys(S)) S[k].set(st[k as keyof typeof st] as number);
      modeSeg.set(st.mode);
      update();
    } });
  controls.append(modeSeg.el, preset.el, el('h3', {}, 'Transmitter'), S.pt.el, S.lt.el, S.gt.el, el('h3', {}, 'Channel'), S.f.el, S.R.el, S.rcs.el, S.misc.el,
    el('h3', {}, 'Receiver'), S.gr.el, S.lr.el, S.nf.el, S.bw.el, S.snr.el);

  const eqs = equationsSection(eqFor('link'), focusControl);
  after.append(notice([
    '<b>Free space does not absorb anything.</b> FSPL grows with frequency only because a fixed-gain receive antenna has a smaller aperture A_e = Gλ²/4π. Hold the dish size fixed instead, and gain rises as f², which cancels the loss.',
    '<b>Every doubling of range costs 6 dB one-way and 12 dB for radar.</b> The range plot shows the −20 and −40 dB/decade slopes directly.',
    '<b>The noise floor starts at −174 dBm/Hz</b> (kT at 290 K). Bandwidth adds 10 log B and the receiver adds its noise figure. A 10 GHz-wide THz receiver has a floor near −74 dBm before its noise figure is even counted.',
    '<b>The 300 GHz preset</b> needs 40 dBi lenses or horns at both ends to close 20 m. That high gain is also why beam alignment at THz is hard: the beams are about a degree wide.',
    'Friis assumes far-field (R > 2D²/λ), matched polarisation and matched impedances. Each departure goes into “other losses”. Atmospheric absorption at 300 GHz is roughly 5–10 dB/km at sea level and much higher near water lines.',
  ]), eqs.el);
  update();
  return () => { loop?.destroy(); SW.destroy(); SR.destroy(); eqs.destroy(); };
}
