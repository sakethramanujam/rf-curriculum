/**
 * Key equations with every explorable term tagged via \htmlData{term=id}{…}.
 * Explanations are original, written for this site.
 */
export type Tone = 'e' | 'h' | 'acc' | 'ok' | 'warn';

export interface Term {
  sym: string; // TeX for the term card
  name: string;
  meaning: string;
  units: string;
  tone?: Tone;
  link?: { explorer: string; control: string; label: string };
}

export interface EquationDef {
  id: string;
  title: string;
  explorer: string;
  tex: string;
  terms: Record<string, Term>;
  note?: string;
}

const T = (term: string, tex: string) => String.raw`\htmlData{term=${term}}{${tex}}`;
const r = String.raw;

export const EQUATIONS: EquationDef[] = [
  {
    id: 'maxwell', title: "Maxwell's equations (differential, time domain)", explorer: 'planewave',
    tex: r`\begin{aligned}
      ${T('curlE', r`\nabla\times\mathbf{E}`)} &= ${T('dBdt', r`-\frac{\partial \mathbf{B}}{\partial t}`)} \\
      ${T('curlH', r`\nabla\times\mathbf{H}`)} &= ${T('J', r`\mathbf{J}`)} + ${T('dDdt', r`\frac{\partial \mathbf{D}}{\partial t}`)} \\
      ${T('divD', r`\nabla\cdot\mathbf{D}`)} &= ${T('rho', r`\rho`)} \qquad ${T('divB', r`\nabla\cdot\mathbf{B} = 0`)}
    \end{aligned}`,
    terms: {
      curlE: { sym: r`\nabla\times\mathbf{E}`, name: 'Curl of E', tone: 'e', units: 'V/m²',
        meaning: 'How much the electric field circulates around a point. A loop of E is what an EMF around a wire loop measures.',
        link: { explorer: 'planewave', control: 'f', label: 'Faster change, more curl: frequency' } },
      dBdt: { sym: r`-\partial\mathbf{B}/\partial t`, name: 'Changing magnetic flux', tone: 'h', units: 'T/s = V·s/m² per s',
        meaning: 'A magnetic field that changes in time creates circulating E (Faraday). The minus sign is Lenz: the induced E opposes the change.',
        link: { explorer: 'planewave', control: 'f', label: 'Frequency sets ∂/∂t → jω' } },
      curlH: { sym: r`\nabla\times\mathbf{H}`, name: 'Curl of H', tone: 'h', units: 'A/m²',
        meaning: 'Circulation of the magnetic field. Ampère: any current, real or displacement, is wrapped by a loop of H.' },
      J: { sym: r`\mathbf{J}=\sigma\mathbf{E}`, name: 'Conduction current density', tone: 'warn', units: 'A/m²',
        meaning: 'Charges actually moving. In a conductor J = σE, and this term is what turns wave energy into heat.',
        link: { explorer: 'planewave', control: 'sigma', label: 'Raise σ to add loss' } },
      dDdt: { sym: r`\partial\mathbf{D}/\partial t`, name: 'Displacement current', tone: 'e', units: 'A/m²',
        meaning: "Maxwell's addition: a changing E field acts like a current. Without it there would be no self-sustaining waves.",
        link: { explorer: 'planewave', control: 'epsr', label: 'εr scales D = εE' } },
      divD: { sym: r`\nabla\cdot\mathbf{D}`, name: 'Divergence of D', tone: 'e', units: 'C/m³',
        meaning: 'Net outflow of electric flux from a point. Gauss: flux lines start and end on charge.' },
      rho: { sym: r`\rho`, name: 'Free charge density', tone: 'acc', units: 'C/m³',
        meaning: 'Where electric flux lines are born. In the source-free regions of a plane wave it is zero.' },
      divB: { sym: r`\nabla\cdot\mathbf{B}=0`, name: 'No magnetic monopoles', tone: 'h', units: 'T/m',
        meaning: 'Magnetic flux lines never start or end; they always close on themselves.' },
    },
    note: 'In phasor form (e^{jωt}), every ∂/∂t becomes jω. That is the bridge to the explorers.',
  },
  {
    id: 'wave', title: 'Wave equation and Helmholtz form', explorer: 'planewave',
    tex: r`${T('lap', r`\nabla^2\mathbf{E}`)} - ${T('mueps', r`\mu\varepsilon`)}\,${T('d2t', r`\frac{\partial^2 \mathbf{E}}{\partial t^2}`)} = 0
      \;\;\xrightarrow{\;\partial_t \to j\omega\;}\;\; \nabla^2\mathbf{E} + ${T('k', r`k^2`)}\,\mathbf{E} = 0`,
    terms: {
      lap: { sym: r`\nabla^2\mathbf{E}`, name: 'Curvature in space', tone: 'e', units: 'V/m³',
        meaning: 'How sharply the field bends from point to point. A wave balances this spatial bending against its curvature in time.' },
      mueps: { sym: r`\mu\varepsilon = 1/v^2`, name: 'Medium "stiffness"', tone: 'acc', units: 's²/m²',
        meaning: 'Sets the wave speed v = 1/√(με). Raising εr slows the wave and shrinks the wavelength.',
        link: { explorer: 'planewave', control: 'epsr', label: 'Adjust εr' } },
      d2t: { sym: r`\partial^2\mathbf{E}/\partial t^2`, name: 'Curvature in time', tone: 'e', units: 'V/(m·s²)',
        meaning: 'How fast the oscillation reverses at a fixed point. Matched to spatial curvature, it forces a shape that travels.' },
      k: { sym: r`k = \omega\sqrt{\mu\varepsilon}`, name: 'Wavenumber', tone: 'ok', units: 'rad/m',
        meaning: 'Phase accumulated per metre, 2π/λ. In a lossy medium k becomes complex: its real part is β and its imaginary part is the attenuation α.',
        link: { explorer: 'planewave', control: 'f', label: 'Frequency → k' } },
    },
  },
  {
    id: 'skin', title: 'Skin depth in a good conductor', explorer: 'planewave',
    tex: r`${T('delta', r`\delta_s`)} = \frac{1}{\alpha} \approx \sqrt{\frac{2}{${T('w', r`\omega`)}\,${T('mu', r`\mu`)}\,${T('sigma', r`\sigma`)}}}`,
    terms: {
      delta: { sym: r`\delta_s`, name: 'Skin depth', tone: 'warn', units: 'm',
        meaning: 'Distance over which the field amplitude drops to 1/e (≈37%). Copper at 1 GHz: about 2 µm.' },
      w: { sym: r`\omega=2\pi f`, name: 'Angular frequency', tone: 'acc', units: 'rad/s',
        meaning: 'Higher frequency, thinner skin: δ ∝ 1/√f.', link: { explorer: 'planewave', control: 'f', label: 'Sweep frequency' } },
      mu: { sym: r`\mu`, name: 'Permeability', tone: 'h', units: 'H/m', meaning: 'Magnetic materials (large μ) have thinner skins.' },
      sigma: { sym: r`\sigma`, name: 'Conductivity', tone: 'warn', units: 'S/m',
        meaning: 'More free charge to respond, so the field is cancelled sooner.', link: { explorer: 'planewave', control: 'sigma', label: 'Set σ' } },
    },
    note: 'The site computes α exactly from the complex k, so it also works for poor conductors and lossy dielectrics.',
  },
  {
    id: 'telegrapher', title: "Telegrapher's equations", explorer: 'tline',
    tex: r`\begin{aligned}
      ${T('dvdz', r`\frac{\partial v}{\partial z}`)} &= -${T('R', 'R')}\,i - ${T('L', 'L')}\,\frac{\partial i}{\partial t} \\
      ${T('didz', r`\frac{\partial i}{\partial z}`)} &= -${T('G', 'G')}\,v - ${T('C', 'C')}\,\frac{\partial v}{\partial t}
    \end{aligned}`,
    terms: {
      dvdz: { sym: r`\partial v/\partial z`, name: 'Voltage slope along the line', tone: 'e', units: 'V/m',
        meaning: 'Voltage drops along the line because current flows through series resistance and inductance.' },
      R: { sym: 'R', name: 'Series resistance', tone: 'warn', units: 'Ω/m', meaning: 'Conductor loss per unit length (skin effect lives here).',
        link: { explorer: 'tline', control: 'loss', label: 'Add line loss' } },
      L: { sym: 'L', name: 'Series inductance', tone: 'h', units: 'H/m',
        meaning: 'Magnetic energy stored per metre. With C it sets Z0 = √(L/C) and v = 1/√(LC).', link: { explorer: 'tline', control: 'z0', label: 'Z0 = √(L/C)' } },
      didz: { sym: r`\partial i/\partial z`, name: 'Current slope along the line', tone: 'h', units: 'A/m',
        meaning: 'Current leaks away through shunt conductance and the capacitance it charges.' },
      G: { sym: 'G', name: 'Shunt conductance', tone: 'warn', units: 'S/m', meaning: 'Dielectric loss per unit length.',
        link: { explorer: 'tline', control: 'loss', label: 'Add line loss' } },
      C: { sym: 'C', name: 'Shunt capacitance', tone: 'e', units: 'F/m', meaning: 'Electric energy stored per metre between the conductors.',
        link: { explorer: 'tline', control: 'z0', label: 'Z0 = √(L/C)' } },
    },
    note: 'Solutions are forward and backward waves V0⁺e^{−γz} + V0⁻e^{+γz}, with γ = √((R+jωL)(G+jωC)).',
  },
  {
    id: 'gamma', title: 'Reflection coefficient', explorer: 'tline',
    tex: r`${T('G', r`\Gamma`)} = \frac{${T('ZL', 'Z_L')} - ${T('Z0', 'Z_0')}}{${T('ZL', 'Z_L')} + ${T('Z0', 'Z_0')}}`,
    terms: {
      G: { sym: r`\Gamma = V_0^-/V_0^+`, name: 'Reflection coefficient', tone: 'acc', units: 'dimensionless (complex)',
        meaning: 'Amplitude and phase of the wave bouncing back, relative to the one arriving. |Γ| = 0 is perfect absorption, 1 is total reflection.' },
      ZL: { sym: 'Z_L', name: 'Load impedance', tone: 'e', units: 'Ω',
        meaning: 'What the line ends in. Any mismatch from Z0 forces part of the wave to turn around to satisfy V/I = Z_L.',
        link: { explorer: 'tline', control: 'load', label: 'Choose a load' } },
      Z0: { sym: 'Z_0', name: 'Characteristic impedance', tone: 'h', units: 'Ω',
        meaning: 'The V/I ratio of a single travelling wave on this line. It is a property of the geometry, not a resistor.',
        link: { explorer: 'tline', control: 'z0', label: 'Change Z0' } },
    },
  },
  {
    id: 'zin', title: 'Input impedance of a terminated lossless line', explorer: 'smith',
    tex: r`${T('Zin', r`Z_{\text{in}}`)} = ${T('Z0', 'Z_0')}\,\frac{${T('ZL', 'Z_L')} + j${T('Z0', 'Z_0')}${T('tan', r`\tan\beta\ell`)}}{${T('Z0', 'Z_0')} + j${T('ZL', 'Z_L')}${T('tan', r`\tan\beta\ell`)}}`,
    terms: {
      Zin: { sym: r`Z_{\text{in}}`, name: 'Input impedance', tone: 'acc', units: 'Ω',
        meaning: 'What a generator sees at distance ℓ from the load. It repeats every half wavelength.' },
      Z0: { sym: 'Z_0', name: 'Line impedance', tone: 'h', units: 'Ω', meaning: 'The reference everything is normalised to on the Smith chart.' },
      ZL: { sym: 'Z_L', name: 'Load', tone: 'e', units: 'Ω', meaning: 'Drag it anywhere on the chart.', link: { explorer: 'smith', control: 'chart', label: 'Drag the load' } },
      tan: { sym: r`\tan\beta\ell`, name: 'Electrical length', tone: 'ok', units: 'βℓ in rad (ℓ in λ)',
        meaning: 'Moving ℓ toward the generator rotates Γ clockwise by 2βℓ. At ℓ = λ/4 it inverts the impedance; at λ/8 a short looks like +jZ0.',
        link: { explorer: 'smith', control: 'dist', label: 'Slide along the line' } },
    },
  },
  {
    id: 'sparams', title: 'Scattering parameters', explorer: 'sparams',
    tex: r`${T('S', r`S_{ij}`)} = \left.\frac{${T('Vm', r`V_i^-`)}}{${T('Vp', r`V_j^+`)}}\right|_{${T('cond', r`V_k^+ = 0,\ k\ne j`)}}
      \qquad \begin{bmatrix} b_1\\ b_2 \end{bmatrix} = \begin{bmatrix} S_{11} & S_{12}\\ S_{21} & S_{22}\end{bmatrix}\begin{bmatrix} a_1\\ a_2\end{bmatrix}`,
    terms: {
      S: { sym: r`S_{ij}`, name: 'Scattering parameter', tone: 'acc', units: 'dimensionless (complex)',
        meaning: 'Out of port i, per unit wave into port j. |S21|² is the fraction of incident power delivered to a matched port 2.',
        link: { explorer: 'sparams', control: 'device', label: 'Pick a device' } },
      Vm: { sym: r`V_i^-`, name: 'Outgoing wave at port i', tone: 'h', units: 'V (or √W for b_i)', meaning: 'What leaves the network at port i.' },
      Vp: { sym: r`V_j^+`, name: 'Incident wave at port j', tone: 'e', units: 'V (or √W for a_j)', meaning: 'The one wave you drive in.' },
      cond: { sym: r`V_k^+ = 0`, name: 'All other ports matched', tone: 'warn', units: '—',
        meaning: 'Every other port is terminated in Z0, so nothing reflects back in. Drop this condition and you get Γin, not S11.',
        link: { explorer: 'sparams', control: 'gl', label: 'Unmatch port 2' } },
    },
  },
  {
    id: 'gin', title: 'Input reflection with a load on port 2', explorer: 'sparams',
    tex: r`${T('Gin', r`\Gamma_{\text{in}}`)} = ${T('S11', r`S_{11}`)} + \frac{${T('loop', r`S_{12}S_{21}\Gamma_L`)}}{1 - ${T('S22', r`S_{22}\Gamma_L`)}}`,
    terms: {
      Gin: { sym: r`\Gamma_{\text{in}}`, name: 'Input reflection', tone: 'acc', units: '—', meaning: 'What you actually measure at port 1 when port 2 is not matched.' },
      S11: { sym: r`S_{11}`, name: 'Direct reflection', tone: 'e', units: '—', meaning: 'Bounces straight off the input.' },
      loop: { sym: r`S_{12}S_{21}\Gamma_L`, name: 'Round trip', tone: 'h', units: '—',
        meaning: 'Through the device, off the load, and back through. This is why an amplifier with poor isolation can be pulled by its load.',
        link: { explorer: 'sparams', control: 'gl', label: 'Set |Γ_L|' } },
      S22: { sym: r`S_{22}\Gamma_L`, name: 'Multiple bounces', tone: 'warn', units: '—', meaning: 'The geometric series of reflections trapped between port 2 and the load.' },
    },
  },
  {
    id: 'cutoff', title: 'Rectangular waveguide cutoff', explorer: 'waveguide',
    tex: r`${T('fc', r`f_{c,mn}`)} = \frac{1}{2\pi${T('mueps', r`\sqrt{\mu\varepsilon}`)}}\sqrt{\left(\frac{${T('m', 'm')}\pi}{${T('a', 'a')}}\right)^2 + \left(\frac{${T('n', 'n')}\pi}{${T('b', 'b')}}\right)^2}`,
    terms: {
      fc: { sym: r`f_{c,mn}`, name: 'Cutoff frequency', tone: 'acc', units: 'Hz',
        meaning: 'Below it the mode cannot fit a half-wave pattern across the guide and decays exponentially instead of propagating.' },
      mueps: { sym: r`\sqrt{\mu\varepsilon}`, name: 'Filling material', tone: 'ok', units: 's/m', meaning: 'Filling the guide with dielectric lowers every cutoff by √εr.' },
      m: { sym: 'm', name: 'Half-waves across a', tone: 'e', units: 'integer', meaning: 'Number of half-sine variations across the broad wall.',
        link: { explorer: 'waveguide', control: 'mode', label: 'Pick a mode' } },
      a: { sym: 'a', name: 'Broad dimension', tone: 'e', units: 'm', meaning: 'TE10 cuts off where a = λ/2. WR-90 has a = 22.86 mm.',
        link: { explorer: 'waveguide', control: 'a', label: 'Resize a' } },
      n: { sym: 'n', name: 'Half-waves across b', tone: 'h', units: 'integer', meaning: 'Variations across the narrow wall.',
        link: { explorer: 'waveguide', control: 'mode', label: 'Pick a mode' } },
      b: { sym: 'b', name: 'Narrow dimension', tone: 'h', units: 'm', meaning: 'Keeping b < a/2 holds TE01 above TE20, widening single-mode bandwidth.',
        link: { explorer: 'waveguide', control: 'b', label: 'Resize b' } },
    },
  },
  {
    id: 'dipole', title: 'Half-wave dipole far field', explorer: 'dipole',
    tex: r`${T('E', r`E_\theta`)} \simeq j\,${T('eta', r`\eta`)}\,\frac{${T('I0', 'I_0')}\,${T('sph', r`e^{-jkr}`)}}{2\pi ${T('r', 'r')}}\;${T('pat', r`\left[\frac{\cos\!\left(\tfrac{\pi}{2}\cos\theta\right)}{\sin\theta}\right]`)}`,
    terms: {
      E: { sym: r`E_\theta`, name: 'Far-zone electric field', tone: 'e', units: 'V/m', meaning: 'Points along θ̂, tangent to circles around the wire. There is no radial far field.' },
      eta: { sym: r`\eta\approx 377\,\Omega`, name: 'Wave impedance', tone: 'acc', units: 'Ω', meaning: 'Ratio E/H in the far zone; H_φ = E_θ/η.' },
      I0: { sym: 'I_0', name: 'Peak current', tone: 'warn', units: 'A', meaning: 'Amplitude of the sinusoidal current standing on the wire, maximum at the feed for λ/2.' },
      sph: { sym: r`e^{-jkr}`, name: 'Outgoing phase', tone: 'ok', units: '—', meaning: 'The field travels outward: crests move away from the antenna at c.',
        link: { explorer: 'dipole', control: 'play', label: 'Animate the field' } },
      r: { sym: '1/r', name: 'Spherical spreading', tone: 'h', units: '1/m', meaning: 'Field ∝ 1/r, so power density ∝ 1/r², the root of the Friis R² law.' },
      pat: { sym: r`F(\theta)`, name: 'Pattern factor', tone: 'e', units: '—',
        meaning: 'Zero along the wire, maximum broadside. For longer dipoles cos(kL/2 cosθ) − cos(kL/2) replaces the numerator and lobes appear.',
        link: { explorer: 'dipole', control: 'len', label: 'Change length L' } },
    },
  },
  {
    id: 'af', title: 'Uniform linear array factor', explorer: 'array',
    tex: r`\text{AF} = \sum_{n=0}^{${T('N', 'N')}-1} e^{\,jn${T('psi', r`\psi`)}} = \frac{\sin(N\psi/2)}{\sin(\psi/2)},\qquad
      ${T('psi', r`\psi`)} = ${T('kd', 'kd')}\,${T('sin', r`\sin\phi`)} + ${T('beta', r`\beta`)}`,
    terms: {
      N: { sym: 'N', name: 'Number of elements', tone: 'acc', units: '—',
        meaning: 'More elements, narrower beam (≈ 0.886·2/(N d/λ) rad broadside) and more sidelobes, the first at −13.3 dB.',
        link: { explorer: 'array', control: 'n', label: 'Change N' } },
      psi: { sym: r`\psi`, name: 'Phase step between neighbours', tone: 'e', units: 'rad',
        meaning: 'Total phase difference between adjacent element contributions in direction φ. The beam points where ψ = 0 (mod 2π).' },
      kd: { sym: r`kd = 2\pi d/\lambda`, name: 'Electrical spacing', tone: 'h', units: 'rad',
        meaning: 'Sets how much of ψ-space is visible: φ from −90° to 90° maps to ψ ∈ [β − kd, β + kd]. Over 2π wide and a second main lobe (grating lobe) sneaks in.',
        link: { explorer: 'array', control: 'd', label: 'Change d/λ' } },
      sin: { sym: r`\sin\phi`, name: 'Direction (from broadside)', tone: 'ok', units: '—', meaning: 'Path-length difference between neighbours is d sinφ.' },
      beta: { sym: r`\beta`, name: 'Progressive phase', tone: 'warn', units: 'rad',
        meaning: 'Electronic delay applied to each successive element. The beam steers to sinφ0 = −β/(kd).',
        link: { explorer: 'array', control: 'beta', label: 'Steer the beam' } },
    },
    note: 'Balanis measures θ from the array axis, so his ψ = kd cosθ + β. Here φ is from broadside (φ = 90° − θ), which is how phased-array scan angles are usually quoted.',
  },
  {
    id: 'friis', title: 'Friis transmission equation', explorer: 'link',
    tex: r`\frac{${T('Pr', 'P_r')}}{${T('Pt', 'P_t')}} = ${T('Gt', 'G_t')}\,${T('Gr', 'G_r')}\left(\frac{${T('lam', r`\lambda`)}}{4\pi ${T('R', 'R')}}\right)^{2}`,
    terms: {
      Pr: { sym: 'P_r', name: 'Received power', tone: 'ok', units: 'W', meaning: 'Delivered to a matched, polarisation-matched receiver.' },
      Pt: { sym: 'P_t', name: 'Transmit power', tone: 'e', units: 'W', meaning: 'Accepted by the transmit antenna.', link: { explorer: 'link', control: 'pt', label: 'Set Pt' } },
      Gt: { sym: 'G_t', name: 'Transmit gain', tone: 'acc', units: '— (dBi)', meaning: 'How much the antenna concentrates power toward the receiver compared with an isotropic one.',
        link: { explorer: 'link', control: 'gt', label: 'Set Gt' } },
      Gr: { sym: 'G_r', name: 'Receive gain', tone: 'acc', units: '— (dBi)', meaning: 'Effective aperture A_e = G λ²/4π: how big a net the receiver casts.',
        link: { explorer: 'link', control: 'gr', label: 'Set Gr' } },
      lam: { sym: r`\lambda`, name: 'Wavelength', tone: 'h', units: 'm',
        meaning: 'λ² appears because fixed-gain antennas have smaller apertures at high frequency. Space itself does not absorb more.',
        link: { explorer: 'link', control: 'f', label: 'Change frequency' } },
      R: { sym: 'R', name: 'Distance', tone: 'warn', units: 'm', meaning: 'Power spreads over a sphere of area 4πR²: −20 dB per decade.',
        link: { explorer: 'link', control: 'range', label: 'Change range' } },
    },
  },
  {
    id: 'radar', title: 'Radar equation (monostatic)', explorer: 'link',
    tex: r`${T('Pr', 'P_r')} = \frac{${T('Pt', 'P_t')}\,${T('G2', 'G^2')}\,\lambda^2\,${T('sig', r`\sigma`)}}{(4\pi)^3\,${T('R4', 'R^4')}}`,
    terms: {
      Pr: { sym: 'P_r', name: 'Echo power', tone: 'ok', units: 'W', meaning: 'What comes back to the same antenna.' },
      Pt: { sym: 'P_t', name: 'Transmit power', tone: 'e', units: 'W', meaning: 'Peak power of the pulse.', link: { explorer: 'link', control: 'pt', label: 'Set Pt' } },
      G2: { sym: 'G^2', name: 'Gain, twice', tone: 'acc', units: '—', meaning: 'Once on the way out, once on the way back.', link: { explorer: 'link', control: 'gt', label: 'Set G' } },
      sig: { sym: r`\sigma`, name: 'Radar cross-section', tone: 'h', units: 'm²', meaning: 'The area of an isotropic re-radiator that would return the same echo.',
        link: { explorer: 'link', control: 'rcs', label: 'Set σ' } },
      R4: { sym: 'R^4', name: 'Two-way spreading', tone: 'warn', units: 'm⁴', meaning: 'R² out and R² back: doubling range costs 12 dB, not 6.',
        link: { explorer: 'link', control: 'range', label: 'Change range' } },
    },
  },
];

export const eqFor = (explorer: string) => EQUATIONS.filter((e) => e.explorer === explorer);
export const eqById = (id: string) => EQUATIONS.find((e) => e.id === id)!;
