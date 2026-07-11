// Data integrity: every cross-reference between data modules must resolve.
import test from 'node:test';
import assert from 'node:assert/strict';

import { ATTR_KEYS, ATTRIBUTES, GROUPS } from '../js/data/attributes.js';
import { ROLES, POSITIONS, POSITION_ZONE } from '../js/data/roles.js';
import { DRILLS, DRILL_CATEGORIES, INTENSITY } from '../js/data/drills.js';
import { FORMATIONS, getFormation, ORIENTATION_REFERENCE } from '../js/data/formations.js';
import { GUIDES } from '../js/data/guides.js';
import { SEASON_CHECKLIST, ALL_TASK_IDS, TOKEN_CATEGORIES } from '../js/data/checklist.js';
import { TEAMPLAY_BONUSES, BONUS_MAX, BONUS_DECAY } from '../js/data/teamplay.js';
import { PLAYSTYLES, PLAYSTYLE_LEVELS } from '../js/data/playstyles.js';
import { SPECIAL_ABILITIES, RECOMMENDED_SA_KIT, matchAbility } from '../js/data/abilities.js';

test('attributes: 15 skills across 3 groups, unique keys', () => {
  assert.equal(ATTRIBUTES.length, 15);
  assert.equal(new Set(ATTR_KEYS).size, 15);
  const groupIds = new Set(GROUPS.map((g) => g.id));
  for (const a of ATTRIBUTES) assert.ok(groupIds.has(a.group), `bad group on ${a.key}`);
});

test('roles: every position has a complete weight map', () => {
  for (const pos of POSITIONS) {
    const role = ROLES[pos];
    assert.ok(role, `missing role for ${pos}`);
    assert.ok(role.label && role.description);
    assert.ok(POSITION_ZONE[pos], `missing zone for ${pos}`);
    for (const k of ATTR_KEYS) {
      assert.ok(Number.isFinite(role.weights[k]), `role ${pos} missing weight for ${k}`);
      assert.ok(role.weights[k] >= 0 && role.weights[k] <= 3);
    }
    assert.ok(Object.keys(role.weights).length === 15, `role ${pos} has extra/missing weights`);
  }
});

test('drills: valid categories, attributes, positions and costs', () => {
  const catIds = new Set(DRILL_CATEGORIES.map((c) => c.id));
  const ids = new Set();
  for (const d of DRILLS) {
    assert.ok(!ids.has(d.id), `duplicate drill id ${d.id}`);
    ids.add(d.id);
    assert.ok(catIds.has(d.category), `${d.id}: bad category`);
    assert.ok(d.cost > 0 && d.cost <= 15, `${d.id}: implausible cost`);
    assert.ok(Object.keys(d.attrs).length > 0, `${d.id}: trains nothing`);
    for (const [k, w] of Object.entries(d.attrs)) {
      assert.ok(ATTR_KEYS.includes(k), `${d.id}: unknown attribute ${k}`);
      assert.ok(w === 1 || w === 2, `${d.id}: bad weight for ${k}`);
    }
    assert.ok(d.positions.length > 0);
    for (const p of d.positions) assert.ok(POSITIONS.includes(p), `${d.id}: unknown position ${p}`);
    assert.ok(d.note.length > 10, `${d.id}: missing note`);
  }
  assert.ok(DRILLS.length >= 24, 'drill catalogue should be extensive');
  assert.equal(INTENSITY.length, 3);
});

test('drills: every attribute is trainable by at least one drill', () => {
  for (const k of ATTR_KEYS) {
    assert.ok(DRILLS.some((d) => d.attrs[k]), `no drill trains ${k}`);
  }
});

test('formations: 11 players, valid positions, resolvable counters', () => {
  assert.ok(FORMATIONS.length >= 12, 'formation encyclopedia should be extensive');
  const ids = new Set();
  for (const f of FORMATIONS) {
    assert.ok(!ids.has(f.id), `duplicate formation ${f.id}`);
    ids.add(f.id);
    assert.equal(f.shape.length, 11, `${f.id}: must have 11 players`);
    assert.equal(f.shape.filter((s) => s.pos === 'GK').length, 1, `${f.id}: exactly one GK`);
    for (const s of f.shape) {
      assert.ok(POSITIONS.includes(s.pos), `${f.id}: unknown position ${s.pos}`);
      assert.ok(s.x >= 0 && s.x <= 100 && s.y >= 0 && s.y <= 100);
    }
    assert.ok(f.strengths.length >= 2 && f.weaknesses.length >= 2);
    assert.ok(f.counters.length >= 2, `${f.id}: needs at least 2 counters`);
    for (const c of f.counters) {
      assert.ok(getFormation(c.id), `${f.id}: counter ${c.id} does not exist`);
      assert.notEqual(c.id, f.id, `${f.id}: cannot counter itself`);
      assert.ok(c.why.length > 20, `${f.id}: counter ${c.id} needs an explanation`);
    }
    for (const key of ['mentality', 'focus', 'pressing', 'tackling', 'passing', 'marking', 'counterAttack', 'offsideTrap', 'arrows']) {
      assert.ok(f.settings[key], `${f.id}: missing setting ${key}`);
    }
  }
  assert.ok(ORIENTATION_REFERENCE.length >= 8);
});

test('teamplay: four bonuses referencing real drill categories, sane constants', () => {
  assert.equal(TEAMPLAY_BONUSES.length, 4);
  const catIds = new Set(DRILL_CATEGORIES.map((c) => c.id));
  for (const b of TEAMPLAY_BONUSES) {
    assert.ok(catIds.has(b.drillCategory), `${b.id}: unknown drill category ${b.drillCategory}`);
    assert.ok(typeof b.filter === 'function' && b.minCount >= 4);
    // Each bonus's drill category has at least 2 drills to train with.
    assert.ok(DRILLS.filter((d) => d.category === b.drillCategory).length >= 2, `${b.id}: too few drills`);
  }
  assert.ok(BONUS_MAX === 10 && BONUS_DECAY === 2);
});

test('playstyles: valid positions and drill references, unique ids', () => {
  const drillIds = new Set(DRILLS.map((d) => d.id));
  const ids = new Set();
  for (const s of PLAYSTYLES) {
    assert.ok(!ids.has(s.id), `duplicate playstyle ${s.id}`);
    ids.add(s.id);
    assert.ok(['Attacker', 'Midfielder', 'Defender'].includes(s.category));
    for (const pos of s.positions) assert.ok(POSITIONS.includes(pos), `${s.id}: bad position ${pos}`);
    assert.ok(s.drills.length >= 2);
    for (const d of s.drills) assert.ok(drillIds.has(d), `${s.id}: unknown drill ${d}`);
  }
  assert.deepEqual(PLAYSTYLE_LEVELS, ['None', 'Basic', 'Advanced', 'Master']);
});

test('abilities: kit references real abilities; OCR text maps to ids', () => {
  const saIds = new Set(SPECIAL_ABILITIES.map((a) => a.id));
  assert.equal(saIds.size, SPECIAL_ABILITIES.length);
  for (const k of RECOMMENDED_SA_KIT) assert.ok(saIds.has(k.id), `kit references unknown SA ${k.id}`);
  assert.equal(matchAbility('Free kick specialist'), 'free-kick');
  assert.equal(matchAbility('aerial defender'), 'aerial-defender');
  assert.equal(matchAbility('One on one stopper'), 'one-on-one-stopper');
  assert.equal(matchAbility('Playmaker'), 'playmaker');
  assert.equal(matchAbility('Dribbler'), 'dribbler');
  assert.equal(matchAbility('dribler'), 'dribbler'); // OCR misspelling
  assert.equal(matchAbility('None'), null);
  assert.equal(matchAbility(''), null);
});

test('checklist: unique task ids across phases; token categories valid', () => {
  assert.equal(SEASON_CHECKLIST.length, 3);
  assert.equal(new Set(ALL_TASK_IDS).size, ALL_TASK_IDS.length);
  assert.equal(ALL_TASK_IDS.length, SEASON_CHECKLIST.reduce((s, p) => s + p.tasks.length, 0));
  for (const phase of SEASON_CHECKLIST) {
    assert.ok(phase.id && phase.label);
    for (const t of phase.tasks) assert.ok(t.id && t.text.length > 10);
  }
  const catIds = TOKEN_CATEGORIES.map((c) => c.id);
  assert.equal(new Set(catIds).size, catIds.length);
  for (const c of TOKEN_CATEGORIES) assert.ok(['spend', 'earn'].includes(c.kind));
  assert.ok(TOKEN_CATEGORIES.some((c) => c.kind === 'spend') && TOKEN_CATEGORIES.some((c) => c.kind === 'earn'));
});

test('app version and service worker cache version stay in step', async () => {
  const { readFile } = await import('node:fs/promises');
  const { APP_VERSION } = await import('../js/version.js');
  const sw = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  const m = sw.match(/const VERSION = 'te-manager-(v\d+)'/);
  assert.ok(m, 'sw.js VERSION not found');
  assert.equal(m[1], APP_VERSION, 'bump js/version.js and sw.js together');
});

test('guides: unique ids and substantial content', () => {
  const ids = new Set();
  for (const g of GUIDES) {
    assert.ok(!ids.has(g.id), `duplicate guide ${g.id}`);
    ids.add(g.id);
    assert.ok(g.title && g.summary && g.icon);
    assert.ok(g.body.length > 400, `${g.id}: guide body too thin`);
  }
  assert.ok(GUIDES.length >= 8, 'guide library should be extensive');
});
