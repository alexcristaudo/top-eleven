// parsePlayerText: turning noisy OCR output into a player draft.
import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePlayerText, mergeSightings, planSquadChanges, sameName } from '../js/logic/ocr.js';

const CLEAN_PROFILE = `
Marco Rossi
ST
Age 19    Quality 84%
DEFENCE
Tackling 41
Marking 39
Positioning 82
Heading 63
Bravery 71
ATTACK
Passing 78
Dribbling 85
Crossing 52
Shooting 91
Finishing 88
PHYSICAL & MENTAL
Speed 90
Strength 69
Fitness 80
Aggression 55
Creativity 74
`;

test('parses a clean player profile completely', () => {
  const r = parsePlayerText(CLEAN_PROFILE);
  assert.equal(r.found, 15);
  assert.equal(r.attrs.tackling, 41);
  assert.equal(r.attrs.finishing, 88);
  assert.equal(r.attrs.creativity, 74);
  assert.equal(r.age, 19);
  assert.equal(r.quality, 84);
  assert.equal(r.name, 'Marco Rossi');
  assert.equal(r.position, 'ST');
});

test('tolerates OCR-mangled labels and mixed separators', () => {
  const r = parsePlayerText(`
    Tackl1ng: 45
    Markinq 50
    Posit1oning - 60
    Head1ng 70
    Braverv 30
  `.replace(/1/g, 'i')); // simulate partial cleanup; stems still must match
  assert.ok(r.attrs.tackling === 45);
  assert.ok(r.attrs.positioning === 60);
  assert.ok(r.attrs.heading === 70);
});

test('quality falls back to attribute average when no % is present', () => {
  const noQuality = CLEAN_PROFILE.replace('Age 19    Quality 84%', 'Age 19');
  const r = parsePlayerText(noQuality);
  assert.equal(r.quality, Math.round((41 + 39 + 82 + 63 + 71 + 78 + 85 + 52 + 91 + 88 + 90 + 69 + 80 + 55 + 74) / 15));
});

test('does not mistake attribute-line numbers for quality, or UI text for a name', () => {
  const r = parsePlayerText('PLAYER PROFILE\nTackling 88%\nSpeed 90');
  assert.equal(r.quality, null);
  assert.equal(r.name, null);
  assert.equal(r.attrs.tackling, 88);
});

test('handles garbage input gracefully', () => {
  const r = parsePlayerText('%%% ??? \n\n 12');
  assert.equal(r.found, 0);
  assert.equal(r.age, null);
  assert.deepEqual(r.attrs, {});
});

test('ignores implausible ages and out-of-range values', () => {
  const r = parsePlayerText('Age 99\nTackling 999');
  assert.equal(r.age, null);
  assert.equal(r.attrs.tackling, undefined);
});

// Raw OCR text captured from a real iPhone recording of the game's Skills tab
// (three-column layout, "OVR" misread as "or", accented name with junk edges).
const REAL_SKILLS_TAB = `EY
[/] i AC 5
A «8 cipriano Cuscuna x
( or 67 Sokokok 1 a
1 |B Age: 32 ® Roles:
| # | Team: Alexander FC Special ability: [YO + |
| [CJ DEFENCE 74 [BJ ATTACK 61 [CJ PHYSICAL 66
Skills Tackling 69 Passing 55 Fitness 83
= Marking 80  Dribbling 70 Strength 48
- Positioning 82 Crossing 70 Aggression 67
Heading 62 Shooting 63 Speed 82
Bravery 75 Finishing 49 Creativity 52
Key attributes for this player are highlighted. Train or tier up the player
to improve them further. )`;

test('parses the real in-game Skills tab layout (three columns, OVR, accents)', () => {
  const r = parsePlayerText(REAL_SKILLS_TAB);
  assert.equal(r.found, 15);
  assert.equal(r.attrs.tackling, 69); // must NOT match the "ATTACK 61" header
  assert.equal(r.attrs.speed, 82);
  assert.equal(r.attrs.fitness, 83);
  assert.equal(r.attrs.creativity, 52);
  assert.equal(r.quality, 67); // from "or 67" (mangled OVR), not group averages
  assert.equal(r.age, 32);
  assert.equal(r.name, 'Cipriano Cuscuna');
});

// Real goalkeeper Skills tab (Matteo Ceravolo) — a completely different skill
// set from outfield players: Goalkeeping replaces Defence + Attack.
const REAL_GK_SKILLS = `Matteo Ceravolo
OVR 89
Age: 22   Roles: GK
Team: Alexander FC   Special ability:
GOALKEEPING 98   PHYSICAL 72
Reflexes 96   Throwing 83   Fitness 96
Agility 105   Kicking 92   Strength 53
Anticipation 91   Punching 102   Aggression 75
Rushing out 122   Aerial reach 91   Speed 73
Communication 106   Concentration 94   Creativity 61`;

test('parses a goalkeeper profile with the goalkeeping skill set', () => {
  const r = parsePlayerText(REAL_GK_SKILLS);
  assert.equal(r.position, 'GK');
  assert.equal(r.attrs.reflexes, 96);
  assert.equal(r.attrs.agility, 105);
  assert.equal(r.attrs.rushingOut, 122);
  assert.equal(r.attrs.punching, 102);
  assert.equal(r.attrs.aerialReach, 91);
  assert.equal(r.attrs.communication, 106);
  assert.equal(r.attrs.concentration, 94);
  assert.equal(r.attrs.fitness, 96);
  assert.equal(r.attrs.speed, 73);
  assert.equal(r.found, 15); // 10 goalkeeping + 5 physical
  assert.equal(r.quality, 89);
  assert.equal(r.age, 22);
  assert.equal(r.name, 'Matteo Ceravolo');
  // Must NOT have picked up outfield attributes.
  assert.equal(r.attrs.tackling, undefined);
  assert.equal(r.attrs.shooting, undefined);
});

test('parses the special ability from the profile header', () => {
  const r = parsePlayerText('Marco Rossi\nAge: 19\nSpecial ability: Free kick specialist\nTackling 40');
  assert.equal(r.specialAbility, 'free kick specialist');
  const none = parsePlayerText('Marco Rossi\nSpecial ability: None');
  assert.equal(none.specialAbility, null);
});

test('real Overview tab: header info without skills, condition % ignored', () => {
  const r = parsePlayerText(`e —
“+ cipriano Cuscuna x
( ovr 67 oko 1 a
1 | Age: 32 ® Roles:
Weight: 78 kg Height: 182 cm Foot
INJURIES MORALE CONDITION
Very good 79%
Your player is fully fit.`);
  assert.equal(r.found, 0);
  assert.equal(r.name, 'Cipriano Cuscuna');
  assert.equal(r.quality, 67); // OVR, not the 79% condition meter
  assert.equal(r.age, 32);
});

test('mergeSightings: an Overview header frame donates its name to the following skills frame', () => {
  const header = parsePlayerText('cipriano Cuscuna x\novr 67\nAge: 32');
  const skills = parsePlayerText(REAL_SKILLS_TAB.replace('A «8 cipriano Cuscuna x\n', ''));
  assert.equal(header.found, 0);
  assert.equal(skills.name, null);
  const merged = mergeSightings([header, skills]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].name, 'Cipriano Cuscuna');
  assert.equal(merged[0].found, 15);
});

// ---------- Recording: sighting merge + squad diff ----------

const P1 = parsePlayerText(CLEAN_PROFILE);
const P1_PARTIAL = parsePlayerText(CLEAN_PROFILE.replace('Finishing 88\n', '').replace('Marco Rossi\n', ''));
const P2 = parsePlayerText(CLEAN_PROFILE
  .replace('Marco Rossi', 'John Smith')
  .replace(/Tackling 41/, 'Tackling 90')
  .replace(/Shooting 91/, 'Shooting 40')
  .replace(/Speed 90/, 'Speed 55')
  .replace(/Dribbling 85/, 'Dribbling 30')
  .replace(/Finishing 88/, 'Finishing 21'));

test('mergeSightings: groups repeat frames of the same player, keeps distinct players apart', () => {
  const merged = mergeSightings([P1, P1_PARTIAL, P2, { attrs: {}, found: 0 }]);
  assert.equal(merged.length, 2);
  const rossi = merged.find((m) => m.name === 'Marco Rossi');
  assert.equal(rossi.sightings, 2);
  assert.equal(rossi.found, 15); // partial frame filled by the full one
  assert.equal(merged.find((m) => m.name === 'John Smith').sightings, 1);
});

test('mergeSightings: drops frames below the minimum data threshold', () => {
  const merged = mergeSightings([{ attrs: { speed: 90 }, found: 1, name: null }]);
  assert.equal(merged.length, 0);
});

// Name variants taken from a real user import that produced duplicates.
test('sameName: matches OCR junk-token and accent variants, rejects different players', () => {
  assert.ok(sameName('Raoul Konyuy', 'Ili Raoul Konyuy'));      // junk prefix token
  assert.ok(sameName('Eder Cuesta', 'Eder Cuesta Nr'));         // junk suffix token
  assert.ok(sameName('Cipriano Cuscunà', 'cipriano Cuscuna'));  // accent + case
  assert.ok(sameName('Enrico Lago', 'Enrico Lago'));
  assert.ok(sameName('Enrico Lago', 'Enrico Lagos'));           // 1-char misread
  assert.ok(!sameName('Enrico Lago', 'Pavel Beres'));
  assert.ok(!sameName('Raoul Konyuy', 'Eder Cuesta'));
  assert.ok(!sameName('', 'Eder Cuesta'));
});

test('mergeSightings: folds name-variant entries in a final dedupe pass', () => {
  // Same player: full read, then a partial read with junk-token name and a
  // couple of misread digits (mirrors the real duplicate squad export).
  const full = { name: 'Raoul Konyuy', age: 26, quality: 103, position: 'MC', found: 15,
    attrs: { tackling: 60, marking: 55, positioning: 70, heading: 50, bravery: 65, passing: 90, dribbling: 85, crossing: 70, shooting: 80, finishing: 75, speed: 88, strength: 72, fitness: 91, aggression: 60, creativity: 95 } };
  const partial = { name: 'Ili Raoul Konyuy', age: 26, quality: 103, position: null, found: 12,
    attrs: { tackling: 60, marking: 55, positioning: 70, heading: 50, bravery: 65, passing: 90, dribbling: 85, crossing: 70, shooting: 30, finishing: 75, speed: 88, strength: 72 } };
  const other = { name: 'Pavel Beres', age: 25, quality: 102, position: 'MC', found: 15,
    attrs: { tackling: 70, marking: 65, positioning: 60, heading: 55, bravery: 60, passing: 85, dribbling: 80, crossing: 60, shooting: 75, finishing: 70, speed: 80, strength: 78, fitness: 88, aggression: 65, creativity: 90 } };
  const merged = mergeSightings([full, partial, other]);
  assert.equal(merged.length, 2);
  const konyuy = merged.find((m) => m.name === 'Raoul Konyuy'); // cleaner variant kept
  assert.ok(konyuy, `expected clean name, got ${merged.map((m) => m.name)}`);
  assert.equal(konyuy.sightings, 2);
});

test('planSquadChanges: fuzzy name match updates instead of duplicating', () => {
  const existing = [{ id: 'x', name: 'Eder Cuesta', position: 'MC', age: 18, quality: 109, attrs: { passing: 80 } }];
  const plan = planSquadChanges(existing, [
    { name: 'Eder Cuesta Nr', age: 18, quality: 110, attrs: { passing: 82 }, found: 12, sightings: 1 },
  ]);
  assert.equal(plan[0].type, 'update');
  assert.equal(plan[0].player.id, 'x');
});

test('planSquadChanges: classifies add / update / unchanged with field diffs', () => {
  const existing = [{
    id: 'x', name: 'marco rossi', position: 'ST', age: 19, quality: 80,
    attrs: { ...P1.attrs, shooting: 85 },
  }];
  const plan = planSquadChanges(existing, mergeSightings([P1, P2]));
  const rossi = plan.find((p) => p.sighting.name === 'Marco Rossi');
  assert.equal(rossi.type, 'update');
  assert.equal(rossi.changes.quality, 84);
  assert.equal(rossi.changes.attrs.shooting, 91);
  assert.equal(rossi.changes.age, undefined);
  const smith = plan.find((p) => p.sighting.name === 'John Smith');
  assert.equal(smith.type, 'add');
  // Identical sighting → unchanged.
  const same = planSquadChanges(
    [{ id: 'y', name: 'Marco Rossi', age: 19, quality: 84, attrs: P1.attrs }],
    mergeSightings([P1]),
  );
  assert.equal(same[0].type, 'unchanged');
});
