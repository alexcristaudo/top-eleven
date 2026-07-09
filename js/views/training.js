// Training centre: session builder + drill browser + intensity guide.
import { DRILLS, DRILL_CATEGORIES, INTENSITY } from '../data/drills.js';
import { POSITIONS, ROLES } from '../data/roles.js';
import { attrLabel } from '../data/attributes.js';
import { recommendDrills, needsForPosition, needsFromWeaknesses, weaknessReport } from '../logic/analysis.js';
import { getPlayers } from '../store.js';
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
}
