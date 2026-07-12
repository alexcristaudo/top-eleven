// Pure analysis functions — no DOM, unit-testable with node --test.
import { ATTRIBUTES, ATTR_KEYS, attrLabel, attributesFor, attrKeysFor } from '../data/attributes.js';
import { ROLES, POSITIONS } from '../data/roles.js';
import { DRILLS } from '../data/drills.js';
import { getFormation, FORMATIONS } from '../data/formations.js';
import { ageSlabFactor, TRAINER_CLASSES, MIN_TESTS_FOR_VERDICT, RECOMMENDED_TESTS } from '../data/trainertest.js';
import { RECOMMENDED_SA_KIT, SPECIAL_ABILITIES, abilityIdsOf } from '../data/abilities.js';
import { powerStatsFor, BENCHMARK_KEY_RATIO } from '../data/powerstats.js';
import { attrLabel as attrLabelData } from '../data/attributes.js';

// ---------- Fast-trainer / development ----------

// Classify a player from recorded fast-trainer test entries: the SKILL POINTS
// (out of the 50 a new role/SA needs) that one 6-sprint session awarded —
// whole numbers, typically 0 to +3. The average is corrected for the age slab
// so the classification always compares against the 18–21 baseline.
// Legacy entries recorded as a progress percentage migrate at 1 point = 2%.
function entryPoints(e) {
  if (Number.isFinite(e.points)) return e.points;
  if (Number.isFinite(e.gain)) return e.gain / 2; // old %-based entries
  return NaN;
}

export function classifyTrainerTest(player) {
  const entries = (player.trainerTests || []).filter((e) => entryPoints(e) >= 0);
  if (entries.length < MIN_TESTS_FOR_VERDICT) {
    return { tested: false, testsDone: entries.length, testsNeeded: MIN_TESTS_FOR_VERDICT, recommended: RECOMMENDED_TESTS };
  }
  const points = entries.map(entryPoints);
  const avgPoints = points.reduce((s, p) => s + p, 0) / points.length;
  const normalized = avgPoints / ageSlabFactor(player.age || 21);
  const cls = TRAINER_CLASSES.find((c) => normalized >= c.min) || TRAINER_CLASSES[TRAINER_CLASSES.length - 1];
  const spread = Math.max(...points) - Math.min(...points);
  return {
    tested: true,
    testsDone: entries.length,
    recommended: RECOMMENDED_TESTS,
    provisional: entries.length < RECOMMENDED_TESTS,
    avgPoints,
    normalized,
    class: cls,
    noisy: entries.length >= 2 && spread > Math.max(2, avgPoints * 2), // wildly inconsistent inputs
  };
}

// True when the player should be treated as a fast trainer: a measured test
// verdict wins; the age heuristic is only the fallback for untested players.
export function isFastTrainer(player) {
  const t = classifyTrainerTest(player);
  if (t.tested) return t.class.id === 'elite' || t.class.id === 'fast';
  return (player.age || 99) <= 21;
}

export function fastTrainerRating(age) {
  if (age <= 19) return { tier: 5, label: 'Elite fast trainer', note: 'Peak gain years — every training session counts double here. Train hard and often.' };
  if (age <= 21) return { tier: 4, label: 'Fast trainer', note: 'Still excellent gains. Core development window.' };
  if (age <= 23) return { tier: 3, label: 'Good trainer', note: 'Solid gains, but the window is closing. Focus sessions on role-critical skills only.' };
  if (age <= 26) return { tier: 2, label: 'Average trainer', note: 'Gains are getting expensive. Maintain rather than transform.' };
  if (age <= 28) return { tier: 1, label: 'Slow trainer', note: 'Training mostly offsets seasonal inflation, nothing more.' };
  return { tier: 0, label: 'Veteran', note: 'Near-zero gains. Value is experience on the pitch, not the training ground.' };
}

// Development archetype from age + quality relative to squad average.
export function trainerVerdict(player, squadAvgQuality) {
  const { age, quality } = player;
  const rel = squadAvgQuality ? quality - squadAvgQuality : 0;

  if (age <= 21) {
    return rel >= 0
      ? { type: 'Crown jewel', advice: 'Young AND already above squad level. Build the team around this player: hard training, guaranteed minutes, never sell cheap.', chip: 'green' }
      : { type: 'Project fast trainer', advice: 'Below squad level but in peak gain years — heavy training investment now pays off within a season. Give minutes in low-stakes matches.', chip: 'green' };
  }
  if (age <= 25) {
    return rel >= 0
      ? { type: 'Peak performer', advice: 'In their prime and above squad level. Start every big match; train at normal intensity to hold off inflation. Consider selling around 25 while value is high.', chip: 'blue' }
      : { type: 'Squad filler', advice: 'Prime-age but below level, and training gains are slowing. Fine for rotation; upgrade this slot when a good auction appears.', chip: 'yellow' };
  }
  return rel >= 0
    ? { type: 'Veteran leader', advice: 'Still good enough to start, but value drops every season now. Sell before season rollover, or keep one as captain/mentor if morale-critical.', chip: 'yellow' }
    : { type: 'Sell now', advice: 'Ageing and below squad level — wages and a squad slot for little return. List for sale before the season ends.', chip: 'red' };
}

// ---------- Weakness analysis ----------

// Returns attributes ranked by how much they hold the player back in `position`.
// If the player has no attribute values, falls back to role priorities alone.
export function weaknessReport(player, position) {
  const pos = position || player.position;
  const role = ROLES[pos];
  if (!role) return { hasValues: false, items: [] };
  const attrs = player.attrs || {};
  const attrList = attributesFor(pos);
  const keyList = attrKeysFor(pos);
  const values = keyList.filter((k) => Number.isFinite(attrs[k]));
  const hasValues = values.length >= 5;

  if (!hasValues) {
    const items = attrList
      .filter((a) => role.weights[a.key] >= 2)
      .map((a) => ({ key: a.key, label: a.label, weight: role.weights[a.key], value: null, score: role.weights[a.key] }))
      .sort((x, y) => y.weight - x.weight);
    return { hasValues, items };
  }

  const avg = values.reduce((s, k) => s + attrs[k], 0) / values.length;
  const items = attrList
    .map((a) => {
      const w = role.weights[a.key];
      const v = Number.isFinite(attrs[a.key]) ? attrs[a.key] : avg;
      const gap = avg - v; // how far below the player's own level
      return { key: a.key, label: a.label, weight: w, value: v, gap, score: w * (gap + 4) };
    })
    .filter((it) => it.weight > 0)
    .sort((x, y) => y.score - x.score);
  return { hasValues, items, avg };
}

// Best positions for a player's attribute profile, ranked. Goalkeepers and
// outfield players use disjoint skill sets, so a keeper is only compared to GK
// and outfield players only to outfield positions.
export function roleFit(player) {
  const attrs = player.attrs || {};
  const keyList = attrKeysFor(player.position);
  const values = keyList.filter((k) => Number.isFinite(attrs[k]));
  if (values.length < 5) return [];
  const candidates = player.position === 'GK' ? ['GK'] : POSITIONS.filter((p) => p !== 'GK');
  return candidates
    .map((pos) => {
      const w = ROLES[pos].weights;
      let sum = 0, wsum = 0;
      for (const k of keyList) {
        if (w[k] > 0 && Number.isFinite(attrs[k])) { sum += w[k] * attrs[k]; wsum += w[k]; }
      }
      return { pos, label: ROLES[pos].label, score: wsum ? sum / wsum : 0 };
    })
    .sort((a, b) => b.score - a.score);
}

// ---------- Drill recommendation ----------

// Score drills against a weighted attribute-need map and pick the best set
// within a condition budget. Greedy on value-per-condition, no drill repeated.
export function recommendDrills(needs, { budget = 30, position = null, maxDrills = 5 } = {}) {
  const scored = DRILLS
    .map((d) => {
      let value = 0;
      for (const [attr, w] of Object.entries(d.attrs)) {
        if (needs[attr]) value += needs[attr] * w;
      }
      if (position && d.positions.includes(position)) value *= 1.25;
      return { drill: d, value, perCost: value / d.cost };
    })
    .filter((s) => s.value > 0)
    .sort((a, b) => b.perCost - a.perCost || b.value - a.value);

  const plan = [];
  let remaining = budget;
  for (const s of scored) {
    if (plan.length >= maxDrills) break;
    if (s.drill.cost <= remaining) {
      plan.push(s);
      remaining -= s.drill.cost;
    }
  }
  return { plan, totalCost: budget - remaining, budget };
}

// Convenience: build a needs map from a weakness report (top N weaknesses).
export function needsFromWeaknesses(report, topN = 4) {
  const needs = {};
  for (const it of report.items.slice(0, topN)) {
    needs[it.key] = Math.max(1, it.weight);
  }
  return needs;
}

// Needs map for training a position generally (all weighted attrs).
export function needsForPosition(position) {
  const role = ROLES[position];
  if (!role) return {};
  const needs = {};
  for (const k of attrKeysFor(position)) if (role.weights[k] >= 2) needs[k] = role.weights[k];
  return needs;
}

// ---------- Development plan ----------

export function developmentPlan(player, squadAvgQuality) {
  // A measured fast-trainer test beats the age heuristic.
  const test = classifyTrainerTest(player);
  const TIER_BY_CLASS = { elite: 5, fast: 4, average: 2, slow: 1, 'very-slow': 0 };
  const ft = test.tested
    ? { tier: TIER_BY_CLASS[test.class.id], label: `Tested: ${test.class.label}`, note: test.class.note, tested: true }
    : { ...fastTrainerRating(player.age), tested: false };
  const verdict = trainerVerdict(player, squadAvgQuality);
  const report = weaknessReport(player, player.position);
  const focus = report.items.slice(0, 3);
  const needs = needsFromWeaknesses(report);
  // Bias the session toward the position's key ("power") stats so training
  // pushes what the match engine actually reads, not cosmetic grey stats.
  const powerPlan = powerTrainingReport(player);
  for (const it of powerPlan.items) {
    if (it.maxed) continue; // already at target — don't waste the session on it
    needs[it.key] = Math.max(needs[it.key] || 0, powerPlan.speedKing && it.key === 'speed' ? 4 : 3);
  }
  const session = recommendDrills(needs, { budget: 30, position: player.position });

  const intensity =
    ft.tier >= 4 ? 'Hard intensity when condition is above 85% and no match within 12h; normal otherwise.' :
    ft.tier >= 2 ? 'Normal intensity; drop to low on match days.' :
    'Low intensity only — gains no longer justify injury risk.';

  const greens =
    ft.tier >= 4 ? 'Worth spending green packs to squeeze in extra sessions — this is the age where packs convert to permanent skill the fastest.' :
    ft.tier >= 2 ? 'Spend greens on match recovery first; extra training sessions only in light weeks.' :
    'Do not spend greens on training this player.';

  return { fastTrainer: ft, trainerTest: test, verdict, weaknesses: focus, session, intensity, greens, report };
}

// ---------- Auction bid valuation (free-to-play) ----------

// How many tokens a bid target is worth to a free-to-play manager, who earns
// roughly 1–3 tokens/day from ads and rewards (~30–60 per season). The model
// prices TRAINING POTENTIAL (age) first — that's what F2P managers actually
// buy — then adjusts for star level, star proximity, extras and squad need.
const BID_BASE_BY_AGE = [
  { maxAge: 19, base: 15 },
  { maxAge: 21, base: 12 },
  { maxAge: 23, base: 8 },
  { maxAge: 26, base: 5 },
  { maxAge: 99, base: 2 },
];

const BID_STAR_MULT = { 3: 0.7, 4: 1.0, 5: 1.2, 6: 1.5 };

export function bidValuation({ age, stars = 4, endsIn49 = false, hasSpecialAbility = false, hasPlaystyle = false, need = 'normal' }) {
  const base = BID_BASE_BY_AGE.find((b) => age <= b.maxAge).base;
  const starMult = BID_STAR_MULT[stars] ?? 1.0;
  const needMult = need === 'gap' ? 1.25 : need === 'surplus' ? 0.8 : 1.0;
  let bonus = 0;
  const notes = [];
  if (endsIn49) { bonus += 2; notes.push('Quality ends in 4/9: the next star is one training step away (+2).'); }
  if (hasSpecialAbility) { bonus += 2; notes.push('Special ability included — one star stronger whenever it triggers (+2).'); }
  if (hasPlaystyle) { bonus += 2; notes.push('Playstyle already unlocked — saves weeks of levelling drills (+2).'); }
  if (need === 'gap') notes.push('Fills a position your squad barely covers (×1.25).');
  if (need === 'surplus') notes.push('You already have plenty for this position (×0.8) — only buy a clear upgrade.');
  if (age <= 21) notes.push('Peak training age — every green invested compounds.');
  if (age >= 27) notes.push('Near-zero training gains and falling resale value — pay scraps or pass.');
  const maxBid = Math.max(1, Math.round(base * starMult * needMult + bonus));
  return { base, starMult, needMult, bonus, maxBid, notes };
}

// Squad-derived positional need for the valuator.
export function positionNeed(players, pos) {
  const cover = players.filter((p) => p.position === pos || (p.altPositions || []).includes(pos)).length;
  if (cover <= 1) return 'gap';
  if (cover >= 3) return 'surplus';
  return 'normal';
}

// ---------- Best-player analysis (power stats, archetype, benchmark) ----------

// Power-training plan: the key attributes for the player's position, each with
// its current value and whether it still needs work. Grey stats are ignored.
export function powerTrainingReport(player) {
  const power = powerStatsFor(player.position);
  const attrs = player.attrs || {};
  const quality = player.quality || 0;
  const target = Math.round(quality * BENCHMARK_KEY_RATIO);
  const items = power.key.map((key) => {
    const value = Number.isFinite(attrs[key]) ? attrs[key] : null;
    return {
      key,
      label: attrLabelData(key),
      value,
      target,
      gap: value === null ? null : Math.max(0, target - value),
      maxed: value !== null && value >= target,
    };
  });
  return { keys: power.key, speedKing: power.speedKing, target, items, hasValues: items.some((i) => i.value !== null) };
}

// Elite-archetype rating: how close a player is to a "best in game" player at
// their position, judged ONLY on the key stats (the engine ignores the rest).
// Speed-king positions weight Speed double. Returns 0–100 plus a tier + label.
export function archetypeRating(player) {
  const power = powerStatsFor(player.position);
  const attrs = player.attrs || {};
  if (!power.key.length) return null;
  const target = Math.max(1, (player.quality || 0) * BENCHMARK_KEY_RATIO);
  let sum = 0, wsum = 0;
  for (const key of power.key) {
    const w = (power.speedKing && key === 'speed') ? 2 : 1;
    const v = Number.isFinite(attrs[key]) ? attrs[key] : (player.quality || 0);
    sum += w * Math.min(1, v / target);
    wsum += w;
  }
  const score = Math.round((sum / wsum) * 100);
  const hasValues = power.key.some((k) => Number.isFinite(attrs[k]));
  let tier, label;
  if (score >= 92) { tier = 'elite'; label = power.speedKing ? 'Elite (meta-perfect)' : 'Elite'; }
  else if (score >= 78) { tier = 'strong'; label = 'Strong'; }
  else if (score >= 60) { tier = 'serviceable'; label = 'Serviceable'; }
  else { tier = 'raw'; label = 'Below key-stat par'; }
  const fast = power.speedKing && Number.isFinite(attrs.speed) && attrs.speed >= target * 0.95;
  return { score, tier, label, speedKing: power.speedKing, fast, hasValues };
}

// ---------- Special-ability coverage ----------

// Check the squad against the recommended special-ability kit.
export function saCoverage(players) {
  return RECOMMENDED_SA_KIT.map((slot) => {
    const ability = SPECIAL_ABILITIES.find((a) => a.id === slot.id);
    const holders = players.filter((p) => abilityIdsOf(p).includes(slot.id));
    return {
      id: slot.id,
      label: ability ? ability.label : slot.id,
      want: slot.want,
      why: slot.why,
      holders,
      covered: holders.length >= slot.want,
    };
  });
}

// ---------- Tactics ----------

export function counterOptions(opponentFormationId) {
  const opp = getFormation(opponentFormationId);
  if (!opp) return null;
  return {
    opponent: opp,
    counters: opp.counters
      .map((c) => ({ formation: getFormation(c.id), why: c.why }))
      .filter((c) => c.formation),
  };
}

// Which saved players fit each position of a formation (exact position match,
// falling back to zone matches).
export function squadFitForFormation(formation, players) {
  const need = {};
  for (const spot of formation.shape) need[spot.pos] = (need[spot.pos] || 0) + 1;
  return Object.entries(need).map(([pos, count]) => {
    const exact = players.filter((p) => p.position === pos || (p.altPositions || []).includes(pos));
    return { pos, count, players: exact.sort((a, b) => (b.quality || 0) - (a.quality || 0)) };
  });
}

// Pick the strongest XI for a formation from saved players.
// Players are taken in quality order and placed into the first open slot that
// matches their main position, then a second pass fills remaining slots via
// alt positions. Returns slot assignments (in formation.shape order), the
// bench, average XI quality and any unfilled positions.
export function bestXI(formation, players) {
  const slots = formation.shape.map((s) => ({ pos: s.pos, player: null }));
  const pool = players.slice().sort((a, b) => (b.quality || 0) - (a.quality || 0));
  const used = new Set();

  for (const matcher of [
    (p, pos) => p.position === pos,
    (p, pos) => (p.altPositions || []).includes(pos),
  ]) {
    for (const p of pool) {
      if (used.has(p.id)) continue;
      const slot = slots.find((s) => !s.player && matcher(p, s.pos));
      if (slot) { slot.player = p; used.add(p.id); }
    }
  }

  const bench = pool.filter((p) => !used.has(p.id));
  const filled = slots.filter((s) => s.player);
  const avgQuality = filled.length
    ? filled.reduce((sum, s) => sum + (s.player.quality || 0), 0) / filled.length
    : 0;
  const missing = slots.filter((s) => !s.player).map((s) => s.pos);
  return { slots, bench, avgQuality, missing };
}

// Rank every formation by how well THIS squad fills it, balanced against the
// shape's inherent (meta) strength. Coverage dominates: the in-game
// out-of-position penalty is brutal, so a shape you can fully staff beats a
// "stronger" shape with holes. Within equal coverage the score blends the
// best XI's average quality (alt-position slots at a small discount) with the
// formation's metaRating — a shape rated 9/10 gets ~12% over one rated 5/10,
// comparable to a real quality edge but not enough to override a clearly
// better-fitting squad.
export function rankFormations(players) {
  return FORMATIONS
    .map((formation) => {
      const xi = bestXI(formation, players);
      let total = 0;
      for (const s of xi.slots) {
        if (!s.player) continue;
        const exact = s.player.position === s.pos;
        total += (s.player.quality || 0) * (exact ? 1 : 0.92);
      }
      const fit = total / 11;
      const meta = formation.metaRating || 6;
      const score = fit * (0.85 + meta * 0.03);
      return { formation, xi, fit, meta, score, missing: xi.missing.length };
    })
    .sort((a, b) => a.missing - b.missing || b.score - a.score);
}

// Condition planning: Top Eleven regenerates condition on a 15-minute tick
// (~5% per tick by default) and a green (rest) pack restores ~15%.
export function conditionPlan({ current, minutesUntilMatch, target = 90, regenPer15 = 5, greenValue = 15 }) {
  const cur = Math.max(0, Math.min(100, current));
  const ticks = Math.max(0, Math.floor(minutesUntilMatch / 15));
  const atKickoff = Math.min(100, cur + ticks * regenPer15);
  const shortfall = Math.max(0, target - atKickoff);
  const greensNeeded = Math.ceil(shortfall / greenValue);
  // Minutes of natural regen needed to reach target with no packs (Infinity if unreachable).
  const ticksToTarget = Math.ceil(Math.max(0, target - cur) / regenPer15);
  const minutesToTarget = cur >= target ? 0 : ticksToTarget * 15;
  return { atKickoff, greensNeeded, minutesToTarget, ready: atKickoff >= target };
}

export { attrLabel };
