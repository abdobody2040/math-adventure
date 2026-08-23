const CACHE = "math-adventure-static-v1";
const STATIC_FILES = ["/", "/manifest.webmanifest", "/icon.svg", "/learning-content.json"];

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
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok && (event.request.destination === "script" || event.request.destination === "style" || event.request.destination === "document" || event.request.destination === "image")) {
      const clone = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, clone));
    }
    return response;
  }).catch(() => caches.match("/"))));
});
