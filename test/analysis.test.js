// Analyzer / recommender logic.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  fastTrainerRating, trainerVerdict, weaknessReport, roleFit,
  recommendDrills, needsFromWeaknesses, needsForPosition,
  developmentPlan, counterOptions, squadFitForFormation,
  bestXI, conditionPlan, rankFormations, bidValuation, positionNeed,
  powerTrainingReport, archetypeRating, growthReport,
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
  assert.ok(score('AMC') > score('MC'));
  // An outfield player is never suggested as a goalkeeper (disjoint skills).
  assert.ok(!fits.some((f) => f.pos === 'GK'));
});

test('roleFit: a goalkeeper is only compared to GK', () => {
  const keeper = {
    position: 'GK', quality: 85,
    attrs: { reflexes: 95, agility: 100, anticipation: 88, rushingOut: 90, communication: 92,
      throwing: 80, kicking: 85, punching: 96, aerialReach: 91, concentration: 90,
      speed: 60, strength: 55, fitness: 90, aggression: 70, creativity: 50 },
  };
  const fits = roleFit(keeper);
  assert.deepEqual(fits.map((f) => f.pos), ['GK']);
  assert.ok(fits[0].score > 0);
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

test('rankFormations: full coverage beats higher quality with gaps', () => {
  // Squad tailor-made for 4-4-2: exactly its 11 positions, nothing exotic.
  const squad = [
    { id: 'gk', name: 'GK', position: 'GK', quality: 80 },
    { id: 'dl', name: 'DL', position: 'DL', quality: 80 },
    { id: 'dc1', name: 'D1', position: 'DC', quality: 80 },
    { id: 'dc2', name: 'D2', position: 'DC', quality: 80 },
    { id: 'dr', name: 'DR', position: 'DR', quality: 80 },
    { id: 'ml', name: 'ML', position: 'ML', quality: 80 },
    { id: 'mc1', name: 'M1', position: 'MC', quality: 80 },
    { id: 'mc2', name: 'M2', position: 'MC', quality: 80 },
    { id: 'mr', name: 'MR', position: 'MR', quality: 80 },
    { id: 's1', name: 'S1', position: 'ST', quality: 80 },
    { id: 's2', name: 'S2', position: 'ST', quality: 80 },
  ];
  const ranked = rankFormations(squad);
  assert.equal(ranked[0].formation.id, '4-4-2');
  assert.equal(ranked[0].missing, 0);
  assert.ok(Math.abs(ranked[0].fit - 80) < 0.01);
  // Blended score reflects the shape's meta rating on top of the fit.
  assert.ok(ranked[0].score > ranked[0].fit * 0.85);
  assert.ok(ranked.every((r) => r.meta >= 1 && r.meta <= 10));
  // The butterfly needs DMC/AMC this squad lacks — must rank below despite
  // sharing the same player pool.
  const butterfly = ranked.find((r) => r.formation.id === 'butterfly');
  assert.ok(butterfly.missing > 0);
  assert.ok(ranked.indexOf(butterfly) > 0);
  // Every formation is present exactly once.
  assert.equal(ranked.length, new Set(ranked.map((r) => r.formation.id)).size);
});

test('rankFormations: meta strength breaks ties between equally-covered shapes', () => {
  // Versatile squad that fully staffs BOTH 4-2-3-1 (meta 9) and 4-4-1-1
  // (meta 6.5) at identical quality — the stronger shape must rank higher.
  const q = 80;
  const squad = [
    { id: 'gk', name: 'GK', position: 'GK', quality: q },
    { id: 'dl', name: 'DL', position: 'DL', quality: q },
    { id: 'dc1', name: 'D1', position: 'DC', quality: q },
    { id: 'dc2', name: 'D2', position: 'DC', quality: q },
    { id: 'dr', name: 'DR', position: 'DR', quality: q },
    { id: 'mc1', name: 'M1', position: 'MC', quality: q },
    { id: 'mc2', name: 'M2', position: 'MC', quality: q },
    { id: 'aml', name: 'W1', position: 'AML', altPositions: ['ML'], quality: q },
    { id: 'amr', name: 'W2', position: 'AMR', altPositions: ['MR'], quality: q },
    { id: 'amc', name: 'AM', position: 'AMC', quality: q },
    { id: 'st', name: 'ST', position: 'ST', quality: q },
  ];
  const ranked = rankFormations(squad);
  const pos = (id) => ranked.findIndex((r) => r.formation.id === id);
  const r4231 = ranked[pos('4-2-3-1')];
  const r4411 = ranked[pos('4-4-1-1')];
  assert.equal(r4231.missing, 0);
  assert.equal(r4411.missing, 0);
  assert.ok(pos('4-2-3-1') < pos('4-4-1-1'), 'higher meta must win at equal coverage');
  assert.ok(r4231.fit >= r4411.fit); // exact-position fit is also better for 4-2-3-1
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

test('bidValuation: young players worth more; age dominates', () => {
  const young = bidValuation({ age: 19, stars: 4 });
  const old = bidValuation({ age: 28, stars: 4 });
  assert.ok(young.maxBid > old.maxBid, `young ${young.maxBid} should beat old ${old.maxBid}`);
  // A prime fast-trainer age should command a meaningful token bid.
  assert.ok(young.maxBid >= 10);
  // A 28-year-old is scraps regardless of stars.
  assert.ok(old.maxBid <= 6);
});

test('bidValuation: extras and squad need adjust the ceiling', () => {
  const plain = bidValuation({ age: 20, stars: 4 });
  const loaded = bidValuation({ age: 20, stars: 4, endsIn49: true, hasSpecialAbility: true, hasPlaystyle: true });
  assert.equal(loaded.bonus, 6);
  assert.ok(loaded.maxBid > plain.maxBid);
  const gap = bidValuation({ age: 20, stars: 4, need: 'gap' });
  const surplus = bidValuation({ age: 20, stars: 4, need: 'surplus' });
  assert.ok(gap.maxBid > plain.maxBid && surplus.maxBid < plain.maxBid);
  // Higher star level raises the ceiling.
  assert.ok(bidValuation({ age: 20, stars: 6 }).maxBid > bidValuation({ age: 20, stars: 3 }).maxBid);
});

test('positionNeed: reflects squad coverage', () => {
  const squad = [
    { position: 'ST' },
    { position: 'MC' }, { position: 'MC' }, { position: 'MC' },
    { position: 'DC', altPositions: ['DL'] },
  ];
  assert.equal(positionNeed(squad, 'ST'), 'gap');      // 1 cover
  assert.equal(positionNeed(squad, 'MC'), 'surplus');  // 3 cover
  assert.equal(positionNeed(squad, 'DL'), 'gap');      // 1 via alt
  assert.equal(positionNeed(squad, 'GK'), 'gap');      // 0 cover
});

test('powerTrainingReport: returns the position key stats with targets', () => {
  const rep = powerTrainingReport(youngStriker);
  assert.deepEqual(rep.keys, ['finishing', 'speed', 'shooting']);
  assert.ok(rep.speedKing);
  assert.equal(rep.target, Math.round(80 * 1.15)); // 92
  const finishing = rep.items.find((i) => i.key === 'finishing');
  assert.equal(finishing.value, 55);
  assert.equal(finishing.maxed, false);
  const speed = rep.items.find((i) => i.key === 'speed');
  assert.equal(speed.value, 88);
});

test('archetypeRating: a fast striker with maxed key stats rates elite', () => {
  const elite = {
    position: 'ST', quality: 80,
    attrs: { finishing: 95, speed: 98, shooting: 92, tackling: 20, marking: 15 },
  };
  const r = archetypeRating(elite);
  assert.ok(r.score >= 92, `score ${r.score}`);
  assert.equal(r.tier, 'elite');
  assert.ok(r.fast);
});

test('archetypeRating: key stats decide, cosmetic stats ignored', () => {
  // Same quality; one has key stats high + grey low, the other the reverse.
  const keyStrong = { position: 'ST', quality: 70, attrs: { finishing: 90, speed: 90, shooting: 85, tackling: 90, marking: 90, passing: 90 } };
  const keyWeak = { position: 'ST', quality: 70, attrs: { finishing: 40, speed: 45, shooting: 42, tackling: 95, marking: 95, passing: 95 } };
  assert.ok(archetypeRating(keyStrong).score > archetypeRating(keyWeak).score + 25);
});

test('archetypeRating: speed-king positions weight speed double', () => {
  const slow = { position: 'AML', quality: 80, attrs: { speed: 40, dribbling: 95, finishing: 95 } };
  const fast = { position: 'AML', quality: 80, attrs: { speed: 95, dribbling: 60, finishing: 60 } };
  // Both average ~ the same raw, but the fast one wins because speed counts twice.
  assert.ok(archetypeRating(fast).score > archetypeRating(slow).score);
});

test('developmentPlan session is biased toward power stats', () => {
  const raw = { id: 'r', name: 'Raw ST', position: 'ST', age: 19, quality: 80,
    attrs: { finishing: 40, speed: 40, shooting: 40, positioning: 85, heading: 80 } };
  const plan = developmentPlan(raw, 80);
  const trained = new Set(plan.session.plan.flatMap((s) => Object.keys(s.drill.attrs)));
  // At least one of the striker's key stats must be in the recommended session.
  assert.ok(['finishing', 'speed', 'shooting'].some((k) => trained.has(k)),
    `session trains ${[...trained]}`);
});

test('growthReport: computes weekly velocity and biggest movers', () => {
  const DAY = 86400000;
  assert.equal(growthReport([]), null);
  assert.equal(growthReport([{ t: 0, quality: 80, attrs: {} }]), null); // needs 2+
  const now = 100 * DAY;
  const g = growthReport([
    { t: now - 14 * DAY, quality: 80, attrs: { finishing: 60, speed: 70 } },
    { t: now, quality: 86, attrs: { finishing: 68, speed: 71 } },
  ]);
  assert.equal(g.from, 80);
  assert.equal(g.to, 86);
  assert.equal(g.dQuality, 6);
  assert.equal(g.spanDays, 14);
  assert.equal(Math.round(g.perWeek), 3);        // +6 over 14 days ≈ 3/week
  assert.equal(Math.round(g.recentPerWeek), 3);  // whole span is within 28 days
  assert.equal(g.movers[0].key, 'finishing');    // +8 is the biggest move
  assert.equal(g.movers[0].delta, 8);
  assert.equal(g.totalGain, 9);                  // 8 + 1
  assert.deepEqual(g.series, [80, 86]);
});

test('growthReport: recent window ignores an old pre-reset span', () => {
  const DAY = 86400000;
  const now = 200 * DAY;
  // A big drop 60 days ago (season reset), then steady climb since.
  const g = growthReport([
    { t: now - 60 * DAY, quality: 100, attrs: {} },
    { t: now - 20 * DAY, quality: 80, attrs: {} },
    { t: now, quality: 88, attrs: {} },
  ]);
  assert.ok(g.perWeek < 0, 'overall span still reflects the reset');
  assert.ok(g.recentPerWeek > 0, 'recent 28-day window shows the climb');
});
