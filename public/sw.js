// Cache runtime: como el build de Next genera nombres de archivo con hash,
// no precacheamos una lista fija (se quedaría desactualizada en cada deploy).
// En su lugar cacheamos bajo demanda lo que el usuario va visitando, así
// las páginas ya abiertas siguen funcionando offline.
const CACHE_NAME = "fitlog-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        const networkFetch = fetch(event.request)
          .then((res) => {
            if (res.ok) cache.put(event.request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
  } else {
    // Ej. Open Food Facts: red primero, sin romper si falla.
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
  }
});
