const CACHE = 'dentprep-v19';
const ASSETS = ['./manifest.json', './icon-192.png', './icon-512.png', './styles.css', './app.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Never cache questions.json — always go to network
  if (url.pathname.endsWith('questions.json')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Network-first for HTML — try network, fall back to cache for offline
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return resp;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for static assets (icons, manifest)
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
