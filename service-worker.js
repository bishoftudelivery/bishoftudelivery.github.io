// Service Worker for Bishoftu Delivery - Fixed for GitHub Pages
// Version: 14.4

const CACHE_NAME = 'bishoftu-delivery-v14.4';
const STATIC_CACHE = 'static-v14.4';

// Install event
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName.startsWith('bishoftu-delivery-') && cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Cache First Strategy
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Handle fetch event
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).then(networkResponse => {
        // Don't cache if not a valid response
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        
        // Clone the response
        const responseToCache = networkResponse.clone();
        
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        
        return networkResponse;
      }).catch(() => {
        // If offline and request is for HTML, return a fallback
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('https://bishoftudelivery.github.io/index.html');
        }
        
        return new Response('You are offline. Please check your connection.');
      });
    })
  );
});
