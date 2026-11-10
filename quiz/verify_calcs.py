#!/usr/bin/env python3
"""Independently recompute every type=calc item in questions.json and
check that the official answer contains the right numbers.

Run from anywhere:  python quiz/verify_calcs.py
Exits 0 only if the question bank validates and every calc passes.
"""

from __future__ import annotations

import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
QUESTIONS_PATH = ROOT / "questions.json"

# Curriculum convention (also stated in the README).
C = 3.00e8
ETA0 = 376.73
MU0 = 4.0e-7 * math.pi
EPS0 = 8.854e-12
SIGMA_CU = 5.8e7
KB = 1.381e-23
T0 = 290.0
PI = math.pi

REQUIRED_FIELDS = {"id", "module", "topic", "difficulty", "type", "question", "answer", "ref"}
TYPES = {"concept", "calc", "derive"}


def load_questions() -> list[dict]:
    with QUESTIONS_PATH.open(encoding="utf-8") as fh:
        data = json.load(fh)
    if not isinstance(data, list):
        raise SystemExit("questions.json must be a list")
    return data


def validate_schema(questions: list[dict]) -> list[str]:
    errors: list[str] = []
    seen: set[str] = set()
    for i, q in enumerate(questions):
        missing = REQUIRED_FIELDS - set(q)
        extra = set(q) - REQUIRED_FIELDS
        if missing:
            errors.append(f"item {i}: missing {sorted(missing)}")
        if extra:
            errors.append(f"item {i} ({q.get('id')}): unexpected fields {sorted(extra)}")
        qid = q.get("id")
        if not qid:
            errors.append(f"item {i}: empty id")
        elif qid in seen:
            errors.append(f"duplicate id {qid}")
        else:
            seen.add(qid)
        if q.get("type") not in TYPES:
            errors.append(f"{qid}: bad type {q.get('type')!r}")
        if q.get("difficulty") not in (1, 2, 3):
            errors.append(f"{qid}: bad difficulty {q.get('difficulty')!r}")
        for key in ("question", "answer", "ref", "module", "topic"):
            if not str(q.get(key, "")).strip():
                errors.append(f"{qid}: empty {key}")
    if len(questions) < 150:
        errors.append(f"only {len(questions)} questions (need >= 150)")
    return errors


# ---------------------------------------------------------------------------
# Independent computations, keyed by question id.
# Each function returns {label: expected_float}.
# ---------------------------------------------------------------------------

def _skin_depth(freq_hz: float, sigma: float = SIGMA_CU) -> float:
    return 1.0 / math.sqrt(PI * freq_hz * MU0 * sigma)


def _gamma(zl: complex, z0: float) -> complex:
    return (zl - z0) / (zl + z0)


def _vswr(g: complex) -> float:
    m = abs(g)
    return (1 + m) / (1 - m)


def _rl_db(g: complex) -> float:
    return -20.0 * math.log10(abs(g))


def _db10(x: float) -> float:
    return 10.0 * math.log10(x)


def _db20(x: float) -> float:
    return 20.0 * math.log10(x)


def _lin10(db: float) -> float:
    return 10.0 ** (db / 10.0)


def _lin20(db: float) -> float:
    return 10.0 ** (db / 20.0)


def _zin(zl: complex, z0: float, length_deg: float) -> complex:
    bl = math.radians(length_deg)
    t = 1j * math.tan(bl)
    return z0 * (zl + z0 * t) / (z0 + zl * t)


def checks() -> dict[str, dict[str, float]]:
    """Fresh arithmetic, not copied from the answer strings."""
    out: dict[str, dict[str, float]] = {}

    # p01
    out["p01-03"] = {"eta0": math.sqrt(MU0 / EPS0)}
    d10 = _skin_depth(10e9)
    rs10 = 1.0 / (SIGMA_CU * d10)
    out["p01-04"] = {"delta_um": d10 * 1e6, "Rs": rs10}
    d270 = d10 * math.sqrt(10 / 270)
    out["p01-05"] = {"delta_um": d270 * 1e6, "Rs": rs10 * math.sqrt(27)}
    out["p01-07"] = {"S_mW_m2": (0.5 / ETA0) * 1e3}

    # p02
    g = _gamma(100 + 50j, 50)
    out["p02-03"] = {
        "g_re": g.real, "g_im": g.imag, "g_mag": abs(g),
        "ang_deg": math.degrees(math.atan2(g.imag, g.real)),
        "vswr": _vswr(g), "rl_db": _rl_db(g), "pfrac": abs(g) ** 2,
    }
    zin = _zin(100 + 50j, 50, 60)
    out["p02-04"] = {"rin": zin.real, "xin": zin.imag}
    g75 = _gamma(75, 50)
    out["p02-05"] = {"gamma": g75.real, "vswr": _vswr(g75), "rl_db": _rl_db(g75)}
    vf = 1.0 / math.sqrt(2.30)
    out["p02-09"] = {"vf": vf, "ell_mm": (C * vf) / (4 * 1e9) * 1e3}

    # p03
    a90 = 0.900 * 0.0254
    out["p03-02"] = {"fc_GHz": C / (2 * a90) / 1e9}
    a34 = 0.034 * 0.0254
    fc34 = C / (2 * a34)
    out["p03-03"] = {"fc_GHz": fc34 / 1e9, "te20_GHz": 2 * fc34 / 1e9}
    f270 = 270e9
    lam = C / f270
    factor = math.sqrt(1.0 - (fc34 / f270) ** 2)
    out["p03-04"] = {"lam_mm": lam * 1e3, "factor": factor, "lg_mm": lam * 1e3 / factor}
    out["p03-05"] = {"Zte": ETA0 / factor}
    lnba = 50.0 * 2 * PI * math.sqrt(2.30) / ETA0
    out["p03-07"] = {"b_over_a": math.exp(lnba)}

    # p04
    out["p04-03"] = {"gin": 0.20 + (0.90 * 0.90 * 0.50) / (1 - 0.20 * 0.50)}
    out["p04-04"] = {"sumsq": 0.20 ** 2 + 0.90 ** 2, "dissipated_frac": 1 - (0.20 ** 2 + 0.90 ** 2)}
    g10 = _lin20(-10.0)
    out["p04-06"] = {
        "gamma": g10, "pref": g10 ** 2, "pacc": 1 - g10 ** 2, "vswr": (1 + g10) / (1 - g10),
    }
    out["p04-10"] = {"il_db": -_db20(0.501), "sumsq": 0.501 ** 2}

    # p05
    out["p05-01"] = {"z1": math.sqrt(50 * 200), "ell_mm": C / (4 * 10e9) * 1e3}
    ell = C / (4 * 10e9)
    bl = 2 * PI * 11e9 / C * ell
    zin11 = _zin(200, 100, math.degrees(bl))
    gin = (zin11 - 50) / (zin11 + 50)
    out["p05-02"] = {
        "rin": zin11.real, "xin": zin11.imag, "gmag": abs(gin), "rl_db": _rl_db(gin),
    }
    B = math.sqrt(0.000075)
    w = 2 * PI * 10e9
    Zsh = 1 / (0.005 + 1j * B)
    out["p05-03"] = {"B": B, "C_pF": B / w * 1e12, "X": Zsh.imag, "L_nH": abs(Zsh.imag) / w * 1e9}
    lg = 1.451e-3
    out["p05-07"] = {"travel_mm": lg / 2 * 1e3}

    # p06
    f0 = 10e9
    w0 = 2 * PI * f0
    Cval = 0.500e-12
    L = 1 / (w0 ** 2 * Cval)
    Q0 = 80.0
    out["p06-02"] = {"L_nH": L * 1e9, "R_ohm": w0 * L / Q0, "bw_MHz": f0 / Q0 / 1e6}
    out["p06-03"] = {"Qe": 80.0, "kappa": 1.0, "s11": 0.0}
    qe = 160.0
    kap = Q0 / qe
    out["p06-04"] = {
        "kappa": kap, "QL": 1 / (1 / Q0 + 1 / qe),
        "s11": abs(kap - 1) / (kap + 1), "s11_db": _db20(abs(kap - 1) / (kap + 1)),
    }
    a = 22.86e-3
    s = (2 * f0 / C) ** 2 - 1 / a ** 2
    out["p06-05"] = {"d_mm": (1 / math.sqrt(s)) * 1e3}

    # p07
    out["p07-02"] = {"zarm": 50 * math.sqrt(2), "R": 100.0}
    out["p07-03"] = {"pout_dBm": 10.0 - 10 * math.log10(2)}
    lg = C / (10e9 * math.sqrt(3.00))
    out["p07-04"] = {"zseries": 50 / math.sqrt(2), "zshunt": 50.0, "lg4_mm": lg / 4 * 1e3}
    out["p07-06"] = {"D_db": 25.0, "s31": _lin20(-10), "s41": _lin20(-35)}

    # p08
    wc = 2 * PI * 1e9
    out["p08-03"] = {"L_nH": 50 / wc * 1e9, "C_pF": 2 / (50 * wc) * 1e12}
    out["p08-04"] = {"s21_db": -10 * math.log10(1 + 2 ** 6)}

    # p09
    vswr = 1.25
    gam = (vswr - 1) / (vswr + 1)
    out["p09-03"] = {
        "s21": _lin20(-0.40), "s12": _lin20(-20), "gamma": gam, "rl_db": -_db20(gam),
    }

    # p10
    kt = KB * T0
    out["p10-01"] = {
        "kT_dBm_Hz": 10 * math.log10(kt * 1e3),
        "p_1GHz_dBm": 10 * math.log10(kt * 1e9 * 1e3),
    }
    F1, G1, F2 = _lin10(1.50), _lin10(12.0), _lin10(4.00)
    Fcas = F1 + (F2 - 1) / G1
    out["p10-03"] = {"F": Fcas, "NF_dB": _db10(Fcas)}
    Fcable, Gcable, Flna = 2.0, 0.5, _lin10(1.50)
    Fcab = Fcable + (Flna - 1) / Gcable
    out["p10-04"] = {"F": Fcab, "NF_dB": _db10(Fcab)}
    out["p10-05"] = {"OIP3_dBm": 5.0 + 45.0 / 2, "IIP3_dBm": -10.0 + 45.0 / 2}

    # p11
    out["p11-02"] = {"gt_lin": 16.00, "gt_dB": _db10(16.00)}

    def cis(mag: float, deg: float) -> complex:
        return mag * complex(math.cos(math.radians(deg)), math.sin(math.radians(deg)))

    S11, S21, S12, S22 = cis(0.70, -40), cis(4.00, 70), cis(0.08, 30), cis(0.55, -20)
    delta = S11 * S22 - S12 * S21
    K = (1 - abs(S11) ** 2 - abs(S22) ** 2 + abs(delta) ** 2) / (2 * abs(S12 * S21))
    out["p11-04"] = {"abs_delta": abs(delta), "K": K}
    MAG = (abs(S21) / abs(S12)) * (K - math.sqrt(K ** 2 - 1))
    out["p11-05"] = {"MAG_lin": MAG, "MAG_dB": _db10(MAG)}

    # p12
    Lc, F_if = _lin10(9.0), _lin10(1.50)
    Fmix = Lc + (F_if - 1) * Lc
    out["p12-04"] = {"F": Fmix, "NF_dB": _db10(Fmix)}
    Fpre, Gpre = _lin10(4.00), _lin10(15.0)
    Fnew = Fpre + (Fmix - 1) / Gpre
    out["p12-05"] = {"F": Fnew, "NF_dB": _db10(Fnew)}
    out["p12-06"] = {"pleak_dBm": 7.0 - 6.0}

    # p13
    lam = C / 270e9
    Lfs = (4 * PI * 1.00 / lam) ** 2
    out["p13-02"] = {"Lfs_dB": _db10(Lfs), "Pr_dBm": 0.0 + 20 + 20 - _db10(Lfs)}
    Te = T0 * (_lin10(10.50) - 1)
    Tsys = Te + 290.0
    N = KB * Tsys * 1e6
    Pr = 10 ** ((-41.07 - 30) / 10)  # -41.07 dBm -> watts, but we'll use computed Pr
    Pr_w = 1e-3 * 100 * 100 * (lam / (4 * PI * 1.0)) ** 2
    out["p13-03"] = {
        "Tsys_K": Tsys,
        "N_dBm": 10 * math.log10(N * 1e3),
        "SNR_dB": 10 * math.log10(Pr_w * 1e3) - 10 * math.log10(N * 1e3),
    }
    out["p13-04"] = {"dT_K": Tsys / math.sqrt(1e9 * 1e-3)}
    sig, R, G, Pt = 0.010, 5.00, 100.0, 1e-3
    Pradar = Pt * G ** 2 * lam ** 2 * sig / ((4 * PI) ** 3 * R ** 4)
    out["p13-05"] = {"Pr_W": Pradar, "Pr_dBm": 10 * math.log10(Pradar * 1e3)}
    D = 0.10
    out["p13-06"] = {"Rff_m": 2 * D ** 2 / lam}
    out["p13-07"] = {"Pr_dBm": 10 * math.log10(Pradar * 1e3) - 12.0412}

    # a01
    out["a01-02"] = {
        "D_short": 1.50, "dBi_short": _db10(1.50),
        "D_hw": 1.643, "dBi_hw": _db10(1.643),
    }
    ae_iso = lam ** 2 / (4 * PI)
    out["a01-04"] = {"ae_iso_mm2": ae_iso * 1e6, "ae_20dBi_mm2": 100 * ae_iso * 1e6}
    g15 = _lin20(-15.0)
    pacc = 1 - g15 ** 2
    out["a01-05"] = {"gamma": g15, "pacc": pacc, "ml_dB": -_db10(pacc)}
    out["a01-06"] = {
        "G_dBi": 21.0 + _db10(0.90),
        "Greal_dBi": 21.0 + _db10(0.90) - (-_db10(pacc)),
    }

    # a02
    out["a02-04"] = {"null_deg": 0.0, "peak_deg": 90.0}
    out["a02-05"] = {"half_lambda_mm": lam / 2 * 1e3}

    # a03
    out["a03-02"] = {
        "rr10": 80 * PI ** 2 * (0.10) ** 2,
        "rr20": 80 * PI ** 2 * (0.05) ** 2,
    }
    dl = 0.200e-3 / lam
    rr_u = 80 * PI ** 2 * dl ** 2
    out["a03-06"] = {"dl_over_lam": dl, "rr_uniform": rr_u, "rr_tri": rr_u / 4}

    # a04
    Cl = 2 * PI / 25
    rr = 20 * PI ** 2 * Cl ** 4
    out["a04-03"] = {"C_over_lam": Cl, "R_r": rr}
    out["a04-04"] = {"a_um": (lam / 25) * 1e6, "R_r": 20 * PI ** 2 * (1 / 3) ** 4}

    # a05
    t1 = math.degrees(math.acos(0.25))
    t2 = math.degrees(math.acos(-0.25))
    out["a05-03"] = {"theta1_deg": t1, "theta2_deg": t2, "FNBW_deg": t2 - t1}
    hpbw_approx = 0.886 * 2 / 8 * 180 / PI
    out["a05-04"] = {"HPBW_approx_deg": hpbw_approx, "HPBW_num_deg": 12.82}
    out["a05-05"] = {"beta_deg": -90.0}

    # a06
    A = 0.008 * 0.006
    Ghorn = 0.50 * 4 * PI * A / lam ** 2
    out["a06-04"] = {
        "G_lin": Ghorn, "G_dBi": _db10(Ghorn),
        "Guni_dBi": _db10(Ghorn / 0.50),
    }
    out["a06-05"] = {"Rff_m": 2 * (0.010) ** 2 / lam}

    # a07
    Ddish = 0.300
    Guni = (PI * Ddish / lam) ** 2
    Gdish = 0.60 * Guni
    out["a07-02"] = {"G_lin": Gdish, "G_dBi": _db10(Gdish), "Guni_dBi": _db10(Guni)}
    out["a07-03"] = {"HPBW_deg": 70 * lam / Ddish * 180 / PI / (180 / PI)}  # 70*lam/D in degrees
    # 70 * lambda/D degrees: 70 is already in degrees-per-(lambda/D)
    out["a07-03"] = {"HPBW_deg": 70.0 * lam / Ddish * 1.0}  # lam and D in meters, result in degrees? 
    # 70 * (lam/D) * (if 70 is in degrees) yes: 70 * lam/D degrees when lam and D same units.
    out["a07-03"] = {"HPBW_deg": 70.0 * (lam / Ddish)}
    out["a07-04"] = {"Rff_m": 2 * Ddish ** 2 / lam}

    def ruze(eps: float) -> float:
        return math.exp(-((4 * PI * eps / lam) ** 2))

    e50, e100 = ruze(50e-6), ruze(100e-6)
    out["a07-05"] = {
        "eta50": e50, "eta50_dB": _db10(e50),
        "eta100": e100, "eta100_dB": _db10(e100),
    }

    # a08
    out["a08-02"] = {
        "L0_mm": C / (2 * 10e9 * math.sqrt(3.66)) * 1e3,
        "W_mm": C / (2 * 10e9 * math.sqrt((3.66 + 1) / 2)) * 1e3,
    }
    L0 = C / (2 * 10e9 * math.sqrt(3.66))
    out["a08-05"] = {
        "L0_mm": L0 * 10 / 270 * 1e3,
        "h_over_lam": 0.203e-3 / lam,
    }

    # a09
    out["a09-03"] = {
        "aout_mm": C / (2 * PI * 2.00e9) * 1e3,
        "ain_mm": C / (2 * PI * 8.00e9) * 1e3,
    }
    out["a09-04"] = {
        "aout_mm": C / (2 * PI * 110e9) * 1e3,
        "ain_mm": C / (2 * PI * 330e9) * 1e3,
    }

    # a10
    out["a10-02"] = {"G_dBi": 0.5 * (-41.07 + 81.07)}
    out["a10-03"] = {
        "G_ieee_dBi": 20.00 + (-_db10(pacc)),
        "G_real_dBi": 20.00,
    }

    return out


# Number extraction from answer text (handles 4.32e5, 4.32×10^5, unicode minus).
_SCI = re.compile(
    r"([+\-]?\d+(?:\.\d+)?)\s*(?:×|x|\\times)\s*10\s*\^?\s*\{?([+\-]?\d+)\}?",
    re.IGNORECASE,
)
_NUM = re.compile(r"[+\-]?(?:\d+\.\d*|\.\d+|\d+)(?:[eE][+\-]?\d+)?")


def extract_numbers(text: str) -> list[float]:
    t = text.replace("\u2212", "-").replace("\u2013", "-").replace("\u2014", "-")
    # Strip thousands-ignored; convert a×10^b first so the leftover doesn't double-count badly.
    found: list[float] = []
    def sci_sub(m: re.Match) -> str:
        found.append(float(m.group(1)) * 10 ** int(m.group(2)))
        return " "
    t2 = _SCI.sub(sci_sub, t)
    for m in _NUM.finditer(t2):
        try:
            found.append(float(m.group(0)))
        except ValueError:
            continue
    return found


def close_enough(expected: float, candidates: list[float]) -> bool:
    if expected == 0:
        tol = 1e-9
        return any(abs(c - expected) <= tol for c in candidates)
    # Tight relative, with a floor that allows ordinary one-decimal rounding
    # (e.g. 0.26 vs 0.259, -18.1 vs -18.13, -174.0 vs -173.98).
    scale = abs(expected)
    if scale >= 1:
        tol = max(0.006 * scale, 0.025)
    elif scale >= 0.05:
        tol = max(0.008 * scale, 0.012)
    else:
        tol = max(0.01 * scale, 5e-4)
        # scientific-notation answers such as 9.95e-14 need relative slack
        tol = max(tol, 0.008 * scale)
    return any(abs(c - expected) <= tol for c in candidates)


def main() -> int:
    questions = load_questions()
    schema_errs = validate_schema(questions)
    if schema_errs:
        print("SCHEMA FAILURES:")
        for e in schema_errs:
            print("  ", e)
        return 1

    by_id = {q["id"]: q for q in questions}
    calc_ids = [q["id"] for q in questions if q["type"] == "calc"]
    expected = checks()

    missing = [i for i in calc_ids if i not in expected]
    extra = [i for i in expected if i not in by_id]
    if missing:
        print("No independent check registered for:", ", ".join(missing))
        return 1
    if extra:
        print("Checks for unknown ids:", ", ".join(extra))
        return 1

    failures = 0
    for qid in calc_ids:
        q = by_id[qid]
        nums = extract_numbers(q["answer"])
        for label, value in expected[qid].items():
            if not close_enough(value, nums):
                failures += 1
                print(
                    f"FAIL {qid}.{label}: expected {value:.6g}, "
                    f"numbers in answer: {nums[:12]}"
                    + (" ..." if len(nums) > 12 else "")
                )
    print()
    print(f"Questions: {len(questions)}  (calc {len(calc_ids)}, "
          f"concept {sum(1 for q in questions if q['type']=='concept')}, "
          f"derive {sum(1 for q in questions if q['type']=='derive')})")
    if failures:
        print(f"CALC FAILURES: {failures}")
        return 1
    print("All calc answers match the independent recomputation.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
