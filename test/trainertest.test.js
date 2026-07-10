// Fast-trainer test classification (points out of 50, whole points per session).
import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyTrainerTest, isFastTrainer, developmentPlan } from '../js/logic/analysis.js';
import { ageSlabFactor } from '../js/data/trainertest.js';

const tests = (...points) => points.map((points) => ({ points, date: 1 }));

test('ageSlabFactor: 18–21 full speed, 22–25 half, 26–29 quarter, 30+ eighth', () => {
  for (const a of [18, 19, 20, 21]) assert.equal(ageSlabFactor(a), 1);
  for (const a of [22, 25]) assert.equal(ageSlabFactor(a), 0.5);
  for (const a of [26, 29]) assert.equal(ageSlabFactor(a), 0.25);
  assert.equal(ageSlabFactor(30), 0.125);
});

test('needs at least 3 tests for a verdict', () => {
  const t = classifyTrainerTest({ age: 19, trainerTests: tests(2, 2) });
  assert.equal(t.tested, false);
  assert.equal(t.testsDone, 2);
});

test('a young player earning ~0 points is NOT a fast trainer', () => {
  // 19yo averaging 0.3 points per 6-sprint session — slow despite the age.
  const p = { age: 19, trainerTests: tests(0, 1, 0, 0, 1, 0, 0) };
  const t = classifyTrainerTest(p);
  assert.ok(t.tested);
  assert.ok(['slow', 'very-slow'].includes(t.class.id), t.class.id);
  assert.equal(isFastTrainer(p), false);
});

test('~2 points per session classifies fast; ~3 elite; age slab respected', () => {
  const fast = { age: 19, trainerTests: tests(2, 2, 2, 1, 2, 2, 3) }; // avg 2.0
  const tf = classifyTrainerTest(fast);
  assert.ok(['fast', 'elite'].includes(tf.class.id), tf.class.id);
  assert.ok(isFastTrainer(fast));
  const elite = { age: 20, trainerTests: tests(3, 3, 2, 3, 3, 3, 3) }; // avg ≈2.9
  assert.equal(classifyTrainerTest(elite).class.id, 'elite');
  // 24yo earning 1/session = 2/session slab-adjusted → fast.
  const older = { age: 24, trainerTests: tests(1, 1, 1, 1, 1, 1, 1) };
  const to = classifyTrainerTest(older);
  assert.ok(['fast', 'elite'].includes(to.class.id), to.class.id);
  assert.ok(isFastTrainer(older), 'measured fast trainer at 24 must count as fast');
});

test('legacy %-based entries migrate at 1 point = 2%', () => {
  // Old data: 4%/session ≈ 2 points/session → fast for a 19yo.
  const p = { age: 19, trainerTests: [{ gain: 4 }, { gain: 4 }, { gain: 4.4 }] };
  const t = classifyTrainerTest(p);
  assert.ok(t.tested);
  assert.ok(Math.abs(t.avgPoints - 2.07) < 0.05, String(t.avgPoints));
  assert.ok(['fast', 'elite'].includes(t.class.id), t.class.id);
});

test('untested players fall back to the age heuristic', () => {
  assert.equal(isFastTrainer({ age: 19 }), true);
  assert.equal(isFastTrainer({ age: 27 }), false);
});

test('provisional verdict at 3–6 tests, full at 7; noisy inputs flagged', () => {
  const t3 = classifyTrainerTest({ age: 20, trainerTests: tests(2, 2, 2) });
  assert.ok(t3.tested && t3.provisional);
  const t7 = classifyTrainerTest({ age: 20, trainerTests: tests(2, 2, 2, 2, 2, 2, 2) });
  assert.ok(t7.tested && !t7.provisional && !t7.noisy);
  const noisy = classifyTrainerTest({ age: 20, trainerTests: tests(0, 8, 0, 7) });
  assert.ok(noisy.noisy);
});

test('developmentPlan uses the measured class for intensity/greens advice', () => {
  const slowYoung = {
    id: 'p', name: 'T', position: 'MC', age: 19, quality: 80, attrs: {},
    trainerTests: tests(0, 0, 1, 0, 0, 1, 0),
  };
  const plan = developmentPlan(slowYoung, 80);
  assert.ok(plan.fastTrainer.tested);
  assert.ok(plan.fastTrainer.label.startsWith('Tested:'));
  assert.ok(plan.fastTrainer.tier <= 1, `tier ${plan.fastTrainer.tier}`);
  assert.match(plan.greens, /Do not spend greens/);
});
