import { el } from '../lib/dom';
import { EQUATIONS } from '../equations';
import { equationBlock } from '../lib/equation';
import { byId } from '../explorers/registry';

export default function mount(root: HTMLElement, ctx: { focus?: string }) {
  const cleanups: (() => void)[] = [];
  const list = el('div', { class: 'eqs' });
  for (const d of EQUATIONS) {
    const b = equationBlock(d);
    const ex = byId(d.explorer);
    if (ex) b.el.append(el('p', { class: 'eq-note' }, el('a', { href: `#/${ex.id}` }, `Open the ${ex.short} explorer →`)));
    list.append(b.el);
    cleanups.push(b.destroy);
  }
  root.append(el('div', { class: 'wrap page-enter' },
    el('header', { class: 'page-head' },
      el('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' }, el('a', { href: '#/' }, 'Concept map'), el('span', {}, '›'), el('span', {}, 'Equations')),
      el('h1', {}, 'Exploding equations'),
      el('p', { class: 'lede' }, 'Every equation here is a machine with labelled parts. Hover or tap a term to pull it out and see what it is, what units it carries, and which slider in the explorers turns it.'),
    ),
    list,
  ));
  if (ctx.focus) document.getElementById(`eq-${ctx.focus}`)?.scrollIntoView({ block: 'start' });
  return () => cleanups.forEach((f) => f());
}
