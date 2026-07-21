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

const { getPlayers, upsertPlayer, deletePlayer, seasonRollover, exportSquad, importSquad, recordSnapshot, getHistory } = await import('../js/store.js');

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

test('recordSnapshot: appends only when quality or an attribute moved', () => {
  mem.clear();
  const base = { id: 'h', name: 'H', position: 'ST', quality: 70, age: 19, attrs: { finishing: 60 } };
  recordSnapshot(base, 1000);
  recordSnapshot(base, 2000);                         // unchanged → ignored
  recordSnapshot({ ...base, quality: 72 }, 3000);     // quality moved → recorded
  recordSnapshot({ ...base, quality: 72, attrs: { finishing: 63 } }, 4000); // attr moved
  const h = getHistory('h');
  assert.equal(h.length, 3);
  assert.deepEqual(h.map((s) => s.quality), [70, 72, 72]);
  assert.equal(h[2].attrs.finishing, 63);
});

test('upsertPlayer records history; deletePlayer clears it', () => {
  mem.clear();
  upsertPlayer({ id: 'p', name: 'P', position: 'MC', quality: 80, age: 20, attrs: { passing: 70 } });
  upsertPlayer({ id: 'p', name: 'P', position: 'MC', quality: 82, age: 20, attrs: { passing: 73 } });
  assert.equal(getHistory('p').length, 2);
  deletePlayer('p');
  assert.equal(getHistory('p').length, 0);
});

test('upsertPlayer seeds a baseline for players that predate history', () => {
  // Simulate a squad that existed before history tracking: written via the raw
  // store with NO snapshots (mirrors JSON import / pre-v24 data).
  mem.clear();
  importSquad(JSON.stringify({ players: [
    { id: 'old', name: 'Old', position: 'ST', quality: 80, age: 22, attrs: { finishing: 70 } },
  ] }));
  assert.equal(getHistory('old').length, 0); // import doesn't snapshot
  // A single stat update must now yield TWO snapshots (baseline + new) so the
  // tracker can plot growth immediately.
  upsertPlayer({ id: 'old', name: 'Old', position: 'ST', quality: 83, age: 22, attrs: { finishing: 74 } });
  const h = getHistory('old');
  assert.equal(h.length, 2);
  assert.deepEqual(h.map((s) => s.quality), [80, 83]); // old baseline, then new
  assert.equal(h[0].attrs.finishing, 70);
  assert.equal(h[1].attrs.finishing, 74);
});

test('upsertPlayer does not double-seed once history exists', () => {
  mem.clear();
  upsertPlayer({ id: 'n', name: 'N', position: 'MC', quality: 80, age: 20, attrs: {} }); // fresh add → 1 snapshot
  upsertPlayer({ id: 'n', name: 'N', position: 'MC', quality: 82, age: 20, attrs: {} }); // update → 2
  upsertPlayer({ id: 'n', name: 'N', position: 'MC', quality: 84, age: 20, attrs: {} }); // update → 3 (no extra baseline)
  assert.equal(getHistory('n').length, 3);
});

test('export/import round-trips history', () => {
  mem.clear();
  upsertPlayer({ id: 'q', name: 'Q', position: 'MC', quality: 80, age: 20, attrs: {} });
  upsertPlayer({ id: 'q', name: 'Q', position: 'MC', quality: 85, age: 20, attrs: {} });
  const before = getHistory('q');
  assert.equal(before.length, 2);
  const json = exportSquad();
  mem.clear();
  assert.equal(getHistory('q').length, 0);
  importSquad(json);
  assert.deepEqual(getHistory('q').map((s) => s.quality), before.map((s) => s.quality));
});
