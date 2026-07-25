const CACHE_NAME = 'mosalo-v6';
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Network-only for API/function calls, supabase and auth (never cache dynamic data)
  if (
    event.request.url.includes('supabase.co') ||
    event.request.url.includes('/auth/') ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('/.netlify/') ||
    event.request.url.includes('/external-jobs.json') ||
    event.request.url.includes('/vagas-data/')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Navigation pages: network-first with no HTTP-cache, to avoid stale 301/redirects
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        return caches.match(event.request).then((cached) => cached || caches.match('/offline.html'));
      })
    );
    return;
  }

  // Stale-while-revalidate for static assets
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cached) => {
        const fetched = fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => cached);

        return cached || fetched;
      });
    })
  );
});

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'MÔ SALO', {
        body: data.body || 'Nova notificação',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/favicon-32x32.png',
        vibrate: [100, 50, 100],
        data: { url: data.url || '/' }
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
