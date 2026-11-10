import { el } from '../lib/dom';
import { EXPLORERS } from '../explorers/registry';
import { Loop, surface } from '../lib/canvas';
import { palette, alpha } from '../lib/theme';

const GLYPHS: Record<string, string> = {
  maxwell: `<svg viewBox="0 0 200 40" class="glyph" aria-hidden="true"><text x="100" y="27" text-anchor="middle" font-size="19" font-family="serif" font-style="italic" fill="currentColor">∇×E = −∂B/∂t   ∇×H = J + ∂D/∂t</text></svg>`,
  planewave: `<svg viewBox="0 0 120 54" class="glyph" aria-hidden="true"><path d="M4 27h112" stroke="var(--faint)"/><path d="M4 27c8-22 16-22 24 0s16 22 24 0 16-22 24 0 16 22 24 0 12-18 16-10" fill="none" stroke="var(--e)" stroke-width="2.4"/><path d="M4 27c8 9 16 9 24 0s16-9 24 0 16 9 24 0 16-9 24 0" fill="none" stroke="var(--h)" stroke-width="2.2" opacity=".85" transform="translate(0 0) skewX(-28) translate(14 0)"/></svg>`,
  tline: `<svg viewBox="0 0 120 54" class="glyph" aria-hidden="true"><path d="M4 18h96M4 40h96" stroke="var(--faint)" stroke-width="2"/><rect x="100" y="14" width="10" height="30" rx="2" fill="none" stroke="var(--e)" stroke-width="2"/><path d="M4 29c6-9 12-9 18 0s12 9 18 0 12-9 18 0 12 9 18 0 12-9 18 0" fill="none" stroke="var(--acc)" stroke-width="2.2"/><path d="M4 22c6 0 12 14 18 14s12-14 18-14 12 14 18 14 12-14 18-14 12 14 18 14" fill="none" stroke="var(--ok)" stroke-width="1.5" stroke-dasharray="3 3"/></svg>`,
  smith: `<svg viewBox="0 0 120 54" class="glyph" aria-hidden="true"><g fill="none" stroke="var(--faint)"><circle cx="60" cy="27" r="24"/><circle cx="72" cy="27" r="12"/><circle cx="80" cy="27" r="4"/><path d="M36 27h48"/><path d="M84 27a24 24 0 0 0-24-24M84 27a24 24 0 0 1-24 24"/></g><circle cx="60" cy="27" r="14" fill="none" stroke="var(--acc)" stroke-dasharray="3 3"/><circle cx="70" cy="17" r="3.4" fill="var(--e)"/></svg>`,
  sparams: `<svg viewBox="0 0 120 54" class="glyph" aria-hidden="true"><rect x="44" y="12" width="32" height="30" rx="5" fill="none" stroke="var(--acc)" stroke-width="2"/><path d="M6 22h34M80 22h34" stroke="var(--e)" stroke-width="4" stroke-linecap="round"/><path d="M40 34H14" stroke="var(--h)" stroke-width="2" stroke-linecap="round"/><text x="60" y="32" text-anchor="middle" font-size="11" fill="currentColor">[S]</text></svg>`,
  waveguide: `<svg viewBox="0 0 120 54" class="glyph" aria-hidden="true"><rect x="10" y="10" width="100" height="34" rx="2" fill="none" stroke="var(--faint)" stroke-width="2"/><path d="M10 27h100" stroke="none"/><g fill="var(--e)">${[0, 1, 2, 3, 4].map((i) => `<ellipse cx="${20 + i * 20}" cy="27" rx="7" ry="${12 - Math.abs(i - 2) * 2}" opacity="${0.35 + 0.15 * (i % 2)}"/>`).join('')}</g></svg>`,
  dipole: `<svg viewBox="0 0 120 54" class="glyph" aria-hidden="true"><path d="M60 6v19M60 29v19" stroke="var(--warn)" stroke-width="3"/><path d="M60 27C40 4 20 6 20 27s20 23 40 0C80 4 100 6 100 27s-20 23-40 0" fill="none" stroke="var(--e)" stroke-width="2"/></svg>`,
  array: `<svg viewBox="0 0 120 54" class="glyph" aria-hidden="true"><g fill="var(--h)">${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${30 + i * 12}" cy="46" r="3"/>`).join('')}</g><path d="M60 46L84 4Q70 0 62 6Z" fill="var(--acc)" opacity=".6"/><path d="M60 46L28 22Q24 30 30 34Z" fill="var(--acc)" opacity=".25"/></svg>`,
  link: `<svg viewBox="0 0 120 54" class="glyph" aria-hidden="true"><g fill="var(--acc)"><rect x="8" y="8" width="12" height="40" rx="2"/><rect x="24" y="12" width="12" height="36" rx="2" opacity=".8"/><rect x="40" y="16" width="12" height="32" rx="2" opacity=".6"/><rect x="56" y="34" width="12" height="14" rx="2" fill="var(--warn)"/><rect x="72" y="30" width="12" height="18" rx="2"/><rect x="88" y="32" width="12" height="16" rx="2" fill="var(--ok)"/></g><path d="M4 44h112" stroke="var(--bad)" stroke-dasharray="4 3"/></svg>`,
};

export default function mount(root: HTMLElement) {
  const hero = el('section', { class: 'hero' });
  const bg = el('canvas', { 'aria-hidden': 'true' });
  hero.append(bg, el('div', { class: 'wrap' },
    el('div', { class: 'eyebrow' }, 'Explorable electromagnetics'),
    el('h1', { html: 'Feel the fields,<br/><span class="grad">then trust the math.</span>' }),
    el('p', { class: 'lede' }, 'Eight hands-on explorers for microwave engineering and antennas. Drag a load around a Smith chart, steer a phased array into a grating lobe, or break Maxwell’s equations into labelled parts. Every slider runs the actual physics in your browser.'),
    el('div', { class: 'hero-cta' },
      el('a', { class: 'btn primary', href: '#/planewave' }, 'Start with plane waves →'),
      el('a', { class: 'btn', href: '#/equations' }, '✦ Exploding equations'),
      el('a', { class: 'btn', href: 'https://github.com/sakethramanujam/rf-curriculum#readme', target: '_blank', rel: 'noopener' }, 'Study notes ↗'),
    ),
  ));

  const grid = el('div', { class: 'map-grid' });
  const nodes = new Map<string, HTMLElement>();
  const root0 = el('a', { class: 'node root', href: '#/equations?focus=maxwell', style: 'grid-area: maxwell', 'data-id': 'maxwell' },
    el('span', { html: GLYPHS.maxwell }), el('h3', {}, "Maxwell's equations"), el('p', {}, 'Everything below is a special case. Start here, or tap to break them apart.'));
  nodes.set('maxwell', root0);
  grid.append(root0);
  for (const e of EXPLORERS) {
    const n = el('a', { class: 'node', href: `#/${e.id}`, style: `grid-area: ${e.area}`, 'data-id': e.id },
      el('span', { class: 'tag' }, e.modules[0].file.split('-')[0].toUpperCase()),
      el('span', { html: GLYPHS[e.id] ?? '' }), el('h3', {}, e.title), el('p', {}, e.blurb));
    nodes.set(e.id, n);
    grid.append(n);
  }
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'edges');
  svg.setAttribute('aria-hidden', 'true');
  const map = el('div', { class: 'map', role: 'navigation', 'aria-label': 'Concept map of explorers' }, svg, grid);

  const edges: { from: string; to: string; path: SVGPathElement }[] = [];
  for (const e of EXPLORERS) for (const f of e.builds) {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.append(p);
    edges.push({ from: f, to: e.id, path: p });
  }
  const layout = () => {
    const base = map.getBoundingClientRect();
    for (const ed of edges) {
      const a = nodes.get(ed.from)!.getBoundingClientRect();
      const b = nodes.get(ed.to)!.getBoundingClientRect();
      const ax = a.left + a.width / 2 - base.left, ay = a.top + a.height / 2 - base.top;
      const bx = b.left + b.width / 2 - base.left, by = b.top + b.height / 2 - base.top;
      // exit from the facing edges
      const down = by > ay + 10;
      const y1 = down ? a.bottom - base.top : ay;
      const y2 = down ? b.top - base.top : by;
      const x1 = down ? ax : bx > ax ? a.right - base.left : a.left - base.left;
      const x2 = down ? bx : bx > ax ? b.left - base.left : b.right - base.left;
      const my = (y1 + y2) / 2;
      ed.path.setAttribute('d', down ? `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}` : `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`);
    }
  };
  const hot = (id: string | null) => edges.forEach((e) => e.path.classList.toggle('hot', !!id && (e.from === id || e.to === id)));
  nodes.forEach((n, id) => {
    n.addEventListener('pointerenter', () => hot(id));
    n.addEventListener('pointerleave', () => hot(null));
    n.addEventListener('focus', () => hot(id));
    n.addEventListener('blur', () => hot(null));
  });
  const ro = new ResizeObserver(layout);
  ro.observe(map);

  const body = el('div', { class: 'wrap' },
    el('h2', {}, 'Concept map'),
    el('p', { class: 'muted' }, 'Arrows point from a concept to the ideas that build on it. Each card opens an explorer; each explorer links back to its study sheet and textbook chapter.'),
    map,
    el('div', { class: 'legend' },
      el('span', {}, el('i', { style: 'background: var(--e)' }), 'Electric field'),
      el('span', {}, el('i', { style: 'background: var(--h)' }), 'Magnetic field'),
      el('span', {}, el('i', { style: 'background: var(--acc)' }), 'Power, phase, the thing you control'),
      el('span', {}, el('i', { style: 'background: var(--ok)' }), 'Envelopes and results'),
    ),
    el('section', { class: 'prose' },
      el('h2', {}, 'How to use this'),
      el('p', { html: '<strong>Play first, read second.</strong> Each page opens with a picture that is already moving. Push a slider to an extreme and predict what happens before you look. Then open the exploded equation underneath and find the term you just pushed.' }),
      el('p', { html: '<strong>Phones are first-class.</strong> Sliders have large thumbs, canvases scroll with your thumb, and drag targets (the Smith chart, the 3-D views) only grab the gesture inside the plot.' }),
      el('p', { html: 'Animations respect your system’s <em>reduce motion</em> setting: pages open paused with a Play button.' }),
    ),
  );
  root.append(el('div', { class: 'page-enter' }, hero, body));

  // Hero background: a slow interference of two travelling waves.
  let loop: Loop | null = null;
  const { s, destroy: d1 } = surface(bg, { aspect: 0.5, minH: 320, maxH: 520, maxDpr: 1.5 }, () => loop?.request());
  loop = new Loop((t) => {
    const { ctx, w, h } = s;
    const P = palette();
    ctx.clearRect(0, 0, w, h);
    const lines = 7;
    for (let j = 0; j < lines; j++) {
      ctx.beginPath();
      const amp = 16 + j * 5;
      const y0 = h * (0.35 + j * 0.08);
      for (let x = 0; x <= w; x += 6) {
        const k = (2 * Math.PI) / (260 + j * 30);
        const y = y0 + amp * Math.sin(k * x - t * (0.8 + j * 0.07)) * Math.cos(0.5 * k * x + t * 0.3) * Math.exp(-x / (w * 1.6));
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = alpha(j % 2 ? P.h : P.e, 0.08 + 0.03 * (lines - j) / lines);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, bg);
  return () => { loop?.destroy(); d1(); ro.disconnect(); };
}
