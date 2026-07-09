// Analyzer / recommender logic.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  fastTrainerRating, trainerVerdict, weaknessReport, roleFit,
  recommendDrills, needsFromWeaknesses, needsForPosition,
  developmentPlan, counterOptions, squadFitForFormation,
  bestXI, conditionPlan,
} from '../js/logic/analysis.js';
import { getFormation } from '../js/data/formations.js';

const youngStriker = {
  id: 'p1', name: 'Test ST', position: 'ST', age: 19, quality: 80,
  attrs: {
    tackling: 40, marking: 40, positioning: 85, heading: 60, bravery: 70,
    passing: 75, dribbling: 80, crossing: 50, shooting: 90, finishing: 55,
    speed: 88, strength: 70, fitness: 82, aggression: 60, creativity: 65,
  },
};

test('fastTrainerRating: monotonically declines with age', () => {
  const tiers = [18, 20, 22, 25, 27, 31].map((a) => fastTrainerRating(a).tier);
  for (let i = 1; i < tiers.length; i++) assert.ok(tiers[i] <= tiers[i - 1]);
  assert.equal(fastTrainerRating(18).tier, 5);
  assert.equal(fastTrainerRating(31).tier, 0);
});

test('trainerVerdict: young above-average player is a crown jewel; old below-average is sell', () => {
  assert.equal(trainerVerdict({ age: 19, quality: 90 }, 80).type, 'Crown jewel');
  assert.equal(trainerVerdict({ age: 29, quality: 60 }, 80).type, 'Sell now');
});

test('weaknessReport: ranks role-critical low attributes first', () => {
  const rep = weaknessReport(youngStriker, 'ST');
  assert.ok(rep.hasValues);
  // Finishing (55, weight 3) and heading (60, weight 3) are the striker's clear gaps.
  const topKeys = rep.items.slice(0, 3).map((i) => i.key);
  assert.ok(topKeys.includes('finishing'), `expected finishing in ${topKeys}`);
  assert.ok(topKeys.includes('heading'), `expected heading in ${topKeys}`);
  // Irrelevant-to-role attributes (weight 0) are excluded entirely.
  assert.ok(!rep.items.some((i) => i.key === 'tackling'));
});

test('weaknessReport: falls back to role priorities without attribute values', () => {
  const rep = weaknessReport({ position: 'DC', attrs: {} }, 'DC');
  assert.ok(!rep.hasValues);
  assert.ok(rep.items.length > 0);
  assert.ok(rep.items.every((i) => i.weight >= 2));
});

test('roleFit: attacking profile scores attacking roles above defensive ones', () => {
  const fits = roleFit(youngStriker);
  const score = (pos) => fits.find((f) => f.pos === pos).score;
  assert.ok(score('ST') > score('DC'));
  assert.ok(score('AMC') > score('GK'));
});

test('recommendDrills: respects budget and prefers matching drills', () => {
  const needs = { finishing: 3, heading: 3 };
  const { plan, totalCost } = recommendDrills(needs, { budget: 20, position: 'ST' });
  assert.ok(plan.length > 0);
  assert.ok(totalCost <= 20);
  for (const s of plan) {
    assert.ok(Object.keys(s.drill.attrs).some((k) => needs[k]), `${s.drill.id} trains nothing needed`);
  }
});

test('recommendDrills: zero-value drills are never included', () => {
  const { plan } = recommendDrills({ finishing: 3 }, { budget: 60, maxDrills: 10 });
  for (const s of plan) assert.ok(s.value > 0);
});

test('needsForPosition + needsFromWeaknesses produce usable maps', () => {
  const posNeeds = needsForPosition('DC');
  assert.ok(posNeeds.tackling >= 2 && posNeeds.heading >= 2);
  const rep = weaknessReport(youngStriker, 'ST');
  const wNeeds = needsFromWeaknesses(rep);
  assert.ok(Object.keys(wNeeds).length > 0 && Object.keys(wNeeds).length <= 4);
});

test('developmentPlan: assembles all sections', () => {
  const plan = developmentPlan(youngStriker, 75);
  assert.ok(plan.fastTrainer.tier === 5);
  assert.ok(plan.verdict.type.length > 0);
  assert.ok(plan.session.plan.length > 0);
  assert.ok(plan.intensity.length > 0 && plan.greens.length > 0);
});

test('counterOptions: resolves opponent and counters with settings', () => {
  const res = counterOptions('4-1-2-1-2');
  assert.ok(res.opponent.name.includes('Diamond'));
  assert.ok(res.counters.length >= 2);
  for (const c of res.counters) {
    assert.ok(c.formation.settings.mentality);
    assert.ok(c.why.length > 20);
  }
  assert.equal(counterOptions('nope'), null);
});

test('bestXI: fills slots by quality, uses alt positions, reports gaps and bench', () => {
  const squad = [
    { id: 'gk', name: 'Keeper', position: 'GK', quality: 70 },
    { id: 'st1', name: 'Star ST', position: 'ST', quality: 95 },
    { id: 'st2', name: 'Backup ST', position: 'ST', quality: 60 },
    { id: 'st3', name: 'Third ST', position: 'ST', quality: 50 },
    { id: 'mc1', name: 'Mid One', position: 'MC', quality: 88 },
    { id: 'mc2', name: 'Mid Two', position: 'MC', quality: 80 },
    { id: 'util', name: 'Utility', position: 'DMC', altPositions: ['ML'], quality: 75 },
    { id: 'dc1', name: 'CB One', position: 'DC', quality: 85 },
    { id: 'dc2', name: 'CB Two', position: 'DC', quality: 82 },
    { id: 'dl', name: 'Left Back', position: 'DL', quality: 78 },
    { id: 'dr', name: 'Right Back', position: 'DR', quality: 77 },
    { id: 'mr', name: 'Right Mid', position: 'MR', quality: 72 },
  ];
  const xi = bestXI(getFormation('4-4-2'), squad);
  const byPos = (pos) => xi.slots.filter((s) => s.pos === pos).map((s) => s.player && s.player.id);
  // Both ST slots go to the two best strikers; the third rides the bench.
  assert.deepEqual(byPos('ST').sort(), ['st1', 'st2']);
  assert.ok(xi.bench.some((p) => p.id === 'st3'));
  // ML slot has no natural ML — filled by the utility DMC via alt position.
  assert.deepEqual(byPos('ML'), ['util']);
  // Every slot covered by this squad.
  assert.deepEqual(xi.missing, []);
  assert.ok(xi.avgQuality > 70);
  // No player assigned twice.
  const ids = xi.slots.filter((s) => s.player).map((s) => s.player.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('bestXI: reports missing positions when squad lacks cover', () => {
  const xi = bestXI(getFormation('4-4-2'), [
    { id: 'a', name: 'A', position: 'ST', quality: 90 },
  ]);
  assert.ok(xi.missing.includes('GK'));
  assert.ok(xi.missing.length === 10);
});

test('conditionPlan: regen math, green packs, readiness', () => {
  // 65% + 12 ticks (3h) * 5% = 100 (capped) → ready, no greens.
  const ready = conditionPlan({ current: 65, minutesUntilMatch: 180, target: 90 });
  assert.equal(ready.atKickoff, 100);
  assert.ok(ready.ready);
  assert.equal(ready.greensNeeded, 0);
  // 40% + 2 ticks * 5% = 50; needs 40 more → 3 greens (15% each).
  const short = conditionPlan({ current: 40, minutesUntilMatch: 30, target: 90 });
  assert.equal(short.atKickoff, 50);
  assert.ok(!short.ready);
  assert.equal(short.greensNeeded, 3);
  // Time to reach target naturally: (90-40)/5 = 10 ticks = 150 min.
  assert.equal(short.minutesToTarget, 150);
  // Already at target.
  assert.equal(conditionPlan({ current: 95, minutesUntilMatch: 0, target: 90 }).minutesToTarget, 0);
});

test('squadFitForFormation: matches exact and alt positions, sorted by quality', () => {
  const squad = [
    { id: 'a', name: 'A', position: 'ST', quality: 90 },
    { id: 'b', name: 'B', position: 'MC', altPositions: ['ST'], quality: 95 },
    { id: 'c', name: 'C', position: 'GK', quality: 70 },
  ];
  const fit = squadFitForFormation(getFormation('4-4-2'), squad);
  const st = fit.find((r) => r.pos === 'ST');
  assert.equal(st.count, 2);
  assert.deepEqual(st.players.map((p) => p.id), ['b', 'a']);
  const dl = fit.find((r) => r.pos === 'DL');
  assert.equal(dl.players.length, 0);
});
