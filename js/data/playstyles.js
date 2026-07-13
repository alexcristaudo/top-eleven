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

  // ---- Goalkeeper playstyles (official: Sweeper Keeper / Box Commander / Ball-Playing GK) ----
  {
    id: 'sweeper-keeper',
    label: 'Sweeper Keeper',
    category: 'Goalkeeper',
    positions: ['GK'],
    description: 'Comfortable off his line, rushing out to intercept long balls — an 11th outfield player. Wants rushing out, anticipation and agility.',
    drills: ['gk-shot-stopping', 'def-positioning', 'aerial-defence'],
  },
  {
    id: 'box-commander',
    label: 'Box Commander',
    category: 'Goalkeeper',
    positions: ['GK'],
    description: 'Rules his box — presence and aerial command intimidate strikers and dominate crosses and corners. Wants aerial reach, punching and communication.',
    drills: ['aerial-defence', 'shot-blocking', 'gk-shot-stopping'],
  },
  {
    id: 'ball-playing-gk',
    label: 'Ball-Playing GK',
    category: 'Goalkeeper',
    positions: ['GK'],
    description: 'Starts attacks with the ball at his feet and a sharp throw — the first passer. Wants kicking, throwing and concentration.',
    drills: ['gk-shot-stopping', 'passing-circuit', 'def-positioning'],
  },
];

export function playstylesForPosition(pos) {
  return PLAYSTYLES.filter((s) => s.positions.includes(pos));
}

export function playstyleLabel(id) {
  const s = PLAYSTYLES.find((x) => x.id === id);
  return s ? s.label : id;
}

// OCR-tolerant patterns keyed on each playstyle's distinctive words. Ordered so
// the more specific pair-members are matched (and CONSUMED) before their
// siblings: Ball-Playing GK before Ball-Playing Defender, Box-to-Box before Box
// Commander. Patterns avoid attribute/header words — e.g. the "Positioning"
// attribute and the "GOALKEEPING" header never trigger a match.
const PLAYSTYLE_PATTERNS = [
  { id: 'ball-playing-gk',       re: /ba[l1]{2}[\s.-]*p[l1]ay\w*\s*(?:gk|keep|goal)/ },
  { id: 'ball-playing-defender', re: /ba[l1]{2}[\s.-]*p[l1]ay\w*\s*def/ },
  { id: 'box-to-box',            re: /box[\s.-]*to[\s.-]*box|\bb2b\b/ },
  { id: 'box-commander',         re: /box\s*command|\bcommander\b/ },
  { id: 'sweeper-keeper',        re: /sw[e3]{2}per/ },
  { id: 'attacking-fullback',    re: /attack\w*\s*fu[l1]{2}/ },
  { id: 'false-nine',            re: /fa[l1]se\s*(?:nine|9)/ },
  { id: 'target-man',            re: /targ[e3]t[\s.-]*man/ },
  { id: 'winger-playstyle',      re: /w[il1]ng[e3]r/ },
  { id: 'regista',               re: /r[e3]g[il1]sta/ },
  { id: 'poacher',               re: /p[o0]ach/ },
];

// Scan full OCR text for the playstyles named on it, in canonical order.
export function detectPlaystyles(text) {
  if (!text) return [];
  let t = String(text).toLowerCase();
  const ids = new Set();
  for (const { id, re } of PLAYSTYLE_PATTERNS) {
    const g = new RegExp(re.source, 'g');
    if (g.test(t)) {
      ids.add(id);
      t = t.replace(new RegExp(re.source, 'g'), ' '); // consume so a broader sibling can't re-match
    }
  }
  return PLAYSTYLES.filter((s) => ids.has(s.id)).map((s) => s.id);
}

// The playstyle level named on the screen, but only when exactly one level word
// is present — a "how to level up" list mentioning all three is ambiguous, so
// we return null rather than guess.
export function detectPlaystyleLevel(text) {
  const t = String(text || '').toLowerCase();
  const found = ['Master', 'Advanced', 'Basic'].filter((l) => new RegExp(`\\b${l.toLowerCase()}\\b`).test(t));
  return found.length === 1 ? found[0] : null;
}
