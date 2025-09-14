// Service Worker para GaIA PWA - compatible con API en otro origen
const CACHE_NAME = 'gaia-v13';
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/gaia-192.png',
  '/icons/gaia-512.png',
  '/assets/index.css',
  '/assets/index.js'
];

// Endpoints que jamás se cachean (auth)
const NEVER_CACHE = ['/api/login', '/api/register'];

// Endpoints GET que toleran cache (solo si están en MISMO origen)
const CACHE_FRIENDLY_API = [
  '/api/elderly-users',
  '/api/interactions',
  '/api/stats',
  '/api/sentiment',
  '/api/health-alerts'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1) Si la petición NO es GET, no interceptar (dejar ir a la red)
  if (request.method !== 'GET') return;

  // 2) Si la API está en OTRO ORIGEN, no interceptar (evita CORS/preflight raros)
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin) return;

  // 3) Si es API en MISMO origen:
  if (url.pathname.startsWith('/api/')) {
    // Nunca cachear auth
    if (NEVER_CACHE.some(p => url.pathname.startsWith(p))) return;

    // Cache First opcional para endpoints "amigables"
    if (CACHE_FRIENDLY_API.some(p => url.pathname.startsWith(p))) {
      event.respondWith(
        caches.match(request).then(cached => {
          if (cached) {
            // Actualiza en background
            fetch(request).then(r => r.ok && caches.open(CACHE_NAME).then(c => c.put(request, r.clone()))).catch(()=>{});
            return cached;
          }
          return fetch(request).then(r => {
            if (r.ok) caches.open(CACHE_NAME).then(c => c.put(request, r.clone()));
            return r;
          });
        })
      );
      return;
    }

    // Otros GET de API (mismo origen): Network First con fallback a cache
    event.respondWith(
      fetch(request).then(r => {
        if (r.ok) caches.open(CACHE_NAME).then(c => c.put(request, r.clone()));
        return r;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // 4) Assets estáticos / navegación: Cache First + fallback shell
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(r => {
        if (r.ok) caches.open(CACHE_NAME).then(c => c.put(request, r.clone()));
        return r;
      });
    }).catch(() => (request.mode === 'navigate' ? caches.match('/') : undefined))
  );
});
