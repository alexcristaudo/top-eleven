// Store logic that doesn't need a browser, exercised with a localStorage shim.
import test from 'node:test';
import assert from 'node:assert/strict';

// Minimal in-memory localStorage before importing the store module.
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
};

const { getPlayers, upsertPlayer, seasonRollover, importSquad } = await import('../js/store.js');

test('seasonRollover: drops every rating by 20, floors at 1, leaves the rest', () => {
  mem.clear();
  importSquad(JSON.stringify({ players: [
    { id: 'a', name: 'High', position: 'ST', quality: 84, age: 22, attrs: { finishing: 90 } },
    { id: 'b', name: 'Low', position: 'GK', quality: 15, age: 30, attrs: { reflexes: 80 } },
  ] }));
  const n = seasonRollover(20);
  assert.equal(n, 2);
  const after = getPlayers();
  const high = after.find((p) => p.id === 'a');
  const low = after.find((p) => p.id === 'b');
  assert.equal(high.quality, 64);      // 84 - 20
  assert.equal(low.quality, 1);        // 15 - 20 floored at 1
  // Everything else is untouched.
  assert.equal(high.age, 22);
  assert.equal(high.attrs.finishing, 90);
  assert.equal(low.attrs.reflexes, 80);
});

test('seasonRollover: custom amount', () => {
  mem.clear();
  upsertPlayer({ id: 'x', name: 'X', position: 'MC', quality: 100, age: 20, attrs: {} });
  seasonRollover(10);
  assert.equal(getPlayers()[0].quality, 90);
});
