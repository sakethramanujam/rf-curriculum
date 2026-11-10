# A4 — Loop antennas

**Map to the book:** Balanis, Chapter 5 (Loop Antennas): the small circular loop, its radiation resistance and pattern (dual to the short dipole), larger constant-current and non-constant-current loops, and a brief look at ferrite-loaded and multi-turn loops. Original study note.

## Learning objectives

- Write the far-field of a small loop (a magnetic dipole) and quote the duality with the Hertzian dipole.
- Compute \(R_r=20\pi^2(C/\lambda)^4\) for a small single-turn loop, and know when "small" (\(C\lesssim\lambda/3\)) has been violated.
- Explain why a small loop is a worse radiator (even smaller \(R_r\)) than a short dipole of comparable size, and where that is actually a feature (probes, magnetically coupled near-field links).

## The small loop

A single-turn circular loop of radius \(a\), circumference \(C=2\pi a\), carrying a uniform phasor current \(I_0\), with \(C\ll\lambda\), is a magnetic dipole of moment \(m=I_0\cdot\pi a^2\). Placed in the \(xy\)-plane, its far-field \(E_\phi\) has a \(\sin\theta\) pattern — the same doughnut as a \(z\)-directed Hertzian *electric* dipole, but with the electric field polarized the other way. Duality makes this precise: the small loop's \(\mathbf{E}\) looks like the short dipole's \(\mathbf{H}\), and vice versa.

Radiation resistance of a single-turn small loop in free space (the standard thin-loop result) is

\[
R_r=20\pi^2\left(\frac{C}{\lambda}\right)^4
=31200\left(\frac{A}{\lambda^2}\right)^2
\quad\text{(approximately; \(A=\pi a^2\))}.
\]

The fourth-power dependence is brutal: shrink the loop a little and \(R_r\) collapses. A multi-turn small loop of \(N\) turns (still small compared with \(\lambda\), and neglecting proximity) scales as \(N^2\). The pattern and the directivity stay those of a short magnetic dipole, \(D=1.5\), as long as the loop remains small.

The input impedance is that small \(R_r\) plus a (typically dominant) inductive reactance \(\omega L\), plus loss resistance. Efficiency is often poor unless the loop is made resonant with a capacitor and the conductor is very good — the NFC / RFID situation, not the THz one.

## Worked example — how small is "small" at 270 GHz

At 270 GHz, \(\lambda=1.111\) mm. A loop of radius \(a=\lambda/25=44.4~\mu\)m has \(C/\lambda=2\pi/25=0.251\), so

\[
R_r=20\pi^2(0.2513)^4=0.788~\Omega.
\]

The 31\,200-formula check: \(A/\lambda^2=\pi(1/25)^2=0.005027\), \(31200\times(0.005027)^2=0.788~\Omega\). Directivity is still 1.76 dBi, but a 0.79 Ω radiation resistance next to even a tenth of an ohm of gold loss is an efficiency disaster. A loop with \(C=\lambda/3\) (\(a=\lambda/(6\pi)=59~\mu\)m) is the edge of the "small" approximation; \(C/\lambda=0.333\), \(R_r=20\pi^2(0.333)^4=2.44~\Omega\), still tiny, and the uniform-current assumption is already fraying.

At THz, a "loop" you would actually radiate with is a resonant (about one-wavelength circumference) printed loop or a slot loop, which is not this chapter's small-loop formula.

## Lab notes

- Small loops make excellent *magnetic-field probes* for near-field bench work, including at microwave frequencies, because they respond to \(\mathbf{H}\) and can be made electrically small. Shielded-loop (Moebius, half-shield) constructions reject the electric-field pickup that a bare loop would have. At WR3.4 the same idea exists, but the "small" loop is tens of microns and is usually a lithographed structure on a probe chip, not a wire you solder.
- A loop next to a ground plane, or a loop used as a waveguide-wall coupler, is a different boundary-value problem than the free-space small loop. Do not drop the 20\(\pi^2\) formula onto a flange and expect the \(S_{11}\) to agree.
