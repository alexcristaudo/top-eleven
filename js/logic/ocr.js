// Screenshot import: local OCR (tesseract.js, bundled in vendor/) + parsing
// of Top Eleven player-profile text. Nothing leaves the device.
import { ATTR_KEYS } from '../data/attributes.js';
import { POSITIONS } from '../data/roles.js';

// Fuzzy label stems — OCR often mangles word endings, so match on the start.
const ATTR_STEMS = {
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
  speed: /speed/i,
  strength: /streng/i,
  fitness: /fitnes/i,
  aggression: /aggress/i,
  creativity: /creativ/i,
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

  const POS_RE = new RegExp(`(?:^|[^A-Z0-9])(${POSITIONS.join('|')})(?:[^A-Z0-9]|$)`);

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    // Attribute lines: label stem + a plausible number on the same line.
    for (const key of ATTR_KEYS) {
      if (attrs[key] !== undefined) continue;
      const m = line.match(ATTR_STEMS[key]);
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
    if (qualityPct === null && !/condition/i.test(line) && !ATTR_KEYS.some((k) => ATTR_STEMS[k].test(line))) {
      const m = line.match(/(\d{1,3})\s*%/);
      if (m) {
        const v = parseInt(m[1], 10);
        if (v >= 1 && v <= 250) qualityPct = v;
      }
    }
  }
  quality = qualityOvr !== null ? qualityOvr : qualityPct;

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
      const isSkillRow = ATTR_KEYS.some((k) => ATTR_STEMS[k].test(candidate));
      if (!UI_WORDS.test(candidate) && !isSkillRow && words.every((w) => /^\p{L}/u.test(w))) {
        name = candidate.replace(/(^|\s)\p{Ll}/gu, (c) => c.toUpperCase());
        break;
      }
    }
  }

  // Fall back: quality ≈ average of attributes when no % was found.
  const values = ATTR_KEYS.map((k) => attrs[k]).filter((v) => v !== undefined);
  if (quality === null && values.length >= 10) {
    quality = Math.round(values.reduce((s, v) => s + v, 0) / values.length);
  }

  return { attrs, age, quality, name, position, found: values.length };
}

// ---------- Recording support: merge frame parses into distinct players ----------

// Two parses describe the same player when their shared attributes agree.
function sameAttrs(a, b) {
  const keys = Object.keys(a).filter((k) => b[k] !== undefined);
  if (keys.length < 8) return false;
  const close = keys.filter((k) => Math.abs(a[k] - b[k]) <= 1).length;
  return close >= Math.ceil(keys.length * 0.8);
}

function mergeInto(target, p) {
  target.sightings++;
  if (!target.name && p.name) target.name = p.name;
  if (!target.age && p.age) target.age = p.age;
  if (!target.quality && p.quality) target.quality = p.quality;
  if (!target.position && p.position) target.position = p.position;
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
      target = merged.find((m) => m.name && m.name.toLowerCase() === p.name.toLowerCase());
    }
    if (!target) target = merged.find((m) => sameAttrs(m.attrs, p.attrs));
    if (target) mergeInto(target, p);
    else {
      const entry = {
        name: p.name, age: p.age, quality: p.quality, position: p.position,
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
  return merged;
}

// Decide, per detected player, whether it's a new addition or an update to an
// existing squad member (matched by name, case-insensitive).
export function planSquadChanges(existingPlayers, merged) {
  return merged.map((m) => {
    const match = m.name
      ? existingPlayers.find((p) => p.name.trim().toLowerCase() === m.name.trim().toLowerCase())
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
  const worker = await T.createWorker('eng', 1, {
    workerPath: base + 'worker.min.js',
    corePath: base,
    langPath: base + 'lang',
    logger: (m) => {
      if (m.status !== 'recognizing text') onProgress?.('Loading OCR engine…', null);
    },
  });
  // How "informative" a parse is, for picking the best rotation.
  const score = (p) => p.found * 3 + (p.name ? 2 : 0) + (p.age ? 1 : 0) + (p.quality ? 1 : 0) + (p.position ? 1 : 0);

  let lockedRotation = null; // learned once per session, reused for later frames

  return {
    async recognize(source, w, h, maxWidth) {
      const canvas = preprocessSource(source, w, h, maxWidth);
      const { data } = await worker.recognize(canvas);
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
        const { data } = await worker.recognize(canvas);
        return parsePlayerText(data.text);
      }
      let best = null;
      let bestRot = 0;
      for (const rot of [-90, 90, 0]) {
        const canvas = preprocessSource(source, w, h, rotatedMax, rot);
        const { data } = await worker.recognize(canvas);
        const p = parsePlayerText(data.text);
        if (!best || score(p) > score(best)) { best = p; bestRot = rot; }
        if (p.found >= 10) break; // confident — stop trying
      }
      if (best.found >= 6) lockedRotation = bestRot;
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
async function eachVideoFrame(file, { stepSeconds = 0.7, maxFrames = 150 } = {}, onFrame) {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  try {
    video.src = url;
    await new Promise((res, rej) => {
      video.onloadedmetadata = res;
      video.onerror = () => rej(new Error('Could not read that video format.'));
    });
    let duration = video.duration;
    if (!Number.isFinite(duration)) {
      // Some recordings (e.g. MediaRecorder WebM) report Infinity until a
      // far seek forces the real duration to be computed.
      video.currentTime = 1e7;
      await new Promise((r) => { video.onseeked = r; });
      duration = video.duration;
    }
    if (!Number.isFinite(duration) || duration <= 0) throw new Error('Could not read the video duration.');
    const total = Math.min(maxFrames, Math.max(1, Math.ceil(duration / stepSeconds)));
    for (let i = 0; i < total; i++) {
      const t = Math.min(Math.max(0, duration - 0.05), i * stepSeconds);
      await new Promise((res, rej) => {
        video.onseeked = res;
        video.onerror = () => rej(new Error('Video decode failed mid-file.'));
        video.currentTime = t;
      });
      await onFrame(video, i, total);
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Full recording pipeline: sample frames → OCR each → merge into players.
export async function processRecording(file, onProgress) {
  const session = await createOcrSession(onProgress);
  const parses = [];
  try {
    await eachVideoFrame(file, {}, async (video, i, total) => {
      onProgress?.(`Reading frame ${i + 1} of ${total}…`, (i + 1) / total);
      parses.push(await session.recognizeAuto(video, video.videoWidth, video.videoHeight, 1400));
    });
  } finally {
    await session.terminate();
  }
  return { merged: mergeSightings(parses), frames: parses.length };
}
