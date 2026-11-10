import 'katex/dist/katex.min.css';
import './styles/main.css';
import { EXPLORERS, byId } from './explorers/registry';
import { setTheme } from './lib/theme';
import { el } from './lib/dom';
import { focusControl } from './lib/ui';

const main = document.getElementById('main')!;
const navList = document.getElementById('nav-list')!;
const nav = document.querySelector<HTMLElement>('.topnav')!;
const menuBtn = document.querySelector<HTMLButtonElement>('.menu-btn')!;
const themeBtn = document.querySelector<HTMLButtonElement>('.theme-btn')!;

/* ── navigation ── */
for (const e of [{ id: '', short: 'Map' }, ...EXPLORERS, { id: 'equations', short: 'Equations' }]) {
  navList.append(el('li', {}, el('a', { href: `#/${e.id}`, 'data-route': e.id }, e.short)));
}
menuBtn.addEventListener('click', () => {
  const open = !nav.classList.contains('open');
  nav.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
});
navList.addEventListener('click', () => { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); } });

/* ── theme ── */
const syncThemeBtn = () => {
  const dark = document.documentElement.dataset.theme !== 'light';
  themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
};
themeBtn.addEventListener('click', () => {
  setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
  syncThemeBtn();
});
syncThemeBtn();

/* ── router (hash-based, so GitHub Pages needs no 404 rewrite) ── */
let cleanup: (() => void) | null = null;
let token = 0;

function parse(): { route: string; focus?: string } {
  const h = location.hash.replace(/^#\/?/, '');
  const [route, q] = h.split('?');
  const focus = new URLSearchParams(q ?? '').get('focus') ?? undefined;
  return { route: route ?? '', focus };
}

async function render() {
  const { route, focus } = parse();
  const my = ++token;
  cleanup?.();
  cleanup = null;
  navList.querySelectorAll('a').forEach((a) => {
    if (a.dataset.route === route) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  main.replaceChildren();
  const meta = byId(route);
  let title = 'Field Notes — explorable RF & electromagnetics';
  let dispose: () => void;
  if (meta) {
    const mod = await meta.load();
    if (my !== token) return;
    dispose = mod.default(main, { focus });
    title = `${meta.title} · Field Notes`;
  } else if (route === 'equations') {
    const mod = await import('./pages/equations');
    if (my !== token) return;
    dispose = mod.default(main, { focus });
    title = 'Exploding equations · Field Notes';
  } else {
    const mod = await import('./pages/landing');
    if (my !== token) return;
    dispose = mod.default(main);
  }
  cleanup = dispose;
  document.title = title;
  if (focus) requestAnimationFrame(() => setTimeout(() => focusControl(focus), 350));
  else window.scrollTo({ top: 0 });
  if (route) main.focus({ preventScroll: true });
}

window.addEventListener('hashchange', render);
render();
