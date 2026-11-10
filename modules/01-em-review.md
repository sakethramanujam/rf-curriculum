# 01 — Electromagnetic review

**Map to the book:** Pozar, *Microwave Engineering*, 4th ed., Chapter 1 (Electromagnetic Theory), especially the sections on Maxwell's equations, constitutive relations, boundary conditions, the wave equation, uniform plane waves, polarization, energy and power (Poynting), and reflection/transmission at a dielectric interface. This note is a study sheet written from first principles, not a transcription of the chapter.

## Learning objectives

- Write Maxwell's equations in differential and phasor form, and state what each one constrains.
- Recover the Helmholtz wave equation in a source-free, linear, isotropic region, and identify the wavenumber \(k\).
- Compute intrinsic impedance, wavelength, phase velocity, and skin depth, and know when a conductor is a good conductor.
- Use the time-average Poynting vector to get power density, and apply Snell's law plus the Fresnel coefficients at a planar interface.
- Tie these ideas to a WR3.4 waveguide measurement: what "air-filled" means for \(k\) and \(\eta\), and why metal walls still have finite conductivity.

## Field equations, stated compactly

In the time domain, Faraday, Ampère (with Maxwell's displacement current), Gauss for \(\mathbf{D}\), and Gauss for \(\mathbf{B}\) are the complete set. For a time-harmonic field \(e^{j\omega t}\) in a linear isotropic medium \(\mathbf{D}=\varepsilon\mathbf{E}\), \(\mathbf{B}=\mu\mathbf{H}\), \(\mathbf{J}=\sigma\mathbf{E}\),

\[
\nabla\times\mathbf{E} = -j\omega\mu\mathbf{H},
\qquad
\nabla\times\mathbf{H} = (\sigma+j\omega\varepsilon)\mathbf{E} + \mathbf{J}_\text{imp},
\]

\[
\nabla\cdot\mathbf{E} = \rho/\varepsilon,
\qquad
\nabla\cdot\mathbf{B} = 0.
\]

The complex permittivity \(\varepsilon_c=\varepsilon-j\sigma/\omega\) lets you fold ohmic loss into the dielectric constant. The loss tangent is \(\tan\delta=\varepsilon''/\varepsilon'\) (or \(\sigma/\omega\varepsilon\) for a simple conductor model). At THz, a lot of "dielectric loss" in plastics and photoresists is a large \(\tan\delta\), not a DC conductivity you would quote from a datasheet at 60 Hz.

Boundary conditions, in one line: the tangential \(\mathbf{E}\) difference equals the magnetic surface current (usually zero), the tangential \(\mathbf{H}\) difference equals the electric surface current, the normal \(\mathbf{B}\) is continuous, and the normal \(\mathbf{D}\) difference equals free surface charge.

## Uniform plane waves

In a source-free region the electric field satisfies

\[
\nabla^2\mathbf{E} + k^2\mathbf{E} = 0,
\qquad
k = \omega\sqrt{\mu\varepsilon_c}.
\]

A \(+\hat{z}\) traveling plane wave is \(\mathbf{E}=\hat{x}E_0 e^{-jkz}\), with

\[
\eta = \sqrt{\frac{\mu}{\varepsilon_c}},
\qquad
\mathbf{H}=\hat{y}\frac{E_0}{\eta}e^{-jkz}.
\]

In free space, using \(\mu_0=4\pi\times10^{-7}\) H/m and \(\varepsilon_0=8.854\times10^{-12}\) F/m,

\[
\eta_0=\sqrt{\mu_0/\varepsilon_0}\approx 376.73~\Omega
\quad\text{(often rounded to \(120\pi\approx377~\Omega\))},
\]

\[
c=1/\sqrt{\mu_0\varepsilon_0}=2.99792458\times10^8~\text{m/s}.
\]

In these notes, worked arithmetic uses \(c=3.00\times10^8\) m/s unless a more precise value is stated. Wavelength, phase velocity, and group velocity in a lossless simple medium are \(\lambda=2\pi/k\), \(v_p=\omega/k=1/\sqrt{\mu\varepsilon}\), \(v_g=v_p\).

Polarization is the locus of \(\mathbf{E}\) in time at a fixed plane: linear if the two transverse components are in phase (or if only one is present), circular if they are equal-amplitude and \(\pm90^\circ\) apart, elliptical otherwise. A single-mode rectangular waveguide mode is linearly polarized in the guide's transverse plane; a corrugated horn or a waveguide quarter-wave plate is how you get circular polarization at THz.

## Skin depth and good conductors

For a good conductor (\(\sigma\gg\omega\varepsilon\)),

\[
\delta=\sqrt{\frac{2}{\omega\mu\sigma}}=\frac{1}{\sqrt{\pi f\mu\sigma}},
\qquad
\eta_c\approx(1+j)\frac{1}{\sigma\delta}.
\]

The field decays as \(e^{-x/\delta}\) into the metal, and a useful surface impedance for loss calculations is \(Z_s=1/(\sigma\delta)\) (real part). Copper with \(\sigma=5.8\times10^7\) S/m at 10 GHz has \(\delta=0.66~\mu\)m. At 270 GHz the same formula gives \(\delta\approx0.13~\mu\)m, which is why waveguide wall roughness and gold-flash quality actually show up in WR3.4 insertion loss. The "perfect electric conductor" boundary you use to derive TE/TM modes is an excellent first approximation for the *field pattern*, and a terrible approximation for the *attenuation*.

## Power and interfaces

The time-average power flux is

\[
\mathbf{S}_\text{av}=\tfrac12\mathrm{Re}\{\mathbf{E}\times\mathbf{H}^*\}
\quad\text{(W/m$^2$)}.
\]

At a planar dielectric interface, phase matching forces Snell's law, \(k_1\sin\theta_1=k_2\sin\theta_2\). The Fresnel reflection coefficients differ for perpendicular (TE) and parallel (TM) incidence, and the TM coefficient vanishes at Brewster's angle. Total internal reflection appears when the transmitted angle would be imaginary. You will meet a close cousin of this in the next modules: a waveguide mode below cutoff is an evanescent wave, the same mathematics as a totally reflected field in the rarer medium.

## Worked example — skin depth and surface resistance at 10 GHz and 270 GHz

Take copper, \(\sigma=5.8\times10^7\) S/m, \(\mu=\mu_0\), and \(c=3.00\times10^8\) m/s only as a spectator (skin depth does not use \(c\)).

\[
\delta(10~\text{GHz})=\frac{1}{\sqrt{\pi\cdot10^{10}\cdot4\pi\times10^{-7}\cdot5.8\times10^{7}}}
=6.61\times10^{-7}~\text{m}=0.661~\mu\text{m}.
\]

\[
R_s(10~\text{GHz})=\frac{1}{\sigma\delta}=0.0261~\Omega/\text{sq}.
\]

Scaling: \(\delta\propto1/\sqrt{f}\), so at 270 GHz

\[
\delta(270~\text{GHz})=\delta(10~\text{GHz})\sqrt{10/270}=0.127~\mu\text{m},
\qquad
R_s(270~\text{GHz})=0.136~\Omega/\text{sq}.
\]

A WR3.4 wall is many skin depths thick, so the field does not leak through the metal; the loss is a surface-current ohmic loss set by \(R_s\). If the machined roughness is itself a fraction of a micron, it is no longer a small perturbation at 270 GHz.

## Lab notes

- A VNA reports \(S_{11}\) in a defined reference impedance. The electromagnetic quantity behind that number is a reflection coefficient for a particular propagating mode, not a mystical "S-parameter of space."
- WR3.4 extenders launch the TE\(_{10}\) mode in air-filled guide. Inside the guide, \(k_z\neq k_0\) (see module 03), but in a quasi-optical path after a feed horn the wave is essentially a free-space beam with \(k=k_0\) and \(\eta\approx\eta_0\).
- When you throw away a calibration or leave a flange poorly torqued, you are usually looking at an unintended interface reflection — exactly the Fresnel problem, plus a higher-order mode sitting near the discontinuity.
