// parsePlayerText: turning noisy OCR output into a player draft.
import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePlayerText } from '../js/logic/ocr.js';

const CLEAN_PROFILE = `
Marco Rossi
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
