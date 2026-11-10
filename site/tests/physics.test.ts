import { describe, it, expect } from 'vitest';
import { c, abs, arg, add, div, mul } from '../src/lib/complex';
import * as P from '../src/lib/physics';

const close = (a: number, b: number, tol = 1e-9) => expect(Math.abs(a - b)).toBeLessThanOrEqual(tol);
const closeC = (a: { re: number; im: number }, b: { re: number; im: number }, tol = 1e-9) => {
  close(a.re, b.re, tol);
  close(a.im, b.im, tol);
};

describe('reflection coefficient Γ', () => {
  it('handles the canonical loads', () => {
    closeC(P.gamma(c(50), 50), c(0));
    closeC(P.gamma(c(0), 50), c(-1));
    closeC(P.gamma(c(Infinity), 50), c(1));
    closeC(P.gamma(c(0, 50), 50), c(0, 1)); // pure reactance: |Γ| = 1
  });
  it('matches a hand calculation for 100 + j50 Ω on 50 Ω', () => {
    // (50 + j50)/(150 + j50) = (0.4 + j0.2)
    closeC(P.gamma(c(100, 50), 50), c(0.4, 0.2), 1e-12);
  });
  it('round-trips through zFromGamma', () => {
    const z = c(23, -71);
    closeC(P.zFromGamma(P.gamma(z, 75), 75), z, 1e-9);
  });
});

describe('VSWR and return loss', () => {
  it('VSWR from |Γ|', () => {
    close(P.vswr(0), 1);
    close(P.vswr(1 / 3), 2);
    expect(P.vswr(c(0.6, 0.8))).toBe(Infinity);
    expect(P.vswr(1)).toBe(Infinity);
  });
  it('RL for |Γ| = 0.316 is ≈ 10 dB and VSWR ≈ 1.92', () => {
    close(P.returnLossDb(10 ** (-10 / 20)), 10, 1e-9);
    close(P.vswr(10 ** (-10 / 20)), 1.9249, 1e-4);
  });
  it('standing-wave max/min ratio equals the VSWR', () => {
    const gl = P.gamma(c(30, 40), 50);
    let mx = 0, mn = Infinity;
    for (let i = 0; i <= 2000; i++) {
      const v = P.standingWave(gl, (i / 2000) * 0.5);
      mx = Math.max(mx, v);
      mn = Math.min(mn, v);
    }
    close(mx / mn, P.vswr(gl), 1e-4);
    close(P.standingWave(gl, P.firstVmax(gl)), 1 + abs(gl), 1e-9);
  });
});

describe('input impedance of a terminated lossless line', () => {
  it('agrees with the tan βℓ form', () => {
    for (const l of [0.01, 0.1, 0.2, 0.33, 0.49]) {
      closeC(P.zin(c(100, 50), 50, l), P.zinTan(c(100, 50), 50, l), 1e-8);
    }
  });
  it('quarter-wave transformer: Zin = Z0²/ZL', () => {
    closeC(P.zin(c(100), 50, 0.25), c(25), 1e-9);
    closeC(P.zin(c(25, 25), 50, 0.25), div(c(2500), c(25, 25)), 1e-9);
  });
  it('half wave repeats the load; short and open stubs are pure reactances', () => {
    closeC(P.zin(c(73, 42), 50, 0.5), c(73, 42), 1e-9);
    closeC(P.zin(c(0), 50, 0.125), c(0, 50), 1e-9); // jZ0 tan(π/4)
    closeC(P.zin(c(Infinity), 50, 0.125), c(0, -50), 1e-9); // −jZ0 cot(π/4)
  });
});

describe('matching networks', () => {
  for (const zl of [c(200, -100), c(100, 80), c(20, 30), c(10, -15)]) {
    it(`L-section matches ${zl.re}${zl.im >= 0 ? '+' : ''}${zl.im}j to 50 Ω`, () => {
      const sols = P.lMatch(zl, 50);
      expect(sols.length).toBe(2);
      for (const s of sols) closeC(P.applyL(zl, s), c(50), 1e-8);
    });
    it(`single shunt stub matches ${zl.re}${zl.im >= 0 ? '+' : ''}${zl.im}j`, () => {
      const z0 = 50;
      for (const s of P.shuntStub(zl, z0)) {
        const yd = div(c(1), P.zin(zl, z0, s.d));
        close(yd.re, 1 / z0, 1e-9);
        close(yd.im, s.B, 1e-9);
        const yOpen = div(c(1), P.zin(c(Infinity), z0, s.lOpen));
        const yShort = div(c(1), P.zin(c(0), z0, s.lShort));
        closeC(add(yd, yOpen), c(1 / z0), 1e-9);
        closeC(add(yd, yShort), c(1 / z0), 1e-9);
      }
    });
  }
});

describe('S-parameters', () => {
  it('series impedance: S11 = Z/(Z + 2Z0), S21 = 2Z0/(Z + 2Z0)', () => {
    const z = c(30, 40);
    const s = P.abcdToS(P.abcdSeries(z), 50);
    closeC(s.s11, div(z, add(z, c(100))), 1e-12);
    closeC(s.s21, div(c(100), add(z, c(100))), 1e-12);
    closeC(s.s12, s.s21, 1e-12);
  });
  it('lossless network is unitary: |S11|² + |S21|² = 1', () => {
    const s = P.abcdToS(P.abcdLine(80, 1.1), 50);
    close(abs(s.s11) ** 2 + abs(s.s21) ** 2, 1, 1e-12);
  });
  it('Γin reduces to S11 for a matched load', () => {
    const s = P.abcdToS(P.abcdShunt(c(0.01, -0.02)), 50);
    closeC(P.gammaIn(s, c(0)), s.s11);
  });
});

describe('waveguide cutoff and dispersion', () => {
  const a = 22.86e-3, b = 10.16e-3; // WR-90
  it('WR-90 TE10 cutoff ≈ 6.557 GHz, TE20 ≈ 13.11 GHz', () => {
    close(P.waveguideCutoff(a, b, 1, 0) / 1e9, 6.5571, 1e-3);
    close(P.waveguideCutoff(a, b, 2, 0) / 1e9, 13.114, 1e-3);
  });
  it('TE11 and TM11 share a cutoff ≈ 16.15 GHz', () => {
    close(P.waveguideCutoff(a, b, 1, 1) / 1e9, 16.145, 2e-3);
  });
  it('WR-3.4 TE10 cutoff ≈ 173.5 GHz', () => {
    close(P.waveguideCutoff(0.864e-3, 0.432e-3, 1, 0) / 1e9, 173.49, 0.05);
  });
  it('vp·vg = c² and below cutoff the mode is evanescent', () => {
    const fc = P.waveguideCutoff(a, b, 1, 0);
    const d = P.waveguideDispersion(10e9, fc);
    close((d.vp * d.vg) / P.C0 ** 2, 1, 1e-12);
    expect(P.waveguideDispersion(5e9, fc).propagating).toBe(false);
  });
});

describe('array factor', () => {
  it('broadside peak is 1 and nulls sit at ψ = 2πk/N', () => {
    close(P.arrayFactor(8, 0.5, 0, 0), 1);
    close(P.afFromPsi(8, (2 * Math.PI) / 8), 0, 1e-12);
  });
  it('steering angle = asin(−β/(k d)) and the AF peaks there', () => {
    const d = 0.5, beta = -Math.PI / 2;
    const phi0 = P.steeringAngle(d, beta);
    close(phi0, Math.asin(-beta / (2 * Math.PI * d)), 1e-12);
    close(phi0, Math.PI / 6, 1e-12); // 30°
    close(P.arrayFactor(10, d, beta, phi0), 1, 1e-12);
    expect(P.arrayFactor(10, d, beta, phi0 + 0.05)).toBeLessThan(1);
    close(P.steeringAngle(d, P.phaseForSteer(d, 0.4)), 0.4, 1e-12);
  });
  it('Balanis (axis) and broadside conventions agree', () => {
    const th = 1.0;
    close(P.arrayFactorAxis(6, 0.7, 0.3, th), P.arrayFactor(6, 0.7, 0.3, Math.PI / 2 - th), 1e-12);
  });
  it('grating lobes appear only when d is large enough', () => {
    expect(P.gratingLobes(0.5, 0).length).toBe(1);
    expect(P.gratingLobes(1.0, 0).length).toBe(3); // broadside + both endfire directions
    expect(P.gratingLobes(0.7, P.phaseForSteer(0.7, (60 * Math.PI) / 180)).length).toBe(2);
  });
});

describe('dipole', () => {
  it('half-wave dipole: D0 ≈ 1.641 (2.15 dBi; 4/Cin(2π)), Rr ≈ 73 Ω', () => {
    const m = P.dipoleMetrics(0.5);
    close(m.D0, 4 / (m.Rr / (P.ETA0 / (4 * Math.PI))), 1e-5);
    close(m.D0, 1.641, 2e-3);
    close(m.Rr, 73.08, 0.1);
  });
});

describe('Friis, radar and noise', () => {
  it('Friis equals the dB form', () => {
    const f = 2.4e9, R = 100;
    const pr = P.friis(1, 2, 3, f, R);
    close(P.db10(pr), P.db10(2) + P.db10(3) - P.fsplDb(f, R), 1e-9);
  });
  it('FSPL at 1 GHz over 1 km ≈ 92.45 dB', () => {
    close(P.fsplDb(1e9, 1000), 92.45, 0.01);
  });
  it('radar return falls as R⁻⁴', () => {
    const a = P.radarReceived(1e3, 1000, 10e9, 1, 1e3);
    const b = P.radarReceived(1e3, 1000, 10e9, 1, 2e3);
    close(a / b, 16, 1e-9);
  });
  it('kTB at 290 K is −174 dBm/Hz', () => {
    close(P.noiseFloorDbm(1), -173.98, 0.01);
  });
});

describe('lossy media and skin depth', () => {
  it('copper at 1 GHz: δ ≈ 2.09 µm (good-conductor and exact forms agree)', () => {
    const cu = { epsR: 1, muR: 1, sigma: 5.813e7 };
    close(P.skinDepthGoodConductor(1e9, cu.sigma) * 1e6, 2.088, 2e-3);
    close(P.skinDepth(1e9, cu) / P.skinDepthGoodConductor(1e9, cu.sigma), 1, 1e-6);
  });
  it('lossless medium: α = 0, β = ω√(με), η real', () => {
    const p = P.propagation(1e9, { epsR: 4, muR: 1, sigma: 0 });
    close(p.alpha, 0, 1e-12);
    close(p.beta, (2 * Math.PI * 1e9 * 2) / P.C0, 1e-9);
    close(p.eta.re, P.ETA0 / 2, 1e-9);
    expect(P.skinDepth(1e9, { epsR: 4, muR: 1, sigma: 0 })).toBe(Infinity);
  });
  it('good conductor: η has a 45° angle', () => {
    const p = P.propagation(1e6, { epsR: 1, muR: 1, sigma: 5.8e7 });
    close((arg(p.eta) * 180) / Math.PI, 45, 1e-3);
  });
});

describe('polarisation (IEEE)', () => {
  it('classifies linear, RHCP, LHCP, elliptical', () => {
    expect(P.polarization(1, 0, 0).kind).toBe('linear');
    const r = P.polarization(1, 1, -Math.PI / 2);
    expect(r.kind).toBe('circular');
    expect(r.hand).toBe('RH');
    expect(P.polarization(1, 1, Math.PI / 2).hand).toBe('LH');
    const e = P.polarization(1, 0.5, -Math.PI / 2);
    expect(e.kind).toBe('elliptical');
    close(e.axialRatio, 2, 1e-9);
  });
});

describe('complex helpers', () => {
  it('mul/div are inverse', () => {
    const a = c(3, -4), b = c(-1, 2);
    closeC(div(mul(a, b), b), a, 1e-12);
  });
});
