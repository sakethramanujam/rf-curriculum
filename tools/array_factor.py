#!/usr/bin/env python3
"""Uniform linear array factor: plot and report first-null / HPBW numbers.

AF(ψ) = sin(N ψ / 2) / sin(ψ / 2),  ψ = k d cosθ + β
(θ measured from endfire, i.e. from the array axis, the Balanis convention
used in Chapter 6. Pass --from-broadside to measure from the array normal.)

Examples:
    python tools/array_factor.py --n 8 --d 0.5 --beta 0 --out tools/output/af.png
    python tools/array_factor.py --n 8 --d 0.5 --endfire --self-test
    python tools/array_factor.py --self-test
"""

from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import numpy as np


def psi(theta_rad: np.ndarray, d_over_lambda: float, beta_rad: float) -> np.ndarray:
    kd = 2.0 * math.pi * d_over_lambda
    return kd * np.cos(theta_rad) + beta_rad


def array_factor(n: int, psi_rad: np.ndarray) -> np.ndarray:
    """Normalized so the peak of |AF| is 1. AF = 1 at ψ = 0."""
    half = n * psi_rad / 2.0
    denom = np.sin(psi_rad / 2.0)
    af = np.empty_like(psi_rad, dtype=float)
    small = np.abs(denom) < 1e-14
    af[small] = 1.0
    af[~small] = np.abs(np.sin(half[~small]) / (n * denom[~small]))
    return af


def first_nulls_theta(n: int, d_over_lambda: float, beta_rad: float) -> list[float]:
    """θ in degrees (from endfire) of the first AF nulls nearest the main beam."""
    # Nulls at ψ = ± 2π m / N, m = 1, 2, ... excluding multiples of 2π.
    kd = 2.0 * math.pi * d_over_lambda
    thetas = []
    for m in range(1, n):
        target = 2.0 * math.pi * m / n
        for sign in (+1.0, -1.0):
            c = (sign * target - beta_rad) / kd
            if -1.0 <= c <= 1.0:
                thetas.append(math.degrees(math.acos(c)))
    # Unique, sorted.
    uniq = sorted({round(t, 6) for t in thetas})
    return [float(t) for t in uniq]


def hpbw_deg(n: int, d_over_lambda: float, beta_rad: float, from_broadside: bool) -> float | None:
    """Numerical half-power beamwidth of the main lobe, in degrees of θ."""
    theta = np.linspace(0.0, math.pi, 20001)
    af = array_factor(n, psi(theta, d_over_lambda, beta_rad))
    peak_i = int(np.argmax(af))
    half = af[peak_i] / math.sqrt(2.0)
    # Walk left and right until AF drops to 1/√2.
    def walk(start: int, step: int) -> int | None:
        i = start
        while 0 <= i < len(af):
            if af[i] <= half:
                return i
            i += step
        return None

    left = walk(peak_i, -1)
    right = walk(peak_i, +1)
    if left is None or right is None:
        return None
    width = abs(theta[right] - theta[left])
    return math.degrees(width)


def self_test() -> int:
    # Broadside, N=8, d=λ/2, β=0: main beam at θ=90°, first nulls at
    # ψ = ±2π/N = ±π/4, so (π) cosθ = ±π/4 → cosθ = ±1/4 → θ = 75.522° and 104.478°.
    n, d, beta = 8, 0.5, 0.0
    nulls = first_nulls_theta(n, d, beta)
    expected = [math.degrees(math.acos(0.25)), math.degrees(math.acos(-0.25))]
    # also other m values; just check the first-null pair around 90°.
    near = [t for t in nulls if 70 < t < 110]
    assert len(near) == 2, near
    assert abs(near[0] - expected[0]) < 0.02
    assert abs(near[1] - expected[1]) < 0.02
    # Ordinary endfire: β = -kd, beam at θ=0.
    beta_ef = -2.0 * math.pi * d
    th = np.linspace(0, math.pi, 4001)
    af = array_factor(n, psi(th, d, beta_ef))
    assert abs(th[int(np.argmax(af))] ) < math.radians(2)
    # AF(0) = 1 for broadside at θ=90°.
    af90 = array_factor(n, psi(np.array([math.pi / 2]), d, 0.0))[0]
    assert abs(af90 - 1.0) < 1e-9
    print("array_factor.py self-test: PASS")
    print(f"  N=8, d=λ/2 broadside first nulls near 90°: {near[0]:.3f}° and {near[1]:.3f}°")
    hpbw = hpbw_deg(n, d, 0.0, from_broadside=False)
    print(f"  Numerical HPBW: {hpbw:.3f}°")
    return 0


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Uniform linear array-factor plotter")
    p.add_argument("--n", type=int, default=8, help="number of elements")
    p.add_argument("--d", type=float, default=0.5, help="element spacing in wavelengths")
    p.add_argument("--beta", type=float, default=None,
                   help="progressive phase shift β in degrees (overrides --endfire)")
    p.add_argument("--endfire", action="store_true",
                   help="ordinary endfire, β = -kd")
    p.add_argument("--from-broadside", action="store_true",
                   help="plot vs. angle from the array normal rather than from the axis")
    p.add_argument("--out", type=Path, default=None, help="PNG path (default: no file)")
    p.add_argument("--self-test", action="store_true")
    args = p.parse_args(argv)

    if args.self_test:
        return self_test()

    if args.beta is not None:
        beta = math.radians(args.beta)
    elif args.endfire:
        beta = -2.0 * math.pi * args.d
    else:
        beta = 0.0

    theta = np.linspace(0.0, math.pi, 4001)
    af = array_factor(args.n, psi(theta, args.d, beta))
    nulls = first_nulls_theta(args.n, args.d, beta)
    hpbw = hpbw_deg(args.n, args.d, beta, args.from_broadside)
    peak_theta = math.degrees(theta[int(np.argmax(af))])

    print(f"N           = {args.n}")
    print(f"d/λ         = {args.d}")
    print(f"β           = {math.degrees(beta):.4f} deg")
    print(f"Main beam θ = {peak_theta:.4f} deg (from array axis)")
    if hpbw is not None:
        print(f"HPBW        = {hpbw:.4f} deg")
    if nulls:
        print("Null θ (from axis): " + ", ".join(f"{t:.3f}°" for t in nulls[:8])
              + (" ..." if len(nulls) > 8 else ""))

    if args.out is not None:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        args.out.parent.mkdir(parents=True, exist_ok=True)
        if args.from_broadside:
            # φ = 90° - θ, angle from the array normal.
            x = 90.0 - np.degrees(theta)
            xlabel = "angle from broadside (deg)"
        else:
            x = np.degrees(theta)
            xlabel = "θ from array axis (deg)"
        fig, ax = plt.subplots(figsize=(8, 4.5))
        ax.plot(x, 20.0 * np.log10(np.clip(af, 1e-4, None)))
        ax.set_ylim(-40, 1)
        ax.set_xlabel(xlabel)
        ax.set_ylabel("|AF| (dB)")
        ax.set_title(f"Uniform linear array  N={args.n}, d/λ={args.d}, "
                     f"β={math.degrees(beta):.1f}°")
        ax.grid(True, alpha=0.3)
        fig.tight_layout()
        fig.savefig(args.out, dpi=120)
        plt.close(fig)
        print(f"Wrote {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
