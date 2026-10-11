// Caches the whole site on first visit so page switches load instantly.
// Bump CACHE_VERSION to drop old caches after large changes.
const CACHE_VERSION = 'v1';
const CACHE_NAME = `site-${CACHE_VERSION}`;

const PRECACHE = [
  './',
  'index.html',
  'about.html',
  'work.html',
  'opensource.html',
  'blog.html',
  'now.html',
  'articles/browser-agents-dom.html',
  'articles/context-compilers-preserve.html',
  'articles/frontend-interaction.html',
  'articles/quantum-transpiler.html',
  'articles/resumption-network-feature.html',
  'styles.css',
  'assets/favicon.svg',
  'assets/archive-bg.svg',
  'assets/fonts/cinzel-400.woff2',
  'assets/fonts/cinzel-500.woff2',
  'assets/fonts/cinzel-600.woff2',
  'assets/fonts/cinzel-700.woff2',
  'assets/fonts/space-grotesk-400.woff2',
  'assets/fonts/space-grotesk-500.woff2',
  'assets/fonts/space-grotesk-600.woff2',
  'assets/fonts/space-grotesk-700.woff2',
  'assets/fonts/jetbrains-mono-400.woff2',
  'assets/fonts/jetbrains-mono-500.woff2',
  'assets/fonts/jetbrains-mono-600.woff2',
  'assets/images/page-home-bg-wide.jpg',
  'assets/images/page-home-bg-tall.jpg',
  'assets/images/page-about-bg-wide.jpg',
  'assets/images/page-about-bg-tall.jpg',
  'assets/images/page-work-bg.jpg',
  'assets/images/page-opensource-bg-wide.jpg',
  'assets/images/page-opensource-bg.jpg',
  'assets/images/page-blog-bg-wide.jpg',
  'assets/images/page-blog-bg-tall.jpg',
  'assets/images/page-now-bg-wide.jpg',
  'assets/images/page-now-bg.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Cache each file on its own so one missing file doesn't block the rest.
      Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Stale-while-revalidate: serve from cache instantly, refresh the cache in the
// background so updated images and pages show up on the next visit.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      if (cached) {
        event.waitUntil(network);
        return cached;
      }
      return network;
    })
  );
});
