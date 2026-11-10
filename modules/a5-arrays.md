# A5 — Arrays

**Map to the book:** Balanis, Chapter 6 (Arrays: Linear, Planar, and Circular): two-element arrays, the N-element uniform linear array, ordinary endfire and Hansen–Woodyard, pattern multiplication, broadside vs. endfire, planar arrays, and a look at mutually coupled / non-uniform (binomial, Dolph–Chebyshev) tapering. Original study note.

## Learning objectives

- Write the array factor of an N-element uniformly excited, uniformly spaced linear array, and normalize it.
- Find the main-beam direction from \(\psi=kd\cos\theta+\beta=0\), and design \(\beta\) for broadside, ordinary endfire, or a scanned beam.
- Compute first-null locations and a numerical or approximate HPBW; know that \(d>\lambda/2\) invites grating lobes.
- Use pattern multiplication: element pattern times array factor.
- Run `python tools/array_factor.py` to check a design.

## The uniform linear array

N isotropic elements on the \(z\)-axis (Balanis' usual starting picture), spacing \(d\), progressive phase \(\beta\) (element \(n\) is driven at \(n\beta\)). The array factor is

\[
\text{AF}(\psi)=\frac{\sin(N\psi/2)}{\sin(\psi/2)},
\qquad
\psi=kd\cos\theta+\beta,
\]

and the normalized factor used for plotting is \(|\text{AF}|/N\). \(\theta\) here is measured from the *array axis*. (Some array papers measure from broadside; the cosine becomes a sine. Name your angle.)

The main beam sits where \(\psi=0\):

\[
\cos\theta_0=-\frac{\beta}{kd}.
\]

- Broadside: \(\beta=0\), beam at \(\theta=90^\circ\).
- Ordinary endfire: \(\beta=\mp kd\), beam at \(\theta=0\) or \(180^\circ\).
- Scanned to a chosen \(\theta_0\): \(\beta=-kd\cos\theta_0\).

Nulls of a uniform array are at \(\psi=\pm 2\pi m/N\), \(m=1,2,\ldots,N-1\). For a broadside array with \(d=\lambda/2\), the first nulls around the main beam satisfy \(\pi\cos\theta=\pm 2\pi/N\), so \(\cos\theta=\pm 2/N\). Grating lobes appear when \(\psi\) can be \(0\) and also a multiple of \(2\pi\) for a *different* visible \(\theta\); the usual preventative is \(d\le\lambda/2\) for a broadside array, and a tighter spacing for endfire.

A binomial taper kills sidelobes (in the ideal, isotropic-element case, they vanish) at the cost of a fatter main beam and a narrower match to the uniform-array directivity. A Dolph–Chebyshev taper gives the narrowest main beam for a prescribed sidelobe level.

Pattern multiplication: the true far-field of an array of *identical, identically oriented* elements is the single-element pattern times AF. A broadside array of \(z\)-dipoles has a null along the element axis that the AF cannot fill.

## Worked example — N = 8, d = λ/2, broadside

\(\beta=0\), \(kd=\pi\), \(\psi=\pi\cos\theta\). The main beam is at \(\theta=90^\circ\). First nulls: \(\psi=\pm 2\pi/8=\pm\pi/4\), so

\[
\cos\theta=\pm\frac14,
\qquad
\theta=75.52^\circ\text{ and }104.48^\circ.
\]

The first-null beamwidth is \(29.0^\circ\). A numerical half-power beamwidth (from `tools/array_factor.py`) is \(12.82^\circ\). A common large-\(N\) approximation, \(\text{HPBW}\approx 0.886\,\lambda/(Nd)\) radians for a broadside uniform array, gives

\[
0.886\cdot\frac{2}{8}\cdot\frac{180}{\pi}=12.67^\circ,
\]

within a couple of tenths of a degree of the numerical value already at \(N=8\).

If you instead scan the beam to \(60^\circ\) from the axis, \(\beta=-kd\cos 60^\circ=-\pi/2\). The first grating-lobe condition should be checked: for \(d=\lambda/2\), a scan this far still keeps the next \(\psi=2\pi\) lobe at the edge of or outside visible space, but further scans or larger \(d\) will not. Directivity also drops as the beam is scanned toward endfire (the projected aperture shrinks).

## Lab notes

- Mutual coupling is the reason a real WR3.4 horn array does not have the isolated-element pattern times AF, and why the driving-point impedance of an edge element is not that of a center element. At THz, horns packed at \(d\approx\lambda\) (because a horn mouth is itself \(\sim\lambda\)) *will* have grating lobes; you live with them or you use a tightly spaced printed array.
- A phased array at 270 GHz with analog phase shifters is a research object; many "arrays" in THz imaging are switched or are just a mechanically scanned single horn. The AF math is still how you analyze a sampled aperture (a scanned near-field or a focal-plane array).
- Use the helper to plot before you cut metal: `python tools/array_factor.py --n 8 --d 0.5 --out tools/output/af.png`.
