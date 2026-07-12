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
  if (i >= 0) players[i] = player;
  else players.push(player);
  save(players);
  return player;
}

export function deletePlayer(id) {
  save(load().filter((p) => p.id !== id));
}

// Season rollover: quality re-scales down against the new (higher) league
// level. Drops every player's rating by `amount` (default 20), floored at 1.
// Attributes, age and everything else are left untouched.
export function seasonRollover(amount = 20) {
  const players = load().map((p) => ({
    ...p,
    quality: Math.max(1, Math.round((p.quality || 0) - amount)),
  }));
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
  return players.length;
}
