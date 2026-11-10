import { el } from './dom';
import { EXPLORERS, moduleUrl, type ExplorerMeta } from '../explorers/registry';
import { equationBlock } from './equation';
import type { EquationDef } from '../equations';

/** Common frame for every explorer: header, citation, a visual column and a control column. */
export function explorerPage(root: HTMLElement, meta: ExplorerMeta, intro: string, opts: { wide?: boolean } = {}) {
  const viz = el('div', { class: 'viz' });
  const controls = el('aside', { class: 'controls', 'aria-label': 'Controls' });
  const after = el('div', {});
  const idx = EXPLORERS.findIndex((e) => e.id === meta.id);
  const prev = EXPLORERS[idx - 1];
  const next = EXPLORERS[idx + 1];
  const page = el('div', { class: 'wrap page-enter' },
    el('header', { class: 'page-head' },
      el('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' },
        el('a', { href: '#/' }, 'Concept map'), el('span', { 'aria-hidden': 'true' }, '›'), el('span', {}, meta.short)),
      el('h1', {}, meta.title),
      el('p', { class: 'lede' }, intro),
      el('div', { class: 'crumbs' },
        el('span', { class: 'chip', title: 'Textbook chapter' }, '📖 ' + meta.cite),
        ...meta.modules.map((m) => el('a', { class: 'chip', href: moduleUrl(m.file), target: '_blank', rel: 'noopener' }, '✎ ' + m.label + ' ↗')),
      ),
    ),
    el('section', { class: opts.wide ? 'stage wide' : 'stage', 'aria-label': 'Interactive explorer' }, viz, controls),
    after,
    el('nav', { class: 'next-prev', 'aria-label': 'Explorer sequence' },
      prev ? el('a', { href: `#/${prev.id}` }, el('small', {}, '← Previous'), prev.title) : el('a', { href: '#/' }, el('small', {}, '← Back'), 'Concept map'),
      next ? el('a', { class: 'n', href: `#/${next.id}` }, el('small', {}, 'Next →'), next.title) : el('a', { class: 'n', href: '#/equations' }, el('small', {}, 'Next →'), 'All equations'),
    ),
  );
  root.append(page);
  return { page, viz, controls, after };
}

export function card(title: string, extra?: Node | string): { card: HTMLElement; cap: HTMLElement; canvas: HTMLCanvasElement } {
  const canvas = el('canvas', { role: 'img', 'aria-label': title });
  const cap = el('div', { class: 'cap' }, el('b', {}, title), extra ?? '');
  const c = el('div', { class: 'card' }, cap, canvas);
  return { card: c, cap, canvas };
}

export function equationsSection(defs: EquationDef[], onLink?: (control: string) => void) {
  const cleanups: (() => void)[] = [];
  const sec = el('section', { 'aria-label': 'Key equations' }, el('h2', {}, 'Key equations, exploded'),
    el('p', { class: 'muted' }, 'Tap or hover any highlighted term to break the equation apart. Each piece says what it means, its units, and which control on this page drives it.'));
  const list = el('div', { class: 'eqs' });
  for (const d of defs) {
    const b = equationBlock(d, onLink);
    cleanups.push(b.destroy);
    list.append(b.el);
  }
  sec.append(list);
  return { el: sec, destroy: () => cleanups.forEach((f) => f()) };
}

export function notice(items: string[]) {
  return el('section', {}, el('h2', {}, 'What to notice'), el('ul', { class: 'notice', html: items.map((i) => `<li>${i}</li>`).join('') }));
}
