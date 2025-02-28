// Cache names
const CACHE_NAME = 'picsorpix-cache-v1';
const API_CACHE_NAME = 'picsorpix-api-cache-v1';
const IMAGE_CACHE_NAME = 'picsorpix-image-cache-v1';

// Assets to cache initially
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/main.js',
  '/home.css',
  '/photo-grid.css'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const validCaches = [CACHE_NAME, API_CACHE_NAME, IMAGE_CACHE_NAME];
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => !validCaches.includes(cacheName))
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Helper function to determine cache based on request URL
function getCacheForRequest(request) {
  const url = new URL(request.url);
  
  // API requests
  if (url.pathname.startsWith('/api/')) {
    if (url.pathname.includes('/api/images/') || url.pathname.includes('/api/lqip/')) {
      return IMAGE_CACHE_NAME; // Image processing endpoints
    }
    return API_CACHE_NAME; // Other API endpoints
  }
  
  // Image files
  if (url.pathname.match(/\.(jpe?g|png|gif|webp)$/i)) {
    return IMAGE_CACHE_NAME;
  }
  
  // All other assets (JS, CSS, HTML)
  return CACHE_NAME;
}

// Fetch event - network first strategy for API, cache first for static assets
self.addEventListener('fetch', event => {
  const request = event.request;
  
  // Skip non-GET requests and browser extensions
  if (request.method !== 'GET' || 
      !request.url.startsWith(self.location.origin)) {
    return;
  }
  
  const url = new URL(request.url);
  const cacheName = getCacheForRequest(request);
  
  // Network first for API requests with fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone the response to put in cache
          const responseToCache = response.clone();
          caches.open(cacheName)
            .then(cache => cache.put(request, responseToCache));
          return response;
        })
        .catch(() => {
          // If network fails, try the cache
          return caches.match(request);
        })
    );
    return;
  }
  
  // Cache first for images with network fallback
  if (url.pathname.match(/\.(jpe?g|png|gif|webp)$/i)) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Not in cache, get from network
          return fetch(request)
            .then(response => {
              // Clone and cache the response
              const responseToCache = response.clone();
              caches.open(cacheName)
                .then(cache => cache.put(request, responseToCache));
              return response;
            });
        })
    );
    return;
  }
  
  // Cache first strategy for other static assets
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // If we have a cache hit, return it right away
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        return fetch(request)
          .then(response => {
            // Clone the response to put in cache
            const responseToCache = response.clone();
            caches.open(cacheName)
              .then(cache => cache.put(request, responseToCache));
            return response;
          });
      })
  );
});