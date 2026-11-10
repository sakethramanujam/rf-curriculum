# 06 — Microwave resonators

**Map to the book:** Pozar, Chapter 6 (Microwave Resonators): series and parallel RLC, loaded and unloaded \(Q\), coupling coefficient, transmission-line resonators (half-wave, quarter-wave, ring), rectangular and circular cavities, dielectric resonators, and excitation. Original study note.

## Learning objectives

- Write \(Q\), \(Q_L\), \(Q_e\) and the coupling factor \(\kappa=Q_0/Q_e\), and relate them to 3 dB bandwidth and to \(|S_{11}|\) at resonance.
- Find \(L\), \(R\), and bandwidth from \(C\), \(f_0\) and \(Q\) for a lumped series resonator.
- Explain why a half-wave open microstrip and a quarter-wave shorted stub are resonators, and how the next modes sit at harmonics (or odd harmonics).
- Compute the TE\(_{101}\) frequency of a rectangular cavity, and say how you would couple it (iris, probe, loop).

## Definitions

Stored energy \(U\), dissipation \(P_L\), and resonant radian frequency \(\omega_0\) define the unloaded quality factor

\[
Q_0=\frac{\omega_0 U}{P_L}.
\]

The 3 dB bandwidth of an isolated resonator is \(f_0/Q_0\). Once you hook the resonator to an external circuit, that circuit dissipates too, and the *loaded* \(Q\) is

\[
\frac{1}{Q_L}=\frac{1}{Q_0}+\frac{1}{Q_e},
\qquad
\kappa=\frac{Q_0}{Q_e}.
\]

\(\kappa<1\) is undercoupled, \(\kappa=1\) critically coupled, \(\kappa>1\) overcoupled. For a one-port resonator the on-resonance reflection has magnitude

\[
|S_{11}(\omega_0)|=\left|\frac{\kappa-1}{\kappa+1}\right|.
\]

Critical coupling is a perfect match at resonance: all accepted power is dumped into the resonator loss. Detuned, the port looks like an open or a short (depending on whether you coupled to a parallel or series equivalent), plus the connector length.

A series RLC has \(\omega_0=1/\sqrt{LC}\), \(Q_0=\omega_0 L/R=1/(\omega_0 CR)\). A parallel RLC swaps the role of \(R\). Near resonance, every single-mode cavity can be replaced by one or the other, plus a transformer that represents the coupling.

## Transmission-line and cavity resonators

A lossless open-circuited TEM line is resonant when \(\beta\ell=n\pi\), i.e. \(\ell=n\lambda/2\). A shorted line resonates at odd multiples of \(\lambda/4\). Loss (conductor + dielectric) sets \(Q_0\); radiation at an open microstrip end lowers \(Q_0\) further and is why a cavity or a dielectric resonator beats a printed half-wave element when you care about \(Q\).

A rectangular cavity of sides \(a,b,d\) supports TE/TM\(_{mnp}\) modes with

\[
f_{mnp}=\frac{c}{2\sqrt{\mu_r\varepsilon_r}}\sqrt{\left(\frac{m}{a}\right)^2+\left(\frac{n}{b}\right)^2+\left(\frac{p}{d}\right)^2}.
\]

The dominant empty-cavity mode is usually TE\(_{101}\). \(Q\) scales like (volume)/(surface \(\times\delta\)): larger cavities, better conductors, and lower frequency all help. At THz the cavities are tiny and \(\delta\) is a fraction of a micron, so the \(Q\) you actually get is often set by machining gaps and flange leakage, not by the ideal formula.

## Worked example — lumped series resonator and a TE\(_{101}\) cavity

A series RLC should resonate at 10.00 GHz with \(C=0.500\) pF and unloaded \(Q_0=80\).

\[
L=\frac{1}{\omega_0^2 C}=0.507~\text{nH},
\qquad
R=\frac{\omega_0 L}{Q_0}=0.398~\Omega,
\qquad
\Delta f_{3\text{dB}}=\frac{f_0}{Q_0}=125~\text{MHz}.
\]

If this resonator is then coupled so that \(Q_L=40\),

\[
\frac{1}{Q_e}=\frac{1}{40}-\frac{1}{80}\implies Q_e=80,\qquad\kappa=1
\]

and the one-port is critically coupled: \(S_{11}(f_0)=0\) (at the detilded reference plane). If instead \(Q_L=53.33\) with the same \(Q_0=80\), then \(Q_e=160\), \(\kappa=0.5\), and \(|S_{11}(f_0)|=1/3=-9.54\) dB (undercoupled).

For an air-filled WR-90 cavity, \(a=22.86\) mm, \(b=10.16\) mm, the length \(d\) that puts TE\(_{101}\) at 10.00 GHz (using \(c=3.00\times10^8\) m/s) satisfies

\[
\left(\frac{2f}{c}\right)^2=\frac{1}{a^2}+\frac{1}{d^2}
\implies d=19.88~\text{mm}.
\]

That is a short X-band cavity, a bit shorter than \(a\), because 10 GHz sits well above the 6.56 GHz TE\(_{10}\) cutoff of the corresponding waveguide.

## Lab notes

- On a VNA, a one-port resonator is a tight loop (or a "bead") on the Smith chart. The loop passes through the chart center at critical coupling. The frequency span of the loop is a quick \(Q\) indicator; a proper extraction uses \(Q_L=f_0/\Delta f_{3\text{dB}}\) on \(|S_{11}|\) or, better, a phase-slope or delay method, then backs out \(Q_0\) from the coupling.
- Gating out the connector delay is mandatory if you want the loop centered rather than spun around the chart.
- THz "resonators" in imaging systems are often a silicon etalon, a cavity-backed slot, or a metasurface, not a WR3.4 box. The same \(Q_L\), \(\kappa\), and \(S_{11}\) language applies. A high-\(Q\) etalon in front of a detector is a thermometer for alignment drift: if the peak walks in frequency, something changed length by a fraction of \(\lambda_g\).
