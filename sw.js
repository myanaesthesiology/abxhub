'use strict';

const CACHE = 'abxhub-v0.16.0';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css?v=0.16.0',
  './app.js?v=0.16.0',
  './manifest.webmanifest?v=0.16.0',
  './data/clinical-data.json',
  './data/nag-topics.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => (k.startsWith('abxhub-') || k.startsWith('abx-critical-')) && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never cache external live guideline pages

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  if (url.pathname.includes('/data/')) {
    event.respondWith(
      fetch(req).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Bundled guideline PDFs are intentionally not pre-cached to keep installation light.
  // A complete 200 response is cached after first opening; range/partial responses are served normally.
  if (url.pathname.includes('/references/')) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.status === 200 && !req.headers.has('range')) caches.open(CACHE).then(c => c.put(req, res.clone())).catch(()=>{});
        return res;
      }).catch(() => caches.match(req)))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
      return res;
    }))
  );
});
