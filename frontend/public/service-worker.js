/* Guide Visa — Service Worker (offline-first for GET APIs and static assets) */
const CACHE_VERSION = "gv-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;

const CACHEABLE_API_PATTERNS = [
  /\/api\/pays/,
  /\/api\/simulations\/pays/,
  /\/api\/simulations\/donnees\//,
  /\/api\/simulations\/mes/,
  /\/api\/simulations\/[^/]+$/,
  /\/api\/liens/,
  /\/api\/forum\/categories/,
  /\/api\/forum\/topics/,
  /\/api\/documents$/,
  /\/api\/auth\/me/,
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // API: network-first, cache fallback
  if (url.pathname.startsWith("/api/") && CACHEABLE_API_PATTERNS.some((p) => p.test(url.pathname))) {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(API_CACHE).then((c) => c.put(req, clone));
          }
          return resp;
        })
        .catch(() => caches.match(req).then((cached) => cached || new Response(JSON.stringify({ offline: true }), { status: 503, headers: { "Content-Type": "application/json" } })))
    );
    return;
  }

  // Static: cache-first for images and cross-origin CDN
  if (req.destination === "image" || req.destination === "font" || url.hostname.includes("fontshare") || url.hostname.includes("gstatic")) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((resp) => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(req, clone));
        }
        return resp;
      }).catch(() => new Response("", { status: 504 })))
    );
    return;
  }

  // Navigation: network-first, fallback to cached "/"
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/") || caches.match(req))
    );
  }
});
