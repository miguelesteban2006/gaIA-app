// Service Worker para GaIA PWA - Optimizado para funcionamiento independiente
const CACHE_NAME = 'gaia-v12-optimized';
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/gaia-icon.png',
  '/icons/gaia-icon.svg',
  '/assets/index.css',
  '/assets/index.js'
];

// URLs que requieren red activa (autenticación crítica)
const NEVER_CACHE = [
  '/api/login',
  '/api/register'
];

// Datos que se pueden mostrar desde cache en modo offline
const CACHE_FRIENDLY_API = [
  '/api/elderly-users',
  '/api/interactions',
  '/api/stats',
  '/api/sentiment',
  '/api/health-alerts'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker caching static files');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Estrategia de cache: Network First para API, Cache First para assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests - Estrategia inteligente para funcionamiento independiente
  if (url.pathname.startsWith('/api/')) {
    const shouldNeverCache = NEVER_CACHE.some(path => url.pathname.startsWith(path));
    const isCacheFriendly = CACHE_FRIENDLY_API.some(path => url.pathname.startsWith(path));
    
    if (shouldNeverCache) {
      // Auth endpoints requieren red activa
      event.respondWith(fetch(request));
    } else if (isCacheFriendly) {
      // Datos del usuario: Cache First para funcionamiento offline
      event.respondWith(
        caches.match(request).then((cached) => {
          if (cached) {
            // Actualizar cache en background si hay red
            fetch(request).then((response) => {
              if (response.ok) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, response.clone());
                });
              }
            }).catch(() => {});
            return cached;
          }
          // Si no hay cache, intentar red
          return fetch(request).then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
      );
    } else {
      // Otros endpoints: Network First con fallback a cache
      event.respondWith(
        fetch(request)
          .then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            return caches.match(request) || new Response(
              JSON.stringify({ error: 'Sin conexión. Funcionalidad limitada disponible.' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          })
      );
    }
    return;
  }

  // Static assets - Cache First
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request).then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
      .catch(() => {
        // Fallback for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/');
        }
      })
  );
});