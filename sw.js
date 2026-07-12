// TE Manager service worker — cache-first with versioned precache.
// vendor/tesseract assets are intentionally NOT precached: they are large and
// lazy-loaded on first screenshot import, then kept by the runtime cache below.
const VERSION = 'te-manager-v20'; // keep in step with js/version.js
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/app.js',
  './js/version.js',
  './js/store.js',
  './js/logic/analysis.js',
  './js/logic/ocr.js',
  './js/data/attributes.js',
  './js/data/roles.js',
  './js/data/drills.js',
  './js/data/formations.js',
  './js/data/guides.js',
  './js/data/checklist.js',
  './js/data/trainertest.js',
  './js/data/teamplay.js',
  './js/data/playstyles.js',
  './js/data/abilities.js',
  './js/data/powerstats.js',
  './js/views/ui.js',
  './js/views/dashboard.js',
  './js/views/squad.js',
  './js/views/player.js',
  './js/views/training.js',
  './js/views/tactics.js',
  './js/views/guides.js',
  './js/views/season.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        if (res.ok && new URL(e.request.url).origin === self.location.origin) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copy));
        }
        return res;
      });
    })
  );
});
