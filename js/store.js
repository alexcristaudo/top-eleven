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

export function newId() {
  return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function exportSquad() {
  return JSON.stringify({ app: 'te-manager', version: 1, players: load() }, null, 2);
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
  return players.length;
}
