// Formation encyclopedia. Coordinates are % of pitch width (x) and length (y),
// rendered with your own goal at the bottom (y=100) attacking upward.
// `counters` = formations that beat this one (ordered, best first).
// `settings` = recommended orientation when YOU play the formation.

function P(pos, x, y) { return { pos, x, y }; }

export const FORMATIONS = [
  {
    id: '4-4-2',
    metaRating: 7,
    name: '4-4-2 Classic',
    shape: [
      P('GK', 50, 93),
      P('DL', 15, 76), P('DC', 38, 78), P('DC', 62, 78), P('DR', 85, 76),
      P('ML', 15, 50), P('MC', 38, 52), P('MC', 62, 52), P('MR', 85, 50),
      P('ST', 38, 22), P('ST', 62, 22),
    ],
    style: 'The balanced default. Two banks of four, width on both sides, two strikers to share goals.',
    strengths: [
      'No obvious weak zone — hard to overload anywhere.',
      'Natural width from ML/MR feeds two strikers.',
      'Simple to staff: no exotic positions needed.',
    ],
    weaknesses: [
      'Two central midfielders can be outnumbered by 3-man (or diamond) midfields.',
      'No natural playmaker between the lines — an unmarked opposing AMC hurts it.',
    ],
    counters: [
      { id: '4-1-2-1-2', why: 'The diamond puts 4 central players against your 2 MCs and its AMC operates in the pocket nobody marks.' },
      { id: '4-5-1-v', why: 'Three MCs win the centre while the wingers pin your fullbacks.' },
      { id: '4-2-3-1', why: 'The AMC trio floats between your lines; two holding MCs blunt your strikers.' },
    ],
    settings: {
      mentality: 'Normal', focus: 'Down Both Flanks', pressing: 'Own Half',
      tackling: 'Normal', passing: 'Mixed', marking: 'Zonal',
      counterAttack: 'On when opponent is stronger', offsideTrap: 'Off',
      arrows: 'Red (defensive) arrows on ML/MR if you need extra flank cover; blue on one ST vs deep blocks.',
    },
  },
  {
    id: '4-1-2-1-2',
    metaRating: 9,
    name: '4-1-2-1-2 Narrow Diamond',
    shape: [
      P('GK', 50, 93),
      P('DL', 15, 76), P('DC', 38, 78), P('DC', 62, 78), P('DR', 85, 76),
      P('DMC', 50, 63),
      P('MC', 32, 50), P('MC', 68, 50),
      P('AMC', 50, 36),
      P('ST', 38, 20), P('ST', 62, 20),
    ],
    style: 'The classic Top Eleven power formation: total control of the centre, AMC feeding two strikers.',
    strengths: [
      'Four central midfielders dominate possession through the middle.',
      'DMC screens the defence; AMC creates constantly.',
      'Two strikers plus AMC generate the most central chances of any shape.',
    ],
    weaknesses: [
      'Zero natural width — fullbacks are alone on the flanks.',
      'Vulnerable to fast wingers and teams focusing play down both flanks.',
    ],
    counters: [
      { id: '4-4-2', why: 'Focus down both flanks: ML/MR attack the space the diamond leaves empty and out-cross it.' },
      { id: '4-5-1-v', why: 'Wingers exploit the empty flanks while three MCs avoid losing the centre outright.' },
      { id: '4-2-3-1', why: 'Wide AMs pin the lonely fullbacks; double pivot handles the two strikers.' },
    ],
    settings: {
      mentality: 'Normal or Attacking', focus: 'Through the Middle', pressing: 'Own Half',
      tackling: 'Normal', passing: 'Short', marking: 'Zonal',
      counterAttack: 'Off (you want possession)', offsideTrap: 'Off',
      arrows: 'Blue (attacking) arrows on both fullbacks to fake width when the opponent sits deep.',
    },
  },
  {
    id: '4-5-1-v',
    metaRating: 8.5,
    name: '4-5-1 V-Style',
    shape: [
      P('GK', 50, 93),
      P('DL', 15, 76), P('DC', 38, 78), P('DC', 62, 78), P('DR', 85, 76),
      P('MC', 30, 54), P('MC', 50, 56), P('MC', 70, 54),
      P('AML', 18, 34), P('AMR', 82, 34),
      P('ST', 50, 18),
    ],
    style: 'A Top Eleven community favourite: three MCs form the base of the V, two high wingers and a lone striker finish it.',
    strengths: [
      'Wins midfield 3v2 against 4-4-2 style shapes.',
      'Wingers provide both width and goals — the ST is rarely isolated.',
      'Flexible: turns into 4-3-3 in attack, 4-5-1 in defence.',
    ],
    weaknesses: [
      'Lone striker struggles against three centre backs.',
      'AML/AMR give little defensive cover — quick fullback overlaps hurt it.',
      'Gap between the MC line and front three if mentality is too defensive.',
    ],
    counters: [
      { id: '3-5-2', why: 'Three DCs swallow the lone ST while wingbacks push into the space behind the AMs.' },
      { id: '4-1-4-1', why: 'The DMC cuts the supply into the V and flat mid four blocks the wingers.' },
      { id: '5-3-2', why: 'Five at the back nullify the front three; two STs isolate the remaining CBs on the break.' },
    ],
    settings: {
      mentality: 'Normal', focus: 'Down Both Flanks', pressing: 'Own Half',
      tackling: 'Normal', passing: 'Mixed', marking: 'Zonal',
      counterAttack: 'On', offsideTrap: 'Off',
      arrows: 'Red arrows on AML/AMR when protecting a lead; blue arrow on the middle MC to add a runner.',
    },
  },
  {
    id: '4-3-2-1',
    metaRating: 8,
    name: '4-3-2-1 Christmas Tree',
    shape: [
      P('GK', 50, 93),
      P('DL', 15, 76), P('DC', 38, 78), P('DC', 62, 78), P('DR', 85, 76),
      P('MC', 30, 54), P('MC', 50, 56), P('MC', 70, 54),
      P('AMC', 38, 36), P('AMC', 62, 36),
      P('ST', 50, 18),
    ],
    style: 'Narrow, technical, possession-heavy. Two AMCs float behind a lone striker.',
    strengths: [
      'Five central midfielders: overwhelming control through the middle.',
      'Two AMCs are very hard to mark for flat back fours.',
      'Excellent for short-passing, high-quality squads.',
    ],
    weaknesses: [
      'Even narrower than the diamond — flanks completely open.',
      'Needs elite AMCs: mediocre ones make it toothless.',
    ],
    counters: [
      { id: '4-4-2', why: 'Both flanks are free motorways — focus passing wide and whip crosses at the two STs.' },
      { id: '3-5-2', why: 'Wide midfielders own the empty flanks and three DCs blot out the lone striker.' },
      { id: '4-2-3-1', why: 'Wide AMs punish the fullbacks while the double pivot marks the AMC pair.' },
    ],
    settings: {
      mentality: 'Normal', focus: 'Through the Middle', pressing: 'Own Half',
      tackling: 'Normal', passing: 'Short', marking: 'Zonal',
      counterAttack: 'Off', offsideTrap: 'Off',
      arrows: 'Blue arrows on both fullbacks are near-mandatory for width.',
    },
  },
  {
    id: '4-2-3-1',
    metaRating: 9,
    name: '4-2-3-1',
    shape: [
      P('GK', 50, 93),
      P('DL', 15, 76), P('DC', 38, 78), P('DC', 62, 78), P('DR', 85, 76),
      P('MC', 38, 58), P('MC', 62, 58),
      P('AML', 18, 38), P('AMC', 50, 38), P('AMR', 82, 38),
      P('ST', 50, 18),
    ],
    style: 'The modern all-rounder: double pivot, creative trio, lone striker. Strong in every phase.',
    strengths: [
      'Balanced width AND central presence — few bad matchups.',
      'AMC between the lines plus two wingers creates from everywhere.',
      'Double pivot gives real defensive stability for an attacking shape.',
    ],
    weaknesses: [
      'Lone ST can be isolated against three centre backs.',
      'The two MCs can be overrun by a diamond or Christmas tree in the centre.',
    ],
    counters: [
      { id: '4-1-2-1-2', why: 'Four central mids against the double pivot; diamond wins the middle before the trio can create.' },
      { id: '3-5-2', why: 'Back three handles the lone ST; five midfielders squeeze the AM line.' },
      { id: '4-3-2-1', why: 'Five central players suffocate the pivot and the AMC.' },
    ],
    settings: {
      mentality: 'Normal', focus: 'Mixed', pressing: 'Own Half',
      tackling: 'Normal', passing: 'Short', marking: 'Zonal',
      counterAttack: 'On against stronger teams', offsideTrap: 'Off',
      arrows: 'Red arrow on one MC (make it a true DMC); blue arrows on AML/AMR when chasing.',
    },
  },
  {
    id: '4-4-1-1',
    metaRating: 6.5,
    name: '4-4-1-1',
    shape: [
      P('GK', 50, 93),
      P('DL', 15, 76), P('DC', 38, 78), P('DC', 62, 78), P('DR', 85, 76),
      P('ML', 15, 52), P('MC', 38, 54), P('MC', 62, 54), P('MR', 85, 52),
      P('AMC', 50, 34),
      P('ST', 50, 16),
    ],
    style: '4-4-2 with the second striker dropped into the hole. Solid and sneaky-creative.',
    strengths: [
      'Keeps 4-4-2 solidity while adding a playmaker between the lines.',
      'AMC + ST partnership is excellent for counter-attacks.',
    ],
    weaknesses: [
      'Still only two central midfielders — diamonds outnumber it.',
      'Lone ST needs the AMC to arrive, or attacks fizzle out.',
    ],
    counters: [
      { id: '4-1-2-1-2', why: 'Central overload, and the DMC erases the AMC — the shape\'s only creative outlet.' },
      { id: '4-1-4-1', why: 'DMC man-marks the hole player; flat five matches the mid four.' },
      { id: '4-3-2-1', why: 'Five central players against two; the AMCs attack the space beside the MC pair.' },
    ],
    settings: {
      mentality: 'Normal', focus: 'Mixed', pressing: 'Own Half',
      tackling: 'Normal', passing: 'Mixed', marking: 'Zonal',
      counterAttack: 'On', offsideTrap: 'Off',
      arrows: 'Blue arrow on the AMC to make him a second striker against weak defences.',
    },
  },
  {
    id: '3-5-2',
    metaRating: 7,
    name: '3-5-2 (3-4-1-2)',
    shape: [
      P('GK', 50, 93),
      P('DC', 28, 78), P('DC', 50, 80), P('DC', 72, 78),
      P('ML', 12, 50), P('MC', 38, 54), P('MC', 62, 54), P('MR', 88, 50),
      P('AMC', 50, 36),
      P('ST', 38, 18), P('ST', 62, 18),
    ],
    style: 'Back three, wingbacks doing both jobs, playmaker feeding a strike pair.',
    strengths: [
      'Three DCs dominate lone-striker formations.',
      'Five in midfield with genuine width from ML/MR.',
      'Two strikers plus AMC — heavy firepower.',
    ],
    weaknesses: [
      'ML/MR must cover entire flanks; fast wingers pinning them exposes the back three wide.',
      'Channels beside the outer DCs are soft against wide strikers and overlapping fullbacks.',
    ],
    counters: [
      { id: '4-5-1-v', why: 'AML/AMR attack the space behind the wingbacks where the back three hates defending.' },
      { id: '4-2-3-1', why: 'Wide AMs pin the wingbacks back, turning it into a 5-3-2 with no outlet.' },
      { id: '3-4-3', why: 'Three forwards stretch the back three across the full width.' },
    ],
    settings: {
      mentality: 'Normal', focus: 'Mixed', pressing: 'Own Half',
      tackling: 'Normal', passing: 'Mixed', marking: 'Zonal',
      counterAttack: 'On', offsideTrap: 'Consider — the back three steps well together',
      arrows: 'Red arrows on ML/MR against teams with wingers; blue if the opponent is narrow.',
    },
  },
  {
    id: '3-4-3',
    metaRating: 6,
    name: '3-4-3',
    shape: [
      P('GK', 50, 93),
      P('DC', 28, 78), P('DC', 50, 80), P('DC', 72, 78),
      P('ML', 12, 52), P('MC', 38, 54), P('MC', 62, 54), P('MR', 88, 52),
      P('AML', 20, 26), P('AMR', 80, 26),
      P('ST', 50, 16),
    ],
    style: 'All-out width and pressure: front three plus wingbacks camp in the opposition half.',
    strengths: [
      'Five attackers in the final third — overwhelming against passive teams.',
      'Stretches back fours horizontally until gaps appear.',
    ],
    weaknesses: [
      'Only three defenders and two MCs behind the ball — brutal on the counter.',
      'Needs superior squad quality; as an underdog shape it leaks goals.',
    ],
    counters: [
      { id: '4-4-2', why: 'Counter-attack football: absorb, then hit the acres behind the wingbacks with two quick STs.' },
      { id: '5-3-2', why: 'Five defenders absorb the front three; long balls release the strike pair 2v2.' },
      { id: '4-1-4-1', why: 'Compact block denies space, DMC plugs the middle, then break wide.' },
    ],
    settings: {
      mentality: 'Attacking', focus: 'Down Both Flanks', pressing: 'Whole Pitch',
      tackling: 'Normal', passing: 'Mixed', marking: 'Zonal',
      counterAttack: 'Off', offsideTrap: 'On with fast DCs',
      arrows: 'Only use when clearly stronger. Red arrows on ML/MR restore some sanity defensively.',
    },
  },
  {
    id: '5-2-2-1',
    metaRating: 5.5,
    name: '5-2-2-1',
    shape: [
      P('GK', 50, 93),
      P('DL', 10, 74), P('DC', 30, 79), P('DC', 50, 81), P('DC', 70, 79), P('DR', 90, 74),
      P('MC', 38, 56), P('MC', 62, 56),
      P('AML', 22, 36), P('AMR', 78, 36),
      P('ST', 50, 16),
    ],
    style: 'The underdog special: five at the back, two outlets wide, one runner up top.',
    strengths: [
      'Extremely hard to break down — five defenders plus two MCs behind the ball.',
      'AML/AMR make counters genuinely dangerous, not just hopeful.',
    ],
    weaknesses: [
      'Concedes possession and territory by design.',
      'If the ST is weak, the team creates almost nothing.',
    ],
    counters: [
      { id: '4-1-2-1-2', why: 'Patient central overload plus long shots — the bus has no midfield to stop either.' },
      { id: '4-3-2-1', why: 'Five technical mids pass around the low block and the AMCs find pockets at the edge of the box.' },
      { id: '4-2-3-1', why: 'Sustained pressure from every angle; double pivot kills the counters at source.' },
    ],
    settings: {
      mentality: 'Defensive', focus: 'Mixed', pressing: 'Own Half',
      tackling: 'Normal', passing: 'Long', marking: 'Zonal',
      counterAttack: 'On — it is the whole plan', offsideTrap: 'Off',
      arrows: 'Blue arrows on AML/AMR so counters have numbers; red on both MCs.',
    },
  },
  {
    id: '5-3-2',
    metaRating: 5,
    name: '5-3-2',
    shape: [
      P('GK', 50, 93),
      P('DL', 10, 74), P('DC', 30, 79), P('DC', 50, 81), P('DC', 70, 79), P('DR', 90, 74),
      P('MC', 30, 54), P('MC', 50, 56), P('MC', 70, 54),
      P('ST', 38, 20), P('ST', 62, 20),
    ],
    style: 'Defensive but honest: back five, working midfield three, proper strike pair.',
    strengths: [
      'Solid centre AND numbers at the back; strike pair keeps defenders honest.',
      'Great against front threes — three DCs take the ST/wingers, fullbacks push up.',
    ],
    weaknesses: [
      'No wide midfielders: crosses keep coming in from unopposed flanks.',
      'Midfield three must be fit — they cover enormous ground.',
    ],
    counters: [
      { id: '4-4-2', why: 'Unchallenged ML/MR deliver cross after cross; the back five is stretched side to side.' },
      { id: '4-5-1-v', why: 'Wingers occupy the fullbacks, midfield three gets outpassed 3v3 with an extra man high.' },
      { id: '4-2-3-1', why: 'Width plus an AMC in the pocket between the lines.' },
    ],
    settings: {
      mentality: 'Defensive or Normal', focus: 'Through the Middle', pressing: 'Own Half',
      tackling: 'Normal', passing: 'Mixed', marking: 'Zonal',
      counterAttack: 'On', offsideTrap: 'Off',
      arrows: 'Blue arrows on DL/DR turn it into 3-5-2 when you have the ball.',
    },
  },
  {
    id: '4-2-2-2',
    metaRating: 7.5,
    name: '4-2-2-2 Brazilian Box',
    shape: [
      P('GK', 50, 93),
      P('DL', 15, 76), P('DC', 38, 78), P('DC', 62, 78), P('DR', 85, 76),
      P('MC', 38, 58), P('MC', 62, 58),
      P('AMC', 38, 38), P('AMC', 62, 38),
      P('ST', 38, 18), P('ST', 62, 18),
    ],
    style: 'The box midfield: two holders, two creators, two finishers. Devastating centrally.',
    strengths: [
      'Two AMCs and two STs make four central attackers — chance volume is huge.',
      'The MC pair protects against counters better than a diamond.',
    ],
    weaknesses: [
      'No width at all: everything must come through congested central lanes.',
      'Fullbacks exposed exactly like the diamond.',
    ],
    counters: [
      { id: '4-4-2', why: 'Classic answer to narrow shapes — flank focus and crosses.' },
      { id: '4-5-1-v', why: 'Wingers punish the naked fullbacks while three MCs contest the box midfield.' },
      { id: '4-1-4-1', why: 'DMC plus flat four congest the middle where all its play lives.' },
    ],
    settings: {
      mentality: 'Normal', focus: 'Through the Middle', pressing: 'Own Half',
      tackling: 'Normal', passing: 'Short', marking: 'Zonal',
      counterAttack: 'Off', offsideTrap: 'Off',
      arrows: 'Blue arrows on both fullbacks for width, red on both MCs for cover.',
    },
  },
  {
    id: '4-1-4-1',
    metaRating: 6.5,
    name: '4-1-4-1',
    shape: [
      P('GK', 50, 93),
      P('DL', 15, 76), P('DC', 38, 78), P('DC', 62, 78), P('DR', 85, 76),
      P('DMC', 50, 64),
      P('ML', 15, 48), P('MC', 38, 50), P('MC', 62, 50), P('MR', 85, 48),
      P('ST', 50, 18),
    ],
    style: 'The anti-playmaker shape: a DMC eats the opposing AMC, flat four gives width and cover.',
    strengths: [
      'DMC neutralises AMC-based formations (4-2-3-1, 4-4-1-1, diamond).',
      'Compact between the lines and wide cover on both sides.',
    ],
    weaknesses: [
      'Lone striker with modest support — low chance volume.',
      'Passive against two-striker shapes; the DMC has nobody to mark.',
    ],
    counters: [
      { id: '4-4-2', why: 'Two STs occupy both DCs and the DMC marks a ghost — width does the rest.' },
      { id: '3-5-2', why: 'Strike pair plus midfield numbers; the DMC is redundant.' },
      { id: '4-2-2-2', why: 'Two AMCs give the lone DMC an impossible choice.' },
    ],
    settings: {
      mentality: 'Normal', focus: 'Mixed', pressing: 'Own Half',
      tackling: 'Normal', passing: 'Mixed', marking: 'Man-to-Man on their AMC',
      counterAttack: 'On', offsideTrap: 'Off',
      arrows: 'Blue arrows on ML/MR so the striker isn\'t alone.',
    },
  },
  {
    id: 'butterfly',
    metaRating: 7,
    name: '3-2-2-2-1 Butterfly',
    shape: [
      P('GK', 50, 93),
      P('DC', 28, 79), P('DC', 50, 81), P('DC', 72, 79),
      P('DMC', 38, 64), P('DMC', 62, 64),
      P('MC', 38, 48), P('MC', 62, 48),
      P('AMC', 38, 33), P('AMC', 62, 33),
      P('ST', 50, 15),
    ],
    style: 'The infamous Top Eleven "butterfly": a solid central spine stacked from box to box.',
    strengths: [
      'Nearly unbeatable through the middle — three banks of central pairs.',
      'Double DMC wall in front of three DCs frustrates most attacks.',
    ],
    weaknesses: [
      'The most extreme no-width formation in the game.',
      'Relentless flank play and crosses eventually break it.',
    ],
    counters: [
      { id: '4-4-2', why: 'Focus down both flanks — every cross attacks the zone the butterfly cannot defend.' },
      { id: '4-5-1-v', why: 'High wingers vs three DCs with no fullbacks: constant 1v1s wide.' },
      { id: '3-4-3', why: 'Maximum width and a front three stretch the spine until it snaps.' },
    ],
    settings: {
      mentality: 'Normal', focus: 'Through the Middle', pressing: 'Own Half',
      tackling: 'Normal', passing: 'Short', marking: 'Zonal',
      counterAttack: 'On', offsideTrap: 'Off',
      arrows: 'Blue arrows on the outer DCs are risky; better to accept the trade-off it makes.',
    },
  },
];

export function getFormation(id) {
  return FORMATIONS.find((f) => f.id === id) || null;
}

// Full list of Top Eleven orientation settings, for reference UI.
export const ORIENTATION_REFERENCE = [
  {
    setting: 'Team Mentality',
    options: 'Hard Defending · Defensive · Normal · Attacking · Hard Attacking',
    advice: 'Match it to squad quality gap: stronger team → Normal/Attacking; clear underdog → Defensive + counters. Hard Attacking only vs much weaker teams or when chasing late — it strips your defensive shape.',
  },
  {
    setting: 'Focus Passing',
    options: 'Down Both Flanks · Down Left Flank · Down Right Flank · Through the Middle · Mixed',
    advice: 'Attack where the opponent has no players: flanks vs narrow shapes (diamond, box, butterfly), middle vs flat 4-4-2s with weak MCs. Single-flank focus targets their weakest fullback.',
  },
  {
    setting: 'Pressing Style',
    options: 'Own Half · Whole Pitch',
    advice: 'Whole-pitch pressing drains condition fast and needs high fitness — use it when stronger or vs low quality passers. Default to Own Half.',
  },
  {
    setting: 'Tackling Style',
    options: 'Easy · Normal · Hard',
    advice: 'Hard tackling wins the ball more but stacks cards and injuries, especially with high-aggression squads. Use vs technical teams; drop to Normal when a player is booked.',
  },
  {
    setting: 'Passing Style',
    options: 'Short · Long · Mixed',
    advice: 'Short suits high-quality, creative midfields; Long suits counter-attacking and physical strikers. When your midfield is outmatched, Long over the press works.',
  },
  {
    setting: 'Marking Style',
    options: 'Zonal · Man-to-Man',
    advice: 'Zonal is the safe default. Man-to-Man vs a single dangerous playmaker (AMC) or when you clearly out-quality the opponent.',
  },
  {
    setting: 'Force Counterattacks',
    options: 'On · Off',
    advice: 'On when defending deep or against attacking mentalities — your fast forwards exploit the space. Off when you dominate possession (it just rushes your build-up).',
  },
  {
    setting: 'Play Offside Trap',
    options: 'On · Off',
    advice: 'Only with fast, well-drilled DCs on a high line. Risky vs speedy strikers and long-ball teams.',
  },
  {
    setting: 'Player Arrows',
    options: 'Red (defensive) · Blue (attacking)',
    advice: 'Arrows shift a player\'s effective position. Blue on fullbacks adds width to narrow shapes; red on wingers protects a lead. Never arrow your whole team one way — you lose the shape\'s balance.',
  },
];
