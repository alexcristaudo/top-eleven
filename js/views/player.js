// Per-player development page: verdict, weaknesses, drill session, role fit.
import { getPlayer, getPlayers } from '../store.js';
import { ROLES } from '../data/roles.js';
import { developmentPlan, roleFit, attrLabel } from '../logic/analysis.js';
import { esc, posBadge, meterRow } from './ui.js';

export function renderPlayer(view, id) {
  const p = getPlayer(id);
  if (!p) {
    view.innerHTML = `<a class="back-link" href="#/squad">← Squad</a><div class="empty">Player not found.</div>`;
    return;
  }
  const squad = getPlayers();
  const avgQ = squad.length ? squad.reduce((s, x) => s + (x.quality || 0), 0) / squad.length : 0;
  const plan = developmentPlan(p, avgQ);
  const fits = roleFit(p).slice(0, 4);
  const role = ROLES[p.position];

  view.innerHTML = `
    <a class="back-link" href="#/squad">← Squad</a>
    <h2 class="page-title">${esc(p.name)} ${posBadge(p.position)}</h2>
    <p class="page-sub">Age ${esc(p.age)} · ${esc(p.quality)}% quality${p.altPositions?.length ? ' · also plays ' + p.altPositions.map(esc).join('/') : ''}</p>

    <div class="card">
      <h3>Development verdict</h3>
      <p><span class="chip ${plan.verdict.chip}">${esc(plan.verdict.type)}</span>
         <span class="chip blue">${esc(plan.fastTrainer.label)}</span></p>
      <p>${esc(plan.verdict.advice)}</p>
      <p class="hint">${esc(plan.fastTrainer.note)}</p>
    </div>

    <div class="card">
      <h3>Areas of improvement — ${esc(role ? role.label : p.position)}</h3>
      ${plan.report.hasValues ? `
        <p class="hint">Ranked by role importance × gap below the player's own average (${Math.round(plan.report.avg)}).</p>
        ${plan.report.items.slice(0, 6).map((it) => meterRow(it.label, it.value, Math.max(plan.report.avg * 1.3, it.value))).join('')}
      ` : `
        <p>No attribute values saved for this player, so here are the skills that matter most for a ${esc(role ? role.label.toLowerCase() : p.position)} — train these first:</p>
        <p>${plan.report.items.map((it) => `<span class="chip ${it.weight >= 3 ? 'green' : ''}">${esc(it.label)}</span>`).join('')}</p>
        <p class="hint">Add attribute values on the Squad page (edit player) for a precise gap analysis.</p>
      `}
    </div>

    <div class="card">
      <h3>Recommended training session (~30% condition)</h3>
      ${plan.session.plan.length ? `
        <div class="table-wrap"><table class="tbl">
          <tr><th>Drill</th><th>Trains</th><th>Cond.</th></tr>
          ${plan.session.plan.map((s) => `
            <tr>
              <td><strong>${esc(s.drill.name)}</strong></td>
              <td>${Object.entries(s.drill.attrs).map(([k, w]) => `<span class="chip ${w >= 2 ? 'green' : ''}">${esc(attrLabel(k))}</span>`).join('')}</td>
              <td>${s.drill.cost}%</td>
            </tr>`).join('')}
        </table></div>
        <p class="hint">Total ≈ ${plan.session.totalCost}% condition at normal intensity.</p>
      ` : '<p class="hint">No matching drills found.</p>'}
      <h4>Intensity</h4><p>${esc(plan.intensity)}</p>
      <h4>Green packs</h4><p>${esc(plan.greens)}</p>
    </div>

    ${fits.length ? `
    <div class="card">
      <h3>Role fit</h3>
      <p class="hint">Weighted attribute score per position — a higher score than the current role suggests retraining.</p>
      ${fits.map((f) => meterRow(`${f.pos}`, f.score, Math.max(...fits.map((x) => x.score)) * 1.1)).join('')}
    </div>` : ''}
  `;
}
