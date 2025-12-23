// Cache name with version
const CACHE_NAME = 'bishoftu-delivery-v13';
const BASE_PATH = '/';

// Files to cache
const urlsToCache = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'service-worker.js',
  BASE_PATH + 'offline.html',
  
  // Icons
  BASE_PATH + 'icons/icon-72x72.png',
  BASE_PATH + 'icons/icon-96x96.png',
  BASE_PATH + 'icons/icon-128x128.png',
  BASE_PATH + 'icons/icon-144x144.png',
  BASE_PATH + 'icons/icon-152x152.png',
  BASE_PATH + 'icons/icon-192x192.png',
  BASE_PATH + 'icons/icon-512x512.png',
  BASE_PATH + 'icons/favicon.ico'
];

// Install service worker
self.addEventListener('install', event => {
  console.log('📦 Installing Service Worker v13');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📁 Caching app files...');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate
self.addEventListener('activate', event => {
  console.log('✅ Service Worker v13 activated');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Handle root requests
  if (requestUrl.pathname === '/' || requestUrl.pathname === '') {
    event.respondWith(
      caches.match('/index.html')
        .then(cachedResponse => cachedResponse || fetch(event.request))
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }
  
  // Default caching
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        return cachedResponse || fetch(event.request)
          .then(response => {
            // Cache successful responses
            if (response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseToCache));
            }
            return response;
          })
          .catch(() => {
            // If offline and request is HTML, show offline page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
          });
      })
  );
});
