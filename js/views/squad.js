// Squad tracker: list, add/edit form, export/import.
import { getPlayers, upsertPlayer, deletePlayer, newId, exportSquad, importSquad } from '../store.js';
import { POSITIONS } from '../data/roles.js';
import { ATTRIBUTES, GROUPS } from '../data/attributes.js';
import { fastTrainerRating } from '../logic/analysis.js';
import { esc, posBadge } from './ui.js';

export function renderSquad(view) {
  view.innerHTML = `
    <h2 class="page-title">Squad</h2>
    <p class="page-sub">Your saved players power every tool: development plans, weakness analysis and formation fit. Data lives only on this device — use Export to move it.</p>
    <div id="squad-list"></div>
    <div class="btn-row">
      <button class="btn" id="add-player">＋ Add player</button>
      <button class="btn secondary" id="export">Export JSON</button>
      <button class="btn secondary" id="import">Import JSON</button>
      <input type="file" id="import-file" accept="application/json,.json" class="sr-only">
    </div>
    <div id="editor"></div>
    <div id="compare-card"></div>
  `;

  const listEl = view.querySelector('#squad-list');
  const editorEl = view.querySelector('#editor');

  function drawList() {
    const players = getPlayers();
    if (!players.length) {
      listEl.innerHTML = `<div class="empty">No players yet. Add your squad to unlock personalised training plans and tactics.</div>`;
      drawCompare();
      return;
    }
    listEl.innerHTML = `<div class="card">` + players
      .slice()
      .sort((a, b) => (b.quality || 0) - (a.quality || 0))
      .map((p) => `
        <div class="player-row" data-id="${esc(p.id)}">
          ${posBadge(p.position)}
          <div class="grow">
            <div class="name">${esc(p.name)}</div>
            <div class="meta">Age ${esc(p.age)}${p.altPositions?.length ? ' · also ' + p.altPositions.map(esc).join('/') : ''}</div>
          </div>
          <div class="quality">${esc(p.quality)}%</div>
        </div>`).join('') + `</div>`;
    for (const row of listEl.querySelectorAll('.player-row')) {
      row.addEventListener('click', () => { location.hash = `#/player/${row.dataset.id}`; });
    }
    drawCompare();
  }

  function drawEditor(player) {
    const p = player || { id: newId(), name: '', position: 'MC', altPositions: [], age: 18, quality: 20, attrs: {} };
    const isNew = !player;
    editorEl.innerHTML = `
      <div class="card" id="edit-card">
        <h3>${isNew ? 'Add player' : 'Edit ' + esc(p.name)}</h3>
        <label class="field"><span>Name</span><input type="text" id="f-name" value="${esc(p.name)}" placeholder="Player name"></label>
        <div class="field-row">
          <label class="field"><span>Main position</span>
            <select id="f-pos">${POSITIONS.map((x) => `<option ${x === p.position ? 'selected' : ''}>${x}</option>`).join('')}</select>
          </label>
          <label class="field"><span>Age</span><input type="number" id="f-age" min="16" max="40" value="${esc(p.age)}"></label>
        </div>
        <div class="field-row">
          <label class="field"><span>Quality % (overall)</span><input type="number" id="f-quality" min="1" max="200" value="${esc(p.quality)}"></label>
          <label class="field"><span>Alt positions (comma-sep, e.g. DL,ML)</span><input type="text" id="f-alt" value="${esc((p.altPositions || []).join(','))}"></label>
        </div>
        <h4>Attributes (optional — enables precise weakness analysis)</h4>
        <p class="hint">Enter the % value shown on each skill in-game. Leave blank to skip.</p>
        ${GROUPS.map((g) => `
          <h4>${esc(g.label)}</h4>
          <div class="attr-grid">
            ${ATTRIBUTES.filter((a) => a.group === g.id).map((a) => `
              <label class="field"><span>${esc(a.label)}</span>
                <input type="number" min="1" max="250" data-attr="${a.key}" value="${Number.isFinite(p.attrs?.[a.key]) ? esc(p.attrs[a.key]) : ''}">
              </label>`).join('')}
          </div>`).join('')}
        <div class="btn-row">
          <button class="btn" id="save">Save player</button>
          <button class="btn secondary" id="cancel">Cancel</button>
          ${isNew ? '' : '<button class="btn danger" id="delete">Delete</button>'}
        </div>
      </div>`;

    editorEl.querySelector('#save').addEventListener('click', () => {
      const name = editorEl.querySelector('#f-name').value.trim();
      if (!name) { editorEl.querySelector('#f-name').focus(); return; }
      const attrs = {};
      for (const inp of editorEl.querySelectorAll('[data-attr]')) {
        const v = parseFloat(inp.value);
        if (Number.isFinite(v)) attrs[inp.dataset.attr] = v;
      }
      upsertPlayer({
        id: p.id,
        name,
        position: editorEl.querySelector('#f-pos').value,
        altPositions: editorEl.querySelector('#f-alt').value.split(',').map((s) => s.trim().toUpperCase()).filter((s) => POSITIONS.includes(s)),
        age: parseInt(editorEl.querySelector('#f-age').value, 10) || 18,
        quality: parseFloat(editorEl.querySelector('#f-quality').value) || 0,
        attrs,
      });
      editorEl.innerHTML = '';
      drawList();
    });
    editorEl.querySelector('#cancel').addEventListener('click', () => { editorEl.innerHTML = ''; });
    const del = editorEl.querySelector('#delete');
    if (del) del.addEventListener('click', () => {
      if (confirm(`Delete ${p.name}?`)) { deletePlayer(p.id); editorEl.innerHTML = ''; drawList(); }
    });
    editorEl.querySelector('#edit-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  view.querySelector('#add-player').addEventListener('click', () => drawEditor(null));

  view.querySelector('#export').addEventListener('click', () => {
    const blob = new Blob([exportSquad()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'te-manager-squad.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  const fileInput = view.querySelector('#import-file');
  view.querySelector('#import').addEventListener('click', () => fileInput.click());
  const compareEl = view.querySelector('#compare-card');
  function drawCompare() {
    const players = getPlayers();
    if (players.length < 2) { compareEl.innerHTML = ''; return; }
    const opts = (sel) => players.map((p, i) =>
      `<option value="${esc(p.id)}" ${i === sel ? 'selected' : ''}>${esc(p.name)} (${esc(p.position)})</option>`).join('');
    compareEl.innerHTML = `
      <div class="card">
        <h3>Compare players</h3>
        <p class="hint">Side-by-side check — handy when judging an auction target against a current starter (add the target temporarily, compare, then delete).</p>
        <div class="field-row">
          <label class="field"><span>Player A</span><select id="cmp-a">${opts(0)}</select></label>
          <label class="field"><span>Player B</span><select id="cmp-b">${opts(1)}</select></label>
        </div>
        <div id="cmp-out"></div>
      </div>`;
    const selA = compareEl.querySelector('#cmp-a');
    const selB = compareEl.querySelector('#cmp-b');
    const out = compareEl.querySelector('#cmp-out');
    function drawTable() {
      const a = players.find((p) => p.id === selA.value);
      const b = players.find((p) => p.id === selB.value);
      if (!a || !b) return;
      const row = (label, va, vb, fmt = (x) => x) => {
        const aWin = Number.isFinite(va) && Number.isFinite(vb) && va > vb;
        const bWin = Number.isFinite(va) && Number.isFinite(vb) && vb > va;
        return `<tr><th>${esc(label)}</th>
          <td style="${aWin ? 'color:var(--accent);font-weight:700' : ''}">${Number.isFinite(va) ? fmt(va) : '—'}</td>
          <td style="${bWin ? 'color:var(--accent);font-weight:700' : ''}">${Number.isFinite(vb) ? fmt(vb) : '—'}</td></tr>`;
      };
      out.innerHTML = `
        <div class="table-wrap"><table class="tbl">
          <tr><th></th><th>${esc(a.name)}</th><th>${esc(b.name)}</th></tr>
          ${row('Quality %', a.quality, b.quality)}
          <tr><th>Age / trainer</th>
            <td>${esc(a.age)} · ${esc(fastTrainerRating(a.age).label)}</td>
            <td>${esc(b.age)} · ${esc(fastTrainerRating(b.age).label)}</td></tr>
          ${ATTRIBUTES.map((at) => row(at.label, a.attrs?.[at.key], b.attrs?.[at.key])).join('')}
        </table></div>
        <p class="hint">Green = higher value. Missing attributes show as —.</p>`;
    }
    selA.addEventListener('change', drawTable);
    selB.addEventListener('change', drawTable);
    drawTable();
  }

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    try {
      const n = importSquad(await file.text());
      alert(`Imported ${n} players.`);
      drawList();
    } catch (e) {
      alert('Import failed: ' + e.message);
    }
    fileInput.value = '';
  });

  drawList();
}
