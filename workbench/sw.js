/* === Workbench Offline Service Worker (r14) === */
const CACHE_NAME = 'wb-cache-20261120-r14';
const SHELL_PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './shared/portal.css',
  './shared/portal.js',
  './shared/modules/calculus_special_labs.js',
  './books_data/global_search_meta.js',
  './books_data/cross_search_data.js',
  './shared/workbench.css',
  './shared/ui_polish.css',
  './shared/storage_idb.js',
  './shared/ui_polish.js',
  './shared/modules/ai_client.js',
  './shared/modules/stem_ai_exam.js',
  './shared/workbench_engine.js',
  './shared/workbench_addons.js',
  './shared/mastery_suite.js',
  './shared/tree3d.js',
  './shared/modules/roadmap.js',
  './shared/modules/viz_engine.js',
  './shared/modules/glossary_pedagogy.js',
  './shared/modules/algo_tree.js',
  './shared/modules/ai_assistant.js',
  './shared/modules/vp_stress.js',
  './books_data/catalog.js',
  './vendor/katex/katex.min.css',
  './vendor/katex/katex.min.js',
  './vendor/katex/auto-render.min.js',
  './vendor/katex/fonts/KaTeX_AMS-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Caligraphic-Bold.woff2',
  './vendor/katex/fonts/KaTeX_Caligraphic-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Fraktur-Bold.woff2',
  './vendor/katex/fonts/KaTeX_Fraktur-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Main-Bold.woff2',
  './vendor/katex/fonts/KaTeX_Main-BoldItalic.woff2',
  './vendor/katex/fonts/KaTeX_Main-Italic.woff2',
  './vendor/katex/fonts/KaTeX_Main-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Math-BoldItalic.woff2',
  './vendor/katex/fonts/KaTeX_Math-Italic.woff2',
  './vendor/katex/fonts/KaTeX_SansSerif-Bold.woff2',
  './vendor/katex/fonts/KaTeX_SansSerif-Italic.woff2',
  './vendor/katex/fonts/KaTeX_SansSerif-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Script-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Size1-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Size2-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Size3-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Size4-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Typewriter-Regular.woff2',
];

const API_PREFIXES = ['/run', '/stress', '/ai_chat', '/fetch_oj', '/ai_news', '/health', '/sync_state', '/mobile_connect'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.searchParams.has('token')) return;
  if (API_PREFIXES.some((p) => url.pathname === p || url.pathname.startsWith(p + '/'))) return;

  // 1. HTML pages: Network-First with Cache fallback (ignoreSearch so non-token query params still match)
  if (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  // 2. Large subject data & books (excluding offline_manifest.json): Cache-First with safe offline catch
  if ((url.pathname.includes('/data/') && !url.pathname.endsWith('offline_manifest.json')) || url.pathname.includes('/books_data/')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => new Response('/* Offline: resource not cached */', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }));
      })
    );
    return;
  }

  // 3. Shared shell / vendor / icons / offline_manifest.json: Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const netFetch = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || netFetch;
    })
  );
});
