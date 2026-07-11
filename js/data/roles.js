// Position roles with ideal attribute weights (0 = irrelevant … 3 = critical).
// Used to rank a player's weakest areas for their role and to compute role fit.
export const POSITIONS = [
  'GK', 'DC', 'DL', 'DR', 'DMC', 'MC', 'ML', 'MR', 'AMC', 'AML', 'AMR', 'ST',
];

export const POSITION_ZONE = {
  GK: 'gk',
  DC: 'def', DL: 'def', DR: 'def',
  DMC: 'mid', MC: 'mid', ML: 'mid', MR: 'mid', AMC: 'mid',
  AML: 'att', AMR: 'att', ST: 'att',
};

const fullback = {
  tackling: 3, marking: 3, positioning: 2, heading: 1, bravery: 2,
  passing: 2, dribbling: 1, crossing: 3, shooting: 0, finishing: 0,
  speed: 3, strength: 1, fitness: 3, aggression: 2, creativity: 1,
};

const wideMid = {
  tackling: 1, marking: 1, positioning: 1, heading: 1, bravery: 1,
  passing: 2, dribbling: 3, crossing: 3, shooting: 1, finishing: 1,
  speed: 3, strength: 1, fitness: 3, aggression: 1, creativity: 2,
};

const winger = {
  tackling: 0, marking: 0, positioning: 1, heading: 1, bravery: 1,
  passing: 2, dribbling: 3, crossing: 3, shooting: 2, finishing: 2,
  speed: 3, strength: 1, fitness: 2, aggression: 1, creativity: 2,
};

export const ROLES = {
  GK: {
    label: 'Goalkeeper',
    description: 'Shot-stopper and last line. Reflexes, agility and aerial command decide saves; anticipation and rushing out handle one-on-ones.',
    // Goalkeepers use the Goalkeeping skill set, not the outfield attributes.
    weights: {
      reflexes: 3, agility: 3, anticipation: 2, rushingOut: 2, communication: 1,
      throwing: 1, kicking: 1, punching: 2, aerialReach: 3, concentration: 2,
      speed: 1, strength: 1, fitness: 2, aggression: 1, creativity: 1,
    },
  },
  DC: {
    label: 'Centre Back',
    description: 'Wins duels and headers, holds the line. Tackling, marking, positioning and heading are the core four.',
    weights: {
      tackling: 3, marking: 3, positioning: 3, heading: 3, bravery: 2,
      passing: 1, dribbling: 0, crossing: 0, shooting: 0, finishing: 0,
      speed: 2, strength: 3, fitness: 2, aggression: 2, creativity: 0,
    },
  },
  DL: { label: 'Left Back', description: 'Defends the flank and overlaps. Needs tackling and marking plus speed, fitness and crossing to contribute going forward.', weights: fullback },
  DR: { label: 'Right Back', description: 'Defends the flank and overlaps. Needs tackling and marking plus speed, fitness and crossing to contribute going forward.', weights: fullback },
  DMC: {
    label: 'Defensive Midfielder',
    description: 'Screens the back line and recycles possession. Tackling, marking, positioning and passing; strength to win the physical battle.',
    weights: {
      tackling: 3, marking: 3, positioning: 3, heading: 1, bravery: 2,
      passing: 3, dribbling: 1, crossing: 0, shooting: 1, finishing: 0,
      speed: 1, strength: 3, fitness: 3, aggression: 2, creativity: 1,
    },
  },
  MC: {
    label: 'Central Midfielder',
    description: 'Engine of the team — contributes in both boxes. Passing, creativity and fitness first; tackling and shooting round it out.',
    weights: {
      tackling: 2, marking: 1, positioning: 2, heading: 1, bravery: 1,
      passing: 3, dribbling: 2, crossing: 1, shooting: 2, finishing: 1,
      speed: 2, strength: 2, fitness: 3, aggression: 1, creativity: 3,
    },
  },
  ML: { label: 'Left Midfielder', description: 'Wide outlet who defends a little and crosses a lot. Speed, dribbling, crossing and the fitness to run the whole flank.', weights: wideMid },
  MR: { label: 'Right Midfielder', description: 'Wide outlet who defends a little and crosses a lot. Speed, dribbling, crossing and the fitness to run the whole flank.', weights: wideMid },
  AMC: {
    label: 'Attacking Midfielder',
    description: 'The playmaker between the lines. Creativity, passing and dribbling create chances; shooting adds goals from range.',
    weights: {
      tackling: 0, marking: 0, positioning: 1, heading: 0, bravery: 1,
      passing: 3, dribbling: 3, crossing: 1, shooting: 3, finishing: 2,
      speed: 2, strength: 1, fitness: 2, aggression: 0, creativity: 3,
    },
  },
  AML: { label: 'Left Winger', description: 'High and wide chance creator. Speed and dribbling beat the fullback; crossing and finishing convert the advantage.', weights: winger },
  AMR: { label: 'Right Winger', description: 'High and wide chance creator. Speed and dribbling beat the fullback; crossing and finishing convert the advantage.', weights: winger },
  ST: {
    label: 'Striker',
    description: 'Scores. Finishing, shooting, positioning and heading turn chances into goals; speed and strength win the space.',
    weights: {
      tackling: 0, marking: 0, positioning: 3, heading: 3, bravery: 2,
      passing: 1, dribbling: 2, crossing: 0, shooting: 3, finishing: 3,
      speed: 3, strength: 2, fitness: 2, aggression: 1, creativity: 1,
    },
  },
};
