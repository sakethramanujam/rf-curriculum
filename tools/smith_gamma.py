#!/usr/bin/env python3
"""Smith-chart arithmetic: Gamma, VSWR, return loss, and input impedance.

Examples:
    python tools/smith_gamma.py --z 100+50j --z0 50
    python tools/smith_gamma.py --gamma 0.4+0.2j --z0 50
    python tools/smith_gamma.py --z 75 --z0 50 --length-deg 90
    python tools/smith_gamma.py --self-test
"""

from __future__ import annotations

import argparse
import cmath
import math
import sys


def parse_complex(text: str) -> complex:
    s = text.strip().lower().replace(" ", "").replace("i", "j")
    if s and s[-1] not in "j" and "+" not in s[1:] and "-" not in s[1:]:
        return complex(float(s), 0.0)
    return complex(s)


def gamma_from_z(zl: complex, z0: float) -> complex:
    return (zl - z0) / (zl + z0)


def z_from_gamma(gamma: complex, z0: float) -> complex:
    return z0 * (1 + gamma) / (1 - gamma)


def vswr(gamma: complex) -> float:
    mag = abs(gamma)
    if mag >= 1 - 1e-15:
        return math.inf
    return (1 + mag) / (1 - mag)


def return_loss_db(gamma: complex) -> float:
    mag = abs(gamma)
    if mag <= 0:
        return math.inf
    return -20.0 * math.log10(mag)


def mismatch_loss_db(gamma: complex) -> float:
    """Available-power loss due to reflection, -10 log10(1-|Γ|^2)."""
    p = 1.0 - abs(gamma) ** 2
    if p <= 0:
        return math.inf
    return -10.0 * math.log10(p)


def zin_at_electrical_length(zl: complex, z0: float, length_deg: float) -> complex:
    """Lossless line: Zin(ℓ) looking toward ZL, electrical length in degrees."""
    bl = math.radians(length_deg)
    t = 1j * math.tan(bl)
    return z0 * (zl + z0 * t) / (z0 + zl * t)


def rotate_gamma(gamma: complex, length_deg: float) -> complex:
    """Toward the generator on a lossless line: Γ(ℓ) = ΓL exp(-j 2 βℓ)."""
    return gamma * cmath.exp(-1j * 2 * math.radians(length_deg))


def report(zl: complex, z0: float, gamma: complex, length_deg: float | None) -> None:
    mag = abs(gamma)
    ang = math.degrees(cmath.phase(gamma))
    print(f"Z0          = {z0:.6g} ohm")
    sign = "+" if zl.imag >= 0 else "-"
    print(f"ZL          = {zl.real:.6g} {sign} j{abs(zl.imag):.6g} ohm")
    z_norm = zl / z0
    ss = "+" if z_norm.imag >= 0 else "-"
    print(f"z = ZL/Z0   = {z_norm.real:.6g} {ss} j{abs(z_norm.imag):.6g}")
    sg = "+" if gamma.imag >= 0 else "-"
    print(f"Gamma       = {gamma.real:.6g} {sg} j{abs(gamma.imag):.6g}")
    print(f"|Gamma|     = {mag:.6g}")
    print(f"ang(Gamma)  = {ang:.4f} deg")
    print(f"VSWR        = {vswr(gamma):.6g}")
    rl = return_loss_db(gamma)
    print(f"Return loss = {rl:.4f} dB" if math.isfinite(rl) else "Return loss = inf dB")
    ml = mismatch_loss_db(gamma)
    print(f"Mismatch    = {ml:.4f} dB" if math.isfinite(ml) else "Mismatch    = inf dB")
    print(f"|Gamma|^2   = {mag**2:.6g}  (reflected power fraction)")
    if length_deg is not None:
        zin = zin_at_electrical_length(zl, z0, length_deg)
        g_in = rotate_gamma(gamma, length_deg)
        print(f"At ℓ = {length_deg:g} deg toward generator:")
        sz = "+" if zin.imag >= 0 else "-"
        print(f"  Zin       = {zin.real:.6g} {sz} j{abs(zin.imag):.6g} ohm")
        sgi = "+" if g_in.imag >= 0 else "-"
        print(f"  Gamma_in  = {g_in.real:.6g} {sgi} j{abs(g_in.imag):.6g}")
        print(f"  |Gamma_in|= {abs(g_in):.6g}")


def self_test() -> int:
    z0 = 50.0
    zl = 100 + 50j
    g = gamma_from_z(zl, z0)
    assert abs(g - (0.4 + 0.2j)) < 1e-12, g
    assert abs(z_from_gamma(g, z0) - zl) < 1e-12
    mag = abs(g)
    assert abs(mag - math.sqrt(0.2)) < 1e-12
    assert abs(vswr(g) - (1 + mag) / (1 - mag)) < 1e-12
    # Quarter-wave inversion: 200 ohm through 50-ohm, 90-deg line -> 12.5 ohm.
    zin = zin_at_electrical_length(200, 50, 90)
    assert abs(zin.real - 12.5) < 1e-9 and abs(zin.imag) < 1e-9, zin
    # Open circuit a quarter-wave away looks like a short.
    zin_oc = zin_at_electrical_length(1e18, 50, 90)
    assert abs(zin_oc) < 1e-6, zin_oc
    print("smith_gamma.py self-test: PASS")
    return 0


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Gamma / VSWR / Smith-chart calculator")
    p.add_argument("--z", help="load impedance, e.g. 100+50j")
    p.add_argument("--gamma", help="reflection coefficient, e.g. 0.4+0.2j")
    p.add_argument("--z0", type=float, default=50.0, help="reference impedance (ohm)")
    p.add_argument("--length-deg", type=float, default=None,
                   help="lossless electrical length toward generator, degrees")
    p.add_argument("--self-test", action="store_true")
    args = p.parse_args(argv)

    if args.self_test:
        return self_test()
    if (args.z is None) == (args.gamma is None):
        p.error("provide exactly one of --z or --gamma (or use --self-test)")

    z0 = args.z0
    if args.z is not None:
        zl = parse_complex(args.z)
        gamma = gamma_from_z(zl, z0)
    else:
        gamma = parse_complex(args.gamma)
        zl = z_from_gamma(gamma, z0)
    report(zl, z0, gamma, args.length_deg)
    return 0


if __name__ == "__main__":
    sys.exit(main())
