import katex from 'katex';
import { el } from './dom';
import type { EquationDef } from '../equations';

const KATEX_OPTS = {
  displayMode: true,
  throwOnError: false,
  strict: 'ignore' as const,
  trust: (ctx: { command: string }) => ctx.command === '\\htmlData',
};

export function renderTex(tex: string, display = false): string {
  return katex.renderToString(tex, { ...KATEX_OPTS, displayMode: display });
}

const toneVar = (t?: string) => `var(--${t ?? 'acc'})`;

/**
 * "Exploding" equation: hover, tap or focus a term and the equation spreads apart,
 * dims everything else, and reveals a card per term with meaning, units and a link
 * to the control that drives it. A dashed leader line ties the active term to its card.
 */
export function equationBlock(def: EquationDef, onLink?: (control: string) => void) {
  const math = el('div', { class: 'eq-math' });
  katex.render(def.tex, math, KATEX_OPTS);
  const btn = el('button', { type: 'button', class: 'btn', 'aria-pressed': 'false', 'aria-controls': `terms-${def.id}` }, '✦ Explode');
  const leads = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  leads.setAttribute('class', 'leads');
  leads.setAttribute('aria-hidden', 'true');
  const termsBox = el('div', { class: 'eq-terms', id: `terms-${def.id}` });
  const root = el('article', { class: 'eq', id: `eq-${def.id}` },
    el('div', { class: 'eq-head' }, el('h3', {}, def.title), btn),
    math, termsBox,
    def.note ? el('p', { class: 'eq-note' }, def.note) : null,
  );
  root.append(leads);

  const ids = Object.keys(def.terms);
  const spans = Array.from(math.querySelectorAll<HTMLElement>('.katex-html [data-term]'));
  spans.forEach((s, i) => {
    const t = def.terms[s.dataset.term!];
    s.style.setProperty('--tc', toneVar(t?.tone));
    s.classList.add(i % 2 ? 'dn' : 'up');
    s.setAttribute('title', t?.name ?? '');
  });

  const cards = new Map<string, HTMLElement>();
  ids.forEach((id, i) => {
    const t = def.terms[id];
    const link = t.link
      ? el('a', { href: `#/${t.link.explorer}?focus=${t.link.control}` }, t.link.label)
      : null;
    if (link && onLink) {
      link.addEventListener('click', (e) => {
        const route = location.hash.replace(/^#\/?/, '').split('?')[0];
        if (route !== t.link!.explorer) return; // different page: let the hash link navigate
        e.preventDefault();
        onLink(t.link!.control);
      });
    }
    const card = el('div', { class: 'term', tabindex: '0', 'data-term': id, role: 'group', 'aria-label': t.name },
      el('span', { class: 't-sym', html: renderTex(t.sym) }),
      el('span', { class: 't-name' }, t.name),
      el('span', { class: 't-mean' }, t.meaning),
      el('span', { class: 't-unit' }, 'Units: ' + t.units),
      link,
    );
    card.style.setProperty('--tc', toneVar(t.tone));
    card.style.setProperty('--i', String(i));
    cards.set(id, card);
    termsBox.append(card);
  });

  let exploded = false;
  let pinned = false;
  let active: string | null = null;
  let raf = 0;

  const drawLeads = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      leads.innerHTML = '';
      if (!exploded || !active) return;
      const base = root.getBoundingClientRect();
      const card = cards.get(active);
      const span = spans.find((s) => s.dataset.term === active);
      if (!card || !span) return;
      const a = span.getBoundingClientRect();
      const b = card.getBoundingClientRect();
      const mr = math.getBoundingClientRect();
      if (a.right < mr.left || a.left > mr.right) return; // scrolled out of view
      const x1 = a.left + a.width / 2 - base.left, y1 = a.bottom - base.top + 2;
      const x2 = b.left + Math.min(28, b.width / 2) - base.left, y2 = b.top - base.top;
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const my = (y1 + y2) / 2;
      p.setAttribute('d', `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`);
      p.setAttribute('stroke', toneVar(def.terms[active].tone));
      leads.append(p);
    });
  };

  const setExploded = (v: boolean) => {
    exploded = v;
    root.classList.toggle('exploded', v);
    btn.setAttribute('aria-pressed', String(v));
    btn.textContent = v ? '✕ Collapse' : '✦ Explode';
    if (!v) setActive(null);
    window.setTimeout(drawLeads, 620);
  };
  const setActive = (id: string | null) => {
    active = id;
    root.classList.toggle('has-active', !!id);
    spans.forEach((s) => s.classList.toggle('active', s.dataset.term === id));
    cards.forEach((c, k) => c.classList.toggle('active', k === id));
    drawLeads();
    window.setTimeout(drawLeads, 600);
  };

  btn.addEventListener('click', () => { pinned = !exploded; setExploded(!exploded); });
  spans.forEach((s) => {
    s.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (!exploded) setExploded(true);
      setActive(s.dataset.term!);
    });
    s.addEventListener('click', () => {
      pinned = true;
      if (!exploded) setExploded(true);
      setActive(active === s.dataset.term ? null : s.dataset.term!);
      if (matchMedia('(max-width: 760px)').matches) {
        cards.get(s.dataset.term!)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  });
  root.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse' && !pinned && exploded) setExploded(false);
  });
  cards.forEach((c, id) => {
    c.addEventListener('pointerenter', () => setActive(id));
    c.addEventListener('focusin', () => { if (!exploded) setExploded(true); setActive(id); });
    c.addEventListener('click', () => setActive(id));
  });
  math.addEventListener('scroll', drawLeads, { passive: true });
  const ro = new ResizeObserver(drawLeads);
  ro.observe(root);

  return { el: root, destroy: () => { ro.disconnect(); cancelAnimationFrame(raf); } };
}
