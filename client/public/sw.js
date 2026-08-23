const CACHE = "math-adventure-static-v3";
const STATIC_FILES = ["/manifest.webmanifest", "/icon.svg", "/learning-content.json"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  const isAppShell = event.request.mode === "navigate" || event.request.destination === "script" || event.request.destination === "style";
  if (isAppShell) {
    event.respondWith(fetch(event.request).then(response => response.ok ? response : caches.match(event.request)).catch(() => caches.match(event.request).then(cached => cached || caches.match("/"))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => {
    if (cached) return cached;
    return fetch(event.request).then(response => {
      if (response.ok && (event.request.destination === "image" || STATIC_FILES.includes(new URL(event.request.url).pathname))) {
        caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
      }
      return response;
    });
  }));
});
