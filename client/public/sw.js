// Service Worker para GaIA PWA — versión segura para Pages + API externa
// - No intercepta peticiones no-GET.
// - No intercepta /.well-known/* (ej. assetlinks.json).
// - No intercepta recursos cross-origin (API, CDNs, etc.).
// - No intercepta /api/ ni siquiera en mismo origen (para evitar CORS/preflight raros).
// - Estrategias: 
//    * Navegación (HTML): Network First, fallback a cache y, si falla, a '/'
//    * Estáticos (mismo origen): Cache First con refresco en background

const CACHE_NAME = 'gaia-v15'; // ¡sube versión cuando cambies el SW!
const APP_SHELL = [
  '/',                 // shell de la app
  '/manifest.json',
  '/icons/gaia-192.png',
  '/icons/gaia-512.png',
];

// Utilidad: guarda en caché si la respuesta es OK (clonando antes)
const putInCache = async (request, response) => {
  try {
    if (!response || !response.ok) return;
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  } catch (_) {
    // silenciar errores de cache (quota, etc.)
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(APP_SHELL);
      // Activa inmediatamente el nuevo SW
      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))
      );
      // Toma control de clientes abiertos
      self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 0) No interceptar nada que no sea GET
  if (request.method !== 'GET') return;

  // 1) No interceptar /.well-known/* (p.ej. assetlinks.json de TWA)
  if (url.pathname.startsWith('/.well-known/')) return;

  // 2) No interceptar recursos cross-origin (API externa, CDN, fuentes, etc.)
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin) return;

  // 3) No interceptar API ni siquiera en mismo origen (más simple y seguro)
  if (url.pathname.startsWith('/api/')) return;

  // 4) Navegación (HTML): Network First con fallback a cache y, si todo falla, a '/'
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const netRes = await fetch(request);
          // Si es HTML, guarda una copia (algunos servidores devuelven text/html en navegaciones)
          putInCache(request, netRes);
          return netRes;
        } catch (_) {
          // Sin red: intenta cache
          const cached = await caches.match(request);
          if (cached) return cached;
          // Fallback a shell si tampoco está la ruta en caché
          const shell = await caches.match('/');
          return shell || new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      })()
    );
    return;
  }

  // 5) Estáticos (mismo origen): Cache First + refresco en background
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) {
        // Refresco en background (no bloquea la respuesta)
        fetch(request)
          .then((r) => putInCache(request, r))
          .catch(() => {});
        return cached;
      }
      // No estaba en caché: ve a red y guarda si OK
      const netRes = await fetch(request);
      putInCache(request, netRes);
      return netRes;
    })()
  );
});
