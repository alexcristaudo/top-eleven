// Screenshot import: local OCR (tesseract.js, bundled in vendor/) + parsing
// of Top Eleven player-profile text. Nothing leaves the device.
import { ATTR_KEYS, GK_ATTR_KEYS } from '../data/attributes.js';
import { POSITIONS } from '../data/roles.js';

// Fuzzy label stems — OCR often mangles word endings, so match on the start.
// Shared by outfield and GK parses.
const PHYSICAL_STEMS = {
  speed: /speed/i,
  strength: /streng/i,
  fitness: /fitnes/i,
  aggression: /aggress/i,
  creativity: /creativ/i,
};

const OUTFIELD_STEMS = {
  tackling: /tackl/i, // NOT /tack/: "ATTACK" contains "tack"
  marking: /marki/i,
  positioning: /positio/i,
  heading: /headi/i,
  bravery: /braver/i,
  passing: /passin/i,
  dribbling: /dribb/i,
  crossing: /crossi/i,
  shooting: /shooti/i,
  finishing: /finish/i,
  ...PHYSICAL_STEMS,
};

// Goalkeeper skill stems. "Rushing out"/"Aerial reach" are two words — match
// the distinctive first word. Avoid overlaps: "concentration" vs nothing,
// "anticipation" vs nothing.
const GK_STEMS = {
  reflexes: /reflex/i,
  agility: /agilit/i,
  anticipation: /anticip/i,
  rushingOut: /rush/i,
  communication: /communic/i,
  throwing: /throw/i,
  kicking: /kicki?n/i,
  punching: /punch/i,
  aerialReach: /aerial/i,
  concentration: /concentr/i,
  ...PHYSICAL_STEMS,
};

function numbersIn(line) {
  return [...line.matchAll(/\d{1,3}/g)]
    .map((m) => parseInt(m[0], 10))
    .filter((n) => n >= 1 && n <= 250);
}

// Parse raw OCR text from a player-profile screenshot into a player draft.
// Tolerant by design: returns whatever it could find plus a found-count so the
// UI can tell the user what still needs manual entry.
export function parsePlayerText(text) {
  const lines = String(text || '').split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const attrs = {};
  let age = null;
  let quality = null;
  let qualityOvr = null;
  let qualityPct = null;
  let name = null;
  let position = null;
  let specialAbility = null;

  const POS_RE = new RegExp(`(?:^|[^A-Z0-9])(${POSITIONS.join('|')})(?:[^A-Z0-9]|$)`);

  // Detect a goalkeeper profile up front: keepers have an entirely different
  // skill set (Goalkeeping replaces Defence+Attack), so we must use GK label
  // stems or nothing matches. Signals: the "Goalkeeping" header, a standalone
  // GK role, or GK-only skill words.
  const joined = lines.join(' ');
  const gkProfile = /goalkeep/i.test(joined)
    || /\bGK\b/.test(joined)
    || (/reflex/i.test(joined) && (/punch/i.test(joined) || /aerial/i.test(joined) || /rush/i.test(joined)));
  const STEMS = gkProfile ? GK_STEMS : OUTFIELD_STEMS;
  const keys = gkProfile ? GK_ATTR_KEYS : ATTR_KEYS;

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    // Attribute lines: label stem + a plausible number on the same line.
    for (const key of keys) {
      if (attrs[key] !== undefined) continue;
      const m = line.match(STEMS[key]);
      if (!m) continue;
      const after = numbersIn(line.slice(m.index));
      const anywhere = numbersIn(line);
      const val = after.length ? after[0] : anywhere[anywhere.length - 1];
      if (val !== undefined) attrs[key] = val;
    }

    // Age: "Age 19", "19 years", "Age: 19".
    if (age === null) {
      const m = line.match(/age\D{0,4}(\d{2})/i) || line.match(/\b(\d{2})\s*(?:years|yrs|y\.o)/i);
      if (m) {
        const v = parseInt(m[1], 10);
        if (v >= 16 && v <= 45) age = v;
      }
    }

    // Special ability from the profile header ("Special ability: Playmaker").
    if (specialAbility === null) {
      const m = line.match(/special\s*abilit\w*\W*([A-Za-z][A-Za-z' -]{2,30})/i);
      if (m) {
        const raw = m[1].trim().toLowerCase();
        if (!/^non?e?$/.test(raw)) specialAbility = raw;
      }
    }

    // Position: a standalone role code (uppercase to avoid prose matches).
    if (position === null) {
      const m = line.match(POS_RE);
      if (m) position = m[1];
    }

    // Quality: prefer the profile's "OVR 67" (no % in-game); OCR often mangles
    // the small OVR label ("or", "ove"), so accept variants near the top only.
    if (qualityOvr === null && li < 8) {
      const m = line.match(/\b(?:ovr|ove|or)\W{0,3}(\d{1,3})\b/i);
      if (m) {
        const v = parseInt(m[1], 10);
        if (v >= 1 && v <= 250) qualityOvr = v;
      }
    }
    if (qualityPct === null && !/condition/i.test(line) && !keys.some((k) => STEMS[k].test(line))) {
      const m = line.match(/(\d{1,3})\s*%/);
      if (m) {
        const v = parseInt(m[1], 10);
        if (v >= 1 && v <= 250) qualityPct = v;
      }
    }
  }
  quality = qualityOvr !== null ? qualityOvr : qualityPct;
  if (gkProfile && position === null) position = 'GK';

  // Name: a "Firstname Lastname"-shaped line near the top that isn't UI text.
  // Unicode-aware (Cuscunà, Müller, …); tolerates a stray shirt number.
  const UI_WORDS = /profile|player|skills|attack|defen[cs]e|physical|mental|value|contract|bid|quality|form|age|team|roles|overview|playstyle|stats|celebrat|trainer|injur|morale|condition|special|ability|squad|lineup|formation|tactic|tier|very|good|happy|weight|height|foot/i;
  // Tokenize, drop non-word junk at the edges (badges, the close button "x"),
  // accept a lowercase first letter (OCR often drops the capital) and
  // title-case the result.
  for (const line of lines.slice(0, 10)) {
    const words = line.split(/\s+/).filter((w) => /^[\p{L}'’.-]{2,}$/u.test(w));
    const letters = words.join('').length;
    // Real names are substantial; icon rows OCR into short junk like "MS Cpr".
    if (words.length >= 2 && words.length <= 4 && letters >= 8
      && words[0].length >= 3 && words.some((w) => w.length >= 4)) {
      const candidate = words.slice(0, 3).join(' ');
      const isSkillRow = keys.some((k) => STEMS[k].test(candidate));
      if (!UI_WORDS.test(candidate) && !isSkillRow && words.every((w) => /^\p{L}/u.test(w))) {
        name = candidate.replace(/(^|\s)\p{Ll}/gu, (c) => c.toUpperCase());
        break;
      }
    }
  }

  // Fall back: quality ≈ average of attributes when no % was found.
  const values = keys.map((k) => attrs[k]).filter((v) => v !== undefined);
  if (quality === null && values.length >= 10) {
    quality = Math.round(values.reduce((s, v) => s + v, 0) / values.length);
  }

  return { attrs, age, quality, name, position, specialAbility, found: values.length };
}

// ---------- Recording support: merge frame parses into distinct players ----------

// OCR name variants: junk tokens glued on ("Ili Raoul Konyuy", "Eder Cuesta
// Nr") and character-level misreads. Two names match when one's tokens are a
// subset of the other's (sharing a substantial token), or they're within a
// small edit distance.
function normName(n) {
  return String(n || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[a.length][b.length];
}

export function sameName(a, b) {
  const na = normName(a);
  const nb = normName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const ta = na.split(/\s+/);
  const tb = nb.split(/\s+/);
  const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  const subset = short.every((t) => long.includes(t));
  if (subset && short.some((t) => t.length >= 4)) return true;
  return editDistance(na, nb) <= 2;
}

// The cleaner of two matching name variants: fewer tokens wins (extra tokens
// are OCR junk), then the longer string (more complete characters).
function betterName(a, b) {
  if (!a) return b;
  if (!b) return a;
  const ta = a.split(/\s+/).length;
  const tb = b.split(/\s+/).length;
  if (ta !== tb) return ta < tb ? a : b;
  return a.length >= b.length ? a : b;
}

// Two parses describe the same player when their shared attributes agree.
function sameAttrs(a, b) {
  const keys = Object.keys(a).filter((k) => b[k] !== undefined);
  if (keys.length < 8) return false;
  const close = keys.filter((k) => Math.abs(a[k] - b[k]) <= 1).length;
  return close >= Math.ceil(keys.length * 0.8);
}

function mergeInto(target, p) {
  target.sightings += p.sightings || 1;
  target.name = betterName(target.name, p.name);
  if (!target.age && p.age) target.age = p.age;
  if (!target.quality && p.quality) target.quality = p.quality;
  if (!target.position && p.position) target.position = p.position;
  if (!target.specialAbility && p.specialAbility) target.specialAbility = p.specialAbility;
  for (const [k, v] of Object.entries(p.attrs)) {
    if (target.attrs[k] === undefined) target.attrs[k] = v;
  }
  target.found = Object.keys(target.attrs).length;
}

// Group per-frame parses into distinct players. Frames with too little data
// (transitions, menus) are dropped; consecutive sightings of the same player
// fill each other's gaps.
export function mergeSightings(parses, minFound = 6) {
  const merged = [];
  // Profile "Overview" frames have the header (name/age/OVR) but no skills.
  // Users flip Overview → Skills per player, so let the most recent header
  // frame donate its name to a skills frame that couldn't read its own.
  let lastHeader = null;
  for (const p of parses) {
    if (!p) continue;
    if (p.found < minFound) {
      if (p.name && (p.quality || p.age)) lastHeader = p;
      continue;
    }
    let target = null;
    if (p.name) {
      target = merged.find((m) => m.name && sameName(m.name, p.name));
    }
    if (!target) target = merged.find((m) => sameAttrs(m.attrs, p.attrs));
    if (target) mergeInto(target, p);
    else {
      const entry = {
        name: p.name, age: p.age, quality: p.quality, position: p.position,
        specialAbility: p.specialAbility || null,
        attrs: { ...p.attrs }, found: p.found, sightings: 1,
      };
      if (!entry.name && lastHeader
        && (!lastHeader.quality || !entry.quality || lastHeader.quality === entry.quality)
        && (!lastHeader.age || !entry.age || lastHeader.age === entry.age)) {
        entry.name = lastHeader.name;
        if (!entry.position && lastHeader.position) entry.position = lastHeader.position;
      }
      merged.push(entry);
    }
  }
  // Final dedupe: frames of one player can end up in separate entries when a
  // partial read matched neither by name (not read yet) nor by fingerprint
  // (too few shared attributes), and got its name donated later. Fold any
  // remaining same-name or same-fingerprint entries together, richest first.
  merged.sort((a, b) => b.found - a.found || b.sightings - a.sightings);
  const deduped = [];
  for (const m of merged) {
    const dup = deduped.find((d) =>
      (d.name && m.name && sameName(d.name, m.name)) || sameAttrs(d.attrs, m.attrs));
    if (dup) mergeInto(dup, m);
    else deduped.push(m);
  }
  return deduped;
}

// Decide, per detected player, whether it's a new addition or an update to an
// existing squad member (matched by name, case-insensitive).
export function planSquadChanges(existingPlayers, merged) {
  return merged.map((m) => {
    const match = m.name
      ? existingPlayers.find((p) => sameName(p.name, m.name))
      : null;
    if (!match) return { type: 'add', sighting: m };
    const changes = {};
    if (m.age && m.age !== match.age) changes.age = m.age;
    if (m.quality && m.quality !== match.quality) changes.quality = m.quality;
    const attrChanges = {};
    for (const [k, v] of Object.entries(m.attrs)) {
      if ((match.attrs || {})[k] !== v) attrChanges[k] = v;
    }
    if (Object.keys(attrChanges).length) changes.attrs = attrChanges;
    const type = Object.keys(changes).length ? 'update' : 'unchanged';
    return { type, player: match, sighting: m, changes };
  });
}

// ---------- Browser-side recognition (lazy-loads the bundled engine) ----------

let tesseractLoad = null;

function loadTesseract() {
  if (!tesseractLoad) {
    tesseractLoad = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = new URL('vendor/tesseract/tesseract.min.js', document.baseURI).href;
      s.onload = () => resolve(window.Tesseract);
      s.onerror = () => { tesseractLoad = null; reject(new Error('Could not load the OCR engine.')); };
      document.head.appendChild(s);
    });
  }
  return tesseractLoad;
}

// Downscale + grayscale + auto-invert (Top Eleven UI is light text on dark).
// `source` is anything drawImage accepts; w/h are its natural dimensions.
// `rotate` (0 | 90 | -90 degrees) handles portrait-stored recordings of the
// landscape game — iPhone screen recordings save sideways pixels.
export function preprocessSource(source, w, h, maxWidth = 1600, rotate = 0) {
  const outW = rotate ? h : w;
  const outH = rotate ? w : h;
  const scale = Math.min(1, maxWidth / outW);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(outW * scale);
  canvas.height = Math.round(outH * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.save();
  if (rotate) {
    const dw = Math.round(w * scale);
    const dh = Math.round(h * scale);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.drawImage(source, -dw / 2, -dh / 2, dw, dh);
  } else {
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  }
  ctx.restore();
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = d[i + 1] = d[i + 2] = g;
    sum += g;
  }
  const avg = sum / (d.length / 4);
  if (avg < 128) {
    for (let i = 0; i < d.length; i += 4) {
      d[i] = d[i + 1] = d[i + 2] = 255 - d[i];
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

// Reusable OCR worker — create once per import, recognize many frames.
export async function createOcrSession(onProgress) {
  const T = await loadTesseract();
  const base = new URL('vendor/tesseract/', document.baseURI).href;
  let label = 'Reading…';
  const worker = await T.createWorker('eng', 1, {
    workerPath: base + 'worker.min.js',
    corePath: base,
    langPath: base + 'lang',
    logger: (m) => {
      if (m.status === 'recognizing text') onProgress?.(label, m.progress);
      else onProgress?.('Loading OCR engine…', null);
    },
  });

  // Safety net: a wedged recognition surfaces as an error, not a silent stall.
  const withTimeout = (promise, ms = 90000) => Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('OCR timed out on a frame — try a shorter or steadier recording.')), ms)),
  ]);
  // How "informative" a parse is, for picking the best rotation.
  const score = (p) => p.found * 3 + (p.name ? 2 : 0) + (p.age ? 1 : 0) + (p.quality ? 1 : 0) + (p.position ? 1 : 0);

  let lockedRotation = null; // learned once per session, reused for later frames

  return {
    setLabel(text) { label = text; },
    async recognize(source, w, h, maxWidth) {
      const canvas = preprocessSource(source, w, h, maxWidth);
      const { data } = await withTimeout(worker.recognize(canvas));
      return parsePlayerText(data.text);
    },
    // Recognize trying rotations when the frame is portrait (the game is
    // landscape-only, so portrait pixels mean a sideways recording).
    async recognizeAuto(source, w, h, maxWidth) {
      if (w >= h) return this.recognize(source, w, h, maxWidth);
      // Rotated frames pack the full landscape UI into the long edge — OCR the
      // small skill digits at higher resolution.
      const rotatedMax = Math.max(maxWidth || 1600, 2000);
      if (lockedRotation !== null) {
        const canvas = preprocessSource(source, w, h, rotatedMax, lockedRotation);
        const { data } = await withTimeout(worker.recognize(canvas));
        return parsePlayerText(data.text);
      }
      // Orientation detection runs at LOW resolution — it only needs to tell
      // which way the text reads, and phones would otherwise sit on the first
      // frame for a minute doing three full-resolution passes.
      const outerLabel = label;
      let best = null;
      let bestRot = 0;
      const trials = [-90, 90, 0];
      for (let i = 0; i < trials.length; i++) {
        label = `Detecting orientation (${i + 1}/${trials.length})…`;
        const canvas = preprocessSource(source, w, h, 1100, trials[i]);
        const { data } = await withTimeout(worker.recognize(canvas));
        const p = parsePlayerText(data.text);
        if (!best || score(p) > score(best)) { best = p; bestRot = trials[i]; }
        if (p.found >= 10) break; // confident — stop trying
      }
      label = outerLabel;
      if (best.found >= 4) {
        lockedRotation = bestRot;
        // Redo this frame properly at full resolution with the locked rotation.
        return this.recognizeAuto(source, w, h, maxWidth);
      }
      return best;
    },
    terminate: () => worker.terminate(),
  };
}

export async function recognizeScreenshot(file, onProgress) {
  const session = await createOcrSession(onProgress);
  try {
    onProgress?.('Reading screenshot…', null);
    const bitmap = await createImageBitmap(file);
    return await session.recognizeAuto(bitmap, bitmap.width, bitmap.height);
  } finally {
    await session.terminate();
  }
}

// ---------- Screen-recording import ----------

// Seek through a video file and hand each sampled frame to `onFrame`.
// Hardened for iOS Safari: 'seeked' does not fire when seeking to the current
// position, and some decoders need a muted play/pause warm-up — so every wait
// has an event OR timeout fallback rather than trusting a single event.
async function eachVideoFrame(file, { stepSeconds = 0.7, maxFrames = 150 } = {}, onFrame) {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.preload = 'auto';

  const seekTo = (t, timeoutMs = 3000) => new Promise((resolve, reject) => {
    let settled = false;
    const settle = () => { if (!settled) { settled = true; cleanup(); resolve(); } };
    // Stale events queued before the seek started (e.g. from the play/pause
    // warm-up) must not resolve early — while a real seek is in flight,
    // video.seeking is true.
    const finish = () => { if (!video.seeking) settle(); };
    const fail = () => { if (!settled) { settled = true; cleanup(); reject(new Error('Video decode failed mid-file.')); } };
    const timer = setTimeout(settle, timeoutMs); // Safari sometimes skips the event
    const cleanup = () => {
      clearTimeout(timer);
      video.removeEventListener('seeked', finish);
      video.removeEventListener('timeupdate', finish);
      video.removeEventListener('error', fail);
    };
    video.addEventListener('seeked', finish);
    video.addEventListener('timeupdate', finish);
    video.addEventListener('error', fail);
    if (Math.abs(video.currentTime - t) < 0.01 && video.readyState >= 2) { finish(); return; }
    try { video.currentTime = t; } catch { fail(); }
  });

  try {
    video.src = url;
    await new Promise((res, rej) => {
      const timer = setTimeout(() => rej(new Error('Timed out opening the video — is it a normal screen recording?')), 15000);
      video.onloadedmetadata = () => { clearTimeout(timer); res(); };
      video.onerror = () => { clearTimeout(timer); rej(new Error('Could not read that video format.')); };
    });
    // Warm up the decode pipeline (needed on some iOS versions before a
    // paused video can be drawn to canvas). Muted play is gesture-exempt.
    try { await video.play(); video.pause(); } catch { /* non-fatal */ }

    let duration = video.duration;
    if (!Number.isFinite(duration)) {
      // Some recordings (e.g. MediaRecorder WebM) report Infinity until a
      // far seek forces the real duration to be computed.
      await seekTo(1e7, 5000);
      duration = video.duration;
    }
    if (!Number.isFinite(duration) || duration <= 0) throw new Error('Could not read the video duration.');
    const total = Math.min(maxFrames, Math.max(1, Math.ceil(duration / stepSeconds)));
    for (let i = 0; i < total; i++) {
      const t = Math.min(Math.max(0, duration - 0.05), i * stepSeconds);
      await seekTo(t);
      await onFrame(video, i, total);
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Grayscale thumbnail + block-wise difference for cheap frame-similarity
// checks. The metric is the MAX per-block mean difference, so a localized
// change (different digits or name on an otherwise identical layout) still
// registers strongly. Calibrated on real footage: identical screens score
// < 0.5, different players on the same layout score > 9.
const THUMB_SIZE = 48;
const THUMB_BLOCK = 8;

function frameThumb(source) {
  const c = document.createElement('canvas');
  c.width = c.height = THUMB_SIZE;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, THUMB_SIZE, THUMB_SIZE);
  const d = ctx.getImageData(0, 0, THUMB_SIZE, THUMB_SIZE).data;
  const out = new Float32Array(THUMB_SIZE * THUMB_SIZE);
  for (let i = 0; i < out.length; i++) {
    out[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  }
  return out;
}

function thumbDiff(a, b) {
  let max = 0;
  const nb = THUMB_SIZE / THUMB_BLOCK;
  for (let by = 0; by < nb; by++) {
    for (let bx = 0; bx < nb; bx++) {
      let sum = 0;
      for (let y = 0; y < THUMB_BLOCK; y++) {
        for (let x = 0; x < THUMB_BLOCK; x++) {
          const i = (by * THUMB_BLOCK + y) * THUMB_SIZE + bx * THUMB_BLOCK + x;
          sum += Math.abs(a[i] - b[i]);
        }
      }
      max = Math.max(max, sum / (THUMB_BLOCK * THUMB_BLOCK));
    }
  }
  return max;
}

// Full recording pipeline: sample frames → OCR each → merge into players.
// Near-identical consecutive frames (user holding one screen) reuse the
// previous OCR result instead of paying for another recognition pass.
export async function processRecording(file, onProgress) {
  const session = await createOcrSession(onProgress);
  const parses = [];
  let prevThumb = null;
  let prevParse = null;
  try {
    onProgress?.('Opening video…', null);
    await eachVideoFrame(file, {}, async (video, i, total) => {
      const msg = `Reading frame ${i + 1} of ${total}…`;
      session.setLabel(msg);
      onProgress?.(msg, i / total);
      const thumb = frameThumb(video);
      if (prevThumb && prevParse && thumbDiff(thumb, prevThumb) < 4) {
        parses.push(prevParse); // same screen as last frame — no need to re-OCR
      } else {
        prevParse = await session.recognizeAuto(video, video.videoWidth, video.videoHeight, 1400);
        parses.push(prevParse);
      }
      prevThumb = thumb;
    });
  } finally {
    await session.terminate();
  }
  // Frames that showed a profile but couldn't be read fully — worth telling
  // the user so they re-record those players with a steadier hold.
  const partials = parses.filter((p) => p && p.found >= 1 && p.found < 6).length;
  return { merged: mergeSightings(parses), frames: parses.length, partials };
}
