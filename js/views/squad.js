// Squad tracker: list, add/edit form, export/import.
import { getPlayers, upsertPlayer, deletePlayer, newId, exportSquad, importSquad, seasonRollover, getHistory } from '../store.js';
import { POSITIONS } from '../data/roles.js';
import { ATTRIBUTES, GROUPS, attributesFor, groupsFor } from '../data/attributes.js';
import { fastTrainerRating, saCoverage, archetypeRating, growthReport } from '../logic/analysis.js';
import { SPECIAL_ABILITIES, abilityLabel, abilityIdsOf } from '../data/abilities.js';
import { PLAYSTYLES, PLAYSTYLE_LEVELS, playstyleLabel } from '../data/playstyles.js';
import { recognizeScreenshot, processRecording, planSquadChanges, sameName, screenshotUpdateDraft } from '../logic/ocr.js';
import { esc, posBadge } from './ui.js';

export function renderSquad(view) {
  view.innerHTML = `
    <h2 class="page-title">Squad</h2>
    <p class="page-sub">Your saved players power every tool: development plans, weakness analysis and formation fit. Data lives only on this device — use Export to move it.</p>
    <div id="squad-list"></div>
    <div class="btn-row">
      <button class="btn" id="add-player">＋ Add player</button>
      <button class="btn secondary" id="scan-player">📷 From screenshot</button>
      <button class="btn secondary" id="scan-video">🎬 From recording</button>
      <button class="btn secondary" id="new-season">🔄 New season −20</button>
      <button class="btn secondary" id="export">Export JSON</button>
      <button class="btn secondary" id="import">Import JSON</button>
      <input type="file" id="import-file" accept="application/json,.json" class="sr-only">
      <input type="file" id="scan-file" accept="image/*" class="sr-only">
      <input type="file" id="video-file" accept="video/*" class="sr-only">
    </div>
    <div id="scan-status"></div>
    <div id="video-review"></div>
    <div id="editor"></div>
    <div id="risers-card"></div>
    <div id="sa-coverage"></div>
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
            <div class="name">${esc(p.name)}${[4, 9].includes(Math.round(p.quality) % 10) ? ' <span class="chip green" title="One step from the next star">★+1 soon</span>' : ''}${(() => {
              const a = archetypeRating(p);
              return a && a.fast ? ' <span class="chip green" title="Fast — meta attacker profile">⚡</span>' : '';
            })()}</div>
            <div class="meta">Age ${esc(p.age)}${abilityIdsOf(p).length ? ' · ' + abilityIdsOf(p).map((id) => esc(abilityLabel(id))).join(', ') : ''}${p.altPositions?.length ? ' · also ' + p.altPositions.map(esc).join('/') : ''}</div>
          </div>
          <div class="quality">${esc(p.quality)}%</div>
          <button class="btn secondary small" data-edit="${esc(p.id)}" aria-label="Edit ${esc(p.name)}">✎</button>
        </div>`).join('') + `</div>`;
    for (const row of listEl.querySelectorAll('.player-row')) {
      row.addEventListener('click', () => { location.hash = `#/player/${row.dataset.id}`; });
    }
    for (const btn of listEl.querySelectorAll('[data-edit]')) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // don't navigate to the player page
        const p = getPlayers().find((x) => x.id === btn.dataset.edit);
        if (p) drawEditor(p);
      });
    }
    drawCompare();
    drawRisers();
    drawSaCoverage();
  }

  const risersEl = view.querySelector('#risers-card');
  function drawRisers() {
    const rows = getPlayers()
      .map((p) => ({ p, g: growthReport(getHistory(p.id)) }))
      .filter((r) => r.g)
      .map((r) => ({ name: r.p.name, id: r.p.id, rate: r.g.recentPerWeek, d: r.g.dQuality }))
      .filter((r) => Math.abs(r.rate) > 0.01 || r.d !== 0)
      .sort((a, b) => b.rate - a.rate);
    if (!rows.length) { risersEl.innerHTML = ''; return; }
    const sign = (n) => (n >= 0 ? '+' : '') + n;
    const risers = rows.filter((r) => r.rate > 0.05).slice(0, 5);
    const fallers = rows.filter((r) => r.rate < -0.05).reverse().slice(0, 3);
    const chip = (r) => `<a class="chip ${r.rate >= 0 ? 'green' : 'red'}" href="#/player/${esc(r.id)}">${esc(r.name)} ${sign(+r.rate.toFixed(1))}%/wk</a>`;
    risersEl.innerHTML = `
      <div class="card">
        <h3>Squad development</h3>
        <p class="hint">Quality change per week, measured from your imports over time. Re-import from a recording periodically to keep this live.</p>
        ${risers.length ? `<p><strong>Rising:</strong> ${risers.map(chip).join(' ')}</p>` : '<p class="hint">No clear risers yet — needs a couple of imports spread over time.</p>'}
        ${fallers.length ? `<p><strong>Slipping:</strong> ${fallers.map(chip).join(' ')} <span class="hint">(a season −20 reset shows here too)</span></p>` : ''}
      </div>`;
  }

  const saEl = view.querySelector('#sa-coverage');
  function drawSaCoverage() {
    const players = getPlayers();
    if (!players.length) { saEl.innerHTML = ''; return; }
    const kit = saCoverage(players);
    const missing = kit.filter((k) => !k.covered).length;
    saEl.innerHTML = `
      <div class="card">
        <h3>Special-ability coverage</h3>
        <p class="hint">A triggered special ability makes the player count one star higher for that action. The recommended kit${missing ? ` — <strong>${missing} gap${missing === 1 ? '' : 's'}</strong>` : ' — fully covered ✅'}:</p>
        ${kit.map((k) => `
          <p>${k.covered ? '✅' : '❌'} <strong>${esc(k.label)}</strong> ×${k.want}
            ${k.holders.length ? `— ${k.holders.map((h) => esc(h.name)).join(', ')}` : '<span class="chip red">nobody</span>'}
            <br><span class="hint">${esc(k.why)}</span></p>`).join('')}
        <p class="hint">Set each player's special abilities in the edit form (✎), or import them automatically — capture the player's <strong>Special Abilities</strong> screen (where each is named) so OCR can read them.</p>
      </div>`;
  }

  // Attribute input fields for the given position (GK gets goalkeeping skills).
  function attrFieldsHtml(position, attrs) {
    return groupsFor(position).map((g) => `
      <h4>${esc(g.label)}</h4>
      <div class="attr-grid">
        ${attributesFor(position).filter((a) => a.group === g.id).map((a) => `
          <label class="field"><span>${esc(a.label)}</span>
            <input type="number" min="1" max="250" data-attr="${a.key}" value="${Number.isFinite(attrs?.[a.key]) ? esc(attrs[a.key]) : ''}">
          </label>`).join('')}
      </div>`).join('');
  }

  function drawEditor(player, draft = null) {
    // A draft overlays whichever base it's given: the blank template (add
    // flow) or an existing player (screenshot-update flow) — attrs merge so
    // unread skills keep their saved values.
    const base = player || { id: newId(), name: '', position: 'MC', altPositions: [], age: 18, quality: 20, attrs: {} };
    const p = {
      ...base,
      ...(draft || {}),
      attrs: { ...(base.attrs || {}), ...((draft || {}).attrs || {}) },
    };
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
        <div class="field">
          <span>Special abilities <span class="hint">(a player can hold several)</span></span>
          <div class="sa-checks">
            ${SPECIAL_ABILITIES.map((a) => `<label class="sa-check"><input type="checkbox" name="f-sa" value="${a.id}" ${abilityIdsOf(p).includes(a.id) ? 'checked' : ''}> ${esc(a.label)}</label>`).join('')}
          </div>
        </div>
        <label class="field"><span>Playstyle</span>
          <select id="f-playstyle">
            <option value="">None</option>
            ${PLAYSTYLES.map((s) => `<option value="${s.id}" ${p.playstyle === s.id ? 'selected' : ''}>${esc(s.label)} (${esc(s.category)})</option>`).join('')}
          </select>
        </label>
        <label class="field"><span>Playstyle level</span>
          <select id="f-playstyle-level">
            ${PLAYSTYLE_LEVELS.map((l) => `<option ${p.playstyleLevel === l ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </label>
        <h4>Attributes (optional — enables precise weakness analysis)</h4>
        <p class="hint">Enter the value shown on each skill in-game. Leave blank to skip. Goalkeepers show goalkeeping skills.</p>
        <div id="attr-fields">${attrFieldsHtml(p.position, p.attrs)}</div>
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
        ...p,
        id: p.id,
        name,
        position: editorEl.querySelector('#f-pos').value,
        altPositions: editorEl.querySelector('#f-alt').value.split(',').map((s) => s.trim().toUpperCase()).filter((s) => POSITIONS.includes(s)),
        age: parseInt(editorEl.querySelector('#f-age').value, 10) || 18,
        quality: parseFloat(editorEl.querySelector('#f-quality').value) || 0,
        specialAbilities: [...editorEl.querySelectorAll('input[name="f-sa"]:checked')].map((el) => el.value),
        specialAbility: null, // superseded by specialAbilities (kept null for back-compat readers)
        playstyle: editorEl.querySelector('#f-playstyle').value || null,
        playstyleLevel: editorEl.querySelector('#f-playstyle-level').value,
        attrs,
      });
      editorEl.innerHTML = '';
      drawList();
    });
    // Swap attribute fields when switching to/from goalkeeper, keeping values.
    editorEl.querySelector('#f-pos').addEventListener('change', (e) => {
      const current = {};
      for (const inp of editorEl.querySelectorAll('[data-attr]')) {
        const v = parseFloat(inp.value);
        if (Number.isFinite(v)) current[inp.dataset.attr] = v;
      }
      editorEl.querySelector('#attr-fields').innerHTML = attrFieldsHtml(e.target.value, current);
    });
    editorEl.querySelector('#cancel').addEventListener('click', () => { editorEl.innerHTML = ''; });
    const del = editorEl.querySelector('#delete');
    if (del) del.addEventListener('click', () => {
      if (confirm(`Delete ${p.name}?`)) { deletePlayer(p.id); editorEl.innerHTML = ''; drawList(); }
    });
    editorEl.querySelector('#edit-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  view.querySelector('#add-player').addEventListener('click', () => drawEditor(null));

  view.querySelector('#new-season').addEventListener('click', () => {
    const n = getPlayers().length;
    if (!n) { alert('No players to adjust yet.'); return; }
    if (confirm(`New season: drop every player's rating by 20 to reflect the higher league level?\n\nThis lowers quality and every attribute for ${n} player${n === 1 ? '' : 's'} (ages are unchanged) and can't be undone — Export first if unsure.`)) {
      seasonRollover(20);
      drawList();
    }
  });

  // ---------- Screenshot import (local OCR) ----------
  const scanFile = view.querySelector('#scan-file');
  const scanStatus = view.querySelector('#scan-status');
  view.querySelector('#scan-player').addEventListener('click', () => scanFile.click());
  scanFile.addEventListener('change', async () => {
    const file = scanFile.files[0];
    scanFile.value = '';
    if (!file) return;
    scanStatus.innerHTML = `<div class="note">📷 Preparing… <span class="hint">(first use downloads the ~15 MB OCR engine, then it works offline)</span></div>`;
    try {
      const result = await recognizeScreenshot(file, (msg, progress) => {
        scanStatus.innerHTML = `<div class="note">📷 ${esc(msg)}${progress != null ? ` ${Math.round(progress * 100)}%` : ''} — everything runs on this device.</div>`;
      });
      if (result.found === 0 && result.age === null && result.quality === null) {
        scanStatus.innerHTML = `<div class="warn-note">Couldn't read any player data from that image. Use a screenshot of the player-profile screen (the one showing all 15 skills), as sharp and uncropped as possible.</div>`;
        return;
      }
      const missing = 15 - result.found;
      const summary = `<div class="note">✅ Recognised ${result.found}/15 attributes${result.age ? ', age' : ''}${result.quality ? ', quality' : ''}${result.name ? ', name' : ''}.
        ${missing > 0 || !result.age || !result.name ? ' Review the form below and fill any gaps before saving.' : ' Review and save.'}</div>`;
      const addDraft = { attrs: result.attrs };
      if (result.name) addDraft.name = result.name;
      if (result.age) addDraft.age = result.age;
      if (result.quality) addDraft.quality = result.quality;
      if (result.position) addDraft.position = result.position;
      if (result.specialAbilities?.length) addDraft.specialAbilities = result.specialAbilities;
      if (result.playstyle) {
        addDraft.playstyle = result.playstyle;
        addDraft.playstyleLevel = result.playstyleLevel || 'Basic';
      }
      const players = getPlayers();
      if (!players.length) {
        scanStatus.innerHTML = summary;
        drawEditor(null, addDraft);
        return;
      }
      // Let the user apply the reading to an existing player instead of
      // creating a duplicate. A fuzzy name match picks the likely target.
      const match = result.name ? players.find((x) => sameName(x.name, result.name)) : null;
      scanStatus.innerHTML = `${summary}
        <div class="card">
          <h3>Apply to…</h3>
          ${match ? `<p class="hint">Looks like <strong>${esc(match.name)}</strong> is already in your squad.</p>` : ''}
          <div class="field-row">
            <label class="field"><span>Existing player</span>
              <select id="scan-target">
                ${players.map((x) => `<option value="${esc(x.id)}" ${match && x.id === match.id ? 'selected' : ''}>${esc(x.name)} (${esc(x.position)})</option>`).join('')}
              </select>
            </label>
          </div>
          <div class="btn-row">
            <button class="btn ${match ? '' : 'secondary'}" id="scan-update">↻ Update selected player</button>
            <button class="btn ${match ? 'secondary' : ''}" id="scan-add">＋ Add as new player</button>
          </div>
          <p class="hint">Update keeps the player's name and fills in the newly read values — skills the OCR missed keep their saved numbers.</p>
        </div>`;
      scanStatus.querySelector('#scan-add').addEventListener('click', () => {
        scanStatus.innerHTML = summary;
        drawEditor(null, addDraft);
      });
      scanStatus.querySelector('#scan-update').addEventListener('click', () => {
        const target = getPlayers().find((x) => x.id === scanStatus.querySelector('#scan-target').value);
        if (!target) return;
        scanStatus.innerHTML = summary;
        drawEditor(target, screenshotUpdateDraft(target, result));
      });
    } catch (e) {
      scanStatus.innerHTML = `<div class="warn-note">Screenshot import failed: ${esc(e.message)}. You can still add the player manually.</div>`;
    }
  });

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
          ${(() => {
            // Show the attribute set that fits the players. Two GKs → GK skills;
            // otherwise outfield skills (a GK-vs-outfield compare only lines up
            // on the shared physical stats, which is expected).
            const set = (a.position === 'GK' && b.position === 'GK') ? attributesFor('GK') : ATTRIBUTES;
            return set.map((at) => row(at.label, a.attrs?.[at.key], b.attrs?.[at.key])).join('');
          })()}
        </table></div>
        <p class="hint">Green = higher value. Missing attributes show as —.</p>`;
    }
    selA.addEventListener('change', drawTable);
    selB.addEventListener('change', drawTable);
    drawTable();
  }

  // ---------- Screen-recording bulk import ----------
  const videoFile = view.querySelector('#video-file');
  const videoReview = view.querySelector('#video-review');
  view.querySelector('#scan-video').addEventListener('click', () => videoFile.click());
  videoFile.addEventListener('change', async () => {
    const file = videoFile.files[0];
    videoFile.value = '';
    if (!file) return;
    videoReview.innerHTML = '';
    scanStatus.innerHTML = `<div class="note">🎬 Preparing recording… <span class="hint">Best results: open each player's profile → <strong>Skills</strong> tab and hold for 1–2 seconds. Sideways recordings are handled automatically. Everything runs on this device.</span></div>`;
    try {
      const { merged, frames, partials } = await processRecording(file, (msg, progress) => {
        scanStatus.innerHTML = `<div class="note">🎬 ${esc(msg)}${progress != null ? ` (${Math.round(progress * 100)}%)` : ''}</div>`;
      });
      if (!merged.length) {
        scanStatus.innerHTML = `<div class="warn-note">Read ${frames} frames but couldn't identify any player profiles. Make sure the recording shows the profile screen with all 15 skills, held steady for a second or two per player.</div>`;
        return;
      }
      const partialNote = partials
        ? ` ⚠️ ${partials} screen${partials === 1 ? '' : 's'} couldn't be read fully and ${partials === 1 ? 'was' : 'were'} skipped — if a player is missing below, re-record them holding the Skills tab steady for 2 seconds.`
        : '';
      scanStatus.innerHTML = `<div class="note">✅ Found <strong>${merged.length}</strong> player${merged.length === 1 ? '' : 's'} across ${frames} frames.${partialNote} Review below, then apply.</div>`;
      drawVideoReview(merged);
    } catch (e) {
      scanStatus.innerHTML = `<div class="warn-note">Recording import failed: ${esc(e.message)}</div>`;
    }
  });

  function drawVideoReview(merged) {
    const plan = planSquadChanges(getPlayers(), merged);
    videoReview.innerHTML = `
      <div class="card">
        <h3>Recording results</h3>
        ${plan.map((item, i) => {
          const s = item.sighting;
          const badge = item.type === 'add'
            ? '<span class="chip green">New</span>'
            : item.type === 'update'
              ? `<span class="chip blue">Update ${esc(item.player.name)}</span>`
              : `<span class="chip">No changes — ${esc(item.player.name)}</span>`;
          const changed = item.type === 'update'
            ? Object.keys(item.changes.attrs || {}).length + (item.changes.age ? 1 : 0) + (item.changes.quality ? 1 : 0) + (item.changes.addedAbilities?.length || 0) + (item.changes.playstyle ? 1 : 0)
            : 0;
          return `
            <div class="divider"></div>
            <label class="check-row">
              <input type="checkbox" data-apply="${i}" ${item.type === 'unchanged' ? 'disabled' : 'checked'}>
              <span>
                ${badge}
                <span class="chip">${s.found}/15 skills</span>
                ${s.position ? `<span class="chip">${esc(s.position)}</span>` : ''}
                ${s.age ? `<span class="chip">age ${esc(s.age)}</span>` : ''}
                ${s.quality ? `<span class="chip">${esc(s.quality)}%</span>` : ''}
                ${(s.specialAbilities || []).map((id) => `<span class="chip blue">${esc(abilityLabel(id))}</span>`).join('')}
                ${s.playstyle ? `<span class="chip green">${esc(playstyleLabel(s.playstyle))}${s.playstyleLevel ? ' · ' + esc(s.playstyleLevel) : ''}</span>` : ''}
                ${item.type === 'update' ? `<span class="chip yellow">${changed} field${changed === 1 ? '' : 's'} changed</span>` : ''}
              </span>
            </label>
            ${item.type === 'add' ? `
              <label class="field" style="margin-left:28px"><span>Name${s.name ? '' : ' (not recognised — required)'}</span>
                <input type="text" data-name="${i}" value="${esc(s.name || '')}" placeholder="Player name">
              </label>` : ''}
          `;
        }).join('')}
        <div class="btn-row">
          <button class="btn" id="apply-video">Apply selected</button>
          <button class="btn secondary" id="cancel-video">Discard</button>
        </div>
        <p class="hint">New players default to the recognised position (or MC) — open them afterwards to fix positions and gaps.</p>
      </div>`;

    videoReview.querySelector('#cancel-video').addEventListener('click', () => {
      videoReview.innerHTML = '';
      scanStatus.innerHTML = '';
    });
    videoReview.querySelector('#apply-video').addEventListener('click', () => {
      let added = 0, updated = 0, skipped = 0;
      plan.forEach((item, i) => {
        const box = videoReview.querySelector(`[data-apply="${i}"]`);
        if (!box || !box.checked || item.type === 'unchanged') return;
        if (item.type === 'add') {
          const name = (videoReview.querySelector(`[data-name="${i}"]`)?.value || '').trim();
          if (!name) { skipped++; return; }
          upsertPlayer({
            id: newId(),
            name,
            position: item.sighting.position || 'MC',
            altPositions: [],
            age: item.sighting.age || 18,
            quality: item.sighting.quality || 0,
            specialAbilities: item.sighting.specialAbilities || [],
            playstyle: item.sighting.playstyle || null,
            playstyleLevel: item.sighting.playstyle ? (item.sighting.playstyleLevel || 'Basic') : 'None',
            attrs: item.sighting.attrs,
          });
          added++;
        } else {
          const p = { ...item.player, attrs: { ...(item.player.attrs || {}) } };
          if (item.changes.age) p.age = item.changes.age;
          if (item.changes.quality) p.quality = item.changes.quality;
          Object.assign(p.attrs, item.changes.attrs || {});
          if (item.changes.addedAbilities?.length) {
            p.specialAbilities = [...abilityIdsOf(item.player), ...item.changes.addedAbilities];
            p.specialAbility = null;
          }
          if (item.changes.playstyle) {
            p.playstyle = item.changes.playstyle;
            if (item.changes.playstyleLevel) p.playstyleLevel = item.changes.playstyleLevel;
          }
          upsertPlayer(p);
          updated++;
        }
      });
      videoReview.innerHTML = '';
      scanStatus.innerHTML = `<div class="note">✅ Applied: ${added} added, ${updated} updated${skipped ? `, ${skipped} skipped (missing name)` : ''}.</div>`;
      drawList();
    });
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

  // Arriving from a player page's "Edit player" button: open their editor.
  const editOnArrival = sessionStorage.getItem('te-manager.edit-on-arrival');
  if (editOnArrival) {
    sessionStorage.removeItem('te-manager.edit-on-arrival');
    const p = getPlayers().find((x) => x.id === editOnArrival);
    if (p) drawEditor(p);
  }
}
