const CACHE_NAME = 'arkya-store-v3';
// Límite de entradas en caché dinámico: el catálogo tiene miles de
// imágenes y sin límite el storage del navegador crece sin control.
const MAX_CACHE_ITEMS = 250;
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/images/logo.png',
  '/images/hero1.webp',
];

async function trimCache(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_CACHE_ITEMS) return;
  await Promise.all(
    keys.slice(0, keys.length - MAX_CACHE_ITEMS).map((k) => cache.delete(k))
  );
}

// Instalar: cachear assets estáticos básicos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).catch(() => {})
  );
  self.skipWaiting();
});

// Activar: limpiar caches viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first para HTML, cache-first para el resto
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignorar requests no-GET y cross-origin (CDN de imágenes, APIs, etc.)
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  // Para páginas HTML (navegación): network-first
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Para imágenes y estáticos: cache-first con límite de tamaño
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(async (cache) => {
            await cache.put(request, clone);
            trimCache(cache);
          });
        }
        return response;
      });
    })
  );
});
