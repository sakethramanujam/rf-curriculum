# 12 — Oscillators and mixers

**Map to the book:** Pozar, Chapter 12 (Oscillators and Mixers): oscillator conditions (negative resistance, or loop gain), transistor and diode oscillators, a glance at phase noise, mixer figures of merit (conversion loss / gain, LO drive, isolation, noise figure), and the diode mixer as the workhorse. Original study note.

## Learning objectives

- State the oscillation condition in both the negative-resistance form \(\Gamma_\text{in}\Gamma_L=1\) and the Barkhausen loop-gain form.
- Sketch why phase noise skirts fall as \(1/f^2\) (and \(1/f^3\) close-in), and why a high-\(Q\) resonator helps.
- Define conversion loss, distinguish a mixer NF from its conversion loss, and say what LO–RF and LO–IF isolation cost you in a measurement.
- Explain why a THz receiver is so often a Schottky or HEMT mixer pumped by a multiplied LO, and what a WR3.4 VNA extender *is* (a chain of multipliers and mixers with a coupler).

## Oscillators

A one-port oscillator is a device whose input impedance has a negative real part, terminating a resonator (or a length of line plus a stub) that presents \(\Gamma_L\). Steady state requires

\[
\Gamma_\text{in}(\omega,A)\,\Gamma_L(\omega)=1,
\]

i.e. the start-up small-signal \(|\Gamma_\text{in}|>1/|\Gamma_L|\) with a matching phase, collapsing to equality as the amplitude \(A\) grows and the negative resistance compresses. The two-port (feedback) view is the same fact rewritten as loop gain \(=1\).

Frequency is set by the phase condition, and is pulled by anything that changes that phase: load pulling (\(\Gamma_L\)), bias, and temperature. A buffer or an isolator reduces pulling. Leeson's model, in words: outside the resonator bandwidth, SSB phase-noise density falls 20 dB/decade; inside, the resonator no longer helps and a \(1/f^3\) region appears if the device has flicker noise. Raising the carrier power and the resonator \(Q\) both lower the skirt.

A VCO adds a varactor (or a bias-tuned junction) in the resonator. Tuning range and phase noise fight each other, because a highly tunable resonator is a low-\(Q\) resonator.

## Mixers

A mixer is a multiplier, usually implemented as a time-varying conductance (a pumped diode or a FET). For an RF at \(f_\text{RF}\) and an LO at \(f_\text{LO}\), the IF sits at \(|f_\text{RF}-f_\text{LO}|\) (downconv) or the sum (upconv). Figures of merit:

- Conversion loss \(L_c=P_\text{RF,avail}/P_\text{IF,deliv}\) (or conversion *gain* for an active mixer), usually in dB.
- Noise figure, which for a passive, well-terminated Schottky mixer is typically close to \(L_c\) (sometimes 0.5–1 dB worse). Image-rejected or SSB NF and DSB NF differ by up to 3 dB, and you must know which one a datasheet is quoting.
- LO drive level, IP3, and 1 dB compression — mixers are strongly nonlinear on purpose, but they still compress the RF-to-IF path.
- Isolation: LO leaking out of the RF port can radiate, or can mix with itself in a preceding component.

A balanced or double-balanced (ring, star, or MMIC Gilbert) mixer improves LO–RF isolation and rejects some even-order products. A subharmonic mixer, pumped at \(f_\text{LO}\approx f_\text{RF}/2\) or \(f_\text{RF}/n\), is the standard trick when you cannot generate enough LO power at the RF frequency — which is the default situation in WR3.4.

## Worked example — a downconverter budget

A WR3.4 receiver: RF at 270 GHz, LO (subharmonic, \(n=2\)) at 135 GHz, IF at 1.00 GHz. The mixer has 9.0 dB of SSB conversion loss and 6 dB of LO–RF isolation, and is pumped at +7 dBm (at 135 GHz). An IF LNA follows, NF \(=1.5\) dB, gain \(=25\) dB. Treat the mixer as a passive stage with \(F_1=L_c=7.943\) (9.0 dB) and \(G_1=1/L_c\). Then

\[
F=7.943+\frac{1.413-1}{1/7.943}=7.943+3.28=11.22,
\qquad
\text{NF}=10.50~\text{dB}.
\]

The IF LNA barely matters — Friis, again, with a lossy first stage. If you instead put a 15 dB, 4 dB-NF preamp *in front* of the mixer (rare, but instructive),

\[
F=2.512+\frac{11.22-1}{31.62}=2.835,
\qquad
\text{NF}=4.52~\text{dB}.
\]

That is the entire argument for a THz LNA.

A related power check: +7 dBm LO and 6 dB LO–RF isolation means \(+1\) dBm of LO energy coming *out* of the RF port, toward the antenna or the DUT. In a reflection imager that leakage is a coherent background; in a VNA extender it is one more reason the raw uncorrected \(S_{11}\) is meaningless until you calibrate.

## Lab notes

- A WR3.4 VNA extender *is* this chapter made physical: a multiplied LO, a harmonic mixer (or a pair of them, for a two-port), a coupler or a circulator-like waveguide junction, and a lot of correction math. When an extender "loses lock" or the trace goes noisy, the first suspects are LO drive, multiplier bias, and cable IF connections — not the DUT.
- Always filter or at least know your image. A DSB mixer will happily fold two RF sidebands onto the same IF; an imaging system can use that (more power), a spectroscopy system usually cannot.
- Source pulling and LO leakage are the reason a good THz bench looks cluttered with isolators, couplers, and absorbers.
