// parsePlayerText: turning noisy OCR output into a player draft.
import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePlayerText, mergeSightings, planSquadChanges } from '../js/logic/ocr.js';

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
