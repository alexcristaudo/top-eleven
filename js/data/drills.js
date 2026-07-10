// Training drill database. `attrs` maps trained attributes to a gain weight
// (2 = primary focus, 1 = secondary). `cost` is the approximate condition
// drain (%) at NORMAL intensity — in-game values vary slightly with training
// level and intensity setting (low ≈ half, hard ≈ ×1.5, with matching gains
// and injury risk).
export const DRILL_CATEGORIES = [
  { id: 'defence', label: 'Defence drills' },
  { id: 'attack', label: 'Attack drills' },
  { id: 'possession', label: 'Possession drills' },
  { id: 'physical', label: 'Physical & Mental drills' },
];

export const DRILLS = [
  // ---------- Defence ----------
  {
    id: 'def-positioning', name: 'Defensive Positioning', category: 'defence', cost: 5,
    attrs: { positioning: 2, marking: 1 },
    positions: ['GK', 'DC', 'DL', 'DR', 'DMC'],
    note: 'Shape work: holding the line, covering channels. Cheap, high value for every defender.',
  },
  {
    id: 'slide-tackling', name: 'Slide Tackling', category: 'defence', cost: 7,
    attrs: { tackling: 2, aggression: 1 },
    positions: ['DC', 'DL', 'DR', 'DMC'],
    note: 'Timing challenges without fouling. Slightly higher injury risk than positional work.',
  },
  {
    id: 'man-marking', name: 'Man-to-Man Marking', category: 'defence', cost: 6,
    attrs: { marking: 2, positioning: 1, speed: 1 },
    positions: ['DC', 'DL', 'DR', 'DMC', 'MC'],
    note: 'Tracking a runner through the whole move. Pairs well with a man-marking tactic.',
  },
  {
    id: 'aerial-defence', name: 'Aerial Defence', category: 'defence', cost: 8,
    attrs: { heading: 2, bravery: 1, strength: 1 },
    positions: ['GK', 'DC', 'DMC', 'ST'],
    note: 'Attacking the ball at corners and long balls. Also useful for target-man strikers.',
  },
  {
    id: 'pressing-drill', name: 'Pressing the Ball Carrier', category: 'defence', cost: 9,
    attrs: { tackling: 2, positioning: 1, fitness: 1 },
    positions: ['DMC', 'MC', 'ML', 'MR', 'ST'],
    note: 'High-energy win-it-back drill. Expensive on condition — schedule away from match days.',
  },
  {
    id: 'shot-blocking', name: 'Shot Blocking', category: 'defence', cost: 5,
    attrs: { bravery: 2, positioning: 1 },
    positions: ['GK', 'DC', 'DMC'],
    note: 'Getting bodies in the way. Core drill for keepers and centre backs.',
  },
  {
    id: 'clearing-lines', name: 'Clearing the Lines', category: 'defence', cost: 5,
    attrs: { heading: 2, bravery: 1 },
    positions: ['DC', 'DL', 'DR'],
    note: 'First-contact clearances under pressure.',
  },
  {
    id: 'gk-shot-stopping', name: 'Shot Stopping (GK)', category: 'defence', cost: 6,
    attrs: { positioning: 2, bravery: 2, speed: 1 },
    positions: ['GK'],
    note: 'Keeper-focused: angles, reactions and one-on-ones.',
  },

  // ---------- Attack ----------
  {
    id: 'passing-circuit', name: 'Passing Circuit (Rondo)', category: 'attack', cost: 5,
    attrs: { passing: 2, creativity: 1 },
    positions: ['DMC', 'MC', 'AMC', 'DL', 'DR'],
    note: 'Quick one-touch keep-ball. The staple drill for any possession tactic.',
  },
  {
    id: 'through-balls', name: 'Through-Ball Practice', category: 'attack', cost: 7,
    attrs: { passing: 2, creativity: 2 },
    positions: ['MC', 'AMC'],
    note: 'Splitting the defensive line. Best single drill for playmakers.',
  },
  {
    id: 'slalom-dribble', name: 'Slalom Dribbling', category: 'attack', cost: 6,
    attrs: { dribbling: 2, speed: 1 },
    positions: ['ML', 'MR', 'AML', 'AMR', 'AMC', 'ST'],
    note: 'Cone runs at pace. Bread and butter for wingers.',
  },
  {
    id: 'one-on-one-finishing', name: 'One-on-One Finishing', category: 'attack', cost: 8,
    attrs: { finishing: 2, dribbling: 1 },
    positions: ['ST', 'AML', 'AMR'],
    note: 'Beating the keeper from through balls. Directly converts to goals.',
  },
  {
    id: 'shooting-technique', name: 'Shooting Technique', category: 'attack', cost: 6,
    attrs: { shooting: 2 },
    positions: ['ST', 'AMC', 'MC', 'AML', 'AMR'],
    note: 'Clean striking from the edge of the box.',
  },
  {
    id: 'long-shots', name: 'Long-Range Shooting', category: 'attack', cost: 7,
    attrs: { shooting: 2, strength: 1 },
    positions: ['MC', 'AMC', 'DMC'],
    note: 'Power and placement from distance — feeds the long-shot chances midfielders get.',
  },
  {
    id: 'crossing-flanks', name: 'Crossing from the Flanks', category: 'attack', cost: 6,
    attrs: { crossing: 2, passing: 1 },
    positions: ['DL', 'DR', 'ML', 'MR', 'AML', 'AMR'],
    note: 'Delivery under pressure. Essential when your tactic focuses passing down the flanks.',
  },
  {
    id: 'set-pieces', name: 'Set-Piece Routine', category: 'attack', cost: 8,
    attrs: { shooting: 1, crossing: 1, creativity: 1, heading: 1 },
    positions: ['MC', 'AMC', 'DC', 'ST'],
    note: 'Free kicks and corners for takers AND target players. Broad but shallow gains.',
  },
  {
    id: 'attacking-movement', name: 'Attacking Movement', category: 'attack', cost: 7,
    attrs: { positioning: 2, finishing: 1, creativity: 1 },
    positions: ['ST', 'AML', 'AMR', 'AMC'],
    note: 'Losing your marker and timing runs. Positioning matters for forwards too — it drives where they show up in the box.',
  },
  {
    id: 'headers-on-goal', name: 'Headers on Goal', category: 'attack', cost: 6,
    attrs: { heading: 2, finishing: 1 },
    positions: ['ST', 'AMC', 'DC'],
    note: 'Attacking crosses in the air. Pair with flank-focused tactics.',
  },

  // ---------- Possession ----------
  {
    id: 'keep-ball', name: 'Keep-Ball Game', category: 'possession', cost: 6,
    attrs: { passing: 2, positioning: 1 },
    positions: ['DMC', 'MC', 'ML', 'MR', 'AMC'],
    note: 'Small-sided keep-away under pressure. The staple for restoring the Possession teamplay bonus.',
  },
  {
    id: 'positional-rondo', name: 'Positional Rondo', category: 'possession', cost: 5,
    attrs: { passing: 2, creativity: 1 },
    positions: ['DMC', 'MC', 'AMC', 'DC'],
    note: 'Rondo with fixed zones — passing lanes over legs. Cheap possession-bonus filler.',
  },
  {
    id: 'transition-play', name: 'Transition Play', category: 'possession', cost: 7,
    attrs: { passing: 1, positioning: 1, fitness: 1 },
    positions: ['DMC', 'MC', 'ML', 'MR', 'AMC', 'DL', 'DR'],
    note: 'Win it, keep it, switch the point of attack. Broad gains and possession-bonus credit.',
  },

  // ---------- Physical & Mental ----------
  {
    id: 'slow-jog', name: 'Slow-Paced Jogging', category: 'physical', cost: 2,
    attrs: { fitness: 1 },
    positions: POS_ALL(),
    note: 'Recovery-day filler: tiny gain, tiny drain. Use when condition is precious.',
  },
  {
    id: 'stretching', name: 'Stretching', category: 'physical', cost: 2,
    attrs: { fitness: 1 },
    positions: POS_ALL(),
    note: 'Light session that keeps training streaks alive on match days.',
  },
  {
    id: 'cardio', name: 'Cardio Circuit', category: 'physical', cost: 5,
    attrs: { fitness: 2, speed: 1 },
    positions: POS_ALL(),
    note: 'The default engine-builder — fitness feeds every other stat over a season.',
  },
  {
    id: 'sprints', name: 'Sprint Training', category: 'physical', cost: 6,
    attrs: { speed: 2 },
    positions: ['DL', 'DR', 'ML', 'MR', 'AML', 'AMR', 'ST'],
    note: 'Pure pace work. The most valuable single stat for wide players and strikers.',
  },
  {
    id: 'gym-strength', name: 'Gym / Weight Training', category: 'physical', cost: 6,
    attrs: { strength: 2 },
    positions: ['GK', 'DC', 'DMC', 'ST'],
    note: 'Wins the physical duels. Prioritise for centre backs and target men.',
  },
  {
    id: 'agility-ladder', name: 'Agility Ladder', category: 'physical', cost: 5,
    attrs: { speed: 1, dribbling: 1 },
    positions: ['ML', 'MR', 'AML', 'AMR', 'AMC', 'ST'],
    note: 'Quick feet — a cheaper hybrid when you want pace and ball control together.',
  },
  {
    id: 'video-analysis', name: 'Video Analysis Session', category: 'physical', cost: 3,
    attrs: { creativity: 2, positioning: 1 },
    positions: POS_ALL(),
    note: 'Classroom session: almost no condition cost. Perfect on the day before a big match.',
  },
  {
    id: 'duel-training', name: 'Physical Duels', category: 'physical', cost: 7,
    attrs: { aggression: 2, strength: 1, bravery: 1 },
    positions: ['DC', 'DMC', 'MC', 'ST'],
    note: 'Shoulder-to-shoulder battles. Raises aggression — useful, but high aggression plus hard tackling means cards.',
  },
  {
    id: 'endurance-run', name: 'Endurance Run', category: 'physical', cost: 7,
    attrs: { fitness: 2, strength: 1 },
    positions: POS_ALL(),
    note: 'Heavy conditioning block for pre-season or long gaps between matches.',
  },
];

function POS_ALL() {
  return ['GK', 'DC', 'DL', 'DR', 'DMC', 'MC', 'ML', 'MR', 'AMC', 'AML', 'AMR', 'ST'];
}

export const INTENSITY = [
  {
    id: 'low', label: 'Low intensity',
    effect: '≈ half the condition cost and half the skill gain; minimal injury risk.',
    when: 'Match days, players below 75% condition, or veterans you only want ticking over.',
  },
  {
    id: 'normal', label: 'Normal intensity',
    effect: 'Baseline cost and gain shown on each drill.',
    when: 'Default for most sessions.',
  },
  {
    id: 'hard', label: 'Hard intensity',
    effect: '≈ 1.5× condition cost and gain; noticeably higher injury risk, especially below 60% condition.',
    when: 'Young fast trainers at high condition with rest packs banked, and no match in the next 8–12 hours.',
  },
];
