// Home dashboard: squad snapshot + quick links + rotating tip.
import { getPlayers } from '../store.js';
import { fastTrainerRating } from '../logic/analysis.js';
import { GUIDES } from '../data/guides.js';
import { esc, posBadge } from './ui.js';

const TIPS = [
  'Bid in the final seconds of an auction round — early bids just attract rivals.',
  'Players regenerate condition every 15 minutes. Boost greens right before the match, not hours before.',
  'Buy 18-year-old fast trainers in the first days of the season, when the market is flooded and cheap.',
  'Narrow formations (diamond, box, butterfly) die to "Focus passing: Down Both Flanks".',
  'Never train hard below 60% condition — that\'s where injuries come from.',
  'Sell declining players before season rollover; they age +1 and lose value at reset.',
  'A DMC neutralises the opponent\'s AMC. No DMC vs a 4-2-3-1 means their playmaker runs free.',
  'Attend big matches live — your presence gives the team a small real boost.',
  'Watch every free ad video daily; over a season it funds a whole transfer campaign.',
  'Possession doesn\'t win games — chances do. Judge tactics by chances created and conceded.',
];

export function renderDashboard(view) {
  const players = getPlayers();
  const avgQ = players.length ? players.reduce((s, p) => s + (p.quality || 0), 0) / players.length : 0;
  const avgAge = players.length ? players.reduce((s, p) => s + (p.age || 0), 0) / players.length : 0;
  const fastTrainers = players.filter((p) => fastTrainerRating(p.age).tier >= 4).length;
  const tip = TIPS[new Date().getDate() % TIPS.length];

  view.innerHTML = `
    <h2 class="page-title">TE Manager</h2>
    <p class="page-sub">Your Top Eleven strategy assistant — training, development, tactics and long-game strategy in one place.</p>

    <div class="tiles">
      <div class="tile"><div class="num">${players.length}</div><div class="lbl">Players saved</div></div>
      <div class="tile"><div class="num">${players.length ? Math.round(avgQ) + '%' : '—'}</div><div class="lbl">Avg quality</div></div>
      <div class="tile"><div class="num">${players.length ? avgAge.toFixed(1) : '—'}</div><div class="lbl">Avg age</div></div>
      <div class="tile"><div class="num">${players.length ? fastTrainers : '—'}</div><div class="lbl">Fast trainers (≤21)</div></div>
    </div>

    <div class="note">💡 <strong>Tip of the day:</strong> ${esc(tip)}</div>
    <div style="height:14px"></div>

    <div class="quick-links">
      <a href="#/squad"><strong>👥 Squad</strong><span class="desc">${players.length ? 'Manage players & open development pages' : 'Start here — add your players'}</span></a>
      <a href="#/training"><strong>🏋️ Training</strong><span class="desc">Build optimal drill sessions per player or position</span></a>
      <a href="#/tactics"><strong>📋 Tactics</strong><span class="desc">Counter any formation with full match settings</span></a>
      <a href="#/guides"><strong>📖 Guides</strong><span class="desc">${GUIDES.length} strategy playbooks: tokens, transfers, packs…</span></a>
    </div>

    ${players.length ? `
      <div style="height:14px"></div>
      <div class="card">
        <h3>Development priorities</h3>
        <p class="hint">Your fast trainers — the players where training time converts to skill fastest.</p>
        ${players.filter((p) => fastTrainerRating(p.age).tier >= 4)
          .sort((a, b) => a.age - b.age)
          .slice(0, 5)
          .map((p) => `
            <div class="player-row" data-id="${esc(p.id)}">
              ${posBadge(p.position)}
              <div class="grow"><div class="name">${esc(p.name)}</div>
              <div class="meta">Age ${esc(p.age)} · ${esc(fastTrainerRating(p.age).label)}</div></div>
              <div class="quality">${esc(p.quality)}%</div>
            </div>`).join('') || '<p class="hint">No players aged 21 or under — consider buying young projects early next season.</p>'}
      </div>` : `
      <div style="height:14px"></div>
      <div class="empty">Add your squad to unlock personalised development plans,<br>weakness analysis and formation fit checks.</div>`}
  `;

  for (const row of view.querySelectorAll('.player-row')) {
    row.addEventListener('click', () => { location.hash = `#/player/${row.dataset.id}`; });
  }
}
