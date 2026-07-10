// The community fast-trainer test. Training speed is a hidden per-player
// multiplier — age only sets a global scaling (the "age slabs"), so a young
// player is NOT automatically a fast trainer. The test measures the
// multiplier directly.
//
// Learning a new role or special ability takes 50 SKILL POINTS in-game, and
// each training session awards whole points (0, +1, +2, +3…):
//
//   1. Give the player a NEW role (position) or special ability to learn.
//   2. With condition near 100%, run ONE session of 6× Sprint drills.
//   3. Enter how many POINTS the learning bar gained (0, 1, 2, 3…).
//   4. Rest the player and repeat — 7 tests give a reliable average
//      (single sessions quantize to whole points, so one test proves little).
//
// Reference: community guides put a genuine fast trainer at ~1 point per
// 15–18% condition at ages 18–21 — about 2 points per 6-sprint session.

// Age slabs: role/SA training speed relative to the 18–21 baseline.
export function ageSlabFactor(age) {
  if (age <= 21) return 1;
  if (age <= 25) return 0.5;
  if (age <= 29) return 0.25;
  return 0.125;
}

// One new role / special ability = 50 points.
export const TEST_POINTS_TOTAL = 50;

// Condition consumed by one test session (6× Sprint at normal intensity).
export const TEST_CONDITION_COST = 33;

export const RECOMMENDED_TESTS = 7;
export const MIN_TESTS_FOR_VERDICT = 3;

// Classification of the age-normalized average points per test session.
export const TRAINER_CLASSES = [
  { id: 'elite', min: 2.4, label: 'Elite fast trainer', chip: 'green', note: 'Top-tier hidden multiplier (~3 points per session) — build your training plan around this player and use greens aggressively.' },
  { id: 'fast', min: 1.7, label: 'Fast trainer', chip: 'green', note: 'Genuine fast trainer (~2 points per session). Worth heavy training investment and a long-term squad role.' },
  { id: 'average', min: 0.9, label: 'Average trainer', chip: 'yellow', note: 'Normal gains (~1 point per session). Train for maintenance and targeted weaknesses, not transformation.' },
  { id: 'slow', min: 0.4, label: 'Slow trainer', chip: 'red', note: 'Below average — training resources are better spent elsewhere. Value this player for match output only.' },
  { id: 'very-slow', min: 0, label: 'Very slow trainer', chip: 'red', note: 'Barely moves. Do not invest packs; sell if development was the plan.' },
];

export const TEST_AGE_NOTE = 'The test is designed for players aged 18–22. Outside that range the age correction dominates the measurement, so treat results as rough.';
