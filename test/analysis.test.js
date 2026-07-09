// Analyzer / recommender logic.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  fastTrainerRating, trainerVerdict, weaknessReport, roleFit,
  recommendDrills, needsFromWeaknesses, needsForPosition,
  developmentPlan, counterOptions, squadFitForFormation,
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
