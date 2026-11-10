# A1 — Antenna fundamentals

**Map to the book:** Balanis, *Antenna Theory: Analysis and Design*, 4th ed., Chapters 1–2 (Antennas, and Fundamental Parameters of Antennas): radiation pattern, beamwidth, directivity and gain, efficiency, input impedance and radiation resistance, polarization, effective aperture, and the Friis / radar connections. Original study note, not a transcription.

## Learning objectives

- Define radiation intensity \(U(\theta,\phi)\), directivity \(D\), gain \(G\), and radiation efficiency \(e_r\), and convert between linear and dBi.
- Relate effective aperture to gain: \(A_e=G\lambda^2/(4\pi)\).
- Write radiation resistance and input impedance as the antenna's one-port, and connect them to a measured \(S_{11}\).
- State the far-field criterion \(R\ge 2D^2/\lambda\) and polarization mismatch as two ways a "Friis" measurement goes wrong.

## Pattern, directivity, gain

An antenna is a transducer between a guided mode (coax, microstrip, WR3.4 TE\(_{10}\)) and a radiated field. In the far field the radiated power density is

\[
S_\text{av}(R,\theta,\phi)=\frac{U(\theta,\phi)}{R^2},
\qquad
U=\frac{R^2}{2\eta}|\mathbf{E}|^2
\quad\text{(W/sr)}.
\]

Radiation intensity \(U\) is what a pattern cut plots (usually in dB, normalized to its peak). The half-power beamwidth (HPBW) is the angle between 3 dB points of the main beam; the first-null beamwidth (FNBW) is the angle between the first zeros. Directivity is the peak intensity over the average intensity,

\[
D=\frac{4\pi U_\max}{P_\text{rad}},
\qquad
P_\text{rad}=\oint U\,d\Omega.
\]

An isotropic radiator has \(D=1\) (0 dBi). A short (Hertzian) dipole has \(D=1.5\) (1.76 dBi). A half-wave dipole has \(D\approx1.643\) (2.15 dBi). Gain includes loss:

\[
G=e_r D,
\qquad
e_r=\frac{P_\text{rad}}{P_\text{accepted}}=\frac{R_r}{R_r+R_\text{loss}}.
\]

\(P_\text{accepted}=P_\text{inc}(1-|S_{11}|^2)\) is what the antenna actually takes from the guide; realized gain still multiplies by that mismatch factor. Datasheets sometimes blur these three (directivity / IEEE gain / realized gain). When you quote a horn as "20 dBi," ask which one.

Effective aperture is the area that, placed in a plane wave of power density \(W\), would collect \(P_\text{rec}=W A_e\):

\[
A_e=\frac{G\lambda^2}{4\pi}.
\]

This is an identity, not an approximation, once \(G\) is the IEEE gain in that polarization. At 270 GHz, \(\lambda=1.111\) mm, an isotropic antenna has \(A_e=0.098\) mm\(^2\); a 20 dBi horn has \(A_e=9.82\) mm\(^2\). THz "large gain" still looks like a small physical window.

## Impedance, polarization, far field

The input impedance \(Z_\text{in}=R_r+R_\text{loss}+jX\) is a one-port. Radiation resistance \(R_r\) is the resistor that would dissipate \(P_\text{rad}\) when the terminal current is the actual terminal current. A measured \(S_{11}\) on a VNA is \(\Gamma\) at the calibration plane; rotating out the waveguide or coax length (port extension) is how you recover \(Z_\text{in}\) at the planned terminal.

Polarization is the locus of the radiated \(\mathbf{E}\) at a far-field point. Polarization mismatch efficiency between a wave and an antenna is \(|\hat{\rho}_w\cdot\hat{\rho}_a|^2\), zero for perfectly crossed linear, 0.5 (−3 dB) for linear into circular, 1 for a matched pair, and 0 for opposite-sense circular.

The far-field (Fraunhofer) distance for an aperture of maximum dimension \(D\) is \(R\ge 2D^2/\lambda\). Inside that, Friis and a far-field pattern cut are both approximations. A 10 cm aperture at 270 GHz has \(2D^2/\lambda=18\) m: most THz bench "pattern" work is actually near-field or Fresnel-region work unless you are deliberately far away, or you transform a scanned near field.

## Worked example — from \(S_{11}\) and a pattern to realized gain

A WR3.4 horn, at 270 GHz, is measured with a flange-calibrated extender: \(S_{11}=-15.0\) dB, so \(|\Gamma|=0.1778\) and the accepted-power fraction is \(1-|\Gamma|^2=0.968\) (−0.14 dB of mismatch loss). A far-field pattern integration (or a careful gain comparison) gives a directivity of 21.0 dBi. The ohmic/dielectric efficiency is estimated at \(e_r=0.90\) (−0.46 dB). Then

\[
G=21.0-0.46=20.54~\text{dBi},
\qquad
G_\text{realized}=20.54-0.14=20.40~\text{dBi},
\]

and

\[
A_e=\frac{G\lambda^2}{4\pi}=\frac{113.2\cdot(1.111\times10^{-3})^2}{4\pi}=1.11\times10^{-5}~\text{m}^2=11.1~\text{mm}^2.
\]

If you had treated the 21 dBi directivity as a realized gain in a Friis budget, you would have been 0.6 dB optimistic — enough to matter when you are chasing tenths in a path-loss measurement.

## Lab notes

- Always write down the reference plane of \(S_{11}\). A WR3.4 flange cal puts it at the flange; the horn's throat is a few millimeters inboard, which is several tenths of a guide wavelength.
- Cross-pol is not a moral failing, it is a measurement. Rotate a linear probe (or use a dual-pol receiver) and record both. A "20 dB down" cross-pol that actually depends on your rotary joint is not a number you should publish.
- Absorb the bench. Anything behind the AUT, including a metal optical breadboard, becomes part of the antenna if you are not careful. This is the everyday THz version of a range-reflection problem (module a10).
