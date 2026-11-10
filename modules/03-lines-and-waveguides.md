# 03 — Transmission lines and waveguides

**Map to the book:** Pozar, Chapter 3 (Transmission Lines and Waveguides): coaxial, two-wire and microstrip/stripline pictures, rectangular and circular waveguide modes, cutoff, guide wavelength and wave impedance, attenuation, and cavities as a preview of Chapter 6. Original study note.

## Learning objectives

- State the TEM / TE / TM classification and why a hollow metal pipe cannot carry TEM.
- Compute TE\(_{10}\) cutoff, \(\beta\), \(\lambda_g\), and the wave impedance for air-filled rectangular guide, including WR90 and WR3.4 numbers.
- Explain why group velocity is below \(c\) and phase velocity is above \(c\), with \(v_p v_g=c^2\) in air-filled guide.
- Estimate conductor attenuation's frequency dependence, and know the practical bandwidth of a rectangular band (roughly \(1.25f_c\) to \(1.9f_c\)).
- Synthesize or analyze a microstrip width (use `tools/microstrip_width.py`).

## Coax and printed lines

A coaxial line is TEM (plus higher-order waveguide-like modes that appear when the mean circumference becomes comparable to \(\lambda\)). For a dielectric \(\varepsilon_r\),

\[
Z_0=\frac{\eta_0}{2\pi\sqrt{\varepsilon_r}}\ln(b/a).
\]

For 50 Ω and polyethylene \(\varepsilon_r=2.3\), \(b/a\approx3.54\), and the velocity factor is \(1/\sqrt{2.3}=0.659\). The cable's higher-order-mode cutoff is why a 1.85 mm or 1.0 mm coax connector, not an SMA, belongs on a 67–110 GHz coaxial port — and why at WR3.4 frequencies we abandon coax altogether.

Microstrip is a *quasi*-TEM line: part of the field is in the substrate and part is in air, so there is a weak longitudinal field and an effective permittivity \(\varepsilon_\text{eff}\) with \(1<\varepsilon_\text{eff}<\varepsilon_r\). Closed-form Hammerstad/Wheeler formulas for \(Z_0(W/h)\) and the inverse synthesis for \(W/h\) are implemented in `tools/microstrip_width.py`. A worked synthesis: 50 Ω on Rogers 4350B-class \(\varepsilon_r=3.66\), \(h=0.203\) mm, gives \(W/h\approx2.19\), so \(W\approx0.445\) mm, with analysis closing to \(Z_0\approx50.2~\Omega\). That is a microwave board rule of thumb, not a THz one — at 270 GHz the same geometry is many wavelengths wide and radiates, which is why THz on-wafer work uses tiny CPW on III–V or silicon, not FR4 microstrip.

## Rectangular waveguide

Place a metal pipe of width \(a\) (x-direction) and height \(b\) (y), \(a>b\), filled with a dielectric of wavenumber \(k=\omega\sqrt{\mu\varepsilon}\). Modes are TE\(_{mn}\) or TM\(_{mn}\) with

\[
k_c=\sqrt{\left(\frac{m\pi}{a}\right)^2+\left(\frac{n\pi}{b}\right)^2},
\qquad
f_c=\frac{k_c}{2\pi\sqrt{\mu\varepsilon}}.
\]

TM requires \(m,n\ge1\). TE allows \(n=0\) or \(m=0\), but not both zero. The dominant mode is TE\(_{10}\), with

\[
f_c=\frac{1}{2a\sqrt{\mu\varepsilon}}=\frac{c}{2a}
\quad\text{(air-filled)}.
\]

Above cutoff,

\[
\beta=\sqrt{k^2-k_c^2}=k\sqrt{1-(f_c/f)^2},
\qquad
\lambda_g=\frac{2\pi}{\beta}=\frac{\lambda}{\sqrt{1-(f_c/f)^2}}.
\]

\[
v_p=\omega/\beta>c,
\qquad
v_g=d\omega/d\beta=c^2/v_p<c
\quad\text{(air-filled)}.
\]

Wave impedances:

\[
Z_\text{TE}=\frac{k\eta}{\beta}=\frac{\eta}{\sqrt{1-(f_c/f)^2}},
\qquad
Z_\text{TM}=\frac{\beta\eta}{k}.
\]

Standard bands are chosen so that TE\(_{10}\) is the only propagating mode: roughly from 1.25\(f_c\) up to just below TE\(_{20}\) or TE\(_{01}\) cutoff. For the usual \(b\approx a/2\) guide, TE\(_{20}\) cuts off at \(2f_c\) and TE\(_{01}\) at \(c/(2b)\approx2f_c\), so the useful band is about 1.25\(f_c\)–1.9\(f_c\).

**WR-90** (X-band): \(a=0.900\) in \(=22.86\) mm, \(b=0.450\) in. With \(c=3.00\times10^8\) m/s, \(f_c=6.562\) GHz, recommended band 8.2–12.4 GHz.

**WR-3.4** (the extender band you have actually swept): \(a=0.034\) in \(=0.8636\) mm, \(b=0.017\) in \(=0.4318\) mm. Then

\[
f_c=\frac{3.00\times10^8}{2\times0.8636\times10^{-3}}=173.69~\text{GHz}.
\]

The recommended 220–330 GHz window sits from \(1.27f_c\) to \(1.90f_c\), just under the TE\(_{20}\) cutoff at 347.4 GHz. This is why a WR3.4 extender is specified over that range and not down to 180 GHz: near cutoff, \(\beta\) is small, \(Z_\text{TE}\) blows up, group delay disperses hard, and flange mismatches become vicious.

## Worked example — WR3.4 at 270 GHz

\[
\lambda=\frac{3.00\times10^8}{270\times10^9}=1.111~\text{mm},
\qquad
\frac{f_c}{f}=\frac{173.69}{270}=0.6433,
\]

\[
\sqrt{1-(f_c/f)^2}=\sqrt{1-0.4138}=0.7656,
\qquad
\lambda_g=\frac{1.111}{0.7656}=1.451~\text{mm}.
\]

\[
Z_\text{TE}=\frac{376.73}{0.7656}=492~\Omega.
\]

A "quarter-wave" section of WR3.4 at 270 GHz is \(\lambda_g/4=0.363\) mm of guide, not \(\lambda/4=0.278\) mm of free space. If you machine a waveguide iris or a backshort, it is \(\lambda_g\) you must use.

## Lab notes

- Waveguide calibration kits at these frequencies are usually TRL or LRL, not SOLT: a high-quality sliding load or a set of flush shorts/opens at WR3.4 is a serious piece of machining. Always record the cal standard definition and the flange type (often UG-387/U-M or similar).
- Insertion loss of a WR3.4 straight section is a conductor-loss plus leakage-at-the-flange number; it rises with \(\sqrt{f}\) from skin effect and rises again as you approach cutoff. A "too good to be true" through measurement often means the cal was stale.
- Never fold the guide. A ding in the broad wall is a mode converter. Blow the flange faces with clean air; do not drag a cotton swab across a lapped surface.
- If you move from waveguide into a horn and then a quasi-optical path, you have left the single-mode-pipe model. The beam has a waist, a Rayleigh range, and spillover — antenna language from the Balanis half of this curriculum.
