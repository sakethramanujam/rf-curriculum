# 05 — Impedance matching and tuning

**Map to the book:** Pozar, Chapter 5 (Impedance Matching and Tuning): matching philosophy, L-section lumped matching, single-stub and double-stub tuning, the quarter-wave transformer, binomial and Chebyshev multi-section transformers, and tapered lines. Original study note.

## Learning objectives

- State the goal of a match (maximize power transfer, set a noise or power load line, or present a prescribed \(\Gamma\)) and the bandwidth / Q cost of a narrow match.
- Design an L-section and a quarter-wave transformer for a real load, and a single open or shorted stub for a complex load.
- Explain why a single-section quarter-wave match is narrow, and how adding sections or a taper buys bandwidth.
- Relate analytical designs to what you actually do on a VNA: slide a tuner, add bond-wire inductance, or machine a backshort.

## Why match, and what you cannot evade

For a fixed available power from a source with real \(Z_0\), the load absorbs \(P_\text{inc}(1-|\Gamma_\text{in}|^2)\). Matching drives \(\Gamma_\text{in}\) toward 0 at the design frequency. A lossless matching network cannot change the fact that a high-Q load is hard to match over a wide band — Fano's limitation is the quantitative version of that intuition. At THz you often *choose* not to match perfectly across the whole WR3.4 band; you flatten the match over the frequency slice your imager actually uses.

## Quarter-wave transformer

For real \(Z_L\) and real \(Z_0\), a section of length \(\lambda/4\) and characteristic impedance

\[
Z_1=\sqrt{Z_0 Z_L}
\]

presents \(Z_\text{in}=Z_0\) at the design frequency. The match repeats at odd multiples of the design frequency and degrades as you walk off \(\lambda/4\). Example: 50 Ω to 200 Ω wants \(Z_1=100~\Omega\). In waveguide, "\(Z_1\)" is realized as a reduced-height or dielectric-filled section a quarter of a *guide* wavelength long (module 03).

Multi-section transformers (binomial = maximally flat; Chebyshev = equal ripple, wider band for a given allowed \(|\Gamma|_\max\)) are the usual microwave way to widen this. A continuous taper (exponential, Klopfenstein) is the distributed limit of many sections.

## L-sections and stubs

Two reactive elements can match a complex load to a real \(Z_0\) at one frequency, with two topology choices (series-then-shunt or shunt-then-series) and a region of the Smith chart where each works. You solve for a susceptance that drops the real part of the admittance to \(Y_0\), then cancel the leftover susceptance with a reactance (or vice versa). The unused topology is often the one that wants a negative inductor or a capacitor you cannot fabricate at that frequency.

A single-stub tuner does the same job with a length of line (to walk \(Z_L\) onto the \(1+jb\) circle) plus a shunt stub whose susceptance cancels \(b\). A shorted stub is preferred in waveguide and often at high power; an open stub is easier to etch on microstrip (no via). Double-stub tuners fix the stub locations — useful when you cannot choose the first length freely — at the cost of a forbidden region on the chart.

## Worked example — quarter-wave plus a single-frequency L-section check

**Quarter-wave.** Match 200 Ω to 50 Ω at 10 GHz on a TEM line with \(v_p=c\).

\[
Z_1=\sqrt{50\cdot200}=100~\Omega,
\qquad
\ell=\frac{c}{4f}=\frac{3.00\times10^8}{4\times10^{10}}=7.50~\text{mm}.
\]

At 10 GHz, \(Z_\text{in}=50~\Omega\) exactly. At 11 GHz the electrical length is 99°, \(\tan\beta\ell=\tan 99^\circ=-6.314\), and

\[
Z_\text{in}=100\frac{200+j100(-6.314)}{100+j200(-6.314)}=50.93+j11.80~\Omega,
\]

so \(\Gamma=(Z_\text{in}-50)/(Z_\text{in}+50)=0.023+j0.114\), \(|\Gamma|=0.117\), RL \(=18.7\) dB. Already 1 GHz off, the return loss has come down from a perfect match to 18.7 dB — that is the bandwidth cost of a single section between a 4:1 real-impedance ratio.

**L-section (shunt C then series L) for a real 200 Ω load to 50 Ω.** The load is \(G_L=1/200=0.005\) S. A shunt susceptance \(B\) produces

\[
Y=0.005+jB,
\qquad
Z=\frac{1}{0.005+jB}.
\]

We need \(\mathrm{Re}(Z)=50\). Solving \(0.005/(0.005^2+B^2)=50\) gives \(B=\pm0.00866\) S. Taking the capacitive (positive \(B\)) branch, \(B=0.00866\) S, the leftover reactance of \(Z\) is \(X=-B/(G^2+B^2)=-86.6~\Omega\), cancelled by a series \(+j86.6~\Omega\) inductor. At 10 GHz,

\[
C=\frac{B}{\omega}=0.138~\text{pF},
\qquad
L=\frac{86.6}{\omega}=1.38~\text{nH}.
\]

Both are fabricable at 10 GHz and both are lumped-element fiction at 270 GHz.

## Lab notes

- On a VNA, matching is an interactive Smith-chart sport: you add a bit of series inductance (a longer bond, a longer ribbon) and watch \(\Gamma\) walk along a constant-resistance circle. Shunt capacitance walks you along a constant-conductance circle.
- Waveguide backshorts and E/H tuners are just movable stubs. At WR3.4 the motion for a full 180° of stub phase is \(\lambda_g/2\approx0.73\) mm at 270 GHz — a micrometer-driven short is doing precision work, and backlash is a real measurement error.
- Do not "match" a noise-parameter or power-amplifier load line to 50 Ω just because \(S_{11}\) looks prettier. Those problems want a prescribed \(\Gamma_L\), not zero (modules 10 and 11).
- A perfect narrowband match plus a long line to the device produces a rapid phase wrap and a comb of mismatch ripple. Keep the matching elements close to the discontinuity you are cancelling.
