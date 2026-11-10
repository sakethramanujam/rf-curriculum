# A10 — Antenna measurements

**Map to the book:** Balanis, Chapter 16 (Antenna Measurements): anechoic and outdoor ranges, far-field pattern cuts, gain (comparison, two-antenna, three-antenna), polarization, impedance and efficiency (including Wheeler-cap style ideas), and a survey of near-field scanning. Original study note, written with a VNA and a WR3.4 extender in mind.

## Learning objectives

- Choose a range (far-field, compact, or near-field) using \(2D^2/\lambda\) and the actual room you have.
- Measure gain by a comparison method and by a two-identical-antenna Friis method, and list the leading errors (mismatch, polarization, multiple reflections, \(R\) uncertainty).
- Measure \(Z_\text{in}\) / \(S_{11}\) at a defined reference plane, and say what a radiation-efficiency measurement is actually doing.
- Describe a planar near-field scan as a sampled radiation integral (module a2) with probe correction.

## Impedance, first

Every other measurement is easier if you already trust \(S_{11}\). Calibrate at the plane you will report (WR3.4 flange, coaxial connector, or an on-wafer probe tip). Record the cal kit, the torque, the temperature, and the IF bandwidth. A good one-port check is a flushed short (a tight bead on the Smith chart at \(|\Gamma|\approx 1\)), then a load if you have one whose return loss you believe. Time-domain gating is legitimate if you document the gate and do not use it to invent a match the antenna does not have.

Mismatch loss, \(1-|S_{11}|^2\), must be applied if you are reporting realized gain, and must *not* be applied twice.

## Gain and patterns

The two-identical-antenna method uses Friis:

\[
G_t G_r=\frac{P_r}{P_t}\left(\frac{4\pi R}{\lambda}\right)^2,
\]

and \(G_t=G_r\) if the two antennas really are identical and equally matched. In dB,

\[
G_{\text{dBi}}=\tfrac12\left[P_r-P_t+20\log_{10}(4\pi R/\lambda)\right].
\]

The three-antenna method drops the "identical" assumption by measuring all three pairs. A comparison (substitution) method uses a standard-gain horn whose gain you already trust, and a stable path; the difference in received power, after mismatch corrections, is the difference in realized gain.

Leading errors on a THz bench:

- You are not in the far field (compute \(2D^2/\lambda\); for anything bigger than a small horn, you probably are not).
- Multiple reflections (the standing-wave ripple on \(P_r\) as you move \(R\) by a few \(\lambda/2\)). Average, dither, time-gate, or absorb.
- Polarization mismatch, including a slightly elliptical "linear" horn.
- An uncertain \(R\), an uncertain \(\lambda\) (frequency error is usually the lesser problem at a locked VNA frequency), and a power-meter / VNA receiver linearity error.
- A stale extender cal, or different flange torque between the "through" and the AUT.

Patterns: a far-field cut is an azimuth or elevation sweep in a single polarization, plotted as realized gain or as dB-normalized intensity. Record the co-pol and the cross-pol. A near-field planar scan measures \(E_x,E_y\) on a plane in front of the AUT, Fourier-transforms to the far-field plane-wave spectrum, and applies a probe-correction factor. The scan must be dense enough (\(\lesssim\lambda/2\)) and wide enough that the truncated evanescent and radiating spectrum is acceptable.

Efficiency: a calorimetric or Wheeler-cap measurement (put the antenna in a conducting shell, compare \(R_\text{loss}\) to \(R_r+R_\text{loss}\)) is standard at UHF and awkward at THz. At WR3.4, efficiency is more often inferred from a measured realized gain divided by a computed or near-field-integrated directivity.

## Worked example — two-horn Friis on a 1 m bench

Two nominally identical WR3.4 horns, 1.00 m apart, at 270 GHz (\(\lambda=1.111\) mm). A calibrated power measurement (or a VNA \(S_{21}\) with a known reference) gives \(P_r/P_t=-41.07\) dB. If the antennas were 20.00 dBi each, this is exactly the module 13 path-loss example, with no extra loss. Solving without assuming the 20 dBi number,

\[
2G_{\text{dBi}}=-41.07+81.07=40.00
\implies G=20.00~\text{dBi}.
\]

Now add realism: \(S_{11}\) of each horn is −15 dB, so each has 0.14 dB of mismatch loss (module a1). If \(P_r/P_t\) was measured as delivered/accepted (a VNA \(S_{21}\) with 50 Ω / waveguide reference, *not* corrected for mismatch) then the 20.00 dBi is a *realized* gain. The IEEE gain is 20.14 dBi. If you also see a \(\pm 0.6\) dB ripple as you slide one horn by 2 mm, do not claim \(\pm 0.1\) dB of gain accuracy; quote the ripple, or dither it out and say so.

The far-field check: a 10 mm horn at 270 GHz has \(2D^2/\lambda=0.18\) m, so 1 m is fine for the horns themselves.

## Lab notes

- Write a measurement equation *before* you turn on the extender: what you will record, what you will correct, and what you will not pretend to know. The curriculum's whole point, on the measurement side, is that \(S_{11}\), Friis, \(Q\), and AF are not different subjects — they are the same numbers in a lab notebook.
- At WR3.4, "anechoic" often means a carefully placed piece of foam or a pyramid of absorber, not a certified 40 dB chamber. Look at the time-domain \(S_{11}\) or at the \(R\)-ripple and decide whether the room is good enough for the claim you want to make.
- Document the flange, the cal, the temperature, and the IF bandwidth. Future-you, reducing THz imaging data, will need them.
