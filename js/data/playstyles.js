// Playstyles: unlockable per-player specialisations levelled through specific
// drills (Basic → Advanced → Master). Names and drill mappings follow the
// official playstyle-types thread and community guides; drills reference our
// catalogue by id so the recommender can build the exact levelling session.
export const PLAYSTYLE_LEVELS = ['None', 'Basic', 'Advanced', 'Master'];

export const PLAYSTYLES = [
  {
    id: 'poacher',
    label: 'Poacher',
    category: 'Attacker',
    positions: ['ST'],
    description: 'Lives on the last defender\'s shoulder — every ball into the box becomes a chance. Pure finishing threat.',
    drills: ['shooting-technique', 'slalom-dribble', 'sprints'],
  },
  {
    id: 'target-man',
    label: 'Target Man',
    category: 'Attacker',
    positions: ['ST'],
    description: 'The magnet for aerial balls: finishes crosses or holds the ball up for arriving teammates. Wants heading and strength.',
    drills: ['headers-on-goal', 'aerial-defence', 'gym-strength'],
  },
  {
    id: 'false-nine',
    label: 'False Nine',
    category: 'Attacker',
    positions: ['ST', 'AMC'],
    description: 'Drops between the lines to create, dragging centre-backs out of shape. Passing and creativity first, goals second.',
    drills: ['through-balls', 'passing-circuit', 'attacking-movement'],
  },
  {
    id: 'winger-playstyle',
    label: 'Classic Winger',
    category: 'Attacker',
    positions: ['AML', 'AMR', 'ML', 'MR'],
    description: 'Beats the fullback on the outside and delivers. Pace, dribbling and crossing define the ceiling.',
    drills: ['slalom-dribble', 'crossing-flanks', 'sprints'],
  },
  {
    id: 'regista',
    label: 'Regista',
    category: 'Midfielder',
    positions: ['DMC', 'MC'],
    description: 'The deep-lying director: links defence to attack and controls tempo through passing range.',
    drills: ['passing-circuit', 'through-balls', 'video-analysis'],
  },
  {
    id: 'box-to-box',
    label: 'Box-to-Box',
    category: 'Midfielder',
    positions: ['MC'],
    description: 'Covers both boxes all match — tackles at one end, arrives late at the other. Fitness is the engine.',
    drills: ['endurance-run', 'pressing-drill', 'long-shots'],
  },
  {
    id: 'attacking-fullback',
    label: 'Attacking Full-back',
    category: 'Defender',
    positions: ['DL', 'DR'],
    description: 'Defends the flank, then overlaps to supply width — especially valuable in narrow formations.',
    drills: ['crossing-flanks', 'sprints', 'man-marking'],
  },
  {
    id: 'ball-playing-defender',
    label: 'Ball-Playing Defender',
    category: 'Defender',
    positions: ['DC'],
    description: 'Starts attacks from the back with composed passing while still winning his duels.',
    drills: ['passing-circuit', 'def-positioning', 'aerial-defence'],
  },
];

export function playstylesForPosition(pos) {
  return PLAYSTYLES.filter((s) => s.positions.includes(pos));
}
