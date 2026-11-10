# A3 — Linear dipoles and monopoles

**Map to the book:** Balanis, Chapter 4 (Linear Wire Antennas): the infinitesimal (Hertzian) dipole, the small dipole, the finite-length dipole with a sinusoidal current assumption, the half-wave dipole, near- and far-field expressions, radiation resistance and directivity vs. length, and the monopole over a ground plane. Original study note.

## Learning objectives

- Write \(E_\theta\) and \(R_r\) for a Hertzian dipole of length \(\Delta\ell\), and quote \(D=1.5\).
- Use the sinusoidal-current far-field pattern of a \(z\)-directed dipole of length \(L\), and specialize to \(L=\lambda/2\).
- Recite the half-wave dipole's radiation resistance (\(\approx 73~\Omega\)) and directivity (\(\approx 1.64\), 2.15 dBi).
- Obtain monopole numbers from the dipole by the image principle: half the power, half the impedance, same pattern above the plane.

## Hertzian and small dipoles

A current \(I_0\) on a \(z\)-directed element \(\Delta\ell\ll\lambda\), at the origin, radiates (far field)

\[
E_\theta=j\eta\frac{k I_0\Delta\ell}{4\pi}\sin\theta\,\frac{e^{-jkR}}{R},
\qquad
H_\phi=E_\theta/\eta.
\]

The \(\sin\theta\) pattern is the origin of the "doughnut" of a short dipole. Integrating the Poynting flux gives

\[
P_\text{rad}=\eta\frac{\pi}{3}\left(\frac{I_0\Delta\ell}{\lambda}\right)^2,
\qquad
R_r=\frac{2P_\text{rad}}{|I_0|^2}=80\pi^2\left(\frac{\Delta\ell}{\lambda}\right)^2
\quad(\eta=\eta_0).
\]

Directivity is 1.50. For \(\Delta\ell=\lambda/10\), \(R_r=7.90~\Omega\); for \(\Delta\ell=\lambda/20\), \(R_r=1.97~\Omega\). A short dipole is a small resistor in series with a large capacitive reactance — that is why it is hard to match and why its *realized* efficiency is often terrible once \(R_\text{loss}\) of the matching network is included.

A "small dipole" of length \(L<\lambda/10\) with a triangular (vanishing at the ends) current has the same pattern and a radiation resistance one-quarter of the uniform-current Hertzian of the same length, because the average current is half.

## Finite length and the half-wave dipole

Assuming \(I(z)=I_0\sin[k(L/2-|z|)]\) on a thin \(z\)-directed wire (a good approximation near the first resonance of a thin dipole), the far-field pattern is

\[
E_\theta\propto\frac{\cos\!\left(\tfrac{kL}{2}\cos\theta\right)-\cos\!\left(\tfrac{kL}{2}\right)}{\sin\theta}.
\]

For \(L=\lambda/2\), this reduces to \(\cos[(\pi/2)\cos\theta]/\sin\theta\). The radiation resistance referred to the driving point (the current maximum, which for a half-wave is at the feed) is about \(73~\Omega\), with a small reactance that passes through zero at a length slightly *under* \(\lambda/2\) (the exact shortening depends on the wire radius). Directivity is 1.643 (2.15 dBi). The 73 Ω is why a half-wave dipole is a reasonable thing to hang on a 75 Ω (or, with a bit of a mismatch, a 50 Ω) line.

A quarter-wave monopole over an infinite perfect ground is the top half of a half-wave dipole. Same pattern for \(z>0\), half the radiated power for the same feed current, therefore \(R_r\approx 36.5~\Omega\), and the same directivity *relative to isotropic in the half-space* as the dipole had in all space — but be careful with dBi vs. dB over a ground plane when someone quotes "monopole gain."

## Worked example — a short 270 GHz "dipole" on a wafer

A on-wafer gold bar, 0.200 mm long, is driven at 270 GHz (\(\lambda=1.111\) mm), so \(\Delta\ell/\lambda=0.180\). If we treat it as a Hertzian (uniform-current) element in free space, which is optimistic,

\[
R_r=80\pi^2(0.180)^2=25.6~\Omega.
\]

If the current is closer to triangular (ends almost open), \(R_r\) drops by about four, to 6.4 Ω. In either case the pattern is essentially \(\sin\theta\), \(D=1.76\) dBi, and the input reactance is a large capacitance set by the bar's width and the substrate. This is not a good antenna; it is a poorly matched, low-efficiency scatterer unless you embed it in a resonant structure (a patch, a slot, a leaky-wave, a dielectric resonator). That is why THz "dipoles" on chips are almost always part of a resonant, substrate-backed design, not a bare \(\lambda/10\) wire.

## Lab notes

- Measuring a dipole on a VNA requires a balun or a well-modeled transition. A coax soldered to one arm, with the shield grabbing the other, is a monopole-plus-feed-line, and its \(S_{11}\) is not the dipole's \(Z_\text{in}\).
- A quarter-wave monopole over a small ground is not the infinite-plane textbook monopole. The ground-plane edge radiates, the pattern tilts, and \(R_r\) moves. At THz, a "ground plane" a few millimeters across is already several wavelengths, so the infinite-plane model is actually *better* than it is at UHF, provided the flange and the launcher are under control.
