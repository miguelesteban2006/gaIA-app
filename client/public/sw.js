kconst CACHE_NAME = 'eldercompanion-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      self.clients.claim();
    })
  );
});

// Fetch event - cache first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // NO API interception: let all /api/ calls go to network directly

  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response as it's a stream
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          });
      })
      .catch(() => {
        // Return the cached homepage for navigation requests when offline
        if (request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Background sync for audio uploads (when available)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-audio-upload') {
    event.waitUntil(
      // Handle background upload logic here
      console.log('Background sync for audio upload')
    );
  }
});

// Push notifications (when available)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: 'eldercompanion-notification'
      })
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/');
  );
});

