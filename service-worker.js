const CACHE_NAME = "senalco-pwa-v2";

const ASSETS = [
  "./",
  "./login.html",
  "./login.js",
  "./manifest.json",
  "./estilo.css",

  "./relevamiento.html",
  "./relevamiento.js",
  "./base.html",
  "./base.js",

  "./images/logo_blanco.jpg",
  "./images/icon-192.png",
  "./images/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});