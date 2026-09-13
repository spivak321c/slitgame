/* Slotword — service worker (Phase 4)
 *
 * Offline-first app shell: precaches the shell on install, then uses a
 * network-first strategy for navigations (falling back to the cached
 * index.html so solo practice + profile keep working offline) and a
 * cache-first strategy for same-origin static assets (hashed bundles,
 * icons, fonts via CSS, manifest).
 *
 * Everything cross-origin (Supabase REST/Realtime, Google Fonts) is left
 * to the network and never cached, so duels always talk to the live
 * backend and fonts can update.
 */
const CACHE = 'slotword-shell-v1';
const SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navigations: try the network, fall back to the cached app shell.
  // Every successful navigation refreshes the shell copy.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Same-origin static assets: cache-first with network fill (hashed
  // bundles are immutable, so a cached copy is always correct).
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
  }
  // Cross-origin (Supabase, fonts): no service-worker involvement.
});