// ══════════════════════════════════════════
//  SANARIA — sw.js (Service Worker)
//  ئەم فایلە پێشتر دانێ — کار دەکات ئۆفلاین
// ══════════════════════════════════════════

var CACHE_NAME = 'sanaria-v2';

// فایلەکانی کەشکردن
var CACHE_FILES = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/config.js',
  '/firebase.js',
  '/ads.js',
  '/otp.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700;800&display=swap',
];

// ── INSTALL ────────────────────────────────
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(CACHE_FILES.filter(function(url){
        // تەنها فایلە سەرەکیەکان کەش بکە
        return !url.includes('firebase') && !url.includes('googleapis');
      }));
    }).catch(function(err){ console.warn('Cache install:', err); })
  );
  self.skipWaiting();
});

// ── ACTIVATE ───────────────────────────────
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// ── FETCH ──────────────────────────────────
self.addEventListener('fetch', function (e) {
  // Firebase و Sheets requests — هەرگیز کەش نەکە
  if (e.request.url.includes('firebase') ||
      e.request.url.includes('googleapis') ||
      e.request.url.includes('firestore') ||
      e.request.url.includes('google.com/macros') ||
      e.request.method !== 'GET') {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function (cached) {
      // ئەگەر کەشکراوە بیدەرەوە، هەروەها لە پشت نوێ بکەرەوە
      var fetchPromise = fetch(e.request).then(function (response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function () { return cached; });

      return cached || fetchPromise;
    })
  );
});
