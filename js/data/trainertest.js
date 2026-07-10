// The community fast-trainer test. Training speed is a hidden per-player
// multiplier — age only sets a global scaling (the "age slabs"), so a young
// player is NOT automatically a fast trainer. The test measures the
// multiplier directly:
//
//   1. Give the player a NEW role (position) or special ability to learn.
//   2. Note the learning progress %.
//   3. With condition near 100%, run ONE session of 6× Sprint drills.
//   4. Note the new progress % and enter the gain here.
//   5. Rest the player and repeat — 7 tests give a reliable average
//      (single sessions are noisy).
//
// Reference: community guides put a genuine fast trainer at roughly 4%
// role/SA progress per 15% condition spent at ages 18–21.

// Age slabs: role/SA training speed relative to the 18–21 baseline.
export function ageSlabFactor(age) {
  if (age <= 21) return 1;
  if (age <= 25) return 0.5;
  if (age <= 29) return 0.25;
  return 0.125;
}

// Condition consumed by one test session (6× Sprint at normal intensity).
export const TEST_CONDITION_COST = 33;

export const RECOMMENDED_TESTS = 7;
export const MIN_TESTS_FOR_VERDICT = 3;

// Classification of the age-normalized gain per 15% condition.
export const TRAINER_CLASSES = [
  { id: 'elite', min: 4.5, label: 'Elite fast trainer', chip: 'green', note: 'Top-tier hidden multiplier — build your training plan around this player and use greens aggressively.' },
  { id: 'fast', min: 3.2, label: 'Fast trainer', chip: 'green', note: 'Well above average. Worth heavy training investment and a long-term squad role.' },
  { id: 'average', min: 2.0, label: 'Average trainer', chip: 'yellow', note: 'Normal gains. Train for maintenance and targeted weaknesses, not transformation.' },
  { id: 'slow', min: 1.2, label: 'Slow trainer', chip: 'red', note: 'Below average — training resources are better spent elsewhere. Value this player for match output only.' },
  { id: 'very-slow', min: 0, label: 'Very slow trainer', chip: 'red', note: 'Barely moves. Do not invest packs; sell if development was the plan.' },
];

export const TEST_AGE_NOTE = 'The test is designed for players aged 18–22. Outside that range the age correction dominates the measurement, so treat results as rough.';
