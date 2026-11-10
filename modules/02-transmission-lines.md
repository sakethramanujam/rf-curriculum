# 02 — Transmission line theory

**Map to the book:** Pozar, Chapter 2 (Transmission Line Theory): the telegrapher's equations, characteristic impedance and propagation constant, terminated lines, the reflection coefficient and VSWR, input impedance, the Smith chart, and the bounce-diagram / transient picture. Written here as a working note, not a copy of the text.

## Learning objectives

- Derive \(Z_0\) and \(\gamma=\alpha+j\beta\) from \(R,L,G,C\), and specialize to the lossless and low-loss cases.
- Compute \(\Gamma_L\), VSWR, return loss, and the reflected-power fraction for a given \(Z_L\).
- Use the lossless input-impedance formula, including the open, short, and quarter-wave special cases.
- Move around a Smith chart by a known electrical length, and explain what a VNA time-domain (or gated) \(S_{11}\) trace is showing.

## Telegrapher parameters

A uniform line is a distributed series \(R,L\) and shunt \(G,C\) per unit length. The wave quantities on the line satisfy

\[
\gamma=\sqrt{(R+j\omega L)(G+j\omega C)}=\alpha+j\beta,
\qquad
Z_0=\sqrt{\frac{R+j\omega L}{G+j\omega C}}.
\]

Voltage and current on a \(+\hat{z}\) line are \(V^+e^{-\gamma z}\) and \(V^+e^{-\gamma z}/Z_0\). In the lossless limit \(R=G=0\),

\[
\beta=\omega\sqrt{LC},
\qquad
Z_0=\sqrt{L/C},
\qquad
v_p=1/\sqrt{LC}.
\]

A low-loss approximation commonly used for cables and good microstrip is \(\alpha\approx R/(2Z_0)+GZ_0/2\). The velocity factor of a dielectric-filled line is \(1/\sqrt{\varepsilon_r}\) relative to \(c\).

## Termination, reflection, standing waves

With a load \(Z_L\) at \(z=0\) and the generator toward \(z<0\),

\[
\Gamma_L=\frac{Z_L-Z_0}{Z_L+Z_0}=|\Gamma_L|e^{j\theta_\Gamma}.
\]

Special cases you should be able to recite: open \(\Gamma=+1\), short \(\Gamma=-1\), matched load \(\Gamma=0\), a purely reactive load lies on the \(|\Gamma|=1\) circle. The voltage standing-wave ratio and the return loss are

\[
\text{VSWR}=\frac{1+|\Gamma|}{1-|\Gamma|},
\qquad
\text{RL}=-20\log_{10}|\Gamma|\quad\text{(dB)}.
\]

The fraction of incident power that is reflected is \(|\Gamma|^2\); the accepted fraction is \(1-|\Gamma|^2\). VSWR is defined only for a single propagating mode on a line with a well-defined \(Z_0\). That is why a waveguide VNA still talks about VSWR: the instrument is referred to the waveguide characteristic impedance of the launched mode (see module 03).

On a lossless line the input impedance at a distance \(\ell\) from the load is

\[
Z_\text{in}(\ell)=Z_0\frac{Z_L+jZ_0\tan\beta\ell}{Z_0+jZ_L\tan\beta\ell}.
\]

Memorize the four classic reductions:

- short, \(\ell=\lambda/4\): \(Z_\text{in}\to\infty\) (quarter-wave stub looks open);
- open, \(\ell=\lambda/4\): \(Z_\text{in}=0\);
- \(\ell=\lambda/2\): \(Z_\text{in}=Z_L\) (repeats);
- quarter-wave transformer, real \(Z_L\): \(Z_\text{in}=Z_0^2/Z_L\).

The reflection coefficient transforms as \(\Gamma(\ell)=\Gamma_L e^{-j2\beta\ell}\) toward the generator. That factor of two is the Smith-chart "wavelengths toward generator" scale: a half-turn around the chart is \(\lambda/4\) of line.

## Worked example — a 100 + j50 Ω load on 50 Ω

\[
\Gamma_L=\frac{(100+j50)-50}{(100+j50)+50}=\frac{50+j50}{150+j50}=0.400+j0.200.
\]

\[
|\Gamma_L|=\sqrt{0.20}=0.4472,
\qquad
\arg\Gamma_L=\tan^{-1}(0.5)=26.57^\circ.
\]

\[
\text{VSWR}=\frac{1.4472}{0.5528}=2.618,
\qquad
\text{RL}=6.99~\text{dB},
\qquad
|\Gamma_L|^2=0.20
\]

so 20% of the incident power bounces and 80% is accepted by the load. Move 60° of electrical length toward the generator:

\[
Z_\text{in}=50\,\frac{(100+j50)+j50\tan 60^\circ}{50+j(100+j50)\tan 60^\circ}
=31.91-j35.61~\Omega.
\]

You can confirm this with `python tools/smith_gamma.py --z 100+50j --z0 50 --length-deg 60`.

A purely real 75 Ω load on 50 Ω is milder: \(\Gamma=0.200\), VSWR \(=1.50\), RL \(=13.98\) dB.

## Lab notes

- A one-port VNA measurement of \(S_{11}\) *is* \(\Gamma\) at the calibration plane, in the reference impedance of that calibration (50 Ω coaxial, or the TE\(_{10}\) wave impedance / characteristic impedance for a waveguide cal).
- Electrical delay and port extension just rotate \(\Gamma\) around the Smith chart. If you apply the wrong port extension you will misread a capacitive load as inductive, or vice versa.
- At WR3.4 the "transmission line" is the waveguide itself. A poorly mated flange is a shunt discontinuity a fraction of a millimeter from your calibration plane — enough phase at 270 GHz to walk you a noticeable arc on the Smith chart. Tight, clean, aligned flanges are part of the RF design.
- Time-domain \(S_{11}\) (an inverse transform of a wide frequency sweep) is the transient bounce diagram in disguise, and is the fastest way to see whether a mismatch is at the flange, at a wire-bond, or at the device.
