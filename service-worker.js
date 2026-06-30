// Service Worker using Workbox (loaded from CDN)
// Handles:
//   - Precaching: static assets (CSS, JS) served immediately from cache
//   - Runtime caching: API calls and images cached after first fetch
//   - Offline fallback: if a navigation fails (no network), show a cached page

importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const { precacheAndRoute, createHandlerBoundToURL } = workbox.precaching;
const { registerRoute, NavigationRoute }             = workbox.routing;
const { NetworkFirst, CacheFirst, StaleWhileRevalidate } = workbox.strategies;
const { ExpirationPlugin }  = workbox.expiration;
const { CacheableResponsePlugin } = workbox.cacheableResponse;

// ── Precache: these files are cached immediately on install ──────────────────
// Add your versioned static assets here.
precacheAndRoute([
  { url: '/static/css/style.css',      revision: '1' },
  { url: '/static/js/db.js',           revision: '1' },
  { url: '/static/js/main.js',         revision: '1' },
  { url: '/static/js/prediction.js',   revision: '1' },
  { url: '/static/js/playoffs.js',     revision: '1' },
  { url: '/static/js/bracket.js',      revision: '1' },
  { url: '/static/js/nrl.js',          revision: '1' },
  { url: '/static/js/nrl-teams.js',    revision: '1' },
  { url: '/static/js/nrl-standings.js',revision: '1' },
]);

// ── Runtime: TheSportsDB API responses ──────────────────────────────────────
// NetworkFirst: always try the network for fresh data, fall back to cache if offline
registerRoute(
  ({ url }) => url.hostname === 'www.thesportsdb.com',
  new NetworkFirst({
    cacheName: 'sportsdb-api',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 }) // 1 hour
    ]
  })
);

// ── Runtime: Team badge images ───────────────────────────────────────────────
// CacheFirst: badges change rarely; serve from cache instantly, update in background
registerRoute(
  ({ url }) => url.hostname.includes('thesportsdb.com') && url.pathname.includes('/images/'),
  new CacheFirst({
    cacheName: 'team-badges',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 }) // 1 week
    ]
  })
);

// ── Runtime: Google Fonts ───────────────────────────────────────────────────
registerRoute(
  ({ url }) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 })
    ]
  })
);