/**
 * JsonlintPlus Service Worker
 * - Network-first for HTML (index) to avoid serving stale UI
 * - Stale-while-revalidate for versioned assets in /assets/js and /assets/css
 * - Cache-first for icons and images
 * - Safe defaults for cross-origin requests (bypass caching)
 */

const CACHE_PREFIX = 'jsonlintplus';
const VERSION = 'v1';
const STATIC_CACHE = `${CACHE_PREFIX}-static-${VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-${VERSION}`;

// Pre-cache only minimal core shell (avoid hashed assets to prevent mismatch)
const PRECACHE_URLS = [
  '/',                // root
  '/index.html',      // SPA shell
  '/manifest.json'    // PWA manifest
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {/* ignore */})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches by prefix
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only cache GET requests
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Restrict to same-origin
  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin) return;

  // HTML shell: network-first to keep UI fresh
  if (isHtml(url)) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Versioned app assets: stale-while-revalidate for quick loads + freshness
  if (isHashedAsset(url)) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // Icons and images: cache-first (they rarely change)
  if (isImage(url)) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Default: pass-through network (no caching)
});

function isHtml(url) {
  return url.pathname === '/' || url.pathname.endsWith('/index.html');
}

function isHashedAsset(url) {
  // Matches /assets/css/*.hash.css or /assets/js/*.hash.js
  return url.pathname.startsWith('/assets/css/') || url.pathname.startsWith('/assets/js/');
}

function isImage(url) {
  return url.pathname.startsWith('/icons/') || /\.(png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname);
}

async function networkFirst(req) {
  try {
    const fresh = await fetch(req);
    // Optionally update cache
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(req, fresh.clone());
    return fresh;
  } catch (_) {
    // Fallback to cache
    const cached = await caches.match(req);
    if (cached) return cached;
    // As a last resort, try serving pre-cached shell
    if (req.mode === 'navigate') {
      const fallback = await caches.match('/index.html');
      if (fallback) return fallback;
    }
    throw _;
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(req);
  const networkPromise = fetch(req)
    .then((res) => {
      // Successful response updates cache
      if (res && res.status === 200) {
        cache.put(req, res.clone());
      }
      return res;
    })
    .catch(() => null);

  // Return cached quickly, otherwise wait for network
  return cached || (await networkPromise) || fetch(req);
}

async function cacheFirst(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res && res.status === 200) {
    cache.put(req, res.clone());
  }
  return res;
}