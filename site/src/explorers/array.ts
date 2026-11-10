import { byId } from './registry';
import { explorerPage, card, equationsSection, notice } from '../lib/page';
import { eqFor } from '../equations';
import { el } from '../lib/dom';
import { Loop, surface, onDrag, Camera, divergingLUT } from '../lib/canvas';
import { slider, segmented, readout, playButton, toggle, focusControl } from '../lib/ui';
import { palette, alpha, rgb } from '../lib/theme';
import { afFromPsi, steeringAngle, phaseForSteer, gratingLobes, DEG } from '../lib/physics';

type Elem = 'iso' | 'cos';

export default function mount(root: HTMLElement) {
  const meta = byId('array')!;
  const { viz, controls, after } = explorerPage(root, meta,
    'Put N identical radiators in a row and their waves add up differently in every direction. Delay each element by a fixed phase step β, and the direction where they all add in phase swings over: that is electronic beam steering. The catch is spacing. Space them more than about λ/2 apart and the same constructive interference happens in more than one direction.');

  const st = { N: 8, d: 0.5, beta: 0, elem: 'iso' as Elem, db: true };
  const kd = () => 2 * Math.PI * st.d;
  const ef = (phi: number) => (st.elem === 'cos' ? Math.max(0, Math.cos(phi)) : 1); // φ from broadside
  const pat = (phi: number) => afFromPsi(st.N, kd() * Math.sin(phi) + st.beta) * ef(phi);

  const cw = card('Wavefronts from the array (top view)', el('span', { class: 'muted' }, 'elements along x; dashed: main beam and grating lobes'));
  const cp = card('Pattern (polar, φ from broadside)');
  const cs = card('ψ-space: what the visible window sees');
  const c3 = card('3-D pattern', el('span', { class: 'muted' }, 'drag to rotate'));
  c3.canvas.classList.add('drag');
  c3.canvas.style.touchAction = 'pan-y';
  const ro = readout([
    { k: 'steer', label: 'Beam direction φ0' }, { k: 'hp', label: 'HPBW (in plane)' }, { k: 'sll', label: 'First sidelobe' },
    { k: 'gl', label: 'Grating lobes' }, { k: 'D', label: 'Directivity (AF·EF)' }, { k: 'dmax', label: 'Max d/λ, no grating lobe' },
  ]);
  viz.append(cw.card, el('div', { class: 'two' }, cp.card, cs.card), el('div', { class: 'two' }, c3.card, el('div', { class: 'card', style: 'padding:12px' }, ro.el)));

  // precomputed phasor field for the wave picture
  let nx = 0, ny = 0, Fr = new Float32Array(0), Fi = new Float32Array(0), fmax = 1, dirty = true, extX = 6, extY = 6;
  const buf = document.createElement('canvas');
  const bctx = buf.getContext('2d')!;
  let img: ImageData | null = null;
  let lutKey = '', lut = new Uint8ClampedArray(0);
  const cam = new Camera(0.5, 0.45, 8, 100);
  let loop: Loop | null = null;
  const SW = surface(cw.canvas, { aspect: 0.55, minH: 240, maxH: 440, maxDpr: 2 }, () => { dirty = true; loop?.request(); });
  const SP = surface(cp.canvas, { aspect: 1, minH: 240, maxH: 340 }, () => loop?.request());
  const SS = surface(cs.canvas, { aspect: 0.75, minH: 220, maxH: 300 }, () => loop?.request());
  const S3 = surface(c3.canvas, { aspect: 0.9, minH: 240, maxH: 360 }, (s) => { cam.cx = s.w / 2; cam.cy = s.h / 2; cam.scale = Math.min(s.w, s.h) * 0.36; loop?.request(); });
  const undrag = onDrag(c3.canvas, { move: (_x, _y, dx, dy) => { cam.yaw += dx * 0.01; cam.pitch = Math.max(-1.3, Math.min(1.3, cam.pitch + dy * 0.01)); loop?.request(); } });

  function rebuildField() {
    dirty = false;
    const { w, h } = SW.s;
    nx = Math.round(Math.min(220, Math.max(120, w / 4)));
    ny = Math.round(nx * (h / Math.max(1, w)));
    const span = (st.N - 1) * st.d;
    extX = Math.max(6, span * 0.8 + 3); // half-width in λ
    extY = extX * 2 * (ny / nx);
    Fr = new Float32Array(nx * ny); Fi = new Float32Array(nx * ny);
    const k = 2 * Math.PI;
    const xs = Array.from({ length: st.N }, (_, n) => (n - (st.N - 1) / 2) * st.d);
    const ph = Array.from({ length: st.N }, (_, n) => n * st.beta);
    let mx = 1e-9;
    for (let j = 0; j < ny; j++) {
      const y = extY * (1 - (j + 0.5) / ny) + 0.02;
      for (let i = 0; i < nx; i++) {
        const x = -extX + ((i + 0.5) / nx) * 2 * extX;
        let re = 0, im = 0;
        for (let n = 0; n < st.N; n++) {
          const r = Math.hypot(x - xs[n], y);
          const a = 1 / Math.sqrt(r + 0.15); // 2-D line-source spreading
          const phi = Math.atan2(x - xs[n], y);
          const e = st.elem === 'cos' ? Math.max(0, Math.cos(phi)) : 1;
          const p = ph[n] - k * r;
          re += a * e * Math.cos(p); im += a * e * Math.sin(p);
        }
        // compensate spreading so the far field reads evenly
        const r0 = Math.hypot(x, y), g = Math.sqrt(r0 + 0.15);
        re *= g; im *= g;
        Fr[j * nx + i] = re; Fi[j * nx + i] = im;
        if (r0 > span / 2 + 1) mx = Math.max(mx, Math.hypot(re, im));
      }
    }
    fmax = mx;
    buf.width = nx; buf.height = ny;
    img = bctx.createImageData(nx, ny);
  }

  const lobes = () => gratingLobes(st.d, st.beta);

  const draw = (t: number) => {
    const P = palette();
    const wt = 2 * Math.PI * 0.5 * t;
    { const { ctx, w, h } = SW.s;
      if (dirty || !img) rebuildField();
      const k = P.e + P.h + P.panel;
      if (k !== lutKey) { lut = divergingLUT(rgb(P.e), rgb(P.h), rgb(P.panel)); lutKey = k; }
      const c = Math.cos(wt), s = Math.sin(wt), D = img!.data;
      for (let p = 0; p < nx * ny; p++) {
        const v = Math.max(-1, Math.min(1, (Fr[p] * c - Fi[p] * s) / fmax));
        const li = Math.round((v + 1) * 127.5) * 3, o = p * 4;
        D[o] = lut[li]; D[o + 1] = lut[li + 1]; D[o + 2] = lut[li + 2]; D[o + 3] = 255;
      }
      bctx.putImageData(img!, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(buf, 0, 0, w, h);
      const sc = w / (2 * extX), cx = w / 2, by = h - 2;
      // beam lines
      for (const a of lobes()) {
        const main = Math.abs(a - steeringAngle(st.d, st.beta)) < 1e-9;
        ctx.strokeStyle = main ? P.text : P.bad; ctx.lineWidth = main ? 2 : 2; ctx.setLineDash(main ? [8, 6] : [3, 5]);
        ctx.beginPath(); ctx.moveTo(cx, by); ctx.lineTo(cx + Math.sin(a) * h * 2, by - Math.cos(a) * h * 2); ctx.stroke();
      }
      ctx.setLineDash([]);
      for (let n = 0; n < st.N; n++) {
        const x = cx + (n - (st.N - 1) / 2) * st.d * sc;
        ctx.beginPath(); ctx.arc(x, by - 4, Math.max(2.5, Math.min(5, st.d * sc * 0.3)), 0, 7); ctx.fillStyle = P.warn; ctx.fill();
        // phase "clock" hand
        const ph = n * st.beta + wt;
        ctx.strokeStyle = P.text; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, by - 4); ctx.lineTo(x + 6 * Math.cos(ph), by - 4 - 6 * Math.sin(ph)); ctx.stroke();
      }
      ctx.fillStyle = P.text; ctx.font = '11px ui-sans-serif, system-ui';
      ctx.strokeStyle = P.text; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(12, 16); ctx.lineTo(12 + sc, 16); ctx.stroke(); ctx.fillText('1 λ', 12 + sc + 6, 20);
    }
    { const { ctx, w, h } = SP.s;
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.43, cx = w / 2, cy = h / 2;
      const floor = -40;
      const rad = (v: number) => (st.db ? Math.max(0, (20 * Math.log10(Math.max(v, 1e-9)) - floor) / -floor) : v);
      ctx.strokeStyle = P.grid; ctx.lineWidth = 1; ctx.fillStyle = P.faint; ctx.font = '10px ui-sans-serif, system-ui';
      for (const q of [0.25, 0.5, 0.75, 1]) { ctx.beginPath(); ctx.arc(cx, cy, q * R, 0, 7); ctx.stroke(); if (st.db) ctx.fillText(`${(floor * (1 - q)).toFixed(0)}`, cx + 3, cy - q * R + 11); }
      for (let a = 0; a < 180; a += 30) { const t = a * DEG; ctx.beginPath(); ctx.moveTo(cx - R * Math.sin(t), cy - R * Math.cos(t)); ctx.lineTo(cx + R * Math.sin(t), cy + R * Math.cos(t)); ctx.stroke(); }
      ctx.strokeStyle = alpha(P.muted, 0.5); ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i <= 720; i++) {
        const a = (i / 720) * 2 * Math.PI - Math.PI; // angle from +y (broadside), full circle
        // back half: the same AF (mirror) times element factor (zero for cos elements)
        const phi = Math.abs(a) <= Math.PI / 2 ? a : Math.sign(a) * (Math.PI - Math.abs(a));
        const front = Math.abs(a) <= Math.PI / 2;
        const v = afFromPsi(st.N, kd() * Math.sin(phi) + st.beta) * (st.elem === 'cos' ? (front ? Math.cos(phi) : 0) : 1);
        const r = rad(v) * R;
        const x = cx + r * Math.sin(a), y = cy - r * Math.cos(a);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath(); ctx.fillStyle = alpha(P.acc, 0.18); ctx.fill(); ctx.strokeStyle = P.acc; ctx.lineWidth = 2.2; ctx.stroke();
      const a0 = steeringAngle(st.d, st.beta);
      if (Number.isFinite(a0)) { ctx.strokeStyle = P.text; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.sin(a0), cy - R * Math.cos(a0)); ctx.stroke(); ctx.setLineDash([]); }
      ctx.fillStyle = P.warn;
      for (let n = 0; n < Math.min(st.N, 16); n++) { ctx.beginPath(); ctx.arc(cx + (n - (Math.min(st.N, 16) - 1) / 2) * 5, cy, 1.8, 0, 7); ctx.fill(); }
      ctx.fillStyle = P.faint; ctx.font = '11px ui-sans-serif, system-ui';
      ctx.fillText('broadside', cx + 4, cy - R - 4); ctx.fillText('end-fire', cx + R - 46, cy + 14);
      ctx.fillText(st.db ? 'dB (40 dB range)' : 'linear', 8, h - 8);
    }
    { const { ctx, w, h } = SS.s;
      ctx.clearRect(0, 0, w, h);
      const l = 14, r = w - 14, tp = 18, bt = h - 40;
      const pmin = -3 * Math.PI, pmax = 3 * Math.PI;
      const X = (p: number) => l + ((p - pmin) / (pmax - pmin)) * (r - l);
      const Y = (v: number) => bt - v * (bt - tp);
      const v0 = st.beta - kd(), v1 = st.beta + kd();
      ctx.fillStyle = alpha(P.ok, 0.14); ctx.fillRect(X(Math.max(pmin, v0)), tp - 6, X(Math.min(pmax, v1)) - X(Math.max(pmin, v0)), bt - tp + 6);
      ctx.strokeStyle = P.ok; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
      for (const v of [v0, v1]) if (v > pmin && v < pmax) { ctx.beginPath(); ctx.moveTo(X(v), tp - 6); ctx.lineTo(X(v), bt); ctx.stroke(); }
      ctx.setLineDash([]);
      ctx.strokeStyle = alpha(P.muted, 0.5); ctx.beginPath(); ctx.moveTo(l, bt); ctx.lineTo(r, bt); ctx.stroke();
      ctx.strokeStyle = P.e; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 900; i++) { const p = pmin + (i / 900) * (pmax - pmin); const v = afFromPsi(st.N, p); i ? ctx.lineTo(X(p), Y(v)) : ctx.moveTo(X(p), Y(v)); }
      ctx.stroke();
      ctx.fillStyle = P.faint; ctx.font = '11px ui-sans-serif, system-ui'; ctx.textAlign = 'center';
      for (let m = -3; m <= 3; m++) ctx.fillText(m === 0 ? '0' : `${m > 0 ? '' : '−'}${Math.abs(m) === 1 ? '' : Math.abs(m)}π`, X(m * Math.PI), bt + 14);
      ctx.fillStyle = P.ok; ctx.fillText('visible: ψ ∈ [β − kd, β + kd]', (l + r) / 2, h - 6);
      ctx.textAlign = 'start';
      ctx.fillStyle = P.text; ctx.fillText('|AF(ψ)|', l, tp - 6);
      // mark peaks inside window
      for (let m = -1; m <= 1; m++) { const p = 2 * Math.PI * m; if (p >= v0 && p <= v1) { ctx.beginPath(); ctx.arc(X(p), Y(1), 5, 0, 7); ctx.fillStyle = m === 0 ? P.text : P.bad; ctx.fill(); } }
    }
    { const { ctx, w, h } = S3.s;
      ctx.clearRect(0, 0, w, h);
      // sphere grid: θ from array axis (x), α around it
      const NT = 60, NA = 48;
      const rAt = (th: number, al: number) => {
        const phiB = Math.PI / 2 - th; // from broadside within the plane containing the axis
        const dirY = Math.sin(th) * Math.cos(al);
        const e = st.elem === 'cos' ? Math.max(0, dirY) : 1;
        const v = afFromPsi(st.N, kd() * Math.sin(phiB) + st.beta) * e;
        return st.db ? Math.max(0, (20 * Math.log10(Math.max(v, 1e-9)) + 30) / 30) : v;
      };
      const pts: [number, number, number, number][][] = [];
      for (let i = 0; i <= NT; i++) {
        const th = (i / NT) * Math.PI; const row: [number, number, number, number][] = [];
        for (let j = 0; j <= NA; j++) {
          const al = (j / NA) * 2 * Math.PI; const r = rAt(th, al);
          // world: x = array axis, y = broadside (up on screen), z = depth
          const [sx, sy, sz] = cam.project(r * Math.cos(th), r * Math.sin(th) * Math.cos(al), r * Math.sin(th) * Math.sin(al));
          row.push([sx, sy, sz, r]);
        }
        pts.push(row);
      }
      const quads: { z: number; p: [number, number][]; r: number }[] = [];
      for (let i = 0; i < NT; i++) for (let j = 0; j < NA; j++) {
        const a = pts[i][j], b = pts[i + 1][j], c = pts[i + 1][j + 1], d = pts[i][j + 1];
        const r = (a[3] + b[3] + c[3] + d[3]) / 4;
        if (r < 0.02) continue;
        quads.push({ z: (a[2] + b[2] + c[2] + d[2]) / 4, p: [[a[0], a[1]], [b[0], b[1]], [c[0], c[1]], [d[0], d[1]]], r });
      }
      quads.sort((q1, q2) => q1.z - q2.z);
      const [er, eg, eb] = rgb(P.e), [ar_, ag, ab] = rgb(P.acc);
      for (const q of quads) {
        const t = Math.min(1, q.r);
        ctx.fillStyle = `rgba(${ar_ + (er - ar_) * t | 0},${ag + (eg - ag) * t | 0},${ab + (eb - ab) * t | 0},${0.55 + 0.4 * t})`;
        ctx.beginPath(); ctx.moveTo(q.p[0][0], q.p[0][1]); for (let k = 1; k < 4; k++) ctx.lineTo(q.p[k][0], q.p[k][1]); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = alpha(P.panel, 0.35); ctx.lineWidth = 0.5; ctx.stroke();
      }
      // axes
      const ax = (x: number, y: number, z: number, lab: string) => { const [x0, y0] = cam.project(0, 0, 0), [x1, y1] = cam.project(x, y, z); ctx.strokeStyle = P.faint; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.fillStyle = P.faint; ctx.font = '11px ui-sans-serif, system-ui'; ctx.fillText(lab, x1 + 3, y1); };
      ax(1.25, 0, 0, 'array axis'); ax(0, 1.25, 0, 'broadside');
    }
  };
  loop = new Loop(draw, cw.canvas);

  const update = () => {
    const a0 = steeringAngle(st.d, st.beta);
    ro.set('steer', Number.isFinite(a0) ? `${(a0 / DEG).toFixed(1)}°` : 'none visible', Number.isFinite(a0) ? undefined : 'badv');
    // numeric pattern metrics in the plane (−90…90° from broadside)
    const M = 7200;
    const v = new Float64Array(M + 1);
    let mx = 0, im = 0;
    for (let i = 0; i <= M; i++) { const phi = -Math.PI / 2 + (i / M) * Math.PI; v[i] = pat(phi); if (v[i] > mx) { mx = v[i]; im = i; } }
    let a = im, b = im;
    const thr = mx / Math.SQRT2;
    while (a > 0 && v[a] > thr) a--;
    while (b < M && v[b] > thr) b++;
    ro.set('hp', `${(((b - a) / M) * 180).toFixed(1)}°`);
    // first sidelobe: highest local max outside the main lobe nulls
    let lo = im, hi = im;
    while (lo > 0 && v[lo - 1] < v[lo]) lo--;
    while (hi < M && v[hi + 1] < v[hi]) hi++;
    let sl = 0;
    for (let i = 1; i < M; i++) if ((i < lo || i > hi) && v[i] >= v[i - 1] && v[i] >= v[i + 1]) sl = Math.max(sl, v[i]);
    ro.set('sll', sl > 0 ? `${(20 * Math.log10(sl / mx)).toFixed(1)} dB` : '—');
    const L = lobes();
    const ng = Math.max(0, L.length - (Number.isFinite(a0) ? 1 : 0));
    ro.set('gl', ng ? `${ng} visible` : 'none', ng ? 'badv' : 'good');
    // directivity: D = 4π U_max / ∮ U dΩ (rotational symmetry only for isotropic elements)
    let num = 0, umax = 0;
    const NT = 360, NA = st.elem === 'cos' ? 72 : 1;
    for (let i = 0; i < NT; i++) {
      const th = ((i + 0.5) / NT) * Math.PI;
      for (let j = 0; j < NA; j++) {
        const al = ((j + 0.5) / NA) * 2 * Math.PI;
        const e = st.elem === 'cos' ? Math.max(0, Math.sin(th) * Math.cos(al)) : 1;
        const u = (afFromPsi(st.N, kd() * Math.cos(th) + st.beta) * e) ** 2;
        num += u * Math.sin(th);
        umax = Math.max(umax, u);
      }
    }
    num *= (Math.PI / NT) * ((2 * Math.PI) / NA);
    const Dl = (4 * Math.PI * umax) / num;
    ro.set('D', `${(10 * Math.log10(Dl)).toFixed(2)} dBi`);
    const s0 = Number.isFinite(a0) ? Math.abs(Math.sin(a0)) : 1;
    ro.set('dmax', `${(1 / (1 + s0)).toFixed(3)} λ`, st.d < 1 / (1 + s0) ? 'good' : 'warnv');
    dirty = true;
    loop?.request();
  };

  const sN = slider({ id: 'n', label: 'Elements N', min: 2, max: 32, step: 1, value: st.N, fmt: (v) => v.toFixed(0), onInput: (v) => { st.N = Math.round(v); update(); } });
  const sD = slider({ id: 'd', label: 'Spacing d/λ', min: 0.1, max: 2, step: 0.01, value: st.d, fmt: (v) => v.toFixed(2), onInput: (v) => { const a0 = steeringAngle(st.d, st.beta); st.d = v; if (lockSteer && Number.isFinite(a0)) { st.beta = phaseForSteer(v, a0); sB.set(st.beta / DEG); } update(); } });
  const sB = slider({ id: 'beta', label: 'Progressive phase β', min: -360, max: 360, step: 1, value: 0, fmt: (v) => `${v.toFixed(0)}°`, onInput: (v) => { st.beta = v * DEG; const a0 = steeringAngle(st.d, st.beta); if (Number.isFinite(a0)) sSteer.set(a0 / DEG); update(); } });
  const sSteer = slider({ id: 'steer', label: 'Steer to φ0 (sets β)', min: -90, max: 90, step: 0.5, value: 0, fmt: (v) => `${v.toFixed(1)}°`, onInput: (v) => { st.beta = phaseForSteer(st.d, v * DEG); sB.set(st.beta / DEG); update(); } });
  let lockSteer = true;
  const tLock = toggle({ id: 'lock', label: 'Keep φ0 fixed when changing d', value: true, onChange: (v) => { lockSteer = v; } });
  const elSeg = segmented<Elem>({ id: 'elem', label: 'Element pattern', value: 'iso', options: [{ value: 'iso', label: 'Isotropic' }, { value: 'cos', label: 'cos φ (patch-like, front only)' }], onChange: (v) => { st.elem = v; update(); } });
  const tdB = toggle({ id: 'db', label: 'Patterns in dB', value: true, onChange: (v) => { st.db = v; loop?.request(); } });
  controls.append(el('div', { class: 'seg' }, playButton(loop)), sN.el, sD.el, sSteer.el, sB.el, tLock.el, elSeg.el, tdB.el,
    el('small', { class: 'muted' }, 'φ is measured from broadside; Balanis’ θ (from the array axis) is 90° − φ. The wave picture uses 2-D line sources, which have the same in-plane pattern as the array factor.'));

  const eqs = equationsSection(eqFor('array'), focusControl);
  after.append(notice([
    '<b>The array factor is a periodic function of ψ</b>, and the real world only shows you a window of it, 2kd wide and centred on β. Steering slides the window; spacing widens it. Once a second 2π peak gets inside the window, you have a grating lobe.',
    '<b>The rule of thumb d < λ/(1 + |sin φ0|)</b> falls straight out of that picture. At broadside you can go almost to λ; to scan to 60° you need about 0.54λ or less.',
    '<b>The beam broadens as you scan</b>, roughly as 1/cos φ0, because the array’s projected length shrinks.',
    '<b>Uniform weighting pins the first sidelobe near −13 dB</b> (−12.8 dB at N = 8, tending to −13.26 dB for large N). Adding elements narrows the beam but does not lower it; only tapering (Dolph–Chebyshev, Taylor) does, at the cost of a wider beam.',
    '<b>Pattern multiplication</b>: switch to the cos φ element and the back lobe disappears, while end-fire grating lobes are suppressed by the element pattern.',
  ]), eqs.el);
  update();
  return () => { loop?.destroy(); SW.destroy(); SP.destroy(); SS.destroy(); S3.destroy(); undrag(); eqs.destroy(); };
}
