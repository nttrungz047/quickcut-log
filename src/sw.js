// ============================================================
// sw.js  –  Service Worker (offline-first)
// ============================================================

const CACHE_NAME = 'quickcut-v2';
const PRECACHE = [
  './',
  './index.html',
  './js/main.js',
  './js/db.js',
  './js/state.js',
  './js/utils.js',
  './js/toast.js',
  './js/theme.js',
  './js/clock.js',
  './js/screens/home.js',
  './js/screens/history.js',
  './js/screens/summary.js',
  './js/components/add-modal.js',
  './js/components/detail.js',
  './js/components/services.js',
  './js/components/data-io.js',
  './js/components/lazy-img.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        // Cache Google Fonts etc.
        if (resp && resp.status === 200 && resp.type !== 'opaque') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
