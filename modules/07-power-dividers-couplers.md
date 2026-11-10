# 07 — Power dividers and directional couplers

**Map to the book:** Pozar, Chapter 7 (Power Dividers and Directional Couplers): the T-junction, the resistive divider, the Wilkinson divider, the quadrature (branch-line) hybrid, the 180° (rat-race) hybrid, coupled-line couplers, and the even/odd-mode analysis that produces them. Original study note.

## Learning objectives

- State the S-matrix targets for a lossless reciprocal 3 dB four-port coupler (and the 0°/180° vs 90° phase distinction).
- Design an equal-split Wilkinson: line impedance and isolation resistor.
- Design a branch-line hybrid: series and shunt arm impedances, and the port numbering / phase relationship.
- Explain even/odd-mode analysis in one paragraph, and why isolation appears at the "isolated" port.
- Know the THz reality: a waveguide magic tee or a directional coupler in WR3.4 is a machined object, not a microstrip Wilkinson.

## What a good divider or coupler does

A three-port network cannot be simultaneously matched, reciprocal, and lossless at all ports (a short uniqueness argument on the S-matrix). That is why a lossless T-junction is mismatched, and why the Wilkinson *adds a resistor* between the output ports: at the design frequency, in even mode, the resistor sees no voltage and is lossless; in odd mode, it absorbs the difference and provides isolation.

A directional coupler is a four-port with a through path (\(P_1\to P_2\)), a coupled path (\(P_1\to P_3\)), and an isolated port (\(P_4\)). Coupling, directivity, and isolation (in dB) are

\[
C=-20\log_{10}|S_{31}|,
\qquad
I=-20\log_{10}|S_{41}|,
\qquad
D=I-C.
\]

A 3 dB coupler with a 90° phase difference is a quadrature hybrid; with a 0°/180° difference it is a magic tee or a rat-race.

## Wilkinson and branch-line, equal split, \(Z_0=50~\Omega\)

Two-way Wilkinson, even-odd analysis gives

\[
Z_\text{arm}=Z_0\sqrt{2}=70.71~\Omega,
\qquad
R=2Z_0=100~\Omega,
\qquad
\ell=\lambda/4.
\]

Ideally \(S_{11}=S_{22}=S_{33}=0\), \(S_{21}=S_{31}=-j/\sqrt{2}\) (\(-3.01\) dB), and \(S_{23}=0\). Unequal splits use two different arm impedances and a resistor that is no longer \(2Z_0\).

Branch-line (quadrature) hybrid, also \(\lambda/4\) cells:

\[
Z_\text{series}=Z_0/\sqrt{2}=35.36~\Omega,
\qquad
Z_\text{shunt}=Z_0=50~\Omega.
\]

Drive port 1: port 2 is the through (\(-j/\sqrt{2}\)), port 3 is the coupled (\(-1/\sqrt{2}\), 90° away from port 2), port 4 is isolated. Swap the roles with frequency, and remember that a branch-line is narrowband compared with a coupled-line Lange coupler or a multi-section hybrid.

## Worked example — power bookkeeping on a 3 dB Wilkinson

A 10.0 dBm source, source-matched, drives an ideal equal-split Wilkinson whose arms are terminated in 50 Ω. Each output delivers \(10.0-3.01=6.99\) dBm. The isolation resistor dissipates nothing. Now put a short on port 3 and keep port 2 matched. The even/odd picture says the odd-mode half of the power that entered the port-3 side is absorbed in the 100 Ω resistor, and the even-mode half reappears at the input (so \(S_{11}\) is no longer zero). A loose statement of the result: half of the power that would have been delivered to port 3 is dissipated, and the input match collapses. This is why you still want decent output matches, even on a "forgiving" Wilkinson.

For the branch-line numbers at 10 GHz on a TEM board with \(v_p=c/\sqrt{\varepsilon_\text{eff}}\) and \(\varepsilon_\text{eff}=3.00\),

\[
\lambda_g=\frac{3.00\times10^8}{10^{10}\sqrt{3}}=17.32~\text{mm},
\qquad
\lambda_g/4=4.33~\text{mm}.
\]

Those are the physical lengths of both the 35.36 Ω series arms and the 50 Ω shunt arms, before open-end and junction discontinuities, which you then compensate.

## Lab notes

- Isolation is the spec people forget to measure. On a VNA, terminate the unused ports *well*. A 15 dB load at WR3.4, used as a "50 Ω" (waveguide-matched) termination on the isolated port, will invent a fictional \(S_{41}\).
- Waveguide couplers are typically multi-hole sidewall or broad-wall couplers; directivity depends on the hole spacing being \(\lambda_g/4\), so a coupler designed at 270 GHz is mediocre at 220 GHz and at 330 GHz. Check the band, not just the mid-band coupling stamp.
- A 10 dB coupler plus a power meter is how a lot of "source power at the flange" numbers are actually obtained. The coupler's own tracking error lands directly on your reported EIRP or path loss.
