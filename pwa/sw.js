/* Ghisa & Grammi — service worker, versione 25ccc3e0fa */
const CACHE = 'ghisa-e-grammi-25ccc3e0fa';
const GUSCIO = ['./', './index.html', './manifest.webmanifest',
  './icone/icona-192.png', './icone/icona-512.png',
  './icone/icona-maskable-512.png', './icone/apple-touch-icon.png'];

/* Sempre dalla rete vera, mai dalla cache HTTP del browser: GitHub Pages serve
   l'HTML con un max-age breve ma non nullo, e senza no-store la pagina "nuova"
   che arrivava era ancora quella vecchia. E' il motivo per cui l'app installata
   restava indietro anche dopo aver ricaricato. */
const dallaRete = u => fetch(u, { cache: 'no-store', credentials: 'same-origin' });

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c =>
    Promise.all(GUSCIO.map(u => dallaRete(u).then(r => r.ok && c.put(u, r))))));
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
      dallaRete(req.url).then(r => {
        if (!r.ok) throw new Error('risposta ' + r.status);
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copia));
        return r;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  ev.respondWith(caches.match(req).then(c => c || fetch(req)));
});
