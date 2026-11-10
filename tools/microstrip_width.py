#!/usr/bin/env python3
"""Microstrip width synthesizer and analyzer (Hammerstad / Wheeler style).

Closed-form synthesis of W/h from Z0 and εr, plus the effective dielectric
constant and guided wavelength. Conductor thickness is neglected (t = 0).

Examples:
    python tools/microstrip_width.py --z0 50 --er 3.66 --h-mm 0.203
    python tools/microstrip_width.py --w-mm 0.4 --er 3.66 --h-mm 0.203
    python tools/microstrip_width.py --self-test
"""

from __future__ import annotations

import argparse
import math
import sys

C0 = 2.99792458e8  # m/s, vacuum speed of light
ETA0 = 376.730313461  # ohm, free-space impedance


def effective_er(er: float, wh: float) -> float:
    """Hammerstad effective permittivity, zero thickness."""
    return (er + 1.0) / 2.0 + (er - 1.0) / 2.0 * (1.0 / math.sqrt(1.0 + 12.0 / wh))


def z0_from_wh(er: float, wh: float) -> float:
    """Characteristic impedance of a zero-thickness microstrip (Hammerstad)."""
    eeff = effective_er(er, wh)
    if wh <= 1.0:
        return (ETA0 / (2 * math.pi * math.sqrt(eeff))) * math.log(8.0 / wh + 0.25 * wh)
    return (ETA0 / math.sqrt(eeff)) / (wh + 1.393 + 0.667 * math.log(wh + 1.444))


def synthesize_wh(z0: float, er: float) -> float:
    """W/h from Z0, εr. Pozar / Hammerstad-Jensen synthesis, t = 0."""
    a = (z0 / 60.0) * math.sqrt((er + 1.0) / 2.0) + (
        (er - 1.0) / (er + 1.0)
    ) * (0.23 + 0.11 / er)
    wh_narrow = (8.0 * math.exp(a)) / (math.exp(2.0 * a) - 2.0)
    if wh_narrow <= 2.0:
        return wh_narrow
    b = 377.0 * math.pi / (2.0 * z0 * math.sqrt(er))
    return (2.0 / math.pi) * (
        b
        - 1.0
        - math.log(2.0 * b - 1.0)
        + ((er - 1.0) / (2.0 * er)) * (math.log(b - 1.0) + 0.39 - 0.61 / er)
    )


def guided_wavelength(freq_hz: float, eeff: float) -> float:
    return C0 / (freq_hz * math.sqrt(eeff))


def self_test() -> int:
    # 50 ohm on Rogers 4350B-ish, εr=3.66, h=8 mil = 0.2032 mm.
    # Synthesis and analysis should close to within about 1 ohm.
    er, z0_target, h_m = 3.66, 50.0, 0.2032e-3
    wh = synthesize_wh(z0_target, er)
    z0 = z0_from_wh(er, wh)
    assert abs(z0 - z0_target) < 1.0, (wh, z0)
    # Classic FR4 50-ohm rule of thumb: W is a bit under h*2 for εr~4.4.
    wh_fr4 = synthesize_wh(50.0, 4.4)
    assert 1.7 < wh_fr4 < 2.1, wh_fr4
    z0_fr4 = z0_from_wh(4.4, wh_fr4)
    assert abs(z0_fr4 - 50.0) < 1.0, z0_fr4
    # Wider line must be lower impedance.
    assert z0_from_wh(4.4, 4.0) < z0_from_wh(4.4, 1.0)
    print("microstrip_width.py self-test: PASS")
    print(f"  RO4350B 50 ohm: W/h={wh:.4f}, analysis Z0={z0:.3f} ohm, "
          f"W={wh * h_m * 1e3:.4f} mm")
    print(f"  FR4 50 ohm:     W/h={wh_fr4:.4f}, analysis Z0={z0_fr4:.3f} ohm")
    return 0


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Microstrip W/h synthesizer and analyzer")
    p.add_argument("--z0", type=float, help="target characteristic impedance (ohm)")
    p.add_argument("--w-mm", type=float, help="strip width (mm), analysis mode")
    p.add_argument("--er", type=float, required=False, help="relative permittivity")
    p.add_argument("--h-mm", type=float, required=False, help="substrate height (mm)")
    p.add_argument("--freq-ghz", type=float, default=None, help="frequency for λg")
    p.add_argument("--self-test", action="store_true")
    args = p.parse_args(argv)

    if args.self_test:
        return self_test()
    if args.er is None or args.h_mm is None:
        p.error("--er and --h-mm are required (or pass --self-test)")
    if (args.z0 is None) == (args.w_mm is None):
        p.error("provide exactly one of --z0 (synthesize) or --w-mm (analyze)")

    h_m = args.h_mm * 1e-3
    if args.z0 is not None:
        wh = synthesize_wh(args.z0, args.er)
        w_m = wh * h_m
        mode = "synthesis"
    else:
        w_m = args.w_mm * 1e-3
        wh = w_m / h_m
        mode = "analysis"

    eeff = effective_er(args.er, wh)
    z0 = z0_from_wh(args.er, wh)
    print(f"Mode        = {mode}")
    print(f"εr          = {args.er}")
    print(f"h           = {args.h_mm:g} mm")
    print(f"W           = {w_m * 1e3:.4f} mm")
    print(f"W/h         = {wh:.4f}")
    print(f"εeff        = {eeff:.4f}")
    print(f"Z0          = {z0:.3f} ohm")
    if args.freq_ghz:
        f = args.freq_ghz * 1e9
        lg = guided_wavelength(f, eeff)
        print(f"f           = {args.freq_ghz:g} GHz")
        print(f"λg          = {lg * 1e3:.4f} mm")
        print(f"λg/4        = {lg * 1e3 / 4:.4f} mm")
    return 0


if __name__ == "__main__":
    sys.exit(main())
