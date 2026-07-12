// Special abilities: when an SA's situation triggers, the player counts as
// ONE STAR higher quality for that action. The recommended squad kit below is
// the community-consensus minimum coverage.
export const SPECIAL_ABILITIES = [
  { id: 'free-kick', label: 'Free-Kick Specialist', positions: ['MC', 'AMC', 'AML', 'AMR', 'ST'] },
  { id: 'corner', label: 'Corner Specialist', positions: ['MC', 'AMC', 'ML', 'MR', 'AML', 'AMR'] },
  { id: 'penalty', label: 'Penalty Specialist', positions: ['MC', 'AMC', 'ST', 'AML', 'AMR'] },
  { id: 'one-on-one-scorer', label: 'One-on-One Scorer', positions: ['ST', 'AML', 'AMR'] },
  { id: 'dribbler', label: 'Dribbler', positions: ['AML', 'AMR', 'ML', 'MR', 'AMC', 'ST'] },
  { id: 'aerial-defender', label: 'Aerial Defender', positions: ['DC', 'DL', 'DR', 'DMC'] },
  { id: 'defensive-wall', label: 'Defensive Wall', positions: ['DC', 'DL', 'DR', 'DMC'] },
  { id: 'one-on-one-stopper', label: 'One-on-One Stopper', positions: ['GK'] },
  { id: 'penalty-stopper', label: 'Penalty Stopper', positions: ['GK'] },
  { id: 'playmaker', label: 'Playmaker', positions: ['DMC', 'MC', 'AMC'] },
];

// The kit every competitive squad should cover.
export const RECOMMENDED_SA_KIT = [
  { id: 'aerial-defender', want: 2, why: 'Kills crosses and corner threats — the most common danger in the match engine.' },
  { id: 'defensive-wall', want: 1, why: 'Blunts direct free kicks against you.' },
  { id: 'corner', want: 1, why: 'Your corners become genuine chances instead of lottery balls.' },
  { id: 'free-kick', want: 1, why: 'Direct free kicks turn into goals — the highest-impact SA in the game.' },
  { id: 'one-on-one-scorer', want: 1, why: 'Converts through-ball chances; pairs beautifully with a counter-attacking setup.' },
];

// OCR-tolerant patterns keyed on each ability's DISTINCTIVE words only — never
// on an attribute name, so scanning a full skills screen can't false-fire:
//  - "Dribbler" requires the "-er" ending, so the "Dribbling" attribute line
//    never matches.
//  - "Aerial Defender" requires "def", so the goalkeeper "Aerial reach"
//    attribute never matches.
// Processed in this order and each match is CONSUMED from the text, so the
// specific "…Stopper" variants win before the plainer "Penalty"/"One-on-One"
// patterns get a look (a Penalty Stopper is not also a Penalty Specialist).
const ABILITY_PATTERNS = [
  { id: 'penalty-stopper',    re: /pena?lt\w*\s*st[o0]pp?/ },
  { id: 'one-on-one-stopper', re: /(?:one[\s.-]*on[\s.-]*one|1[\s.-]*(?:on|v)[\s.-]*1)\s*st[o0]pp?/ },
  { id: 'one-on-one-scorer',  re: /(?:one[\s.-]*on[\s.-]*one|1[\s.-]*(?:on|v)[\s.-]*1)\s*(?:sc[o0]r)?/ },
  { id: 'penalty',            re: /pena?lt/ },
  { id: 'free-kick',          re: /fr[e3]{1,2}[\s.-]*k[il1]ck/ },
  { id: 'corner',             re: /c[o0]rn[e3]r/ },
  { id: 'aerial-defender',    re: /a[e3]r[il1]a?l\s*def/ },
  { id: 'defensive-wall',     re: /def\w*\s*wa[l1]{2}|\bwa[l1]{2}\b/ },
  { id: 'dribbler',           re: /dr[il1]bb?[l1][e3]r/ },
  { id: 'playmaker',          re: /p[l1]ay[\s.-]*mak/ },
];

// Scan full OCR text and return EVERY special-ability id present (players can
// carry several), de-duplicated and in canonical SPECIAL_ABILITIES order.
export function detectAbilities(text) {
  if (!text) return [];
  let t = String(text).toLowerCase();
  const ids = new Set();
  for (const { id, re } of ABILITY_PATTERNS) {
    const g = new RegExp(re.source, 'g');
    if (g.test(t)) {
      ids.add(id);
      t = t.replace(new RegExp(re.source, 'g'), ' '); // consume so a broader sibling can't re-match
    }
  }
  return SPECIAL_ABILITIES.filter((a) => ids.has(a.id)).map((a) => a.id);
}

// Map a single free-text OCR fragment to one SA id (used for legacy header
// parsing and manual entry); prefer detectAbilities for whole-screen scans.
export function matchAbility(text) {
  return detectAbilities(text)[0] || null;
}

// A player's abilities as an id array, tolerating the legacy single-string
// `specialAbility` field so old saved squads keep working.
export function abilityIdsOf(player) {
  if (!player) return [];
  if (Array.isArray(player.specialAbilities)) return player.specialAbilities;
  return player.specialAbility ? [player.specialAbility] : [];
}

export function abilityLabel(id) {
  const a = SPECIAL_ABILITIES.find((x) => x.id === id);
  return a ? a.label : id;
}
