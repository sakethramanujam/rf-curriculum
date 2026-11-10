# 11 — Active devices and microwave amplifiers

**Map to the book:** Pozar, Chapter 10 (device sections) and Chapter 11 (Microwave Amplifier Design): a working view of diodes and transistors as two-ports, transducer / available / operating power gain, stability (\(K\), \(\Delta\), \(\mu\)), simultaneous conjugate match, low-noise vs power design, and balanced amplifiers. Original study note.

## Learning objectives

- Write the transducer power gain \(G_T\) and reduce it to \(|S_{21}|^2\) in the unilateral, matched case.
- Test a two-port for unconditional stability (Rollett \(K>1\) and \(|\Delta|<1\), or equivalently \(\mu>1\)), and say what a stability circle is for.
- Compute the simultaneous conjugate-match source and load for a stable, bilateral transistor, or explain why that match must not be used when \(K<1\).
- Distinguish a conjugate power match, a \(\Gamma_\text{opt}\) noise match, and a load-pull power match.

## Gain definitions

With source and load reflections \(\Gamma_S\), \(\Gamma_L\), and the two-port \(S\),

\[
\Gamma_\text{in}=S_{11}+\frac{S_{12}S_{21}\Gamma_L}{1-S_{22}\Gamma_L},
\qquad
\Gamma_\text{out}=S_{22}+\frac{S_{12}S_{21}\Gamma_S}{1-S_{11}\Gamma_S}.
\]

The transducer gain (power delivered to the load over power *available* from the source) is

\[
G_T=\frac{1-|\Gamma_S|^2}{|1-S_{11}\Gamma_S|^2}\,|S_{21}|^2\,\frac{1-|\Gamma_L|^2}{|1-\Gamma_\text{out}\Gamma_L|^2}.
\]

If the device is unilateral (\(S_{12}=0\)) and both ports are matched, this collapses to \(G_T=|S_{21}|^2\). The available gain \(G_A\) and operating power gain \(G_P\) use slightly different normalizations; they coincide with \(G_T\) at a simultaneous conjugate match.

## Stability and matching

A two-port is unconditionally stable if every passive \(\Gamma_S\) and \(\Gamma_L\) still produces \(|\Gamma_\text{in}|<1\) and \(|\Gamma_\text{out}|<1\). Rollett's test:

\[
K=\frac{1-|S_{11}|^2-|S_{22}|^2+|\Delta|^2}{2|S_{12}S_{21}|}>1
\quad\text{and}\quad
|\Delta|<1,
\]

where \(\Delta=S_{11}S_{22}-S_{12}S_{21}\). Equivalently, Edwards' \(\mu>1\). If the device is only conditionally stable, you plot source and load stability circles and keep the terminations in the safe region — often with a lossy or resistive stabilizer, at some cost in NF and gain.

For an unconditionally stable bilateral device, the simultaneous conjugate match \(\Gamma_S=\Gamma_\text{in}^*\), \(\Gamma_L=\Gamma_\text{out}^*\) has a closed-form solution (the usual \(\Gamma_{MS}\), \(\Gamma_{ML}\) expressions involving \(B_1,B_2,C_1,C_2\)) and produces the maximum available gain

\[
\text{MAG}=\frac{|S_{21}|}{|S_{12}|}\big(K-\sqrt{K^2-1}\big).
\]

A low-noise amplifier is *not* aimed at MAG. You present \(\Gamma_S\approx\Gamma_\text{opt}\), accept whatever \(\Gamma_\text{in}\) that produces, and then match the output for gain or for a flat \(S_{22}\). A power amplifier is aimed at a load-pull contour, often a lower real impedance than the conjugate match, with attention to \(P_{1\text{dB}}\) and PAE.

## Worked example — unilateral gain and a \(K\)-\(\Delta\) check

A transistor, already typified at 10 GHz in 50 Ω, has (linear magnitudes, phases in degrees)

\[
S_{11}=0.70\angle-40^\circ,\;
S_{21}=4.00\angle 70^\circ,\;
S_{12}=0.08\angle 30^\circ,\;
S_{22}=0.55\angle-20^\circ.
\]

Unilateral matched gain would be \(|S_{21}|^2=16.00=12.04\) dB. Now the stability test:

\[
\Delta=S_{11}S_{22}-S_{12}S_{21}.
\]

\[
S_{11}S_{22}=0.385\angle-60^\circ=0.1925-j0.3334,
\]

\[
S_{12}S_{21}=0.320\angle 100^\circ=-0.0556+j0.3152,
\]

\[
\Delta=0.2481-j0.6486,\qquad|\Delta|=0.694.
\]

\[
K=\frac{1-0.49-0.3025+0.482}{2\cdot0.32}=\frac{0.6895}{0.64}=1.077.
\]

So \(K>1\) and \(|\Delta|<1\): unconditionally stable, and a simultaneous conjugate match is legal. The MAG is

\[
\text{MAG}=\frac{4.00}{0.08}\big(1.078-\sqrt{1.078^2-1}\big)=50\cdot(1.078-0.400)=33.80
=15.29~\text{dB},
\]

a few dB above the unilateral estimate because the residual \(S_{12}\) is being used, constructively, at the conjugate match. (If \(K\) had come out below 1, that MAG formula would be meaningless and you would instead talk about the maximum *stable* gain \(|S_{21}|/|S_{12}|\).)

## Lab notes

- You measure amplifiers on a VNA with enough attenuation, or with a coupler, to keep the VNA receivers linear and to keep the DUT from seeing a badly matched receiver. Check \(P_{1\text{dB}}\) *before* you trust a small-signal \(S_{21}\) taken at the VNA's default port power; many "12 dB" amplifiers are already compressed at 0 dBm into WR3.4.
- Stability is not only a paper test. A mm-wave LNA that is stable on 50 Ω can oscillate when dropped onto a long waveguide or a high-Q filter. If \(S_{11}\) or \(S_{22}\) ever exceeds 0 dB, stop and look for oscillation (a spectrum analyzer, not just the VNA).
- True 220–330 GHz LNAs exist in InP HEMT and some SiGe/CMOS research processes, but a lot of THz imagers are still mixer-first because a low-noise LNA at the flange is a luxury. When you do have one, Friis (module 10) says it is the whole ball game — provided its input match is the noise match, not a pretty \(S_{11}\).
