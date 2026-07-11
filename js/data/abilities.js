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

// Map free OCR text ("free kick specialist", "aerial defender") to an SA id.
export function matchAbility(text) {
  if (!text) return null;
  const t = String(text).toLowerCase();
  const found = SPECIAL_ABILITIES.find((a) => {
    const label = a.label.toLowerCase();
    return label.includes(t) || t.includes(label.split(' ')[0].replace('-', ' ')) || t.includes(label);
  });
  if (found) return found.id;
  if (/free.?kick/.test(t)) return 'free-kick';
  if (/corner/.test(t)) return 'corner';
  if (/penalt/.test(t)) return /stop/.test(t) ? 'penalty-stopper' : 'penalty';
  if (/aerial/.test(t)) return 'aerial-defender';
  if (/wall/.test(t)) return 'defensive-wall';
  if (/one.?on.?one|1.?on.?1/.test(t)) return /stop/.test(t) ? 'one-on-one-stopper' : 'one-on-one-scorer';
  if (/playmak/.test(t)) return 'playmaker';
  if (/drib/.test(t)) return 'dribbler';
  return null;
}

export function abilityLabel(id) {
  const a = SPECIAL_ABILITIES.find((x) => x.id === id);
  return a ? a.label : id;
}
