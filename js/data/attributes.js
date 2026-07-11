// Top Eleven player attributes. OUTFIELD players have 15 skills (Defence /
// Attack / Physical & Mental). GOALKEEPERS have a different set: 10 Goalkeeping
// skills plus the same 5 Physical & Mental skills — Defence and Attack are
// replaced entirely.

export const GROUPS = [
  { id: 'defence', label: 'Defence' },
  { id: 'attack', label: 'Attack' },
  { id: 'physical', label: 'Physical & Mental' },
];

// The 5 Physical & Mental skills are shared by outfield players and keepers.
const PHYSICAL = [
  { key: 'speed', label: 'Speed', group: 'physical' },
  { key: 'strength', label: 'Strength', group: 'physical' },
  { key: 'fitness', label: 'Fitness', group: 'physical' },
  { key: 'aggression', label: 'Aggression', group: 'physical' },
  { key: 'creativity', label: 'Creativity', group: 'physical' },
];

export const ATTRIBUTES = [
  { key: 'tackling', label: 'Tackling', group: 'defence' },
  { key: 'marking', label: 'Marking', group: 'defence' },
  { key: 'positioning', label: 'Positioning', group: 'defence' },
  { key: 'heading', label: 'Heading', group: 'defence' },
  { key: 'bravery', label: 'Bravery', group: 'defence' },

  { key: 'passing', label: 'Passing', group: 'attack' },
  { key: 'dribbling', label: 'Dribbling', group: 'attack' },
  { key: 'crossing', label: 'Crossing', group: 'attack' },
  { key: 'shooting', label: 'Shooting', group: 'attack' },
  { key: 'finishing', label: 'Finishing', group: 'attack' },

  ...PHYSICAL,
];

// Goalkeeper skills: the Goalkeeping group replaces Defence + Attack.
export const GK_GROUPS = [
  { id: 'goalkeeping', label: 'Goalkeeping' },
  { id: 'physical', label: 'Physical & Mental' },
];

export const GK_ATTRIBUTES = [
  { key: 'reflexes', label: 'Reflexes', group: 'goalkeeping' },
  { key: 'agility', label: 'Agility', group: 'goalkeeping' },
  { key: 'anticipation', label: 'Anticipation', group: 'goalkeeping' },
  { key: 'rushingOut', label: 'Rushing out', group: 'goalkeeping' },
  { key: 'communication', label: 'Communication', group: 'goalkeeping' },
  { key: 'throwing', label: 'Throwing', group: 'goalkeeping' },
  { key: 'kicking', label: 'Kicking', group: 'goalkeeping' },
  { key: 'punching', label: 'Punching', group: 'goalkeeping' },
  { key: 'aerialReach', label: 'Aerial reach', group: 'goalkeeping' },
  { key: 'concentration', label: 'Concentration', group: 'goalkeeping' },

  ...PHYSICAL,
];

export const ATTR_KEYS = ATTRIBUTES.map((a) => a.key);
export const GK_ATTR_KEYS = GK_ATTRIBUTES.map((a) => a.key);

// Every attribute key that exists (outfield + GK), for label lookups.
const ALL = [...ATTRIBUTES, ...GK_ATTRIBUTES.filter((a) => a.group === 'goalkeeping')];

export function isGk(position) {
  return position === 'GK';
}

export function attributesFor(position) {
  return isGk(position) ? GK_ATTRIBUTES : ATTRIBUTES;
}

export function attrKeysFor(position) {
  return isGk(position) ? GK_ATTR_KEYS : ATTR_KEYS;
}

export function groupsFor(position) {
  return isGk(position) ? GK_GROUPS : GROUPS;
}

export function attrLabel(key) {
  const a = ALL.find((x) => x.key === key);
  return a ? a.label : key;
}

export function attrsInGroup(groupId, position) {
  return attributesFor(position).filter((a) => a.group === groupId);
}
