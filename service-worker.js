// Once upon a Tuesday service worker — caches the app shell so it opens
// instantly and works offline. Bump CACHE_NAME whenever app files change
// so old devices pick up the new version.
const CACHE_NAME = "blossom-v29";
const EXTERNAL_CACHE = "blossom-external-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./css/cover.css",
  "./js/app.js",
  "./js/db.js",
  "./js/legacy-local-db.js",
  "./js/firebase.js",
  "./js/firebase-config.js",
  "./js/ui.js",
  "./js/icons.js",
  "./js/journal-physics.js",
  "./js/theme.js",
  "./js/mascot.js",
  "./js/assistant.js",
  "./js/glam-stickers.js",
  "./js/vibes.js",
  "./js/music.js",
  "./js/screens/auth.js",
  "./js/screens/cover.js",
  "./js/screens/mode-picker.js",
  "./js/screens/home.js",
  "./js/screens/journals.js",
  "./js/screens/create.js",
  "./js/screens/editor.js",
  "./js/screens/reader.js",
  "./js/screens/memories.js",
  "./js/screens/profile.js",
  "./icons/icon-72.png",
  "./icons/icon-96.png",
  "./icons/icon-120.png",
  "./icons/icon-128.png",
  "./icons/icon-144.png",
  "./icons/icon-152.png",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-384.png",
  "./icons/icon-512.png",
  "./icons/templates/blank.jpg",
  "./icons/templates/photodump.jpg",
  "./icons/templates/daily.jpg",
  "./icons/templates/travel.jpg",
  "./icons/templates/letter.jpg",
  "./icons/cover/journal-cover-large.jpg",
  "./icons/cover/journal-cover-spine.jpg",
  "./icons/cover/sticker-headphones.jpg",
  "./icons/cover/sticker-cherries.jpg",
  "./icons/cover/sticker-tape.jpg",
  "./icons/cover/sticker-mushroom.jpg",
  "./icons/bob.png",
  "./icons/barbie.png",
  "./icons/batman.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== EXTERNAL_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Google Fonts + the Firebase SDK: stale-while-revalidate so they still
  // load offline after the first visit. Firestore/Storage/Auth network
  // calls themselves are intentionally NOT cached here — Firestore has its
  // own offline cache, and auth/data requests must always hit the network
  // when available.
  const isCacheableExternal =
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com") ||
    (url.hostname === "www.gstatic.com" && url.pathname.includes("/firebasejs/"));

  if (isCacheableExternal) {
    event.respondWith(
      caches.open(EXTERNAL_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const fetchPromise = fetch(req)
          .then((res) => {
            cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // App shell: cache-first, falling back to network, so the app opens instantly + offline.
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            return res;
          })
          .catch(() => cached);
      })
    );
  }
});
