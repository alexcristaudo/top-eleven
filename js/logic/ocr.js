// Screenshot import: local OCR (tesseract.js, bundled in vendor/) + parsing
// of Top Eleven player-profile text. Nothing leaves the device.
import { ATTR_KEYS } from '../data/attributes.js';

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

  return { attrs, age, quality, name, found: values.length };
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
export async function preprocessImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
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

export async function recognizeScreenshot(file, onProgress) {
  const T = await loadTesseract();
  const base = new URL('vendor/tesseract/', document.baseURI).href;
  const worker = await T.createWorker('eng', 1, {
    workerPath: base + 'worker.min.js',
    corePath: base,
    langPath: base + 'lang',
    logger: (m) => {
      if (m.status === 'recognizing text') onProgress?.('Reading screenshot…', m.progress);
      else onProgress?.('Loading OCR engine…', null);
    },
  });
  try {
    const canvas = await preprocessImage(file);
    const { data } = await worker.recognize(canvas);
    return parsePlayerText(data.text);
  } finally {
    await worker.terminate();
  }
}
