// Jazy's House — Service Worker
// Caches core assets for offline use & fast repeat loads

const CACHE = 'jazys-house-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/shop.html',
  '/catering.html',
  '/about.html',
  '/css/style.css',
  '/js/main.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap'
];

// Install: pre-cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Fetch: cache-first for assets, network-first for pages
self.addEventListener('fetch', e => {
  // Skip non-GET
  if (e.request.method !== 'GET') return;
  // Skip external URLs
  if (!e.request.url.startsWith(self.location.origin) &&
      !e.request.url.startsWith('https://fonts.googleapis.com') &&
      !e.request.url.startsWith('https://fonts.gstatic.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetched = fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
      return cached || fetched;
    })
  );
});
