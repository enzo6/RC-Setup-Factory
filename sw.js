const CACHE = 'rc-setup-v205';
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
const OCR_CACHE='rc-ocr-assets-v1';
const OCR_URLS=new Set(["https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js", "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js", "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-lstm.wasm.js", "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-lstm.wasm", "https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0_best_int/eng.traineddata.gz"]);
self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.method==='GET' && OCR_URLS.has(request.url)){event.respondWith((async()=>{const cache=await caches.open(OCR_CACHE);const hit=await cache.match(request.url);if(hit)return hit;const response=await fetch(request.url,{mode:'cors'});if(response.ok)await cache.put(request.url,response.clone());return response})());return;}
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
