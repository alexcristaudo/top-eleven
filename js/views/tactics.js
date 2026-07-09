// Tactics centre: counter-formation tool, formation encyclopedia, settings reference.
import { FORMATIONS, ORIENTATION_REFERENCE } from '../data/formations.js';
import { counterOptions, squadFitForFormation, bestXI } from '../logic/analysis.js';
import { getPlayers } from '../store.js';
import { esc, pitchHtml, settingsTable, posBadge, shortName } from './ui.js';

export function renderTactics(view) {
  view.innerHTML = `
    <h2 class="page-title">Tactics centre</h2>
    <p class="page-sub">Pick the formation your opponent is using and get the counter — shape, orientation settings and which of your players fit it.</p>

    <div class="card">
      <h3>Best XI builder</h3>
      <label class="field"><span>Your formation</span>
        <select id="xi-formation">
          ${FORMATIONS.map((f) => `<option value="${f.id}">${esc(f.name)}</option>`).join('')}
        </select>
      </label>
      <div id="xi-out"></div>
    </div>

    <div class="card">
      <h3>Counter-formation tool</h3>
      <label class="field"><span>Opponent's formation</span>
        <select id="opp">
          <option value="">— select —</option>
          ${FORMATIONS.map((f) => `<option value="${f.id}">${esc(f.name)}</option>`).join('')}
        </select>
      </label>
      <div id="counter-out"></div>
    </div>

    <div class="card">
      <h3>Formation encyclopedia</h3>
      <label class="field"><span>Formation</span>
        <select id="ency">
          ${FORMATIONS.map((f) => `<option value="${f.id}">${esc(f.name)}</option>`).join('')}
        </select>
      </label>
      <div id="ency-out"></div>
    </div>

    <div class="card">
      <h3>Orientation settings reference</h3>
      <p class="hint">Every match-prep setting in the game and when to use each option.</p>
      ${ORIENTATION_REFERENCE.map((o) => `
        <h4>${esc(o.setting)}</h4>
        <p><span class="chip blue">${esc(o.options)}</span></p>
        <p>${esc(o.advice)}</p>`).join('')}
    </div>
  `;

  const players = getPlayers();

  const xiSel = view.querySelector('#xi-formation');
  const xiOut = view.querySelector('#xi-out');
  function drawXI() {
    if (!players.length) {
      xiOut.innerHTML = `<p class="hint">Add your squad on the Squad page and this tool will pick your strongest lineup for any formation.</p>`;
      return;
    }
    const f = FORMATIONS.find((x) => x.id === xiSel.value);
    if (!f) return;
    const xi = bestXI(f, players);
    const labels = xi.slots.map((s) => s.player ? shortName(s.player.name) : '—');
    xiOut.innerHTML = `
      ${pitchHtml(f, labels)}
      <p><span class="chip green">XI avg quality: ${Math.round(xi.avgQuality)}%</span>
         ${xi.missing.length ? xi.missing.map((pos) => `<span class="chip red">no ${esc(pos)}</span>`).join('') : '<span class="chip blue">all positions covered</span>'}</p>
      ${xi.missing.length ? `<p class="hint">Uncovered slots mean out-of-position players in-game (heavy rating penalty). Train a second position or buy cover — or pick a shape that fits your squad.</p>` : ''}
      ${xi.bench.length ? `
        <h4>Bench (by quality)</h4>
        <p>${xi.bench.slice(0, 8).map((p) => `<span class="chip">${esc(p.name)} · ${esc(p.position)} · ${esc(p.quality)}%</span>`).join('')}</p>
      ` : ''}
    `;
  }
  xiSel.addEventListener('change', drawXI);
  drawXI();

  function formationDetail(f, { withCounters = true } = {}) {
    return `
      ${pitchHtml(f)}
      <p>${esc(f.style)}</p>
      <h4>Strengths</h4><ul>${f.strengths.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      <h4>Weaknesses</h4><ul>${f.weaknesses.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      ${withCounters ? `<h4>Beaten by</h4><ul>${f.counters.map((c) => {
        const cf = FORMATIONS.find((x) => x.id === c.id);
        return `<li><strong>${esc(cf ? cf.name : c.id)}</strong> — ${esc(c.why)}</li>`;
      }).join('')}</ul>` : ''}
      <h4>Recommended settings when you play it</h4>
      ${settingsTable(f.settings)}
    `;
  }

  function squadFitHtml(f) {
    if (!players.length) {
      return `<p class="hint">Add your squad to see which of your players fit this shape.</p>`;
    }
    const fit = squadFitForFormation(f, players);
    return `
      <h4>Your squad in this shape</h4>
      <div class="table-wrap"><table class="tbl">
        <tr><th>Slot</th><th>Need</th><th>Your options</th></tr>
        ${fit.map((row) => `
          <tr>
            <td>${posBadge(row.pos)}</td>
            <td>${row.count}</td>
            <td>${row.players.length
              ? row.players.slice(0, 4).map((p) => `${esc(p.name)} (${esc(p.quality)}%)`).join(', ')
              : '<span class="chip red">no cover</span>'}</td>
          </tr>`).join('')}
      </table></div>`;
  }

  const oppSel = view.querySelector('#opp');
  const counterOut = view.querySelector('#counter-out');
  oppSel.addEventListener('change', () => {
    if (!oppSel.value) { counterOut.innerHTML = ''; return; }
    const res = counterOptions(oppSel.value);
    if (!res) return;
    counterOut.innerHTML = `
      <div class="note">Their <strong>${esc(res.opponent.name)}</strong> — key weaknesses:
        ${res.opponent.weaknesses.map((w) => `<div>• ${esc(w)}</div>`).join('')}
      </div>
      ${res.counters.map((c, i) => `
        <h4>${i === 0 ? 'Best counter' : 'Alternative'}: ${esc(c.formation.name)}</h4>
        <p>${esc(c.why)}</p>
        ${pitchHtml(c.formation)}
        ${settingsTable(c.formation.settings)}
        ${squadFitHtml(c.formation)}
        ${i < res.counters.length - 1 ? '<div class="divider"></div>' : ''}
      `).join('')}
    `;
  });

  const encySel = view.querySelector('#ency');
  const encyOut = view.querySelector('#ency-out');
  function drawEncy() {
    const f = FORMATIONS.find((x) => x.id === encySel.value);
    encyOut.innerHTML = f ? formationDetail(f) + squadFitHtml(f) : '';
  }
  encySel.addEventListener('change', drawEncy);
  drawEncy();
}
