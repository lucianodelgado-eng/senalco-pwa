const CACHE_NAME = "senalco-pwa-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./estilo.css",
  "./manifest.json",
  "./javas.js",
  "./images/icon-192.png",
  "./images/icon-512.png",
  "./images/logo_blanco.jpg",
  "./images/logo.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});