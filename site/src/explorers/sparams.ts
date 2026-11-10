import { byId } from './registry';
import { explorerPage, card, equationsSection, notice } from '../lib/page';
import { eqFor } from '../equations';
import { el } from '../lib/dom';
import { Loop, surface, arrow } from '../lib/canvas';
import { slider, segmented, readout, playButton, focusControl } from '../lib/ui';
import { palette, alpha } from '../lib/theme';
import { abcdToS, abcdSeries, abcdShunt, abcdLine, gammaIn, fromDb20, DEG, type S2 } from '../lib/physics';
import { abs, arg, c, div, mul, sub, polar, type C } from '../lib/complex';
import { drawSmithGrid, toXY, dot, type SmithGeom } from '../lib/smithdraw';

type Dev = 'series' | 'shunt' | 'line' | 'atten' | 'amp';

export default function mount(root: HTMLElement) {
  const meta = byId('sparams')!;
  const { viz, controls, after } = explorerPage(root, meta,
    'S-parameters describe a network with waves instead of voltages and currents. You send a wave a₁ into port 1 and see how much comes back (S11) and how much comes out of port 2 (S21). Because |a|² and |b|² are powers, the matrix also tells you where every watt goes.');

  const st = { dev: 'series' as Dev, r: 0, x: 50, z1: 100, theta: 90, att: 6, gain: 15, iso: 25, s11a: 0.3, s22a: 0.4, gl: 0, glph: 0 };
  const cf = card('Power flow, a₁ = 1 W incident at port 1', el('span', { class: 'muted' }, 'ribbon width ∝ √power'));
  const cs = card('S11, S22 and Γ_in on the Smith chart');
  const mtx = el('div', { class: 'card', style: 'padding:12px' });
  const ro = readout([
    { k: 's11', label: '|S11|' }, { k: 's21', label: '|S21|' }, { k: 'gin', label: 'Γ_in' },
    { k: 'pl', label: 'Delivered to load' }, { k: 'pd', label: 'Absorbed in network' }, { k: 'pr', label: 'Reflected to source' },
  ]);
  mtx.append(ro.el, el('div', { style: 'margin-top:10px' }));
  viz.append(cf.card, el('div', { class: 'two' }, cs.card, mtx));

  let loop: Loop | null = null;
  const SF = surface(cf.canvas, { aspect: 0.42, minH: 250, maxH: 380 }, () => loop?.request());
  const geom: SmithGeom = { cx: 0, cy: 0, R: 1 };
  const SS = surface(cs.canvas, { aspect: 1, minH: 240, maxH: 340 }, (s) => { geom.cx = s.w / 2; geom.cy = s.h / 2; geom.R = Math.min(s.w, s.h) * 0.4; loop?.request(); });

  const sMatrix = (): S2 => {
    const z0 = 50;
    switch (st.dev) {
      case 'series': return abcdToS(abcdSeries(c(st.r, st.x)), z0);
      case 'shunt': return abcdToS(abcdShunt(div(c(1), c(st.r + 1e-9, st.x))), z0);
      case 'line': return abcdToS(abcdLine(st.z1, st.theta * DEG), z0);
      case 'atten': { const t = c(fromDb20(-st.att)); return { s11: c(0), s22: c(0), s21: t, s12: t }; }
      case 'amp': return { s11: polar(st.s11a, Math.PI), s22: polar(st.s22a, -0.6 * Math.PI), s21: polar(fromDb20(st.gain), -Math.PI / 2), s12: polar(fromDb20(-st.iso), -Math.PI / 2) };
    }
  };

  const flows = () => {
    const S = sMatrix();
    const GL = polar(st.gl, st.glph * DEG);
    const Gin = gammaIn(S, GL);
    const b2 = div(S.s21, sub(c(1), mul(S.s22, GL)));
    const pb2 = abs(b2) ** 2;
    const pa2 = pb2 * st.gl ** 2;
    const pl = pb2 - pa2;
    const pr = abs(Gin) ** 2;
    const pd = 1 - pr - pl; // negative → net power added by the device
    return { S, GL, Gin, pb2, pa2, pl, pr, pd };
  };

  const pct = (p: number) => (Math.abs(p) >= 10 ? `${p.toFixed(1)} W` : `${(p * 100).toFixed(p < 0.1 ? 2 : 1)}%`);
  const db = (p: number) => (p > 0 ? `${(10 * Math.log10(p)).toFixed(2)} dB` : '−∞ dB');

  const draw = (t: number) => {
    const P = palette();
    const F = flows();
    { const { ctx, w, h } = SF.s;
      ctx.clearRect(0, 0, w, h);
      const mid = h * 0.46, bx0 = w * 0.4, bx1 = w * 0.6, lane = Math.min(34, h * 0.11), maxW = Math.min(46, h * 0.16);
      const load = w - 30;
      const W = (p: number) => Math.max(p > 1e-6 ? 1.5 : 0, Math.min(maxW * 1.8, maxW * Math.sqrt(Math.max(0, p))));
      const ribbon = (x0: number, x1: number, y: number, p: number, col: string, label: string, below = false) => {
        const wd = W(p);
        if (wd <= 0) return;
        ctx.fillStyle = alpha(col, 0.28); ctx.fillRect(Math.min(x0, x1), y - wd / 2, Math.abs(x1 - x0), wd);
        // flowing particles
        const dir = Math.sign(x1 - x0), L = Math.abs(x1 - x0);
        ctx.fillStyle = col;
        const sp = 26, off = ((t * 60) % sp + sp) % sp;
        for (let s = off; s < L; s += sp) { const x = x0 + dir * s; ctx.beginPath(); ctx.arc(x, y, Math.max(1.5, Math.min(4, wd / 4)), 0, 7); ctx.fill(); }
        ctx.strokeStyle = col; ctx.lineWidth = 2; arrow(ctx, x1 - dir * 14, y, x1 - dir * 2, y, 8);
        ctx.font = '600 12px ui-sans-serif, system-ui'; ctx.fillStyle = col; ctx.textAlign = 'center';
        ctx.fillText(label, (x0 + x1) / 2, below ? y + wd / 2 + 15 : y - wd / 2 - 7);
        ctx.textAlign = 'start';
      };
      // lines and box
      ctx.strokeStyle = alpha(P.muted, 0.4); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(10, mid); ctx.lineTo(bx0, mid); ctx.moveTo(bx1, mid); ctx.lineTo(load, mid); ctx.stroke();
      ctx.fillStyle = alpha(P.acc, 0.12); ctx.strokeStyle = P.acc; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(bx0, mid - h * 0.3, bx1 - bx0, h * 0.6, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = P.text; ctx.font = '600 15px ui-sans-serif, system-ui'; ctx.textAlign = 'center';
      ctx.fillText('[S]', (bx0 + bx1) / 2, mid + 5);
      ctx.font = '11px ui-sans-serif, system-ui'; ctx.fillStyle = P.faint;
      ctx.fillText('port 1', bx0 - 26, mid + h * 0.38); ctx.fillText('port 2', bx1 + 26, mid + h * 0.38);
      // load
      ctx.fillStyle = alpha(P.ok, 0.15 + 0.6 * Math.min(1, F.pl)); ctx.strokeStyle = P.ok;
      ctx.beginPath(); ctx.roundRect(load, mid - 26, 20, 52, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = P.ok; ctx.fillText(`Γ_L`, load + 10, mid - 32);
      ctx.textAlign = 'start';
      ribbon(12, bx0, mid - lane, 1, P.e, 'a₁ = 1 W');
      ribbon(bx0, 12, mid + lane, F.pr, P.h, `|b₁|² = ${pct(F.pr)}`, true);
      ribbon(bx1, load - 2, mid - lane, F.pb2, P.acc, `|b₂|² = ${pct(F.pb2)}`);
      if (st.gl > 0.005) ribbon(load - 2, bx1, mid + lane, F.pa2, alpha(P.h, 1), `|a₂|² = ${pct(F.pa2)}`, true);
      // absorbed or supplied
      const cx = (bx0 + bx1) / 2;
      const pd = F.pd;
      if (Math.abs(pd) > 1e-4) {
        const wd = W(Math.abs(pd));
        const col = pd > 0 ? P.warn : P.ok;
        const y0 = pd > 0 ? mid + h * 0.3 : h - 8, y1 = pd > 0 ? h - 8 : mid + h * 0.3;
        ctx.fillStyle = alpha(col, 0.3); ctx.fillRect(cx - wd / 2, Math.min(y0, y1), wd, Math.abs(y1 - y0));
        ctx.strokeStyle = col; ctx.fillStyle = col; arrow(ctx, cx, y1 - Math.sign(y1 - y0) * 12, cx, y1, 8);
        ctx.font = '600 12px ui-sans-serif, system-ui';
        ctx.fillText(pd > 0 ? `heat ${pct(pd)}` : `from DC supply ${pct(-pd)}`, cx + wd / 2 + 6, h - 12);
      }
    }
    { const { ctx, w, h } = SS.s;
      ctx.clearRect(0, 0, w, h);
      drawSmithGrid(ctx, geom, {});
      const pts: [C, string, string][] = [[F.S.s11, P.e, 'S11'], [F.S.s22, P.h, 'S22'], [F.Gin, P.acc, 'Γ_in']];
      for (const [g, col, lab] of pts) {
        const m = abs(g);
        const gg = m > 1.2 ? polar(1.2, arg(g)) : g;
        const [x, y] = toXY(geom, gg);
        dot(ctx, x, y, 6, col, P.text);
        ctx.fillStyle = col; ctx.font = '600 12px ui-sans-serif, system-ui'; ctx.fillText(lab, x + 9, y - 6);
      }
      ctx.fillStyle = P.faint; ctx.font = '11px ui-sans-serif, system-ui'; ctx.fillText('Z0 = 50 Ω', 8, h - 8);
    }
  };
  loop = new Loop(draw, cf.canvas);

  const mtxBox = mtx.lastChild as HTMLElement;
  const fmtS = (s: C) => `${(20 * Math.log10(Math.max(abs(s), 1e-12))).toFixed(1)} dB ∠${(arg(s) / DEG).toFixed(0)}°`;
  const update = () => {
    const F = flows();
    ro.set('s11', db(abs(F.S.s11) ** 2));
    ro.set('s21', db(abs(F.S.s21) ** 2), abs(F.S.s21) > 1 ? 'good' : undefined);
    ro.set('gin', `${abs(F.Gin).toFixed(3)} ∠${(arg(F.Gin) / DEG).toFixed(0)}°`);
    ro.set('pl', pct(F.pl), 'good');
    ro.set('pd', Math.abs(F.pd) < 1e-6 ? '0%' : F.pd > 0 ? pct(F.pd) : `−${pct(-F.pd)} (gain)`, F.pd > 0.01 ? 'warnv' : undefined);
    ro.set('pr', pct(F.pr), F.pr > 0.1 ? 'badv' : undefined);
    const S = F.S;
    const recip = abs(sub(S.s12, S.s21)) < 1e-9;
    const p1 = abs(S.s11) ** 2 + abs(S.s21) ** 2, p2 = abs(S.s12) ** 2 + abs(S.s22) ** 2;
    const cross = abs(c(S.s11.re * S.s12.re + S.s11.im * S.s12.im + S.s21.re * S.s22.re + S.s21.im * S.s22.im, S.s11.im * S.s12.re - S.s11.re * S.s12.im + S.s21.im * S.s22.re - S.s21.re * S.s22.im));
    const lossless = Math.abs(p1 - 1) < 1e-9 && Math.abs(p2 - 1) < 1e-9 && cross < 1e-9;
    const passive = p1 <= 1 + 1e-9 && p2 <= 1 + 1e-9;
    const yes = (b: boolean) => (b ? '<span style="color:var(--ok)">yes</span>' : '<span style="color:var(--faint)">no</span>');
    mtxBox.innerHTML = `<table class="mini"><tr><th></th><th>port 1 in</th><th>port 2 in</th></tr>
      <tr><th>out 1</th><td class="num">${fmtS(S.s11)}</td><td class="num">${fmtS(S.s12)}</td></tr>
      <tr><th>out 2</th><td class="num">${fmtS(S.s21)}</td><td class="num">${fmtS(S.s22)}</td></tr></table>
      <table class="mini" style="margin-top:8px"><tr><th>Reciprocal (S12 = S21)</th><td>${yes(recip)}</td></tr>
      <tr><th>Lossless (S unitary)</th><td>${yes(lossless)}</td></tr><tr><th>Passive (columns ≤ 1)</th><td>${yes(passive)}</td></tr></table>`;
    loop?.request();
  };

  const sliders = {
    r: slider({ id: 'r', label: 'R', min: 0, max: 200, step: 1, value: st.r, fmt: (v) => `${v.toFixed(0)} Ω`, onInput: (v) => { st.r = v; update(); } }),
    x: slider({ id: 'x', label: 'X', min: -200, max: 200, step: 1, value: st.x, fmt: (v) => `${v >= 0 ? '+' : '−'}j${Math.abs(v).toFixed(0)} Ω`, onInput: (v) => { st.x = v; update(); } }),
    z1: slider({ id: 'z1', label: 'Section impedance Z1', min: 10, max: 200, step: 1, value: st.z1, fmt: (v) => `${v.toFixed(0)} Ω`, onInput: (v) => { st.z1 = v; update(); } }),
    theta: slider({ id: 'theta', label: 'Electrical length βℓ', min: 0, max: 360, step: 1, value: st.theta, fmt: (v) => `${v.toFixed(0)}°`, onInput: (v) => { st.theta = v; update(); } }),
    att: slider({ id: 'att', label: 'Attenuation', min: 0, max: 30, step: 0.5, value: st.att, fmt: (v) => `${v.toFixed(1)} dB`, onInput: (v) => { st.att = v; update(); } }),
    gain: slider({ id: 'gain', label: 'Gain |S21|²', min: 0, max: 25, step: 0.5, value: st.gain, fmt: (v) => `${v.toFixed(1)} dB`, onInput: (v) => { st.gain = v; update(); } }),
    iso: slider({ id: 'iso', label: 'Reverse isolation 1/|S12|²', min: 5, max: 50, step: 0.5, value: st.iso, fmt: (v) => `${v.toFixed(1)} dB`, onInput: (v) => { st.iso = v; update(); } }),
    s11a: slider({ id: 's11a', label: '|S11| input mismatch', min: 0, max: 0.9, step: 0.01, value: st.s11a, fmt: (v) => v.toFixed(2), onInput: (v) => { st.s11a = v; update(); } }),
    s22a: slider({ id: 's22a', label: '|S22| output mismatch', min: 0, max: 0.9, step: 0.01, value: st.s22a, fmt: (v) => v.toFixed(2), onInput: (v) => { st.s22a = v; update(); } }),
  };
  const show: Record<Dev, (keyof typeof sliders)[]> = {
    series: ['r', 'x'], shunt: ['r', 'x'], line: ['z1', 'theta'], atten: ['att'], amp: ['gain', 'iso', 's11a', 's22a'],
  };
  const devSeg = segmented<Dev>({ id: 'device', label: 'Device', value: st.dev, options: [
    { value: 'series', label: 'Series Z' }, { value: 'shunt', label: 'Shunt Z' }, { value: 'line', label: 'Line section' }, { value: 'atten', label: 'Attenuator' }, { value: 'amp', label: 'Amplifier' }],
    onChange: (v) => { st.dev = v; syncVis(); update(); } });
  const syncVis = () => {
    (Object.keys(sliders) as (keyof typeof sliders)[]).forEach((k) => { sliders[k].el.hidden = !show[st.dev].includes(k); });
    sliders.r.el.querySelector('span')!.textContent = st.dev === 'shunt' ? 'Shunt R' : 'Series R';
    sliders.x.el.querySelector('span')!.textContent = st.dev === 'shunt' ? 'Shunt X' : 'Series X';
  };
  const sGL = slider({ id: 'gl', label: 'Port-2 load |Γ_L|', min: 0, max: 1, step: 0.01, value: 0, fmt: (v) => (v === 0 ? '0 (matched)' : v.toFixed(2)), onInput: (v) => { st.gl = v; update(); } });
  const sGLp = slider({ id: 'glph', label: 'Port-2 load ∠Γ_L', min: -180, max: 180, step: 1, value: 0, fmt: (v) => `${v.toFixed(0)}°`, onInput: (v) => { st.glph = v; update(); } });
  controls.append(el('div', { class: 'seg' }, playButton(loop)), el('h3', {}, 'Two-port'), devSeg.el, ...Object.values(sliders).map((s) => s.el),
    el('h3', {}, 'Termination at port 2'), sGL.el, sGLp.el,
    el('small', { class: 'muted' }, 'With |Γ_L| = 0, Γ_in equals S11. Any mismatch on port 2 leaks back through S12 and shifts Γ_in.'));
  syncVis();

  const eqs = equationsSection(eqFor('sparams'), focusControl);
  after.append(notice([
    '<b>A lossless two-port conserves power exactly</b>: pick “Line section” and |S11|² + |S21|² stays at 100% whatever Z1 and βℓ are. When βℓ = 180°, the section disappears entirely.',
    '<b>A series reactance is reciprocal and lossless</b>, but it is not matched. All the “missing” power is reflected, none is absorbed. Add R and some turns into heat.',
    '<b>The attenuator is matched (S11 = 0)</b>. A 3 dB pad delivers half the power and absorbs the other half.',
    '<b>Amplifiers break reciprocity</b> (S21 ≠ S12) and the power columns exceed 1: the extra comes from the DC supply. Lower the isolation and unmatch port 2 to see Γ_in wander. This is the start of the stability story in Pozar ch. 11.',
  ]), eqs.el);
  update();
  return () => { loop?.destroy(); SF.destroy(); SS.destroy(); eqs.destroy(); };
}
