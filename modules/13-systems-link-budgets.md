# 13 — Microwave systems and link budgets

**Map to the book:** Pozar, Chapter 13 (Introduction to Microwave Systems): the Friis transmission equation, system noise temperature and \(G/T\), a radar-equation interlude, radiometer sensitivity, and the bookkeeping that turns components from Chapters 4–12 into a working link or sensor. Original study note.

## Learning objectives

- Write the Friis transmission equation and the free-space path loss, and use them in both linear and dB form.
- Build a received-power and SNR budget, including antenna gains, loss, bandwidth, and system noise temperature.
- Compute a radar return (or a monostatic reflection-mode imaging return) to first order.
- State the radiometric sensitivity \(\Delta T\) for a simple total-power radiometer, and connect it to THz imaging NEDT.

## Friis, path loss, and SNR

For antennas in the far field of each other, aligned and polarization-matched, in free space,

\[
P_r=P_t G_t G_r\left(\frac{\lambda}{4\pi R}\right)^2.
\]

Equivalently, \(P_r=P_t G_t G_r / L_\text{FS}\), with free-space path loss \(L_\text{FS}=(4\pi R/\lambda)^2\). In dB (powers in dBm, gains in dBi),

\[
P_r=P_t+G_t+G_r-20\log_{10}\!\left(\frac{4\pi R}{\lambda}\right)-L_\text{extra}.
\]

The effective aperture of an antenna, \(A_e=G\lambda^2/(4\pi)\), is the other way to write the same fact (see Balanis module a1). Polarization mismatch, impedance mismatch, atmospheric absorption, and spillover all live in \(L_\text{extra}\). At 270 GHz, even a short lab path can have measurable water-vapor absorption, and a few tens of meters outdoors can be serious.

Thermal SNR after a receiver of system noise temperature \(T_\text{sys}\) in bandwidth \(B\) is

\[
\text{SNR}=\frac{P_r}{kT_\text{sys}B},
\qquad
T_\text{sys}=T_\text{ant}+T_e,
\]

where \(T_\text{ant}\) includes sky, absorber, and lossy-antenna contributions, and \(T_e=T_0(F-1)\) is the receiver's input-referred excess noise. Figure of merit for a ground station or a radiometer antenna-plus-LNA is \(G/T\).

## Radar and radiometry, in the same notation

A monostatic radar (or a reflection-mode imager that sees a target of RCS \(\sigma\)) receives

\[
P_r=\frac{P_t G^2\lambda^2\sigma}{(4\pi)^3 R^4}
\]

in free space, with one antenna of gain \(G\) doing both jobs. The \(R^4\) is why a modest THz standoff imager works on a bench and struggles at 20 m, unless \(G\) and \(\sigma\) are large and the noise floor is very low.

A total-power radiometer looking at a scene temperature \(T_A\) with integration time \(\tau\) and RF (or pre-detection) bandwidth \(B\) has a temperature sensitivity of order

\[
\Delta T=\frac{T_\text{sys}}{\sqrt{B\tau}}
\]

(the exact prefactor is 1 for a basic total-power radiometer). That \(\Delta T\) *is* the NEDT of a simple THz imager, before you add standing-wave ripple, gain drift, and calibration error. Dicke chopping or frequent calibration against a known absorber is how you keep gain drift from eating \(\Delta T\).

## Worked example — a 270 GHz bench link and a small radar return

Two 20.0 dBi horns, 1.00 m apart, at 270 GHz, with \(c=3.00\times10^8\) m/s, so \(\lambda=1.111\) mm. Path loss:

\[
L_\text{FS}=\left(\frac{4\pi\cdot1.00}{1.111\times10^{-3}}\right)^2
\implies 10\log_{10}L_\text{FS}=81.07~\text{dB}.
\]

With \(P_t=0.0\) dBm and no extra loss, \(P_r=0+20+20-81.07=-41.07\) dBm. (Linear check: \(G_t=G_r=100\), \(P_r/P_t=7.82\times10^{-5}\).) If the receiver has NF \(=10.5\) dB (the mixer-first number from module 12) and \(B=1.00\) MHz, \(T_e=290(11.22-1)=2964\) K. Taking \(T_\text{ant}=290\) K,

\[
kT_\text{sys}B=1.381\times10^{-23}\cdot3254\cdot10^6=4.49\times10^{-14}~\text{W}=-103.5~\text{dBm},
\]

so SNR \(=-41.07-(-103.5)=62.4\) dB — a very comfortable CW link. The same receiver, used as a 1 ms integration total-power radiometer over a 1 GHz RF band, has

\[
\Delta T=\frac{3254}{\sqrt{10^9\cdot10^{-3}}}=3.25~\text{K},
\]

which is a respectable NEDT if gain drift is controlled. It is *not* a good standoff radar: a \(\sigma=0.01\) m\(^2\) target at \(R=5\) m, with a 20 dBi antenna and \(P_t=0\) dBm, returns

\[
P_r=\frac{(10^{-3})(100)^2(1.111\times10^{-3})^2(0.01)}{(4\pi)^3 5^4}
=9.95\times10^{-14}~\text{W}=-100.0~\text{dBm},
\]

only about 3.5 dB above the 1 MHz noise floor computed above (SNR \(\approx 3.5\) dB). Move the same target to 10 m and \(R^4\) costs another 12 dB, so \(P_r=-112.0\) dBm, now clearly under the floor. That is the \(R^4\) law telling you to raise \(G\), raise \(P_t\), or shrink bandwidth and integrate.

## Lab notes

- A WR3.4 VNA extender already *is* a coherent radar/illuminator when you use \(S_{11}\) in a quasi-optical setup. Standing waves between the horn and the target are the "multipath" term in the link budget; a time-domain gate or a small mechanical dither plus averaging is how you keep them from being your image.
- Always write \(\lambda\), \(R\), and the far-field criterion \(R>2D^2/\lambda\) on the page before you use Friis. A 10 cm aperture at 270 GHz has \(2D^2/\lambda=18\) m; at 1 m you are *not* in the far field, and the Friis number is only a bound.
- Log every loss you can measure: flange, waveguide run, beam-splitter, plastic window, atmosphere. At THz, "miscellaneous" is often the largest line in the budget.
