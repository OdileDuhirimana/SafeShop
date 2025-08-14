const SS_VERSION = 'v1'
const STATIC_CACHE = `safeshop-static-${SS_VERSION}`
const API_CACHE = `safeshop-api-${SS_VERSION}`
const IMG_CACHE = `safeshop-images-${SS_VERSION}`
const GEN_CACHE = `safeshop-cache-${SS_VERSION}`

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll([
    '/offline.html',
    '/',
  ])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => ![STATIC_CACHE, API_CACHE, IMG_CACHE, GEN_CACHE].includes(k)).map(k => caches.delete(k)));
    await clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Navigation requests: try network, then offline fallback
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preloadResp = await event.preloadResponse;
        if (preloadResp) return preloadResp;
        const networkResp = await fetch(req);
        return networkResp;
      } catch (e) {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match('/offline.html');
        return cached || new Response('Offline', { status: 503 });
      }
    })());
    return;
  }

  // API GET requests: stale-while-revalidate
  if (req.method === 'GET' && new URL(req.url).pathname.startsWith('/api/')) {
    event.respondWith((async () => {
      const cache = await caches.open(API_CACHE);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then(res => {
        if (res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })());
    return;
  }

  // Same-origin images: cache first
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const isImage = url.origin === self.location.origin && /\.(png|jpg|jpeg|gif|webp|svg)$/.test(url.pathname);
    if (isImage) {
      event.respondWith((async () => {
        const cache = await caches.open(IMG_CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch (e) {
          return cached || Response.error();
        }
      })());
      return;
    }
  }

  // Other GET requests: cache-first then network
  if (req.method === 'GET') {
    event.respondWith(caches.open(GEN_CACHE).then(async cache => {
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res.status === 200 && res.type === 'basic') cache.put(req, res.clone());
        return res;
      } catch (e) {
        return cached || Promise.reject(e);
      }
    }));
  }
});
