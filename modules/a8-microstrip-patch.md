# A8 — Microstrip patch antennas

**Map to the book:** Balanis, Chapter 14 (Microstrip Antennas): the rectangular patch as a half-wave cavity (transmission-line and cavity-model views), fringing, input impedance and feed methods (edge, inset, probe, aperture), bandwidth's dependence on substrate height and \(\varepsilon_r\), circular patches, and a nod to arrays of patches. Original study note.

## Learning objectives

- Estimate the resonant length of a rectangular patch, \(L\approx\lambda_0/(2\sqrt{\varepsilon_\text{eff}})\), including why fringing makes the physical length a bit shorter.
- Explain why a patch likes a thick, low-\(\varepsilon_r\) substrate for bandwidth, and why that same choice can invite surface waves and poor radiation efficiency.
- Place the feed (inset or probe) to hit 50 Ω at resonance, conceptually, as choosing the point where the cavity voltage/current ratio is 50 Ω.
- Know the THz version: a patch or a stacked patch on a semiconductor or polymer substrate, or a membrane, with the same cavity picture and much tighter fabrication tolerances.

## The half-wave cavity picture

A rectangular patch of length \(L\) (the resonant direction) and width \(W\), over a substrate \(h,\varepsilon_r\), looks like a low-height cavity with two radiating magnetic-current slots at the \(L\)-ends (the open edges). The dominant TM\(_{010}\) (or TM\(_{100}\), depending on axis labels) resonance is a half-wave along \(L\),

\[
L+2\Delta L=\frac{\lambda_0}{2\sqrt{\varepsilon_\text{eff}}},
\]

where \(\varepsilon_\text{eff}\) is the microstrip effective permittivity (module 03) and \(\Delta L\) is the Hammerstad-style fringing extension, of order \(h\). The width \(W\) is often chosen near

\[
W\approx\frac{\lambda_0}{2\sqrt{(\varepsilon_r+1)/2}}
\]

as a compromise among impedance, efficiency, and higher-mode onset.

Radiation is from the two end slots, producing a broad broadside beam with typical directivity in the 5–8 dBi range for a single patch, a linear polarization along \(L\), and a relatively narrow impedance bandwidth. Fractional bandwidth scales roughly with \(h/\lambda\) and is larger for smaller \(\varepsilon_r\). A 1–2% bandwidth on a thin microwave substrate is normal; getting 10% wants a thicker or stacked design, or a different antenna.

The input resistance at the radiating edge is often 100–300 Ω; an inset feed or a quarter-wave transformer or a probe placed inward from the edge walks that down to 50 Ω. The cavity-model \(R(x)\propto\cos^2(\pi x/L)\) (from the edge) is the usual first estimate of where to put the inset.

## Worked example — a 10 GHz patch on RO4350B-class board

Substrate \(\varepsilon_r=3.66\), \(h=0.203\) mm (8 mil), \(f_0=10.00\) GHz, \(c=3.00\times10^8\) m/s. Ignoring fringing first,

\[
L_0=\frac{c}{2f_0\sqrt{\varepsilon_r}}=7.84~\text{mm}.
\]

A starting width

\[
W=\frac{c}{2f_0\sqrt{(\varepsilon_r+1)/2}}=9.83~\text{mm}.
\]

Using `python tools/microstrip_width.py` is not directly the patch formula, but the same \(\varepsilon_\text{eff}\) idea applies under the patch. With \(W/h\approx 48\) (a very wide "microstrip"), \(\varepsilon_\text{eff}\) is close to \(\varepsilon_r\), and \(\Delta L\) is a substantial fraction of the already-small \(h\). A typical result is a physical \(L\) maybe 0.2–0.3 mm shorter than 7.84 mm — you would fine-tune in a full-wave solver, then on a VNA. Expected narrowband \(S_{11}\): a single dip of maybe 50–150 MHz width at 10 GHz (0.5–1.5%), consistent with the thin substrate.

At 270 GHz the same board is unusable (the substrate is \(0.18\lambda\) thick, surface-wave city, and the patch would be 0.29 mm long). A THz patch lives on a much thinner film, or on a high-resistivity silicon / III–V substrate with a designed back-side reflector, and the 0.2 mm "bar" of module a3 becomes this resonant cavity.

## Lab notes

- Measure a patch with a well-de-embedded feed. A long microstrip plus an SMA on a 10 GHz coupon adds mismatch and radiation of its own; a TRL or e-cal plus a defined reference plane on the feed line is the minimum.
- Hand-tuning: a bit of copper tape at the radiating edge lengthens \(L\) and lowers \(f_0\); a deeper inset lowers \(R_\text{in}\). The same instincts apply, carefully, at mm-wave with bond ribbons and laser trims.
- A patch array (module a5 plus this one) is how a lot of 60 GHz and 77 GHz radar antennas are built. Mutual coupling in the *E*-plane is the usual surprise.
