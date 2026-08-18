/* Ghisa & Grammi — service worker, versione 690e0c136d */
const CACHE = 'ghisa-e-grammi-690e0c136d';
const GUSCIO = ['./', './index.html', './manifest.webmanifest',
  './icone/icona-192.png', './icone/icona-512.png',
  './icone/icona-maskable-512.png', './icone/apple-touch-icon.png'];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(GUSCIO)));
});
self.addEventListener('activate', ev => {
  ev.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', ev => { if (ev.data === 'attiva') self.skipWaiting(); });

// La pagina: prima la rete, così un aggiornamento arriva appena c'è campo;
// se la rete non c'è si serve la copia in cache e l'app si apre lo stesso.
self.addEventListener('fetch', ev => {
  const req = ev.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    ev.respondWith(
      fetch(req).then(r => {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copia));
        return r;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  ev.respondWith(caches.match(req).then(c => c || fetch(req)));
});
