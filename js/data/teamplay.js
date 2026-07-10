// Teamplay Form ("training bonuses"): four categories, each capped at 10%
// (40% total), decaying 2% per category at the start of every game-day.
// Restoring a category requires training the right drill types with the
// right players selected. Activating a bonus DURING a match adds half its
// value again for 20 minutes of match time.
export const TEAMPLAY_BONUSES = [
  {
    id: 'attack',
    label: 'Attack',
    drillCategory: 'attack',
    minPlayers: 'At least 4 attacking players (AML/AMC/AMR/ST) in the session',
    filter: (p) => ['AML', 'AMC', 'AMR', 'ST'].includes(p.position),
    minCount: 4,
  },
  {
    id: 'defense',
    label: 'Defense',
    drillCategory: 'defence',
    minPlayers: 'At least 4 defensive players (GK/DL/DC/DR/DMC) in the session',
    filter: (p) => ['GK', 'DL', 'DC', 'DR', 'DMC'].includes(p.position),
    minCount: 4,
  },
  {
    id: 'possession',
    label: 'Possession',
    drillCategory: 'possession',
    minPlayers: 'At least 4 midfielders (DMC/MC/ML/MR/AMC) in the session',
    filter: (p) => ['DMC', 'MC', 'ML', 'MR', 'AMC'].includes(p.position),
    minCount: 4,
  },
  {
    id: 'condition',
    label: 'Condition',
    drillCategory: 'physical',
    minPlayers: 'At least 8 players of any position in the session',
    filter: () => true,
    minCount: 8,
  },
];

export const BONUS_MAX = 10;       // % per category
export const BONUS_DECAY = 2;      // % lost per category per game-day
export const BONUS_PER_SESSION = 2; // ≈ % restored by one matching session (2× ad boost doubles it)

export const TEAMPLAY_NOTES = [
  'The bar resets down 8% total (2% per category) at the start of every game-day — budget one maintenance session per day.',
  'Watching the 2× boost ad before training doubles the bonus gain of that session for the same condition cost.',
  'During a live match, ACTIVATE a bonus to add half its value again for 20 minutes (an 8% bonus plays like 12%).',
];
