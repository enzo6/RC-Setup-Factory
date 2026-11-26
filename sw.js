const CACHE = 'rc-setup-v179';
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.add(new Request('./index.html', {cache: 'reload'}));
    await Promise.all(['./', './manifest.json', './icon.png', './icon512.png'].map(async url => {
      try { await cache.add(new Request(url, {cache: 'reload'})); } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('rc-setup-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      if (response.ok) {
        try { await cache.put(request, response.clone()); } catch (_) {}
      }
      return response;
    } catch (_) {
      return (await cache.match(request)) || (request.mode === 'navigate' ? await cache.match('./index.html') : undefined) || Response.error();
    }
  })());
});
