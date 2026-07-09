// Pure analysis functions — no DOM, unit-testable with node --test.
import { ATTRIBUTES, ATTR_KEYS, attrLabel } from '../data/attributes.js';
import { ROLES, POSITIONS } from '../data/roles.js';
import { DRILLS } from '../data/drills.js';
import { getFormation } from '../data/formations.js';

// ---------- Fast-trainer / development ----------

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
  const role = ROLES[position || player.position];
  if (!role) return { hasValues: false, items: [] };
  const attrs = player.attrs || {};
  const values = ATTR_KEYS.filter((k) => Number.isFinite(attrs[k]));
  const hasValues = values.length >= 5;

  if (!hasValues) {
    const items = ATTRIBUTES
      .filter((a) => role.weights[a.key] >= 2)
      .map((a) => ({ key: a.key, label: a.label, weight: role.weights[a.key], value: null, score: role.weights[a.key] }))
      .sort((x, y) => y.weight - x.weight);
    return { hasValues, items };
  }

  const avg = values.reduce((s, k) => s + attrs[k], 0) / values.length;
  const items = ATTRIBUTES
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

// Best positions for a player's attribute profile, ranked.
export function roleFit(player) {
  const attrs = player.attrs || {};
  const values = ATTR_KEYS.filter((k) => Number.isFinite(attrs[k]));
  if (values.length < 5) return [];
  return POSITIONS
    .map((pos) => {
      const w = ROLES[pos].weights;
      let sum = 0, wsum = 0;
      for (const k of ATTR_KEYS) {
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
  for (const k of ATTR_KEYS) if (role.weights[k] >= 2) needs[k] = role.weights[k];
  return needs;
}

// ---------- Development plan ----------

export function developmentPlan(player, squadAvgQuality) {
  const ft = fastTrainerRating(player.age);
  const verdict = trainerVerdict(player, squadAvgQuality);
  const report = weaknessReport(player, player.position);
  const focus = report.items.slice(0, 3);
  const needs = needsFromWeaknesses(report);
  const session = recommendDrills(needs, { budget: 30, position: player.position });

  const intensity =
    ft.tier >= 4 ? 'Hard intensity when condition is above 85% and no match within 12h; normal otherwise.' :
    ft.tier >= 2 ? 'Normal intensity; drop to low on match days.' :
    'Low intensity only — gains no longer justify injury risk.';

  const greens =
    ft.tier >= 4 ? 'Worth spending green packs to squeeze in extra sessions — this is the age where packs convert to permanent skill the fastest.' :
    ft.tier >= 2 ? 'Spend greens on match recovery first; extra training sessions only in light weeks.' :
    'Do not spend greens on training this player.';

  return { fastTrainer: ft, verdict, weaknesses: focus, session, intensity, greens, report };
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
