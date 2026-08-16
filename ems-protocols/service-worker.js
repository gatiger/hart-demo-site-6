const CACHE_NAME = 'hcems-protocols-v98';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './assets/Hart_EMS_Banner.webp',
  './assets/legend-documentation.webp',
  './assets/legend-important.webp',
  './assets/legend-medical-control.webp',
  './assets/pediatric-pain-rating-scale.png',
  './assets/lvad-heartmate-ii.jpg',
  './assets/lvad-heartware-hvad.jpg',
  './assets/lvad-heartmate-3.jpg',
  './assets/lvad-monitor-without-lvad.png',
  './assets/lvad-monitor-with-lvad.png',
  './page-images/page-211.jpg',
  './content/ems_protocols_content.json',
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match(event.request))
  );
});
