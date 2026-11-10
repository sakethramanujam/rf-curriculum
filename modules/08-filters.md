# 08 — Microwave filters

**Map to the book:** Pozar, Chapter 8 (Microwave Filters): periodic structures and image parameters (briefly), the insertion-loss method, low-pass prototype values, Butterworth and Chebyshev responses, frequency and impedance scaling, Richard's transformation and Kuroda's identities, stepped-impedance and stub low-pass filters, coupled-line and cavity bandpass filters, and a look at suspended and dielectric-resonator implementations. Original study note.

## Learning objectives

- Sketch Butterworth vs Chebyshev low-pass \(|S_{21}|(f)\): flat vs equal ripple, and the stopband trade.
- Use prototype \(g_k\) values, then impedance- and frequency-scale them to a real \(Z_0\) and \(\omega_c\).
- Convert a low-pass prototype into high-pass, band-pass, or band-stop by the standard element transformations.
- Explain, without deriving every identity, why a microwave filter is usually a cascade of \(\lambda/4\) coupled lines, irises, or stubs rather than a handful of 0402 capacitors.
- State what a measured filter must show besides mid-band insertion loss: return loss, shape factor, spurious passbands, and power handling.

## Insertion-loss method, in one page

You start from a normalized low-pass prototype with cutoff at \(\omega_c'=1\), source \(g_0=1\), and a prescribed passband response. For a Butterworth (maximally flat) response of order \(N\),

\[
P_\text{LR}=1+k^2\,\Omega^{2N},
\qquad
\Omega=\omega/\omega_c,
\]

and the prototype elements are tabulated (for \(N=3\): \(g_0=1\), \(g_1=1\), \(g_2=2\), \(g_3=1\), \(g_4=1\)). Chebyshev uses an equal-ripple passband, with \(g_k\) that depend on both \(N\) and the ripple; you buy a sharper transition at the cost of passband ripple and a slightly worse group delay.

Impedance scaling by \(Z_0\) and frequency scaling by \(\omega_c\):

\[
L=g_L\frac{Z_0}{\omega_c},
\qquad
C=\frac{g_C}{Z_0\omega_c}.
\]

A low-pass-to-band-pass map replaces each series \(L\) by a series LC resonant at \(\omega_0\) and each shunt \(C\) by a parallel LC, with the fractional bandwidth \(\Delta=(\omega_2-\omega_1)/\omega_0\) setting the \(L/C\) ratios. That is why a narrow band-pass filter needs high-\(Q\) resonators: the elements have been transformed into lightly loaded resonators.

At microwave frequencies you then replace lumped \(L\) and \(C\) by distributed equivalents: a short high-\(Z_0\) line for an inductor, a short low-\(Z_0\) line or an open stub for a capacitor (Richards + Kuroda), or a chain of coupled \(\lambda/4\) lines for a band-pass. Every one of those equivalences is exact at *one* frequency and approximate nearby, which is why a distributed filter has spurious passbands near \(2f_0\) or \(3f_0\).

## Worked example — 3rd-order Butterworth low-pass, 1.00 GHz, 50 Ω

Prototype, \(N=3\): \(g_1=1\), \(g_2=2\), \(g_3=1\), starting with a series \(L\). With \(\omega_c=2\pi\times10^9\) rad/s,

\[
L_1=L_3=\frac{1\cdot50}{\omega_c}=7.958~\text{nH},
\qquad
C_2=\frac{2}{50\,\omega_c}=6.366~\text{pF}.
\]

At 1.00 GHz the response is 3 dB down by construction (Butterworth cutoff is the 3 dB frequency). At 2.00 GHz, \(\Omega=2\), \(P_\text{LR}=1+(2)^{6}=1+64=65\), so

\[
|S_{21}|_{\text{dB}}=-10\log_{10}65=-18.1~\text{dB}.
\]

A 3rd-order Chebyshev with 0.5 dB ripple would already be lower than that in the stopband, at the cost of 0.5 dB of passband ripple and a return loss that is only "pretty good," not excellent, in the passband.

## Lab notes

- Measure filters with well-calibrated reference planes and with attenuators or isolators if the filter is reflective in the stopband (many VNAs dislike a high-\(|S_{11}|\) resonator sitting on the port). Check both \(S_{21}\) and \(S_{11}\): a pretty insertion-loss curve with a 6 dB return loss in the passband is a mismatch, not a successful design.
- Spurious passbands will surprise you on a wide span. Always sweep to at least \(3f_0\).
- At WR3.4, a "filter" is typically a waveguide iris chain, a gold-plated cavity block, or a quasi-optical mesh / silicon-wafer FSS, not an 0402 lumped ladder. The prototype math is the same; the loss budget is not. A 2 dB mid-band insertion loss that would be embarrassing at 2 GHz is often a victory at 270 GHz.
- Temperature: a cavity filter walks in frequency as the metal expands. In a THz imager, that walk can slide a narrow front-end filter off your source line.
