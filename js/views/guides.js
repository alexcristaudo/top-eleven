// Strategy guide reader — accordion sections.
import { GUIDES } from '../data/guides.js';
import { esc } from './ui.js';

export function renderGuides(view) {
  view.innerHTML = `
    <h2 class="page-title">Strategy guides</h2>
    <p class="page-sub">The long game: tokens, transfers, resources, competitions and everything between matches.</p>
    ${GUIDES.map((g) => `
      <details class="acc">
        <summary><span aria-hidden="true">${g.icon}</span> ${esc(g.title)}</summary>
        <div class="acc-body">
          <p class="hint">${esc(g.summary)}</p>
          ${g.body}
        </div>
      </details>`).join('')}
  `;
}
