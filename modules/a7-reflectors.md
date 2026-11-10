# A7 — Reflector antennas

**Map to the book:** Balanis, Chapter 15 (Reflector Antennas): the paraboloidal reflector, geometric optics and physical optics, focal length and \(f/D\), illumination, spillover, aperture efficiency, and a look at Cassegrain / Gregorian dual-reflector systems. Original study note.

## Learning objectives

- Write the gain of a circular paraboloid, \(G=\eta_A(\pi D/\lambda)^2\), and budget \(\eta_A\) into illumination, spillover, blockage, and surface-error terms.
- Use Ruze's rule of thumb: surface rms error \(\varepsilon_\text{rms}\) costs a factor \(\exp[-(4\pi\varepsilon_\text{rms}/\lambda)^2]\).
- Choose an \(f/D\) as a compromise between a shallow dish (easy feed, more spillover if the feed is broad) and a deep dish (better amplitude taper, worse cross-pol and feed mismatch).
- Apply the numbers to a 30 cm dish at 270 GHz, including the far-field distance.

## Paraboloid basics

A paraboloidal reflector converts a spherical wave from a feed at the focus into a plane wave in the aperture (geometric optics), or equivalently, applies a focusing phase shift to the feed pattern. The geometric aperture is \(A=\pi D^2/4\), and

\[
G=\eta_A\left(\frac{\pi D}{\lambda}\right)^2=\eta_A\frac{4\pi A}{\lambda^2}.
\]

The aperture efficiency \(\eta_A\) is typically 0.5–0.7 for a well-designed single reflector: illumination (the feed taper across the dish), spillover (feed power that misses the dish), blockage (feed and struts), phase error, and (at THz especially) surface accuracy. A low \(f/D\) (a deep dish) lets a moderately directive feed under-illuminate the rim, reducing spillover at the cost of a more poorly matched / higher-cross-pol feed environment. A high \(f/D\) wants a more directive feed, often a corrugated horn, or a dual-reflector (Cassegrain) arrangement that lets you put the horn behind the main dish.

Ruze's approximation for a random surface error of rms \(\varepsilon_\text{rms}\), assumed with a correlation length that is not tiny, is

\[
\eta_\text{surface}\approx\exp\left[-\left(\frac{4\pi\varepsilon_\text{rms}}{\lambda}\right)^2\right].
\]

At 270 GHz, \(\lambda=1.111\) mm, so \(\varepsilon_\text{rms}=50~\mu\)m already gives \(4\pi\varepsilon/\lambda=0.565\), \(\eta_\text{surface}=0.73\) (−1.4 dB). A 100 \(\mu\)m rms, which is "pretty flat" to a machinist, is \(4\pi\varepsilon/\lambda=1.13\), \(\eta_\text{surface}=0.28\) (−5.5 dB) — a destroyed dish. THz reflectors are optical-quality surfaces, not backyard satellite dishes.

## Worked example — a 30 cm dish at 270 GHz

\(D=0.300\) m, \(\lambda=1.111\times10^{-3}\) m, \(\eta_A=0.60\) (a reasonably careful feed, good surface). Then

\[
G=0.60\left(\frac{\pi\cdot0.300}{1.111\times10^{-3}}\right)^2=4.32\times10^5=56.35~\text{dBi}.
\]

The ideal uniform-aperture ceiling is \(G=(\pi D/\lambda)^2=7.20\times10^5=58.57\) dBi, so we are 2.2 dB below that, consistent with \(\eta_A=0.60=-2.22\) dB. A popular half-power beamwidth estimate, \(70\,\lambda/D\) degrees, gives

\[
\text{HPBW}\approx 70\cdot\frac{1.111}{300}=0.26^\circ.
\]

The far-field distance is \(2D^2/\lambda=162\) m. You will not measure this pattern in a 3 m lab. You will either scan the near field (module a10), use a compact range / collimating mirror, or accept a focus-to-focus quasi-optical measurement of coupling rather than a true far-field pattern.

If the surface rms is 50 \(\mu\)m instead of "perfect," knock another 1.4 dB off, and the working gain is about 55.0 dBi.

## Lab notes

- Alignment at 270 GHz is an optical problem. A 0.26° beam, with a feed phase center that must sit on the geometric focus to a small fraction of a millimeter, is why THz reflector benches have translation stages and visible-laser bore-sights.
- A WR3.4 horn feeding a 30 cm dish is a classic \(f/D\) design exercise: the horn's 10 dB beamwidth should roughly fill the dish angle. Over-illuminate and you pay in spillover (and in stray reflections on the bench); under-illuminate and you throw away aperture.
- Blockage and strut scattering show up as near-in sidelobes and as a coherent pedestal in an image. A self-supporting offset reflector avoids the blockage at the cost of a less symmetric pattern and a slightly harder alignment.
