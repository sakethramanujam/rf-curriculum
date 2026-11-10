# 04 — Microwave network analysis and S-parameters

**Map to the book:** Pozar, Chapter 4 (Microwave Network Analysis): impedance, admittance and ABCD matrices, equivalent-circuit representations, the scattering matrix, conversion between representations, signal-flow graphs, and the packed meaning of reciprocity, losslessness, and symmetry. Original study note.

## Learning objectives

- Define \(S_{ij}\) in terms of incident and reflected normalized waves, including the "all other ports matched" condition.
- Convert a one-port \(Z_L\) to \(S_{11}\), and write \(\Gamma_\text{in}\) of a two-port with a load \(\Gamma_L\).
- Use reciprocity (\(S=S^T\) for reciprocal networks in a consistent normalization) and the unitary condition for a lossless network.
- Read a two-port VNA screen: \(S_{11}\) match, \(S_{21}\) insertion, \(S_{12}\) isolation/reverse, \(S_{22}\) output match, and why a poor output match can still sit on a well-matched input.
- Know why THz waveguide extenders are usually one-path or two-port with careful coupler correction, and what a ripple in \(S_{21}\) is trying to tell you.

## Power waves and the S-matrix

With a real reference impedance \(Z_0\) (the usual case), the incident and reflected waves at port \(n\) can be written

\[
a_n=\frac{V_n+Z_0 I_n}{2\sqrt{Z_0}},
\qquad
b_n=\frac{V_n-Z_0 I_n}{2\sqrt{Z_0}},
\]

so that \(\tfrac12(|a_n|^2-|b_n|^2)\) is the net power into the port. Then

\[
\mathbf{b}=\mathbf{S}\,\mathbf{a},
\qquad
S_{ij}=\left.\frac{b_i}{a_j}\right|_{a_k=0,\,k\neq j}.
\]

\(S_{11}\) is therefore the reflection coefficient at port 1 *when every other port is terminated in a matched load*. For a one-port this collapses to

\[
S_{11}=\Gamma=\frac{Z_L-Z_0}{Z_L+Z_0}.
\]

For a two-port driving a load with reflection \(\Gamma_L\),

\[
\Gamma_\text{in}=S_{11}+\frac{S_{12}S_{21}\Gamma_L}{1-S_{22}\Gamma_L}.
\]

So \(\Gamma_\text{in}=S_{11}\) only if port 2 is matched (\(\Gamma_L=0\)) or if the device is unilateral with \(S_{12}=0\). This is the formula you use when a WR3.4 antenna under test is *not* looking into a perfect absorber.

Impedance and admittance matrices still matter: series and shunt elements are trivial in \(Z\) or \(Y\), cascaded two-ports are trivial in ABCD. In practice you measure \(S\), convert if you need to embed a fixture, and convert back. The conversions are algebraic; the failure mode is using the wrong \(Z_0\), especially when one port is waveguide and the other is a 50 Ω probe.

## Reciprocity, losslessness, symmetry

- A reciprocal network made of isotropic materials has a symmetric S-matrix, \(S_{ij}=S_{ji}\), when the port normalizations are chosen consistently. Ferrites break this (module 09).
- A lossless network has a unitary S-matrix, \(\mathbf{S}^\dagger\mathbf{S}=\mathbf{I}\). For a two-port that implies, among other things, \(|S_{11}|=|S_{22}|\) and \(|S_{21}|=|S_{12}|\), and \(|S_{11}|^2+|S_{21}|^2=1\).
- A symmetrical two-port additionally has \(S_{11}=S_{22}\).

Unitarity is a checksum on a waveguide measurement: if you measure a passive through-line with \(|S_{11}|^2+|S_{21}|^2\) noticeably above 1, the calibration is lying. Below 1 is either loss or, again, a bad cal / a mode radiating out of a flange.

## Worked example — checking unitarity and \(\Gamma_\text{in}\)

Suppose a reciprocal two-port, referred to 50 Ω, is measured (linear, not dB) as

\[
S_{11}=0.20,\quad S_{21}=0.90,\quad S_{12}=0.90,\quad S_{22}=0.20
\]

(all real, to keep the arithmetic transparent — a real physical device would also have phase). Then \(|S_{11}|^2+|S_{21}|^2=0.04+0.81=0.85\neq1\), so the network is lossy, with a 15% dissipation / radiation fraction when port 2 is matched. Now terminate port 2 with \(\Gamma_L=0.5\) (a real 150 Ω load on 50 Ω):

\[
\Gamma_\text{in}=0.20+\frac{(0.90)(0.90)(0.5)}{1-0.20\cdot0.5}
=0.20+\frac{0.405}{0.90}=0.650.
\]

The input is much worse than \(S_{11}\) alone suggested. If you only looked at a one-port measurement of a two-port sitting on a badly matched extender, you would mis-attribute that 0.650 to the device.

## Lab notes

- Sweep \(S_{11}\) on a Smith chart and in log-mag at the same time. A loop on the chart that shrinks with frequency is often loss; a loop that does not shrink is a resonance plus a length of line.
- WR3.4 extenders have their own couplers, conversion loss, and raw directivity. A good TRL cal moves the reference plane to the flange. Changing the torque, adding a 90° E-plane bend, or letting the extender drift in temperature all walk the residual directivity, which shows up as a ripple on a well-matched load (the classic "cal is tired" signature).
- Dynamic range at 270 GHz is precious. Average, reduce IF bandwidth, and do not trust a noise-floor \(S_{21}\) of −70 dB if the raw trace is bouncing by 10 dB.
- Reciprocity is a diagnostic: if \(S_{21}\) and \(S_{12}\) of a supposedly reciprocal fixture disagree by more than the instrument uncertainty, something is nonlinear, drifting, or mis-calibrated — or a ferrite sneaked in.
