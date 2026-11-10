# A9 — Broadband and frequency-independent antennas

**Map to the book:** Balanis, Chapters 9–11 (broadband dipoles and matching; traveling-wave antennas; frequency-independent antennas): fat dipoles and biconical antennas, traveling-wave wires (V, rhombic, helical in axial mode), the spiral, and the log-periodic dipole array. Original study note.

## Learning objectives

- State the Rumsey frequency-independence principle: an antenna specified only by angles has, in principle, a frequency-independent pattern and impedance.
- Distinguish "electrically fat but still resonant" (a fat dipole, a bow-tie: maybe 2:1 bandwidth) from truly frequency-independent (spiral, LPDA: a decade is possible).
- Quote the axial-mode helix conditions (circumference \(\approx\lambda\), pitch angle \(\approx 12^\circ\)–\(14^\circ\)) and its circular polarization.
- Know what of this survives at THz (lithographed spirals and log-periodics, yes; a wire helix, rarely).

## Making a dipole broader, then leaving the dipole behind

A thin half-wave dipole is a high-\(Q\) resonance: a few percent bandwidth. Thickening the dipole (or making a bow-tie / a bicone) lowers the Q of that resonance and can give you something like 2:1 of usable VSWR, but there is still a lowest frequency set by the overall length, and a highest frequency set by pattern breakup. A traveling-wave long-wire or a rhombic, terminated in a load, trades efficiency for a smoother, directional pattern over a wider band.

Rumsey's principle: if the geometry, in wavelengths, looks the same at every frequency — which means the actual metal is defined by *angles*, not by lengths — the impedance and the pattern cannot depend on frequency, except through the truncation. A planar or conical spiral is the cleanest example: the active radiation region is a ring about one wavelength in circumference, which slides inward as frequency rises. The finite inner radius sets \(f_\max\); the outer radius sets \(f_\min\). A well-built spiral can cover a decade, with a nearly circularly polarized, bidirectional (or, with a cavity, unidirectional) pattern.

A log-periodic dipole array (LPDA) is a *discrete* frequency-independent design: a sequence of dipoles scaled by a constant \(\tau<1\), with a transposed feed, so that at any frequency a few neighboring elements are "active." The pattern is linearly polarized and unidirectional (toward the short end). Bandwidth is again set by the shortest and longest elements.

An axial-mode helix, with \(C\approx\lambda\) and a pitch angle around \(12^\circ\)–\(14^\circ\), is a circularly polarized endfire antenna of modest bandwidth (maybe 1.5:1 to 2:1), very useful as a feed or as a wideband CP element, but it is not frequency-independent in the Rumsey sense.

## Worked example — sizing a two-octave spiral

You want a planar equiangular spiral to cover 2.00 GHz to 8.00 GHz (two octaves) in free space. A conservative rule is that the active region is near \(C=\lambda\), so the outer radius should be at least \(a_\text{out}\gtrsim\lambda_\text{max}/(2\pi)\):

\[
a_\text{out}\gtrsim\frac{3.00\times10^8}{2\pi\cdot2.00\times10^9}=23.9~\text{mm},
\]

and the inner radius should be no larger than

\[
a_\text{in}\lesssim\frac{3.00\times10^8}{2\pi\cdot8.00\times10^9}=6.0~\text{mm}.
\]

In practice you add margin: a bit more than \(a_\text{out}\) (the outer turn is not fully used) and a bit less than \(a_\text{in}\) (the feed region is messy), plus a balun that itself must be broadband. At 270 GHz the same rules give \(a_\text{out}\gtrsim\lambda/(2\pi)=0.177\) mm for a lower edge of 270 GHz; a spiral that starts at 110 GHz and runs through 330 GHz would have \(a_\text{out}\gtrsim0.43\) mm and \(a_\text{in}\lesssim0.14\) mm, which is a lithography problem, not a wire-bending problem.

## Lab notes

- Spirals and LPDAs have a phase center that moves with frequency, sometimes a lot. That motion is a problem if the antenna is a reflector feed (it defocuses at the band edges) and a feature if you are building a wideband direction-finding or an imaging interferometer and you *account* for it.
- A cavity-backed spiral is how you make the pattern unidirectional; the cavity depth and the absorber in it set a low-frequency wall and a loss penalty. At THz a cavity 0.25 mm deep is already a quarter-wave at 300 GHz, so this is fabricable, but the absorber quality is the efficiency.
- Wideband \(S_{11}\) on a VNA is only half the acceptance test. The pattern and the axial ratio (for a spiral or a helix) over the same band are the other half, and they are the half people skip.
