// Service Worker for Bishoftu Delivery
// Version: 14.4

const CACHE_NAME = 'bishoftu-delivery-v14.4';
const STATIC_CACHE = 'static-v14.4';
const DYNAMIC_CACHE = 'dynamic-v14.4';

// Resources to cache immediately
const STATIC_RESOURCES = [
  './',
  './index.html',
  './manifest.json',
  './service-worker.js'
];

// Install event - Cache core resources
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing version 14.4...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('[Service Worker] Caching static resources...');
      return cache.addAll(STATIC_RESOURCES).catch(error => {
        console.log('[Service Worker] Cache addAll failed:', error);
      });
    }).then(() => {
      console.log('[Service Worker] Install completed');
      return self.skipWaiting();
    })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating version 14.4...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old caches
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activation completed');
      return self.clients.claim();
    })
  );
});

// Fetch event - Network First, Cache Fallback strategy
self.addEventListener('fetch', event => {
  // Skip non-GET requests and browser extensions
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // Handle API requests differently
  if (event.request.url.includes('api.telegram.org') || 
      event.request.url.includes('cdnjs.cloudflare.com')) {
    // For external APIs, use network only
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For local resources, use Network First strategy
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // If we got a response, cache it
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(event.request, responseClone).catch(() => {
              // Silently fail if cache put fails
            });
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              console.log('[Service Worker] Serving from cache:', event.request.url);
              return cachedResponse;
            }
            
            // For HTML pages, return the main page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
            
            // For other requests, return a simple offline response
            return new Response('You are offline. Please check your internet connection.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Handle messages from the page
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '14.4' });
  }
});

// Background sync (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', event => {
    if (event.tag === 'sync-orders') {
      console.log('[Service Worker] Background sync for orders');
      // You can implement order synchronization here
    }
  });
}

// Push notifications (if supported)
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New update from Bishoftu Delivery',
    icon: './icons/icon-192x192.png',
    badge: './icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || './'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Bishoftu Delivery', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        if (clientList.length > 0) {
          let client = clientList[0];
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              client = clientList[i];
            }
          }
          return client.focus();
        }
        return clients.openWindow(event.notification.data.url || './');
      })
  );
});
