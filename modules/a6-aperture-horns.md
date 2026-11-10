# A6 — Aperture antennas and horns

**Map to the book:** Balanis, Chapters 12–13 (Aperture Antennas; Horn Antennas): radiation from a rectangular or circular aperture in a screen, the uniform and TE\(_{10}\)-tapered rectangular apertures, pyramidal and conical horns, the optimum-gain horn flare, and a short mention of corrugated horns. Original study note.

## Learning objectives

- Estimate the directivity of an aperture as \(D=4\pi A\,e_a/\lambda^2\), and give a realistic range for the aperture efficiency \(e_a\).
- Explain why a uniform aperture has the highest directivity for a given area, and why a TE\(_{10}\) taper lowers sidelobes in one plane.
- Sketch a pyramidal horn, and state the trade between flare length (phase error) and aperture size (geometric area).
- Apply this to a WR3.4 horn: start from the waveguide TE\(_{10}\) field, flare, and radiate.

## Apertures

Once Love's equivalence (module a2) has replaced the aperture field \(\mathbf{E}_a\) by a magnetic surface current, the far field is a 2-D Fourier transform of that aperture field. Two immediate consequences:

- The larger the aperture in wavelengths, the narrower the beam and the higher the directivity.
- A tapered aperture field has lower sidelobes and a slightly fatter main beam than a uniform aperture of the same size.

A useful first-cut directivity is

\[
D=\frac{4\pi A}{\lambda^2}e_a,
\]

where \(e_a\) (aperture efficiency) collects taper efficiency and, in a real antenna, spillover, phase error, and ohmic loss if you are really talking about gain. A uniformly illuminated rectangular aperture has \(e_a=1\) *as a taper efficiency*, with a 13.3 dB first sidelobe in each principal plane. A TE\(_{10}\) (cosine-tapered in one direction, uniform in the other) aperture, the natural field of an open-ended waveguide or a pyramidal horn, has a lower taper efficiency (around 0.8 from taper alone) and a first H-plane sidelobe much lower than 13 dB.

An open-ended WR3.4 waveguide is itself an aperture of 0.86 mm × 0.43 mm. At 270 GHz that is only \(0.78\lambda\times 0.39\lambda\), so the directivity is modest (single digits of dBi) and the pattern is very wide — which is why we flare it into a horn.

## Horns

A pyramidal horn flares the rectangular guide in both E and H, with flare lengths \(L_E,L_H\) and aperture sides \(a_E,a_H\). The flare gives you a larger \(A\), hence higher directivity, but it also puts a quadratic phase error on the aperture field. "Optimum" horn design (the usual tables and approximate formulas) chooses the flare so that the extra area is worth the phase-error penalty. Typical *gain* efficiencies for a well-designed pyramidal horn sit near 0.5, which is why the rough formula \(G\approx 0.5\cdot 4\pi A/\lambda^2\) is a popular first estimate.

Corrugated (scalar) horns and dual-mode (Potter) horns are how you get a nearly symmetric beam and low cross-pol, which is what you want when you feed a reflector or a quasi-optical bench. The corrugations enforce a hybrid HE\(_{11}\)-like aperture field, not a raw TE\(_{10}\).

## Worked example — a small WR3.4 pyramidal horn

A machined pyramidal horn has an aperture of 8.00 mm × 6.00 mm and is used at 270 GHz (\(\lambda=1.111\) mm). Take \(e_a=0.50\) as a gain-efficiency estimate (taper + phase error + a bit of loss). Then

\[
G=\frac{4\pi\cdot(0.008\cdot0.006)}{(1.111\times10^{-3})^2}\cdot 0.50=244=23.9~\text{dBi}.
\]

The uniformly illuminated upper bound (\(e_a=1\)) would be 26.9 dBi, three decibels higher, and is not achievable with a simple flare. The far-field distance for this aperture is

\[
R\ge\frac{2D^2}{\lambda}=\frac{2(0.010)^2}{1.111\times10^{-3}}=0.18~\text{m}
\]

using the diagonal \(D=\sqrt{8^2+6^2}=10\) mm, so a 1 m bench path is comfortably far-field *for the horn alone*. (It is not far-field for a 10 cm reflector on the same bench; see module a7 and a1.)

## Lab notes

- WR3.4 horns are small enough to hold in two fingers and easy to ding. A crushed flare is a phase-error and a sidelobe problem, not just a cosmetic one.
- Gain transfer measurements (module a10) of a THz horn are limited by standing waves between two horns on a short bench. A time-domain gate, a small z-dither, or a spot of absorber on the table is part of the measurement, not an afterthought.
- If the horn is used as a feed, what you actually care about is the pattern *at the opening angle of the reflector or lens*, plus the phase-center location (which moves with frequency, and is not exactly at the flare apex).
