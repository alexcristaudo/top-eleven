// Squad persistence: localStorage-backed, with JSON export/import.
const KEY = 'te-manager.squad.v1';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : null;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function save(players) {
  localStorage.setItem(KEY, JSON.stringify(players));
}

export function getPlayers() {
  return load();
}

export function getPlayer(id) {
  return load().find((p) => p.id === id) || null;
}

export function upsertPlayer(player) {
  const players = load();
  const i = players.findIndex((p) => p.id === player.id);
  const existing = i >= 0 ? players[i] : null;
  if (i >= 0) players[i] = player;
  else players.push(player);
  save(players);
  // Seed a baseline from the pre-update stats the first time we touch a player
  // that predates history tracking (or came in via JSON import, which bypasses
  // snapshots). Without this, the very first stat update leaves just one
  // snapshot — not enough to plot growth — so the tracker looked "broken".
  if (existing && getHistory(player.id).length === 0) {
    recordSnapshot(existing, Date.now() - 1000);
  }
  recordSnapshot(player); // capture quality/attrs growth over time
  return player;
}

export function deletePlayer(id) {
  save(load().filter((p) => p.id !== id));
  const h = loadHistory();
  if (h[id]) { delete h[id]; saveHistory(h); }
}

// ---------- Progress history: quality/attribute snapshots over time ----------
// Every meaningful player change (edit, screenshot/recording import) appends a
// timestamped snapshot — but only when a value actually moved — so the app can
// show real development velocity instead of just the latest numbers. Season
// rollover and JSON import write through save() directly, so they don't spam
// history with their bulk rewrites.
const HISTORY_KEY = 'te-manager.history.v1';
const HISTORY_CAP = 120; // per player; oldest trimmed beyond this

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

function saveHistory(h) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
}

function snapshotMoved(prev, player) {
  if (!prev) return true;
  if ((prev.quality || 0) !== (player.quality || 0)) return true;
  const pa = prev.attrs || {};
  const na = player.attrs || {};
  const keys = new Set([...Object.keys(pa), ...Object.keys(na)]);
  for (const k of keys) if (pa[k] !== na[k]) return true;
  return false;
}

export function recordSnapshot(player, when = Date.now()) {
  if (!player || !player.id) return;
  const h = loadHistory();
  const list = h[player.id] || [];
  const prev = list[list.length - 1];
  if (!snapshotMoved(prev, player)) return;
  list.push({ t: when, quality: player.quality || 0, attrs: { ...(player.attrs || {}) } });
  if (list.length > HISTORY_CAP) list.splice(0, list.length - HISTORY_CAP);
  h[player.id] = list;
  saveHistory(h);
}

export function getHistory(id) {
  return loadHistory()[id] || [];
}

// Season rollover: quality re-scales down against the new (higher) league
// level. Since quality is the average of the attributes, the individual skills
// drop too — so this lowers every attribute AND the quality by `amount`
// (default 20), each floored at 1. Age and everything else are untouched.
export function seasonRollover(amount = 20) {
  const players = load().map((p) => {
    const attrs = {};
    for (const [k, v] of Object.entries(p.attrs || {})) {
      attrs[k] = Number.isFinite(v) ? Math.max(1, Math.round(v - amount)) : v;
    }
    return {
      ...p,
      quality: Math.max(1, Math.round((p.quality || 0) - amount)),
      attrs,
    };
  });
  save(players);
  return players.length;
}

export function newId() {
  return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---------- Generic keyed storage (scout log, checklist, tokens) ----------

const DATA_KEYS = {
  scout: 'te-manager.scout.v1',
  checklist: 'te-manager.checklist.v1',
  tokens: 'te-manager.tokens.v1',
};

export function getData(name, fallback) {
  try {
    const raw = localStorage.getItem(DATA_KEYS[name]);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function setData(name, value) {
  localStorage.setItem(DATA_KEYS[name], JSON.stringify(value));
}

// ---------- Export / import (all app data) ----------

export function exportSquad() {
  return JSON.stringify({
    app: 'te-manager',
    version: 2,
    players: load(),
    scout: getData('scout', []),
    checklist: getData('checklist', {}),
    tokens: getData('tokens', []),
    history: loadHistory(),
  }, null, 2);
}

export function importSquad(json) {
  const data = JSON.parse(json);
  const players = Array.isArray(data) ? data : data.players;
  if (!Array.isArray(players)) throw new Error('No players array found in file.');
  for (const p of players) {
    if (!p.id) p.id = newId();
    if (typeof p.name !== 'string' || typeof p.position !== 'string') {
      throw new Error('Invalid player entry in file.');
    }
  }
  save(players);
  if (Array.isArray(data.scout)) setData('scout', data.scout);
  if (data.checklist && typeof data.checklist === 'object') setData('checklist', data.checklist);
  if (Array.isArray(data.tokens)) setData('tokens', data.tokens);
  if (data.history && typeof data.history === 'object') saveHistory(data.history);
  return players.length;
}
