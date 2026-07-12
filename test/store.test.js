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

test('seasonRollover: drops quality AND attributes by 20, floors at 1', () => {
  mem.clear();
  importSquad(JSON.stringify({ players: [
    { id: 'a', name: 'High', position: 'ST', quality: 84, age: 22, attrs: { finishing: 90, speed: 15 } },
    { id: 'b', name: 'Low', position: 'GK', quality: 15, age: 30, attrs: { reflexes: 80 } },
  ] }));
  const n = seasonRollover(20);
  assert.equal(n, 2);
  const after = getPlayers();
  const high = after.find((p) => p.id === 'a');
  const low = after.find((p) => p.id === 'b');
  assert.equal(high.quality, 64);          // 84 - 20
  assert.equal(high.attrs.finishing, 70);  // 90 - 20
  assert.equal(high.attrs.speed, 1);       // 15 - 20 floored at 1
  assert.equal(low.quality, 1);            // 15 - 20 floored at 1
  assert.equal(low.attrs.reflexes, 60);    // 80 - 20
  // Age and other fields untouched.
  assert.equal(high.age, 22);
  assert.equal(low.age, 30);
});

test('seasonRollover: custom amount applies to quality and attributes', () => {
  mem.clear();
  upsertPlayer({ id: 'x', name: 'X', position: 'MC', quality: 100, age: 20, attrs: { passing: 88 } });
  seasonRollover(10);
  const x = getPlayers()[0];
  assert.equal(x.quality, 90);
  assert.equal(x.attrs.passing, 78);
});
