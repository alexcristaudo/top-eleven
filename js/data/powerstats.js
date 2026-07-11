// Power-training targets: the 2–3 "white" (key) attributes the match engine
// actually reads for each position, in priority order. Power training means
// pouring gains into these and ignoring the "grey" (cosmetic) rest.
//
// Also the speed-first attacker meta: `speedKing` positions are the ones where
// Speed is the single most decisive attribute (fast strikers/wingers dominate).
export const POWER_STATS = {
  GK:  { key: ['positioning', 'bravery', 'speed'], speedKing: false },
  DC:  { key: ['marking', 'tackling', 'heading'], speedKing: false },
  DL:  { key: ['speed', 'tackling', 'crossing'], speedKing: true },
  DR:  { key: ['speed', 'tackling', 'crossing'], speedKing: true },
  DMC: { key: ['tackling', 'passing', 'marking'], speedKing: false },
  MC:  { key: ['passing', 'creativity', 'fitness'], speedKing: false },
  ML:  { key: ['speed', 'dribbling', 'crossing'], speedKing: true },
  MR:  { key: ['speed', 'dribbling', 'crossing'], speedKing: true },
  AMC: { key: ['passing', 'creativity', 'shooting'], speedKing: false },
  AML: { key: ['speed', 'dribbling', 'finishing'], speedKing: true },
  AMR: { key: ['speed', 'dribbling', 'finishing'], speedKing: true },
  ST:  { key: ['finishing', 'speed', 'shooting'], speedKing: true },
};

export function powerStatsFor(pos) {
  return POWER_STATS[pos] || { key: [], speedKing: false };
}

// The community-benchmark target for a "best in game" player: their KEY stats
// maxed near the top of your league band. Expressed as a fraction of the
// player's own quality (the game caps a player's stats roughly around their
// quality), so the benchmark scales with level: key stats should sit at ~115%
// of quality (fully power-trained), grey stats are irrelevant.
export const BENCHMARK_KEY_RATIO = 1.15;

export const POWER_TRAINING_NOTE =
  'The match engine only reads a few key attributes per position. Power-train ' +
  'these and ignore the greyed-out stats — a striker with 120 Finishing/Speed ' +
  'and 40 everywhere else beats a "balanced" one of the same quality.';
