// MetriCheck AI — Service Worker
// Version: metricheck-pwa-v1.0.0

const CACHE_NAME = 'metricheck-shell-v1';

const STATIC_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png'
];

// 1. Install Event — Precache essential shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline application shell');
      return cache.addAll(STATIC_SHELL_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 2. Activate Event — Clean up outdated caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Purging legacy cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. Fetch Event — Network-first for dynamic API & AI endpoints; Stale-while-revalidate for static shell; SPA navigation fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (e.g. POST, PUT, DELETE for inspections/auth)
  if (request.method !== 'GET') {
    return;
  }

  // Bypass API calls, AI inference endpoints, and external data queries (Always live network)
  if (url.pathname.startsWith('/api') || url.port === '4000' || url.port === '8000' || url.port === '8001') {
    return;
  }

  // SPA Navigation Request: HTML Page routing
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        // Fallback to cached index.html when offline
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match('/index.html');
        return cachedResponse || new Response('Offline: MetriCheck AI application is offline.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
    );
    return;
  }

  // Google Fonts & Static CDN Resources: Cache-first with fallback
  if (url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          return cached || new Response('', { status: 408, statusText: 'Font offline' });
        }
      })
    );
    return;
  }

  // Static Assets (JS, CSS, Images, SVGs, WOFF2): Stale-While-Revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request);
      
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch((err) => {
          return cachedResponse || new Response('', { status: 504, statusText: 'Asset offline' });
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. Message Event — Support manual update triggers from frontend UI
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
