/* ATHENEA PWA — service worker: red primero, caché como respaldo (offline).
 *
 * La caché lleva el ORIGEN del despliegue en el nombre: el flujo de
 * publicación sustituye 5a8b845 por el SHA corto del commit fuente. Así cada
 * despliegue estrena caché, y `activate` borra las de despliegues anteriores —
 * sin limpieza, un teléfono podía quedarse sirviendo respaldo viejo para
 * siempre y nadie lo sabría. En local (sin sustitución) el nombre queda
 * estable y el comportamiento es el mismo.
 */
const CACHE = "athenea-5a8b845";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c =>
    c.addAll(["./", "./index.html", "./cerebro.html", "./manifest.json"]).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const nombres = await caches.keys();
    await Promise.all(nombres.filter(n => n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copia = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia)).catch(() => {});
      return r;
    }).catch(() => caches.match(e.request))
  );
});
