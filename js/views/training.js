// Training centre: session builder + drill browser + intensity guide.
import { DRILLS, DRILL_CATEGORIES, INTENSITY } from '../data/drills.js';
import { POSITIONS, ROLES } from '../data/roles.js';
import { attrLabel } from '../data/attributes.js';
import { recommendDrills, needsForPosition, needsFromWeaknesses, weaknessReport, conditionPlan } from '../logic/analysis.js';
import { getPlayers } from '../store.js';
import { TEAMPLAY_BONUSES, BONUS_MAX, BONUS_DECAY, BONUS_PER_SESSION, TEAMPLAY_NOTES } from '../data/teamplay.js';
import { esc } from './ui.js';

export function renderTraining(view) {
  const players = getPlayers();
  view.innerHTML = `
    <h2 class="page-title">Training centre</h2>
    <p class="page-sub">Build an optimal drill session for a position or one of your players, then browse the full drill catalogue.</p>

    <div class="card">
      <h3>Session builder</h3>
      <div class="field-row">
        <label class="field"><span>Train for</span>
          <select id="target">
            <optgroup label="Position (generic)">
              ${POSITIONS.map((x) => `<option value="pos:${x}">${x} — ${esc(ROLES[x].label)}</option>`).join('')}
            </optgroup>
            ${players.length ? `<optgroup label="Your players (fix weaknesses)">
              ${players.map((p) => `<option value="ply:${esc(p.id)}">${esc(p.name)} (${esc(p.position)})</option>`).join('')}
            </optgroup>` : ''}
          </select>
        </label>
        <label class="field"><span>Condition budget: <b id="budget-val">30</b>%</span>
          <input type="range" id="budget" min="10" max="60" step="5" value="30">
        </label>
      </div>
      <div id="session-out"></div>
    </div>

    <div class="card">
      <h3>Teamplay bonus planner</h3>
      <p class="hint">The four match bonuses cap at ${BONUS_MAX}% each (40% total) and drop ${BONUS_DECAY}% per category every game-day. Enter today's values to get the maintenance plan.</p>
      <div class="field-row" style="grid-template-columns:1fr 1fr">
        ${TEAMPLAY_BONUSES.slice(0, 2).map((b) => `
          <label class="field"><span>${esc(b.label)}: <b id="tb-val-${b.id}">6</b>%</span>
            <input type="range" id="tb-${b.id}" min="0" max="${BONUS_MAX}" step="1" value="6">
          </label>`).join('')}
      </div>
      <div class="field-row" style="grid-template-columns:1fr 1fr">
        ${TEAMPLAY_BONUSES.slice(2).map((b) => `
          <label class="field"><span>${esc(b.label)}: <b id="tb-val-${b.id}">6</b>%</span>
            <input type="range" id="tb-${b.id}" min="0" max="${BONUS_MAX}" step="1" value="6">
          </label>`).join('')}
      </div>
      <div id="tb-out"></div>
      <ul>${TEAMPLAY_NOTES.map((n) => `<li class="hint">${esc(n)}</li>`).join('')}</ul>
    </div>

    <div class="card">
      <h3>Personal trainer — worth it?</h3>
      <p class="hint">The personal trainer converts tokens straight into skill points (young players get more per token). Check any offer before paying.</p>
      <div class="field-row">
        <label class="field"><span>Tokens asked</span><input type="number" id="pt-tokens" min="1" step="1" placeholder="e.g. 12"></label>
        <label class="field"><span>Skill points offered</span><input type="number" id="pt-points" min="1" step="1" placeholder="e.g. 10"></label>
      </div>
      <div id="pt-out"></div>
    </div>

    <div class="card">
      <h3>Condition planner</h3>
      <p class="hint">Condition regenerates on a 15-minute tick (~5% per tick); a green pack restores ~15%. Plan whether a player is match-ready without wasting packs.</p>
      <div class="field-row">
        <label class="field"><span>Current condition: <b id="cond-val">65</b>%</span>
          <input type="range" id="cond-current" min="0" max="100" step="5" value="65">
        </label>
        <label class="field"><span>Kickoff in (hours): <b id="hours-val">3</b></span>
          <input type="range" id="cond-hours" min="0" max="12" step="0.5" value="3">
        </label>
      </div>
      <label class="field"><span>Target at kickoff: <b id="target-val">90</b>%</span>
        <input type="range" id="cond-target" min="70" max="100" step="5" value="90">
      </label>
      <div id="cond-out"></div>
    </div>

    <div class="card">
      <h3>Intensity guide</h3>
      ${INTENSITY.map((i) => `
        <h4>${esc(i.label)}</h4>
        <p>${esc(i.effect)}</p>
        <p class="hint">Use for: ${esc(i.when)}</p>`).join('')}
      <div class="warn-note">Injury risk spikes when training hard below ~60% condition. Costs shown are approximate at normal intensity — exact in-game numbers vary with your training level.</div>
    </div>

    <h2 class="page-title">Drill catalogue</h2>
    <p class="page-sub">Every drill with what it trains, what it costs, and who benefits.</p>
    ${DRILL_CATEGORIES.map((cat) => `
      <div class="card">
        <h3>${esc(cat.label)}</h3>
        <div class="table-wrap"><table class="tbl">
          <tr><th>Drill</th><th>Trains</th><th>Cond.</th><th>Best for</th></tr>
          ${DRILLS.filter((d) => d.category === cat.id).map((d) => `
            <tr>
              <td><strong>${esc(d.name)}</strong><br><span class="hint">${esc(d.note)}</span></td>
              <td>${Object.entries(d.attrs).map(([k, w]) => `<span class="chip ${w >= 2 ? 'green' : ''}">${esc(attrLabel(k))}</span>`).join('')}</td>
              <td>${d.cost}%</td>
              <td>${d.positions.length >= 12 ? 'All' : d.positions.map(esc).join(', ')}</td>
            </tr>`).join('')}
        </table></div>
      </div>`).join('')}
  `;

  const targetEl = view.querySelector('#target');
  const budgetEl = view.querySelector('#budget');
  const budgetVal = view.querySelector('#budget-val');
  const out = view.querySelector('#session-out');

  function build() {
    const budget = parseInt(budgetEl.value, 10);
    budgetVal.textContent = budget;
    const [kind, key] = targetEl.value.split(':');
    let needs, position, context;
    if (kind === 'ply') {
      const p = players.find((x) => x.id === key);
      if (!p) return;
      position = p.position;
      const report = weaknessReport(p, p.position);
      needs = needsFromWeaknesses(report);
      context = `Targeting ${esc(p.name)}'s weakest role-critical skills: ` +
        report.items.slice(0, 4).map((it) => esc(it.label)).join(', ') + '.';
    } else {
      position = key;
      needs = needsForPosition(key);
      context = `Core skills for a ${esc(ROLES[key].label.toLowerCase())}.`;
    }
    const { plan, totalCost } = recommendDrills(needs, { budget, position });
    out.innerHTML = `
      <p class="hint">${context}</p>
      ${plan.length ? `
        <div class="table-wrap"><table class="tbl">
          <tr><th>Drill</th><th>Trains</th><th>Cond.</th></tr>
          ${plan.map((s) => `
            <tr>
              <td><strong>${esc(s.drill.name)}</strong></td>
              <td>${Object.entries(s.drill.attrs).map(([k, w]) => `<span class="chip ${w >= 2 ? 'green' : ''}">${esc(attrLabel(k))}</span>`).join('')}</td>
              <td>${s.drill.cost}%</td>
            </tr>`).join('')}
        </table></div>
        <p class="hint">Session total ≈ <strong>${totalCost}%</strong> condition of the ${parseInt(budgetEl.value, 10)}% budget at normal intensity.</p>
      ` : '<p class="hint">Budget too small for any matching drill — raise it.</p>'}
    `;
  }

  targetEl.addEventListener('change', build);
  budgetEl.addEventListener('input', build);
  build();

  const condIn = view.querySelector('#cond-current');
  const hoursIn = view.querySelector('#cond-hours');
  const targetIn = view.querySelector('#cond-target');
  const condOut = view.querySelector('#cond-out');
  function drawCondition() {
    const current = parseInt(condIn.value, 10);
    const hours = parseFloat(hoursIn.value);
    const target = parseInt(targetIn.value, 10);
    view.querySelector('#cond-val').textContent = current;
    view.querySelector('#hours-val').textContent = hours;
    view.querySelector('#target-val').textContent = target;
    const plan = conditionPlan({ current, minutesUntilMatch: hours * 60, target });
    condOut.innerHTML = plan.ready
      ? `<div class="note">✅ Match-ready without packs: natural regeneration reaches <strong>${plan.atKickoff}%</strong> by kickoff${plan.minutesToTarget > 0 ? ` (hits ${target}% in ~${plan.minutesToTarget >= 60 ? (plan.minutesToTarget / 60).toFixed(1) + ' h' : plan.minutesToTarget + ' min'})` : ''}. Save your greens.</div>`
      : `<div class="warn-note">⚠️ Regeneration alone only reaches <strong>${plan.atKickoff}%</strong> by kickoff. Use <strong>${plan.greensNeeded} green pack${plan.greensNeeded === 1 ? '' : 's'}</strong> right before the match to hit ${target}%${Number.isFinite(plan.minutesToTarget) ? ` — or it reaches ${target}% naturally in ~${(plan.minutesToTarget / 60).toFixed(1)} h if the match can wait` : ''}.</div>`;
  }
  for (const el of [condIn, hoursIn, targetIn]) el.addEventListener('input', drawCondition);
  drawCondition();

  // ---------- Teamplay bonus planner ----------
  const tbOut = view.querySelector('#tb-out');
  function drawTeamplay() {
    const catLabel = Object.fromEntries(DRILL_CATEGORIES.map((c) => [c.id, c.label]));
    const rows = TEAMPLAY_BONUSES.map((b) => {
      const val = parseInt(view.querySelector(`#tb-${b.id}`).value, 10);
      view.querySelector(`#tb-val-${b.id}`).textContent = val;
      const afterDecay = Math.max(0, val - BONUS_DECAY);
      const sessions = Math.ceil((BONUS_MAX - afterDecay) / BONUS_PER_SESSION);
      const squadOk = players.filter(b.filter).length >= b.minCount;
      return { b, val, afterDecay, sessions, squadOk };
    });
    const work = rows.filter((r) => r.sessions > 0);
    tbOut.innerHTML = `
      <div class="table-wrap"><table class="tbl">
        <tr><th>Bonus</th><th>Tomorrow</th><th>To max</th><th>How</th></tr>
        ${rows.map((r) => `
          <tr>
            <td><strong>${esc(r.b.label)}</strong></td>
            <td>${r.afterDecay}%</td>
            <td>${r.sessions === 0 ? '<span class="chip green">full</span>' : `${r.sessions} session${r.sessions === 1 ? '' : 's'} (${Math.ceil(r.sessions / 2)} with 2× boost)`}</td>
            <td class="hint">${esc(catLabel[r.b.drillCategory] || r.b.drillCategory)} · ${esc(r.b.minPlayers)}${players.length && !r.squadOk ? ' <span class="chip red">squad lacks these players!</span>' : ''}</td>
          </tr>`).join('')}
      </table></div>
      ${work.length === 0 ? '<div class="note">✅ All bonuses hold at max through tomorrow — one light maintenance session per category per day keeps it that way.</div>' : ''}`;
  }
  for (const b of TEAMPLAY_BONUSES) {
    view.querySelector(`#tb-${b.id}`).addEventListener('input', drawTeamplay);
  }
  drawTeamplay();

  // ---------- Personal trainer calculator ----------
  const ptOut = view.querySelector('#pt-out');
  function drawPT() {
    const tokens = parseInt(view.querySelector('#pt-tokens').value, 10);
    const points = parseInt(view.querySelector('#pt-points').value, 10);
    if (!Number.isFinite(tokens) || !Number.isFinite(points) || tokens <= 0 || points <= 0) {
      ptOut.innerHTML = '';
      return;
    }
    const ratio = tokens / points;
    const verdict = ratio <= 1
      ? { cls: 'note', text: `✅ ${ratio.toFixed(1)} tokens per point — good value, IF this is a measured fast trainer aged 18–21 you plan to keep.` }
      : ratio <= 2
        ? { cls: 'note', text: `🟡 ${ratio.toFixed(1)} tokens per point — acceptable for a key young player in a title run; free 6-sprint sessions give a fast trainer ~2 points for ~33% condition.` }
        : { cls: 'warn-note', text: `❌ ${ratio.toFixed(1)} tokens per point — poor value. Normal training (free) or the auction market beats this; never pay it for slow or ageing players.` };
    ptOut.innerHTML = `<div class="${verdict.cls}">${verdict.text}</div>`;
  }
  view.querySelector('#pt-tokens').addEventListener('input', drawPT);
  view.querySelector('#pt-points').addEventListener('input', drawPT);
}
