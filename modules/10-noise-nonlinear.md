# 10 — Noise and nonlinear distortion

**Map to the book:** Pozar, Chapter 10 (Noise and Active RF Components) in the 4th edition grouping — the noise-temperature and noise-figure sections, the Friis cascade formula, and the nonlinear-distortion quantities \(P_{1\text{dB}}\), intermodulation, and IP3. Device physics of diodes and transistors is left to module 11. Original study note.

## Learning objectives

- Convert among noise temperature \(T_e\), noise factor \(F\), and noise figure \(\text{NF}=10\log_{10}F\).
- Apply Friis's formula to a cascade, and explain why the first-stage \(F\) and gain dominate.
- Use \(kT_0B\) with \(T_0=290\) K (\(-174\) dBm/Hz) to put a noise floor in dBm.
- Define \(P_{1\text{dB}}\) and IP3, convert a two-tone measurement into IIP3 / OIP3, and state the usual (rule-of-thumb) gap between \(P_{1\text{dB}}\) and IP3.

## Thermal noise and noise figure

A resistor \(T\) in a bandwidth \(B\) has available noise power \(kTB\), with \(k=1.381\times10^{-23}\) J/K. At \(T_0=290\) K,

\[
kT_0=4.00\times10^{-21}~\text{W/Hz}=-174~\text{dBm/Hz}.
\]

(The more precise value is \(-173.98\) dBm/Hz.) In 1 GHz of bandwidth that is \(-84\) dBm of available thermal noise, before any amplifier noise is added.

A two-port driven from a source at \(T_0\) has noise factor

\[
F=\frac{\text{SNR}_\text{in}}{\text{SNR}_\text{out}}=\frac{T_0+T_e}{T_0},
\qquad
T_e=T_0(F-1).
\]

NF is \(F\) in decibels. For a cascade,

\[
F=F_1+\frac{F_2-1}{G_1}+\frac{F_3-1}{G_1G_2}+\cdots
\]

with \(F_i\) and \(G_i\) in linear units, and \(G_i\) the *available* gain of stage \(i\). A lossy passive network at physical temperature \(T_0\) has \(F=L=1/G\). That is why a 3 dB cable in front of an LNA costs you 3 dB of NF, and why, at 270 GHz, a 4 dB waveguide run or a lossy mixer-first front end often *is* the system noise figure.

The minimum NF of a transistor is \(F_\min\), achieved at a particular \(\Gamma_\text{opt}\). That match is generally not the \(S_{11}^*\) conjugate match, which is why low-noise design and power-gain design disagree (module 11).

## Nonlinearity

A weakly nonlinear memoryless device, \(v_\text{out}=a_1 v+a_2 v^2+a_3 v^3+\cdots\), produces:

- Harmonics at \(2f\), \(3f\), \ldots (square-law and cubic terms).
- Compression of the fundamental (the real part of \(a_3\) usually opposes \(a_1\)). The 1 dB compression point \(P_{1\text{dB}}\) is the input (IIP\(_\text{1dB}\)) or output (OIP\(_\text{1dB}\)) power where the gain is 1 dB below the small-signal value.
- Two-tone intermodulation at \(2f_1-f_2\) and \(2f_2-f_1\). Those products grow 3 dB for every 1 dB of input (cubic). The third-order intercept (IP3) is the fictitious point where the extrapolated fundamental and IM3 curves meet.

\[
\text{OIP3}=P_\text{out}+\frac{\Delta}{2},
\qquad
\text{IIP3}=\text{OIP3}-G=\ P_\text{in}+\frac{\Delta}{2},
\]

where \(\Delta=P_\text{fundamental}-P_\text{IM3}\) (dB) at that drive level, *in the region where the slopes are still 1 dB/dB and 3 dB/dB*. A very common rule of thumb is OIP3 \(\approx P_{1\text{dB}}+10\) dB, but it is a rule of thumb, not a law.

## Worked example — cascade NF and a two-tone IIP3

Stage 1: NF \(=1.50\) dB, gain \(=12.0\) dB. Stage 2: NF \(=4.00\) dB. Then \(F_1=1.413\), \(G_1=15.85\), \(F_2=2.512\), and

\[
F=1.413+\frac{2.512-1}{15.85}=1.508,
\qquad
\text{NF}=1.78~\text{dB}.
\]

The second stage added only 0.28 dB. If you swap the stages, \(F=2.512+(1.413-1)/2.512=2.676\), NF \(=4.27\) dB — a disaster, and the whole point of Friis.

Two-tone: an amplifier with 15.0 dB of small-signal gain is driven with two tones at \(P_\text{in}=-10.0\) dBm each. You measure each fundamental at \(+5.0\) dBm at the output and each IM3 product at \(-40.0\) dBm. Then \(\Delta=45.0\) dB, so

\[
\text{OIP3}=5.0+22.5=27.5~\text{dBm},
\qquad
\text{IIP3}=-10.0+22.5=12.5~\text{dBm}.
\]

(Check: IIP3 \(=\) OIP3 \(-\) gain \(=27.5-15=12.5\).)

## Lab notes

- Noise-figure meters and Y-factor hot/cold measurements assume a well-defined available gain and a matched (or at least known) source. At WR3.4 you more often *compute* a system noise temperature from a hot/cold load in front of a horn (a piece of absorber on a stick, or a Dicke-style load), not from an SMA noise source.
- A VNA is not a noise figure meter. You can sometimes back out a noisy \(S_{21}\) floor, but that is a dynamic-range measurement, not \(F\).
- Two-tone IP3 is only valid if both tones are in the band, the attenuators on the sources are isolating the two generators from each other, and you are not already compressing. If \(\Delta\) does not shrink 2 dB when you raise the input 1 dB, you are not on the cubic slope.
- Imaging front ends at THz are often mixer-first. The mixer's conversion loss *is* \(F\) (plus its excess noise ratio), and every tenth of a dB of LO drive or of waveguide loss shows up in the NEDT of the imager.
