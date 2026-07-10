// Fast-trainer test classification.
import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyTrainerTest, isFastTrainer, developmentPlan } from '../js/logic/analysis.js';
import { ageSlabFactor } from '../js/data/trainertest.js';

const tests = (...gains) => gains.map((gain) => ({ gain, date: 1 }));

test('ageSlabFactor: 18–21 full speed, 22–25 half, 26–29 quarter, 30+ eighth', () => {
  for (const a of [18, 19, 20, 21]) assert.equal(ageSlabFactor(a), 1);
  for (const a of [22, 25]) assert.equal(ageSlabFactor(a), 0.5);
  for (const a of [26, 29]) assert.equal(ageSlabFactor(a), 0.25);
  assert.equal(ageSlabFactor(30), 0.125);
});

test('needs at least 3 tests for a verdict', () => {
  const t = classifyTrainerTest({ age: 19, trainerTests: tests(8, 8) });
  assert.equal(t.tested, false);
  assert.equal(t.testsDone, 2);
});

test('a young player with poor measured gains is NOT a fast trainer', () => {
  // 19yo gaining only 2%/session (≈0.9%/15% cond) — slow despite the age.
  const p = { age: 19, trainerTests: tests(2, 2.2, 1.8, 2, 2, 2.1, 1.9) };
  const t = classifyTrainerTest(p);
  assert.ok(t.tested);
  assert.ok(['slow', 'very-slow'].includes(t.class.id), t.class.id);
  assert.equal(isFastTrainer(p), false);
});

test('strong measured gains classify as fast/elite and beat the age heuristic', () => {
  // 19yo gaining ~9%/session ≈ 4.1%/15% cond → fast at least.
  const young = { age: 19, trainerTests: tests(9, 8.5, 9.5, 9, 8.8, 9.2, 9) };
  const ty = classifyTrainerTest(young);
  assert.ok(['fast', 'elite'].includes(ty.class.id), ty.class.id);
  assert.ok(isFastTrainer(young));
  // 24yo with the same slab-adjusted speed: gains are halved by age, so
  // ~4.5%/session measures the same underlying multiplier.
  const older = { age: 24, trainerTests: tests(4.5, 4.4, 4.6, 4.5, 4.5, 4.4, 4.6) };
  const to = classifyTrainerTest(older);
  assert.ok(['fast', 'elite'].includes(to.class.id), to.class.id);
  assert.ok(isFastTrainer(older), 'measured fast trainer at 24 must count as fast');
});

test('untested players fall back to the age heuristic', () => {
  assert.equal(isFastTrainer({ age: 19 }), true);
  assert.equal(isFastTrainer({ age: 27 }), false);
});

test('provisional verdict at 3–6 tests, full at 7; noisy inputs flagged', () => {
  const t3 = classifyTrainerTest({ age: 20, trainerTests: tests(8, 8, 8) });
  assert.ok(t3.tested && t3.provisional);
  const t7 = classifyTrainerTest({ age: 20, trainerTests: tests(8, 8, 8, 8, 8, 8, 8) });
  assert.ok(t7.tested && !t7.provisional && !t7.noisy);
  const noisy = classifyTrainerTest({ age: 20, trainerTests: tests(1, 12, 2, 11) });
  assert.ok(noisy.noisy);
});

test('developmentPlan uses the measured class for intensity/greens advice', () => {
  const slowYoung = {
    id: 'p', name: 'T', position: 'MC', age: 19, quality: 80, attrs: {},
    trainerTests: tests(1.5, 1.4, 1.6, 1.5, 1.5, 1.4, 1.6),
  };
  const plan = developmentPlan(slowYoung, 80);
  assert.ok(plan.fastTrainer.tested);
  assert.ok(plan.fastTrainer.label.startsWith('Tested:'));
  assert.ok(plan.fastTrainer.tier <= 1, `tier ${plan.fastTrainer.tier}`);
  assert.match(plan.greens, /Do not spend greens/);
});
