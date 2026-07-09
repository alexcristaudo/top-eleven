// Season planner: persistent checklist + token budget tracker.
import { SEASON_CHECKLIST, ALL_TASK_IDS, TOKEN_CATEGORIES } from '../data/checklist.js';
import { getData, setData, newId } from '../store.js';
import { esc } from './ui.js';

export function renderSeason(view) {
  view.innerHTML = `
    <h2 class="page-title">Season planner</h2>
    <p class="page-sub">Tick off the season routine and keep the token budget honest. Everything saves on this device.</p>
    <div id="checklist"></div>
    <div class="card">
      <h3>Token budget tracker</h3>
      <p class="hint">Log what you spend and earn — the balance and breakdown show where tokens actually go over a season.</p>
      <div id="token-summary"></div>
      <div class="field-row">
        <label class="field"><span>Amount (tokens)</span><input type="number" id="tok-amount" min="1" step="1" placeholder="e.g. 15"></label>
        <label class="field"><span>Category</span>
          <select id="tok-category">
            <optgroup label="Spent on">
              ${TOKEN_CATEGORIES.filter((c) => c.kind === 'spend').map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join('')}
            </optgroup>
            <optgroup label="Earned from">
              ${TOKEN_CATEGORIES.filter((c) => c.kind === 'earn').map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join('')}
            </optgroup>
          </select>
        </label>
      </div>
      <label class="field"><span>Note (optional)</span><input type="text" id="tok-note" placeholder="e.g. won auction for young ST"></label>
      <div class="btn-row">
        <button class="btn" id="tok-add">Add entry</button>
      </div>
      <div id="token-list"></div>
    </div>
  `;

  // ---------- Checklist ----------
  const checklistEl = view.querySelector('#checklist');
  function drawChecklist() {
    const state = getData('checklist', {});
    const done = ALL_TASK_IDS.filter((id) => state[id]).length;
    checklistEl.innerHTML = `
      <div class="card">
        <h3>Season checklist</h3>
        <p><span class="chip ${done === ALL_TASK_IDS.length ? 'green' : 'blue'}">${done} / ${ALL_TASK_IDS.length} done</span></p>
        ${SEASON_CHECKLIST.map((phase) => `
          <h4>${esc(phase.label)}</h4>
          ${phase.tasks.map((t) => `
            <label class="check-row">
              <input type="checkbox" data-task="${t.id}" ${state[t.id] ? 'checked' : ''}>
              <span class="${state[t.id] ? 'done' : ''}">${esc(t.text)}</span>
            </label>`).join('')}
        `).join('')}
        <div class="btn-row">
          <button class="btn secondary small" id="reset-season">New season — reset checklist</button>
        </div>
      </div>`;
    for (const box of checklistEl.querySelectorAll('[data-task]')) {
      box.addEventListener('change', () => {
        const state = getData('checklist', {});
        state[box.dataset.task] = box.checked;
        setData('checklist', state);
        drawChecklist();
      });
    }
    checklistEl.querySelector('#reset-season').addEventListener('click', () => {
      if (confirm('Reset all checklist ticks for a new season?')) {
        setData('checklist', {});
        drawChecklist();
      }
    });
  }
  drawChecklist();

  // ---------- Token tracker ----------
  const summaryEl = view.querySelector('#token-summary');
  const listEl = view.querySelector('#token-list');
  const catById = Object.fromEntries(TOKEN_CATEGORIES.map((c) => [c.id, c]));

  function signedAmount(e) {
    return (catById[e.category]?.kind === 'earn' ? 1 : -1) * Math.abs(e.amount);
  }

  function drawTokens() {
    const entries = getData('tokens', []);
    const balance = entries.reduce((s, e) => s + signedAmount(e), 0);
    const byCat = {};
    for (const e of entries) {
      byCat[e.category] = (byCat[e.category] || 0) + Math.abs(e.amount);
    }
    summaryEl.innerHTML = `
      <p><span class="chip ${balance >= 0 ? 'green' : 'red'}">Net: ${balance >= 0 ? '+' : ''}${balance} tokens</span>
        ${Object.entries(byCat).map(([cat, sum]) =>
          `<span class="chip ${catById[cat]?.kind === 'earn' ? 'blue' : 'yellow'}">${esc(catById[cat]?.label || cat)}: ${sum}</span>`).join('')}
      </p>`;
    listEl.innerHTML = entries.length ? `
      <div class="table-wrap"><table class="tbl">
        <tr><th>Date</th><th>Entry</th><th style="text-align:right">Tokens</th><th></th></tr>
        ${entries.slice().reverse().slice(0, 20).map((e) => `
          <tr>
            <td>${esc(new Date(e.date).toLocaleDateString())}</td>
            <td>${esc(catById[e.category]?.label || e.category)}${e.note ? ` — <span class="hint">${esc(e.note)}</span>` : ''}</td>
            <td style="text-align:right;font-variant-numeric:tabular-nums;color:${signedAmount(e) >= 0 ? 'var(--accent)' : 'var(--bad)'}">${signedAmount(e) >= 0 ? '+' : ''}${signedAmount(e)}</td>
            <td><button class="btn danger small" data-del="${esc(e.id)}">✕</button></td>
          </tr>`).join('')}
      </table></div>
      ${entries.length > 20 ? `<p class="hint">Showing the 20 most recent of ${entries.length} entries.</p>` : ''}
    ` : '<p class="hint">No entries yet. Log your first spend or earn above.</p>';
    for (const btn of listEl.querySelectorAll('[data-del]')) {
      btn.addEventListener('click', () => {
        setData('tokens', getData('tokens', []).filter((e) => e.id !== btn.dataset.del));
        drawTokens();
      });
    }
  }

  view.querySelector('#tok-add').addEventListener('click', () => {
    const amountEl = view.querySelector('#tok-amount');
    const amount = Math.abs(parseInt(amountEl.value, 10));
    if (!Number.isFinite(amount) || amount <= 0) { amountEl.focus(); return; }
    const entries = getData('tokens', []);
    entries.push({
      id: newId(),
      amount,
      category: view.querySelector('#tok-category').value,
      note: view.querySelector('#tok-note').value.trim(),
      date: Date.now(),
    });
    setData('tokens', entries);
    amountEl.value = '';
    view.querySelector('#tok-note').value = '';
    drawTokens();
  });

  drawTokens();
}
