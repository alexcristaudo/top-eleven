// Per-player development page: verdict, weaknesses, drill session, role fit.
import { getPlayer, getPlayers, upsertPlayer, deletePlayer } from '../store.js';
import { ROLES } from '../data/roles.js';
import { developmentPlan, roleFit, attrLabel, classifyTrainerTest } from '../logic/analysis.js';
import { RECOMMENDED_TESTS, MIN_TESTS_FOR_VERDICT, TEST_AGE_NOTE } from '../data/trainertest.js';
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
         <span class="chip ${plan.fastTrainer.tested ? 'green' : 'blue'}">${esc(plan.fastTrainer.label)}${plan.fastTrainer.tested ? '' : ' (estimated from age)'}</span></p>
      <p>${esc(plan.verdict.advice)}</p>
      <p class="hint">${esc(plan.fastTrainer.note)}${plan.fastTrainer.tested ? '' : ' Age is only a rough proxy — run the fast-trainer test below for the real answer.'}</p>
    </div>

    <div class="card" id="ft-test-card">
      <h3>Fast-trainer test</h3>
      <p class="hint">Training speed is a hidden per-player multiplier — being young does NOT make a player a fast trainer. Measure it:</p>
      <ol>
        <li>In the game, set this player to learn a <strong>new role or special ability</strong> (it needs 50 skill points).</li>
        <li>With condition near 100%, run <strong>one session of 6× Sprint</strong> drills.</li>
        <li>Enter how many <strong>points</strong> the training awarded (0, +1, +2, +3…).</li>
        <li>Let condition recover and repeat — <strong>${RECOMMENDED_TESTS} tests</strong> give a reliable verdict (${MIN_TESTS_FOR_VERDICT} for a provisional one), since single sessions land on whole points.</li>
      </ol>
      <p class="hint">${esc(TEST_AGE_NOTE)}</p>
      <div class="field-row">
        <label class="field"><span>Points earned this test (of 50)</span>
          <input type="number" id="ft-gain" min="0" max="10" step="1" placeholder="e.g. 2">
        </label>
        <label class="field"><span>&nbsp;</span>
          <button class="btn" id="ft-add">Record test</button>
        </label>
      </div>
      <div id="ft-results"></div>
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

    <div class="btn-row">
      <button class="btn secondary" id="p-edit">✎ Edit player</button>
      <button class="btn danger" id="p-delete">Delete player</button>
    </div>
  `;

  view.querySelector('#p-delete').addEventListener('click', () => {
    if (confirm(`Delete ${p.name}? This also removes their fast-trainer test history.`)) {
      deletePlayer(p.id);
      location.hash = '#/squad';
    }
  });
  view.querySelector('#p-edit').addEventListener('click', () => {
    // The editor lives on the Squad page; remember who to open it for.
    sessionStorage.setItem('te-manager.edit-on-arrival', p.id);
    location.hash = '#/squad';
  });

  // ---------- Fast-trainer test recording ----------
  const resultsEl = view.querySelector('#ft-results');
  function drawTestResults() {
    const cur = getPlayer(id);
    const entries = cur.trainerTests || [];
    const t = classifyTrainerTest(cur);
    resultsEl.innerHTML = `
      <p><span class="chip blue">${entries.length}/${RECOMMENDED_TESTS} tests recorded</span>
      ${t.tested ? `
        <span class="chip ${t.class.chip}">${esc(t.class.label)}${t.provisional ? ' (provisional)' : ''}</span>
        <span class="chip">avg ${t.avgPoints.toFixed(1)} pts/test · ${t.normalized.toFixed(1)} age-adjusted</span>
      ` : entries.length ? `<span class="chip yellow">${MIN_TESTS_FOR_VERDICT - entries.length} more test${MIN_TESTS_FOR_VERDICT - entries.length === 1 ? '' : 's'} for a verdict</span>` : ''}</p>
      ${t.tested ? `<p>${esc(t.class.note)}</p>` : ''}
      ${t.tested && t.noisy ? '<div class="warn-note">Results vary a lot between tests — double-check you used the same 6-sprint session and near-full condition each time.</div>' : ''}
      ${entries.length ? `<p>${entries.map((e, i) =>
        `<span class="chip">#${i + 1}: +${esc(Number.isFinite(e.points) ? e.points : (e.gain / 2).toFixed(1))} pts <button class="btn danger small" data-ft-del="${i}" style="padding:2px 7px">✕</button></span>`).join(' ')}</p>` : ''}
    `;
    for (const btn of resultsEl.querySelectorAll('[data-ft-del]')) {
      btn.addEventListener('click', () => {
        const cur = getPlayer(id);
        cur.trainerTests.splice(parseInt(btn.dataset.ftDel, 10), 1);
        upsertPlayer(cur);
        renderPlayer(view, id); // verdict card depends on the tests — full refresh
      });
    }
  }
  view.querySelector('#ft-add').addEventListener('click', () => {
    const input = view.querySelector('#ft-gain');
    const points = parseInt(input.value, 10);
    if (!Number.isFinite(points) || points < 0 || points > 10) { input.focus(); return; }
    const cur = getPlayer(id);
    cur.trainerTests = cur.trainerTests || [];
    cur.trainerTests.push({ points, date: Date.now() });
    upsertPlayer(cur);
    renderPlayer(view, id);
  });
  drawTestResults();
}
