// Top Eleven player attributes. Every player (including goalkeepers) has the
// same 15 skills, split into three groups; overall quality is their average.
export const GROUPS = [
  { id: 'defence', label: 'Defence' },
  { id: 'attack', label: 'Attack' },
  { id: 'physical', label: 'Physical & Mental' },
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

  { key: 'speed', label: 'Speed', group: 'physical' },
  { key: 'strength', label: 'Strength', group: 'physical' },
  { key: 'fitness', label: 'Fitness', group: 'physical' },
  { key: 'aggression', label: 'Aggression', group: 'physical' },
  { key: 'creativity', label: 'Creativity', group: 'physical' },
];

export const ATTR_KEYS = ATTRIBUTES.map((a) => a.key);

export function attrLabel(key) {
  const a = ATTRIBUTES.find((x) => x.key === key);
  return a ? a.label : key;
}

export function attrsInGroup(groupId) {
  return ATTRIBUTES.filter((a) => a.group === groupId);
}
