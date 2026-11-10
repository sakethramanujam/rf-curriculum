/**
 * Pure physics helpers for the explorers. No DOM access, so they are unit-tested
 * in Node (tests/physics.test.ts). SI units throughout unless a name says otherwise.
 * Time convention: phasors carry e^{+jωt}; waves travel as e^{-jβz} (Pozar/Balanis).
 */
import { C, c, add, sub, mul, div, abs, arg, expj, sqrt, scale } from './complex';

export const C0 = 299_792_458; // m/s
export const MU0 = 4e-7 * Math.PI; // H/m (classic value; the 2019 SI value differs by ~1e-10)
export const EPS0 = 1 / (MU0 * C0 * C0); // F/m
export const ETA0 = MU0 * C0; // ≈ 376.73 Ω
export const KB = 1.380649e-23; // J/K
export const DEG = Math.PI / 180;

export const db10 = (x: number): number => 10 * Math.log10(x);
export const db20 = (x: number): number => 20 * Math.log10(x);
export const fromDb10 = (d: number): number => 10 ** (d / 10);
export const fromDb20 = (d: number): number => 10 ** (d / 20);
export const wavelength = (fHz: number, epsR = 1, muR = 1): number => C0 / (fHz * Math.sqrt(epsR * muR));

/* ───────────────────────── Transmission lines ───────────────────────── */

/** Load reflection coefficient Γ = (Z_L − Z0)/(Z_L + Z0). An infinite Z_L (open) gives Γ = +1. */
export function gamma(zl: C, z0: number | C = 50): C {
  const Z0 = typeof z0 === 'number' ? c(z0) : z0;
  if (!Number.isFinite(zl.re) || !Number.isFinite(zl.im)) return c(1);
  return div(sub(zl, Z0), add(zl, Z0));
}

/** Impedance seen looking into a reflection coefficient Γ on a line of impedance Z0. */
export function zFromGamma(g: C, z0 = 50): C {
  return scale(div(add(c(1), g), sub(c(1), g)), z0);
}

/** VSWR = (1+|Γ|)/(1−|Γ|). Returns Infinity for total reflection. */
export function vswr(g: C | number): number {
  const m = typeof g === 'number' ? Math.abs(g) : abs(g);
  if (m >= 1) return Infinity;
  return (1 + m) / (1 - m);
}

/** Return loss in dB, positive for a passive load: RL = −20 log10|Γ|. */
export const returnLossDb = (g: C | number): number => -db20(typeof g === 'number' ? Math.abs(g) : abs(g));

/** Γ seen a distance ℓ from the load, toward the generator: Γ(ℓ) = Γ_L e^{−j2βℓ}. ℓ in wavelengths. */
export const gammaAt = (gl: C, lOverLambda: number): C => mul(gl, expj(-4 * Math.PI * lOverLambda));

/**
 * Input impedance of a lossless line of length ℓ terminated in Z_L:
 *   Z_in = Z0 (Z_L + j Z0 tan βℓ) / (Z0 + j Z_L tan βℓ).
 * Evaluated through Γ so the tan βℓ = ∞ points (quarter wave) stay finite.
 */
export function zin(zl: C, z0: number, lOverLambda: number): C {
  return zFromGamma(gammaAt(gamma(zl, z0), lOverLambda), z0);
}

/** Same as zin but written literally with tan βℓ, used to cross-check in tests. */
export function zinTan(zl: C, z0: number, lOverLambda: number): C {
  const t = Math.tan(2 * Math.PI * lOverLambda);
  const Z0 = c(z0);
  const num = add(zl, mul(c(0, z0), c(t)));
  const den = add(Z0, mul(c(0, t), zl));
  return scale(div(num, den), z0);
}

/**
 * Normalised total voltage |V(z)|/|V0+| at distance ℓ (wavelengths) from the load:
 * |1 + Γ_L e^{−j2βℓ}|. Its max/min ratio is the VSWR.
 */
export const standingWave = (gl: C, lOverLambda: number): number => abs(add(c(1), gammaAt(gl, lOverLambda)));

/** Distance from the load (in λ) of the first voltage maximum: θ_Γ = 2βℓ_max. */
export function firstVmax(gl: C): number {
  let th = arg(gl);
  if (th < 0) th += 2 * Math.PI;
  return th / (4 * Math.PI);
}

/* ───────────────────────── Matching ───────────────────────── */

export interface LSolution {
  /** Element next to the load comes first in `order`. */
  order: 'shunt-then-series' | 'series-then-shunt';
  X: number; // series reactance, Ω
  B: number; // shunt susceptance, S
}

/**
 * Lumped L-section that matches Z_L to Z0 (two solutions when they exist).
 * If R_L > Z0 the shunt element sits next to the load; otherwise the series one does.
 */
export function lMatch(zl: C, z0: number): LSolution[] {
  const RL = zl.re;
  const XL = zl.im;
  const out: LSolution[] = [];
  if (RL <= 0) return out;
  if (RL > z0) {
    const root = Math.sqrt(RL / z0) * Math.sqrt(RL * RL + XL * XL - z0 * RL);
    for (const s of [1, -1]) {
      const B = (XL + s * root) / (RL * RL + XL * XL);
      const X = 1 / B + (XL * z0) / RL - z0 / (B * RL);
      out.push({ order: 'shunt-then-series', X, B });
    }
  } else {
    const root = Math.sqrt(RL * (z0 - RL));
    for (const s of [1, -1]) {
      const X = s * root - XL;
      const B = (s * Math.sqrt((z0 - RL) / RL)) / z0;
      out.push({ order: 'series-then-shunt', X, B });
    }
  }
  return out;
}

/** Apply an L-section and return the impedance looking into it from the source side. */
export function applyL(zl: C, s: LSolution): C {
  const series = (z: C) => add(z, c(0, s.X));
  const shunt = (z: C) => div(c(1), add(div(c(1), z), c(0, s.B)));
  return s.order === 'shunt-then-series' ? series(shunt(zl)) : shunt(series(zl));
}

export interface StubSolution {
  d: number; // stub position from load, λ
  B: number; // line susceptance to cancel at d, S (the stub supplies −B)
  lOpen: number; // open-circuited stub length, λ
  lShort: number; // short-circuited stub length, λ
}

/** Single shunt-stub tuner: stub position d and stub length for open or short stubs. */
export function shuntStub(zl: C, z0: number): StubSolution[] {
  const RL = zl.re;
  const XL = zl.im;
  const ts: number[] = [];
  if (Math.abs(RL - z0) < 1e-12) {
    ts.push(-XL / (2 * z0));
  } else {
    const r = Math.sqrt((RL * ((z0 - RL) ** 2 + XL * XL)) / z0);
    ts.push((XL + r) / (RL - z0), (XL - r) / (RL - z0));
  }
  const wrap = (x: number) => ((x % 0.5) + 0.5) % 0.5;
  return ts.map((t) => {
    const d = wrap(Math.atan(t) / (2 * Math.PI));
    const B = (RL * RL * t - (z0 - XL * t) * (XL + z0 * t)) / (z0 * (RL * RL + (XL + z0 * t) ** 2));
    const Y0 = 1 / z0;
    // The stub must present −jB. Open stub: jY0 tan βl; short stub: −jY0 cot βl.
    const lOpen = wrap(Math.atan(-B / Y0) / (2 * Math.PI));
    const lShort = wrap(Math.atan(Y0 / B) / (2 * Math.PI));
    return { d, B, lOpen, lShort };
  });
}

/* ───────────────────────── Two-ports ───────────────────────── */

export interface ABCD {
  A: C;
  B: C;
  C: C;
  D: C;
}
export interface S2 {
  s11: C;
  s12: C;
  s21: C;
  s22: C;
}

export const abcdSeries = (z: C): ABCD => ({ A: c(1), B: z, C: c(0), D: c(1) });
export const abcdShunt = (y: C): ABCD => ({ A: c(1), B: c(0), C: y, D: c(1) });
export function abcdLine(z1: number, thetaRad: number): ABCD {
  return {
    A: c(Math.cos(thetaRad)),
    B: c(0, z1 * Math.sin(thetaRad)),
    C: c(0, Math.sin(thetaRad) / z1),
    D: c(Math.cos(thetaRad)),
  };
}

/** ABCD → S for equal real reference impedances Z0 at both ports. */
export function abcdToS(m: ABCD, z0 = 50): S2 {
  const Bz = scale(m.B, 1 / z0);
  const Cz = scale(m.C, z0);
  const den = add(add(m.A, Bz), add(Cz, m.D));
  return {
    s11: div(sub(add(m.A, Bz), add(Cz, m.D)), den),
    s12: div(scale(sub(mul(m.A, m.D), mul(m.B, m.C)), 2), den),
    s21: div(c(2), den),
    s22: div(sub(add(scale(m.A, -1), Bz), sub(Cz, m.D)), den),
  };
}

/** Γ_in = S11 + S12 S21 Γ_L / (1 − S22 Γ_L). */
export function gammaIn(s: S2, gl: C): C {
  return add(s.s11, div(mul(mul(s.s12, s.s21), gl), sub(c(1), mul(s.s22, gl))));
}

/* ───────────────────────── Plane waves ───────────────────────── */

export interface Medium {
  epsR: number;
  muR: number;
  sigma: number; // S/m
}

/** Complex propagation constant γ = α + jβ = jω√(μ ε_c), ε_c = ε − jσ/ω. */
export function propagation(fHz: number, m: Medium): { alpha: number; beta: number; eta: C } {
  const w = 2 * Math.PI * fHz;
  const mu = MU0 * m.muR;
  const epsC = c(EPS0 * m.epsR, -m.sigma / w);
  const g = mul(c(0, w), sqrt(scale(epsC, mu)));
  const eta = sqrt(div(c(0, w * mu), c(m.sigma, w * EPS0 * m.epsR)));
  return { alpha: Math.abs(g.re), beta: Math.abs(g.im), eta };
}

/** Exact skin depth δ = 1/α for any lossy medium. */
export function skinDepth(fHz: number, m: Medium): number {
  const { alpha } = propagation(fHz, m);
  return alpha === 0 ? Infinity : 1 / alpha;
}

/** Good-conductor skin depth δ ≈ √(2/(ωμσ)). */
export const skinDepthGoodConductor = (fHz: number, sigma: number, muR = 1): number =>
  Math.sqrt(2 / (2 * Math.PI * fHz * MU0 * muR * sigma));

export const lossTangent = (fHz: number, m: Medium): number => m.sigma / (2 * Math.PI * fHz * EPS0 * m.epsR);

/**
 * Polarisation of E = x̂ Ax cos(ωt−kz) + ŷ Ay cos(ωt−kz+δ) travelling +z, IEEE convention
 * (RH = clockwise when viewed from behind, looking along +z).
 */
export function polarization(ax: number, ay: number, deltaRad: number): {
  kind: 'linear' | 'circular' | 'elliptical';
  hand: 'RH' | 'LH' | null;
  axialRatio: number;
  tiltRad: number;
} {
  const s = Math.sin(deltaRad);
  const eps = 1e-9;
  // Stokes parameters give axial ratio and tilt robustly.
  const S0 = ax * ax + ay * ay;
  const S1 = ax * ax - ay * ay;
  const S2 = 2 * ax * ay * Math.cos(deltaRad);
  const S3 = 2 * ax * ay * s;
  const chi = 0.5 * Math.asin(Math.max(-1, Math.min(1, S3 / (S0 || 1))));
  const tilt = 0.5 * Math.atan2(S2, S1);
  const ar = Math.abs(Math.tan(chi)) < eps ? Infinity : 1 / Math.abs(Math.tan(chi));
  let kind: 'linear' | 'circular' | 'elliptical' = 'elliptical';
  if (ax < eps || ay < eps || Math.abs(s) < 1e-6) kind = 'linear';
  else if (Math.abs(ar - 1) < 1e-3) kind = 'circular';
  const hand = kind === 'linear' ? null : s < 0 ? 'RH' : 'LH';
  return { kind, hand, axialRatio: ar, tiltRad: tilt };
}

/* ───────────────────────── Waveguides ───────────────────────── */

/** Rectangular guide cutoff: f_c,mn = 1/(2π√(με)) √((mπ/a)² + (nπ/b)²). a, b in metres. */
export function waveguideCutoff(a: number, b: number, m: number, n: number, epsR = 1, muR = 1): number {
  return (C0 / (2 * Math.sqrt(epsR * muR))) * Math.sqrt((m / a) ** 2 + (n / b) ** 2);
}

/** β, phase and group velocity, guide wavelength. Returns α (Np/m) below cutoff instead. */
export function waveguideDispersion(fHz: number, fc: number, epsR = 1, muR = 1) {
  const v = C0 / Math.sqrt(epsR * muR);
  const k = (2 * Math.PI * fHz) / v;
  const kc = (2 * Math.PI * fc) / v;
  if (fHz > fc) {
    const beta = Math.sqrt(k * k - kc * kc);
    const r = Math.sqrt(1 - (fc / fHz) ** 2);
    return { propagating: true, beta, alpha: 0, vp: v / r, vg: v * r, lambdaG: (2 * Math.PI) / beta };
  }
  const alpha = Math.sqrt(kc * kc - k * k);
  return { propagating: false, beta: 0, alpha, vp: Infinity, vg: 0, lambdaG: Infinity };
}

export type ModeKind = 'TE' | 'TM';
export interface Mode {
  kind: ModeKind;
  m: number;
  n: number;
}

/**
 * Transverse field shapes (unnormalised, real amplitude at one instant) at (x, y)
 * in an a×b guide. Pozar Table 3.2 forms with common factors dropped.
 */
export function modeFields(mode: Mode, a: number, b: number, x: number, y: number) {
  const { m, n } = mode;
  const kx = (m * Math.PI) / a;
  const ky = (n * Math.PI) / b;
  const cx = Math.cos(kx * x), sx = Math.sin(kx * x);
  const cy = Math.cos(ky * y), sy = Math.sin(ky * y);
  if (mode.kind === 'TE') {
    const Ex = ky * cx * sy;
    const Ey = -kx * sx * cy;
    return { Ex, Ey, Hx: -Ey, Hy: Ex, Ez: 0, Hz: cx * cy };
  }
  const Ex = kx * cx * sy;
  const Ey = ky * sx * cy;
  return { Ex, Ey, Hx: -Ey, Hy: Ex, Ez: sx * sy, Hz: 0 };
}

/* ───────────────────────── Antennas ───────────────────────── */

/**
 * Normalised far-field |E_θ| shape of a centre-fed thin dipole of length L (in λ),
 * sinusoidal current: [cos(kL/2 cosθ) − cos(kL/2)] / sinθ.
 */
export function dipoleField(LOverLambda: number, theta: number): number {
  const kl2 = Math.PI * LOverLambda;
  const s = Math.sin(theta);
  if (Math.abs(s) < 1e-9) return 0;
  return (Math.cos(kl2 * Math.cos(theta)) - Math.cos(kl2)) / s;
}

/** Directivity D0 and radiation resistance (referred to the current maximum) by numeric integration. */
export function dipoleMetrics(LOverLambda: number, steps = 4000) {
  let integral = 0; // ∫ F(θ) sinθ dθ, F = field² (field already carries 1/sinθ)
  let fmax = 0;
  for (let i = 0; i < steps; i++) {
    const th = ((i + 0.5) / steps) * Math.PI;
    const f = dipoleField(LOverLambda, th) ** 2;
    integral += f * Math.sin(th);
    if (f > fmax) fmax = f;
  }
  const dth = Math.PI / steps;
  integral *= dth;
  // Prad = η|I0|²/(4π) ∫ F sinθ dθ, and Rr = 2 Prad / |I0|².
  const Rr = (ETA0 / (2 * Math.PI)) * integral;
  const D0 = (2 * fmax) / integral;
  return { D0, Rr };
}

/** Uniform linear array, normalised |AF| for phase difference ψ between neighbours. */
export function afFromPsi(N: number, psi: number): number {
  const den = N * Math.sin(psi / 2);
  if (Math.abs(den) < 1e-12) return 1;
  return Math.abs(Math.sin((N * psi) / 2) / den);
}

/**
 * Array factor with angle φ measured from broadside (array along x):
 *   ψ = k d sinφ + β.  d in wavelengths, β in radians.
 */
export function arrayFactor(N: number, dOverLambda: number, betaRad: number, phiFromBroadside: number): number {
  const psi = 2 * Math.PI * dOverLambda * Math.sin(phiFromBroadside) + betaRad;
  return afFromPsi(N, psi);
}

/** Balanis convention: θ from the array axis, ψ = k d cosθ + β. */
export function arrayFactorAxis(N: number, dOverLambda: number, betaRad: number, thetaFromAxis: number): number {
  return afFromPsi(N, 2 * Math.PI * dOverLambda * Math.cos(thetaFromAxis) + betaRad);
}

/** Main-beam direction from broadside: sinφ0 = −β/(k d). NaN if no visible main beam. */
export function steeringAngle(dOverLambda: number, betaRad: number): number {
  const s = -betaRad / (2 * Math.PI * dOverLambda);
  return Math.abs(s) <= 1 ? Math.asin(s) : NaN;
}

/** Progressive phase needed to steer to φ0 from broadside: β = −k d sinφ0. */
export const phaseForSteer = (dOverLambda: number, phi0: number): number =>
  -2 * Math.PI * dOverLambda * Math.sin(phi0);

/** All visible full-height lobes (main + grating), angles from broadside. */
export function gratingLobes(dOverLambda: number, betaRad: number): number[] {
  const kd = 2 * Math.PI * dOverLambda;
  const out: number[] = [];
  const mMax = Math.ceil(kd / (2 * Math.PI)) + 2;
  for (let m = -mMax; m <= mMax; m++) {
    const s = (2 * Math.PI * m - betaRad) / kd;
    if (Math.abs(s) <= 1 + 1e-12) out.push(Math.asin(Math.max(-1, Math.min(1, s))));
  }
  return out.sort((p, q) => p - q);
}

/* ───────────────────────── Links ───────────────────────── */

/** Friis: P_r = P_t G_t G_r (λ/4πR)². Linear units. */
export function friis(pt: number, gt: number, gr: number, fHz: number, R: number): number {
  const lam = C0 / fHz;
  return pt * gt * gr * (lam / (4 * Math.PI * R)) ** 2;
}

/** Free-space path loss in dB: 20 log10(4πR/λ). */
export const fsplDb = (fHz: number, R: number): number => db20((4 * Math.PI * R * fHz) / C0);

/** Monostatic radar: P_r = P_t G² λ² σ / ((4π)³ R⁴). */
export function radarReceived(pt: number, g: number, fHz: number, sigma: number, R: number): number {
  const lam = C0 / fHz;
  return (pt * g * g * lam * lam * sigma) / ((4 * Math.PI) ** 3 * R ** 4);
}

/** Thermal noise floor in dBm: 10log10(kTB) + 30 + NF. */
export const noiseFloorDbm = (bwHz: number, nfDb = 0, T = 290): number => db10(KB * T * bwHz) + 30 + nfDb;

export { c as complex };
export type { C };
