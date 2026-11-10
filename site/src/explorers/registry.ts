export interface ModuleRef {
  file: string;
  label: string;
}

export interface ExplorerMeta {
  id: string;
  title: string;
  short: string;
  blurb: string;
  cite: string;
  modules: ModuleRef[];
  area: string;
  builds: string[]; // ids this concept builds on (edges in the concept map)
  load: () => Promise<{ default: Mount }>;
}

export type Mount = (root: HTMLElement, ctx: { focus?: string }) => () => void;

export const REPO = 'https://github.com/sakethramanujam/rf-curriculum';
export const moduleUrl = (file: string) => `${REPO}/blob/main/modules/${file}`;

export const EXPLORERS: ExplorerMeta[] = [
  {
    id: 'planewave', title: 'Plane waves & polarization', short: 'Plane waves', area: 'plane',
    blurb: 'E and H in lockstep, polarization ellipses, and how a lossy medium eats a wave within a skin depth.',
    cite: 'Pozar ch. 1 (plane waves, polarization, lossy media)',
    modules: [{ file: '01-em-review.md', label: '01 · EM review' }],
    builds: ['maxwell'],
    load: () => import('./planewave'),
  },
  {
    id: 'tline', title: 'Transmission lines & standing waves', short: 'T-lines', area: 'tline',
    blurb: 'Incident and reflected waves interfere into a standing-wave envelope. Pick a load and watch VSWR appear.',
    cite: 'Pozar ch. 2 (telegrapher, Γ, VSWR, Zin)',
    modules: [{ file: '02-transmission-lines.md', label: '02 · Transmission lines' }],
    builds: ['maxwell'],
    load: () => import('./tline'),
  },
  {
    id: 'smith', title: 'Smith chart & matching', short: 'Smith chart', area: 'smith',
    blurb: 'Drag the load, slide along the line and rotate toward the generator, then walk a stub or L-network to the centre.',
    cite: 'Pozar ch. 2.4 (Smith chart) and ch. 5 (stub and L-section matching)',
    modules: [
      { file: '02-transmission-lines.md', label: '02 · Transmission lines' },
      { file: '05-matching-tuning.md', label: '05 · Matching & tuning' },
    ],
    builds: ['tline'],
    load: () => import('./smith'),
  },
  {
    id: 'sparams', title: 'S-parameters & power flow', short: 'S-parameters', area: 'sparams',
    blurb: 'Waves in, waves out. See where incident power goes in a two-port: reflected, transmitted, absorbed or amplified.',
    cite: 'Pozar ch. 4.3 (scattering matrix) and 4.4 (ABCD)',
    modules: [{ file: '04-network-analysis-sparams.md', label: '04 · Network analysis' }],
    builds: ['tline', 'smith'],
    load: () => import('./sparams'),
  },
  {
    id: 'waveguide', title: 'Rectangular waveguide modes', short: 'Waveguides', area: 'wg',
    blurb: 'TE10, TE20, TE11 and TM11: field patterns, cutoff, and why group velocity slows to zero at cutoff.',
    cite: 'Pozar ch. 3.3 (rectangular waveguide)',
    modules: [{ file: '03-lines-and-waveguides.md', label: '03 · Lines & waveguides' }],
    builds: ['maxwell', 'planewave'],
    load: () => import('./waveguide'),
  },
  {
    id: 'dipole', title: 'Dipole radiation', short: 'Dipoles', area: 'dipole',
    blurb: 'Watch fields peel off a dipole, and see the pattern split into lobes as the wire grows past a wavelength.',
    cite: 'Balanis ch. 4 (finite-length and half-wave dipoles)',
    modules: [
      { file: 'a3-dipoles-monopoles.md', label: 'A3 · Dipoles & monopoles' },
      { file: 'a2-radiation-integrals.md', label: 'A2 · Radiation integrals' },
    ],
    builds: ['maxwell'],
    load: () => import('./dipole'),
  },
  {
    id: 'array', title: 'Phased arrays & beam steering', short: 'Phased arrays', area: 'array',
    blurb: 'Line up N radiators, tilt their phases, and steer the beam. Space them too far apart and grating lobes appear.',
    cite: 'Balanis ch. 6 (uniform linear arrays, scanning)',
    modules: [{ file: 'a5-arrays.md', label: 'A5 · Arrays' }],
    builds: ['dipole'],
    load: () => import('./array'),
  },
  {
    id: 'link', title: 'Link budget, Friis & radar', short: 'Link budget', area: 'link',
    blurb: 'A dB waterfall from transmitter to receiver, the noise floor underneath, and the R⁴ penalty of a radar.',
    cite: 'Pozar ch. 13 (Friis, radar, noise) · Balanis ch. 2 (gain, aperture)',
    modules: [
      { file: '13-systems-link-budgets.md', label: '13 · Systems & link budgets' },
      { file: 'a1-antenna-fundamentals.md', label: 'A1 · Antenna fundamentals' },
    ],
    builds: ['array', 'sparams', 'planewave'],
    load: () => import('./link'),
  },
];

export const byId = (id: string) => EXPLORERS.find((e) => e.id === id);
