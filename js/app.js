// TE Manager — hash router + navigation shell.
import { renderDashboard } from './views/dashboard.js';
import { renderSquad } from './views/squad.js';
import { renderPlayer } from './views/player.js';
import { renderTraining } from './views/training.js';
import { renderTactics } from './views/tactics.js';
import { renderGuides } from './views/guides.js';
import { renderSeason } from './views/season.js';

const NAV = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/squad', label: 'Squad', icon: '👥' },
  { path: '/training', label: 'Training', icon: '🏋️' },
  { path: '/tactics', label: 'Tactics', icon: '📋' },
  { path: '/season', label: 'Season', icon: '📅' },
  { path: '/guides', label: 'Guides', icon: '📖' },
];

const ROUTES = [
  { pattern: /^\/$/, render: renderDashboard, nav: '/' },
  { pattern: /^\/squad$/, render: renderSquad, nav: '/squad' },
  { pattern: /^\/player\/([\w-]+)$/, render: renderPlayer, nav: '/squad' },
  { pattern: /^\/training$/, render: renderTraining, nav: '/training' },
  { pattern: /^\/tactics$/, render: renderTactics, nav: '/tactics' },
  { pattern: /^\/season$/, render: renderSeason, nav: '/season' },
  { pattern: /^\/guides$/, render: renderGuides, nav: '/guides' },
];

function navLinks() {
  return NAV.map((n) =>
    `<a href="#${n.path}" data-nav="${n.path}"><span class="icon" aria-hidden="true">${n.icon}</span><span>${n.label}</span></a>`
  ).join('');
}

function currentPath() {
  const h = location.hash.replace(/^#/, '');
  return h === '' ? '/' : h;
}

function route() {
  const path = currentPath();
  const view = document.getElementById('view');
  const match = ROUTES.map((r) => ({ r, m: path.match(r.pattern) })).find((x) => x.m);
  if (!match) {
    location.hash = '#/';
    return;
  }
  view.innerHTML = '';
  match.r.render(view, ...match.m.slice(1));
  for (const a of document.querySelectorAll('[data-nav]')) {
    a.classList.toggle('active', a.dataset.nav === match.r.nav);
  }
  view.scrollTop = 0;
  window.scrollTo(0, 0);
}

document.getElementById('side-nav').innerHTML = navLinks();
document.getElementById('tabbar').innerHTML = navLinks();
window.addEventListener('hashchange', route);
route();
