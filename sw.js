// ========================================
// DentPrep Service Worker
// Auto-updates: VERSION changes on each deploy
// ========================================

const VERSION = "v3-" + "20260323";
const CACHE_NAME = `dentprep-${VERSION}`;

const STATIC_ASSETS = [
  "/dentprep/",
  "/dentprep/index.html",
  "/dentprep/styles.css",
  "/dentprep/app.js",
  "/dentprep/data/questions.json",
  "/dentprep/data/flashcards.json",
  "/dentprep/data/clinical-cases.json",
];

// Install — cache assets, activate immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((e) => console.warn("[SW] Failed:", url, e))
        )
      )
    )
  );
});

// Activate — purge ALL old caches, claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.map((name) => {
            if (name !== CACHE_NAME) {
              console.log("[SW] Purging old cache:", name);
              return caches.delete(name);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch — Network-first for EVERYTHING (ensures auto-update)
// Falls back to cache only when offline
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache the fresh response for offline fallback
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
