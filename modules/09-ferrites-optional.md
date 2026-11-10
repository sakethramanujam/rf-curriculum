# 09 — Ferrimagnetic components (optional)

**Map to the book:** Pozar, Chapter 9 (Theory and Design of Ferrimagnetic Components): permeability tensor of a magnetized ferrite, Faraday rotation, the Y-junction circulator, isolators (resonance, field-displacement, Faraday), and a short look at ferrite phase shifters. Optional in this curriculum — read it after the active-circuit modules if you are short on time. Original study note.

## Learning objectives

- Explain, in words, why a magnetized ferrite is an anisotropic, nonreciprocal medium, and what the off-diagonal entries of \(\bar{\mu}\) do.
- State the function of an isolator and of a circulator, and write the ideal S-matrix of each.
- Give one reason you would place an isolator on a VNA port or on a source, and one reason ferrite parts are scarce at 270 GHz.

## The physical picture

A ferrite biased by a DC magnetic field has precessing magnetic moments. A small RF magnetic field sees a permeability *tensor*, not a scalar \(\mu\). The tensor is antisymmetric, which is the algebraic origin of nonreciprocity: \(S_{ij}\neq S_{ji}\) is allowed, and the lossless condition is still unitarity, not symmetry.

Faraday rotation is the clearest wave picture: a linearly polarized wave can be decomposed into two circular polarizations that travel at different \(\beta\), so the linear polarization rotates as it propagates. The rotation sense is tied to the bias field, not to the direction of travel, which is how a Faraday isolator (rotator + polarizer + analyzer, plus a compensating dielectric rotator in some designs) can pass one way and absorb the other.

A three-port Y-junction circulator uses the same anisotropy to split a degenerate junction resonance into two counter-rotating modes, offset just enough that the junction shoots power from port 1 to 2, 2 to 3, 3 to 1. Ideal S-matrix (one common phase convention):

\[
S=\begin{pmatrix}0&0&1\\1&0&0\\0&1&0\end{pmatrix}.
\]

An isolator is a circulator with the third port internally terminated, or a Faraday/resonance/field-displacement structure designed only for two ports. Ideal isolator: \(S_{21}=1\), \(S_{12}=0\), \(S_{11}=S_{22}=0\).

## Worked example — reading a non-ideal isolator

A catalog isolator at 10 GHz is specified as 20 dB isolation, 0.4 dB insertion loss, 1.25:1 VSWR at both ports. Convert:

\[
|S_{21}|=10^{-0.4/20}=0.955,
\qquad
|S_{12}|=10^{-20/20}=0.100,
\]

\[
|\Gamma|=\frac{\text{VSWR}-1}{\text{VSWR}+1}=\frac{0.25}{2.25}=0.111,
\qquad
\text{RL}=19.1~\text{dB}.
\]

Unitarity is not expected (the device is *supposed* to absorb reverse power). A check that *is* useful: when you terminate the output, the input VSWR should meet the spec; when you present a short at the output, the isolator should still keep the input reasonably matched, because the reflected wave is absorbed rather than re-reflected toward the source. If a "20 dB isolator" fails that test, the termination inside it is the problem.

## Lab notes

- On a VNA, an isolator in front of a source reduces load-pull of the oscillator or of an extender's LO, and it can tame a highly reflective filter in the stopband. It also adds insertion loss, which at THz you may not be able to spend.
- Ferrite saturation magnetization and ferromagnetic resonance frequencies set a practical upper band. Millimeter-wave isolators exist; true WR3.4 ferrite isolators are uncommon and expensive, and many 220–330 GHz benches use a directional coupler plus a load, or just live with the mismatch, instead.
- Circulators are the usual way to make a reflection-mode imager or a single-antenna radar. If you do not have one at your frequency, a coupler or a quasi-optical beam splitter (a lossier, reciprocal stand-in) does some of the same routing.
