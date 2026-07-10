// Screenshot import: local OCR (tesseract.js, bundled in vendor/) + parsing
// of Top Eleven player-profile text. Nothing leaves the device.
import { ATTR_KEYS } from '../data/attributes.js';
import { POSITIONS } from '../data/roles.js';

// Fuzzy label stems — OCR often mangles word endings, so match on the start.
const ATTR_STEMS = {
  tackling: /tack/i,
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
  let name = null;
  let position = null;

  const POS_RE = new RegExp(`(?:^|[^A-Z0-9])(${POSITIONS.join('|')})(?:[^A-Z0-9]|$)`);

  for (const line of lines) {
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

    // Quality: a percentage that is NOT on an attribute line.
    if (quality === null && !ATTR_KEYS.some((k) => ATTR_STEMS[k].test(line))) {
      const m = line.match(/(\d{1,3})\s*%/);
      if (m) {
        const v = parseInt(m[1], 10);
        if (v >= 1 && v <= 250) quality = v;
      }
    }
  }

  // Name: a "Firstname Lastname"-shaped line near the top that isn't UI text.
  const UI_WORDS = /profile|player|skills|attack|defen[cs]e|physical|mental|value|contract|bid|quality|form|age/i;
  for (const line of lines.slice(0, 8)) {
    const m = line.match(/^([A-Z][a-zA-Z'’.-]+(?:\s+[A-Z][a-zA-Z'’.-]+){1,2})$/);
    if (m && !UI_WORDS.test(line)) { name = m[1]; break; }
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
  for (const p of parses) {
    if (!p || p.found < minFound) continue;
    let target = null;
    if (p.name) {
      target = merged.find((m) => m.name && m.name.toLowerCase() === p.name.toLowerCase());
    }
    if (!target) target = merged.find((m) => sameAttrs(m.attrs, p.attrs));
    if (target) mergeInto(target, p);
    else {
      merged.push({
        name: p.name, age: p.age, quality: p.quality, position: p.position,
        attrs: { ...p.attrs }, found: p.found, sightings: 1,
      });
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
export function preprocessSource(source, w, h, maxWidth = 1600) {
  const scale = Math.min(1, maxWidth / w);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
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
  return {
    async recognize(source, w, h, maxWidth) {
      const canvas = preprocessSource(source, w, h, maxWidth);
      const { data } = await worker.recognize(canvas);
      return parsePlayerText(data.text);
    },
    terminate: () => worker.terminate(),
  };
}

export async function recognizeScreenshot(file, onProgress) {
  const session = await createOcrSession(onProgress);
  try {
    onProgress?.('Reading screenshot…', null);
    const bitmap = await createImageBitmap(file);
    return await session.recognize(bitmap, bitmap.width, bitmap.height);
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
      parses.push(await session.recognize(video, video.videoWidth, video.videoHeight, 1200));
    });
  } finally {
    await session.terminate();
  }
  return { merged: mergeSightings(parses), frames: parses.length };
}
