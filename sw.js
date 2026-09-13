// Service Worker — هوا شات v15
// إصلاح: relative paths تعمل على أي domain أو subpath (GitHub Pages, Netlify, إلخ)

const CACHE_NAME    = 'hawa-v15-static';
const RUNTIME_CACHE = 'hawa-v15-runtime';
const OLD_CACHES = [
  'hawa-v1-static','hawa-v1-runtime',
  'hawa-v2-static','hawa-v2-runtime',
  'hawa-v3-static','hawa-v3-runtime',
  'hawa-v4-static','hawa-v4-runtime',
  'hawa-v5-static','hawa-v5-runtime',
  'hawa-v6-static','hawa-v6-runtime',
  'hawa-v7-static','hawa-v7-runtime',
  'hawa-v8-static','hawa-v8-runtime',
  'hawa-v9-static','hawa-v9-runtime',
  'hawa-v10-static','hawa-v10-runtime',
  'hawa-v11-static','hawa-v11-runtime',
  'hawa-v12-static','hawa-v12-runtime',
  'hawa-v13-static','hawa-v13-runtime',
  'hawa-v14-static','hawa-v14-runtime',
];

// الـ base path يُحسَب من موقع sw.js نفسه (يعمل على /HawaChat/ وعلى /)
var SW_SCOPE = self.registration.scope; // مثال: https://goodover7.github.io/HawaChat/

self.addEventListener('install', function(e) {
  self.skipWaiting();
  // precache الأصول الأساسية بـ full URL (من scope)
  var PRECACHE_URLS = [
    SW_SCOPE,                    // index.html
    SW_SCOPE + 'logo.png',
    SW_SCOPE + 'favicon.png',
    SW_SCOPE + 'manifest.json',
  ];
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS).catch(function() {});
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names
          .filter(function(n) { return n !== CACHE_NAME && n !== RUNTIME_CACHE; })
          .map(function(n) { return caches.delete(n); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// استقبال رسالة SKIP_WAITING من الصفحة
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;

  // شبكة-فقط: Supabase + APIs خارجية
  if (
    url.includes('supabase.co') || url.includes('supabase.in') ||
    url.includes('youtube')     || url.includes('googleapis') ||
    url.includes('s3cdn')       || url.includes('miaoda')
  ) return;

  // bundle JS الرئيسي: cache-first
  if (url.includes('/_expo/static/js/web/entry-') || url.includes('/_expo/static/')) {
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        if (cached) return cached;
        return fetch(e.request).then(function(resp) {
          if (resp && resp.status === 200) {
            var clone = resp.clone();
            caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
          }
          return resp;
        }).catch(function() {
          return caches.match(SW_SCOPE);
        });
      })
    );
    return;
  }

  // أصول ثابتة: cache-first مع network fallback
  if (
    url.includes('/assets/') ||
    url.match(/\.(png|jpg|jpeg|webp|svg|woff2?|ttf|otf|ico)(\?.*)?$/)
  ) {
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        if (cached) return cached;
        return fetch(e.request).then(function(resp) {
          if (resp && resp.status === 200) {
            var clone = resp.clone();
            caches.open(RUNTIME_CACHE).then(function(c) { c.put(e.request, clone); });
          }
          return resp;
        }).catch(function() {
          if (url.match(/\.(woff2?|ttf|otf)(\?.*)?$/)) {
            return new Response('', { status: 200, headers: { 'Content-Type': 'font/ttf' } });
          }
          return new Response('', { status: 404 });
        });
      })
    );
    return;
  }

  // HTML navigation: network-first لضمان أحدث نسخة
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(new Request(e.request, { cache: 'no-store' })).then(function(resp) {
        if (resp && resp.status === 200) {
          var clone = resp.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
        }
        return resp;
      }).catch(function() { return caches.match(SW_SCOPE); })
    );
    return;
  }
});
