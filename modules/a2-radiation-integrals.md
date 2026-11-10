# A2 — Radiation integrals and auxiliary potentials

**Map to the book:** Balanis, Chapter 3 (Radiation Integrals and Auxiliary Potential Functions): the magnetic vector potential \(\mathbf{A}\) (and electric vector potential \(\mathbf{F}\) for magnetic currents), the radiation integral, far-field approximations, and the equivalence principle (Huygens / Love) that lets you replace an aperture by equivalent surface currents. Original study note.

## Learning objectives

- Write \(\mathbf{B}=\nabla\times\mathbf{A}\) (plus a possible \(\mathbf{F}\) term) and the far-field \(\mathbf{E}\) in terms of the transverse components of \(\mathbf{A}\).
- Set up the radiation integral for a known electric current \(\mathbf{J}\), and apply the far-field (Fraunhofer) approximation \(e^{-jk|\mathbf{r}-\mathbf{r}'|}\approx e^{-jkR}e^{jk\hat{r}\cdot\mathbf{r}'}\).
- State Love's equivalence principle for an aperture, and explain why a horn or a reflector calculation starts from "magnetic current over the aperture" rather than from every current on the metal.

## Potentials and the radiation integral

In a linear homogeneous region it is convenient to derive \(\mathbf{B}\) from a magnetic vector potential sourced by electric current,

\[
\mathbf{A}(\mathbf{r})=\frac{\mu}{4\pi}\int_V\mathbf{J}(\mathbf{r}')\frac{e^{-jk|\mathbf{r}-\mathbf{r}'|}}{|\mathbf{r}-\mathbf{r}'|}\,dV',
\]

and, if magnetic surface currents \(\mathbf{M}\) are introduced by equivalence, a dual electric vector potential \(\mathbf{F}\). In the far field the radial components vanish and

\[
E_\theta=-j\omega A_\theta-j\omega\eta F_\phi,
\qquad
E_\phi=-j\omega A_\phi+j\omega\eta F_\theta,
\]

up to the common \(e^{-jkR}/R\) spherical-wave factor (conventions for \(\mathbf{F}\) differ by a sign in some texts; be consistent with one book when you compute). The useful operational fact: once you know the *transverse* far-field potentials, you know \(\mathbf{E}\) and then \(\mathbf{H}=\hat{R}\times\mathbf{E}/\eta\).

The Fraunhofer step replaces the exact distance in the exponent by a linear phase \(k\hat{r}\cdot\mathbf{r}'\), and the denominator by \(R\). That is legal when \(R\) is large compared with the source size *and* you are outside \(2D^2/\lambda\). Inside that, you keep a Fresnel (quadratic) term, or you just integrate the exact kernel numerically — which is what a near-field-to-far-field transform is doing.

## Equivalence, in the form you will actually use

Love's equivalence principle: a closed surface around sources can be replaced by the original fields *outside*, zero fields inside, and surface currents

\[
\mathbf{J}_s=\hat{n}\times\mathbf{H},
\qquad
\mathbf{M}_s=-\hat{n}\times\mathbf{E}
\]

on the surface. For an aperture in a conducting screen, the usual move is to take \(\mathbf{M}_s=-2\hat{n}\times\mathbf{E}_a\) in the aperture and \(\mathbf{J}_s=0\) (the physical-optics / image form for a planar conducting screen). The radiation integral over that \(\mathbf{M}_s\) *is* the aperture-antenna calculation of module a6.

The same principle is why "I only know the field in the mouth of the horn, not the current on every wall" is a complete enough starting point.

## Worked example — far-field phase of a two-element current

Two \(z\)-directed Hertzian elements, equal current \(I_0\Delta\ell\), sit at \(x=\pm d/2\), with \(d=\lambda/2\). In the far field in the \(xy\)-plane (\(\theta=90^\circ\)) the array phase factor for the observation angle \(\phi\) from the \(x\)-axis is

\[
\psi=kd\cos\phi=\pi\cos\phi.
\]

The total potential is proportional to \(2\cos(\psi/2)=2\cos((\pi/2)\cos\phi)\), so the pattern has a null at \(\phi=0\) (along the line of elements: the two contributions are \(180^\circ\) out of phase because \(kd=\pi\)) and a peak at \(\phi=90^\circ\). This is the broadside two-element array, derived from the radiation integral before any "array factor" vocabulary is introduced. (Module a5 packages the same arithmetic for \(N\) elements.)

A useful number: at 270 GHz, \(\lambda/2=0.556\) mm. Two probe tips that far apart, driven in phase, already have a two-lobe pattern in the H-plane and cannot be treated as a single point source in a THz near-field scan.

## Lab notes

- When you "integrate the aperture field" of a WR3.4 horn to predict gain, you are applying this chapter. The error term is whatever field you did not measure (evanescent flange modes, outer-wall current, a reflection from the optical table).
- A VNA plus a scanned probe is a machine for measuring \(\mathbf{E}_a\) (or a proxy for it). Transforming that scan to a far-field pattern is a discrete radiation integral. Probe correction, scan-plane leakage, and aliasing of the evanescent spectrum are the practical footnotes.
