const CACHE = "senalco-v1";

const FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./estilo.css",
  "./login.js",
  "./images/logo.png",
  "./images/icon-192.png",
  "./images/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
});

self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});