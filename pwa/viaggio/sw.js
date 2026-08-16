/* Alpi, Soča & Quarnero — service worker, versione 2ce64cb68a */
const CACHE = 'viaggio-2ce64cb68a';
const GUSCIO = ['./', './index.html', './manifest.webmanifest',
  './icone/icona-192.png', './icone/icona-512.png',
  './icone/icona-maskable-512.png', './icone/apple-touch-icon.png'];

// Sotto lo stesso dominio vivono più app: questa tratta solo il proprio
// indice. Senza il controllo, il service worker alla radice — che ha scope
// sull'intero sito — intercetterebbe anche le pagine delle altre e si
// salverebbe la loro come proprio guscio offline.
const BASE = new URL('./', self.location).pathname;
const mio = p => p === BASE || p === BASE + 'index.html';
// Le vecchie versioni da buttare sono solo le proprie: le cache delle altre
// app dello stesso dominio vanno lasciate stare, o si cancellano il guscio
// offline a vicenda a ogni aggiornamento.
const miaCache = k => k.startsWith('viaggio-');

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(GUSCIO)));
});
self.addEventListener('activate', ev => {
  ev.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(x => miaCache(x) && x !== CACHE).map(x => caches.delete(x))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', ev => { if (ev.data === 'attiva') self.skipWaiting(); });

// La pagina: prima la rete, così un aggiornamento arriva appena c'è campo;
// se la rete non c'è si serve la copia in cache e l'app si apre lo stesso.
self.addEventListener('fetch', ev => {
  const req = ev.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    if (!mio(url.pathname)) return;
    ev.respondWith(
      fetch(req).then(r => {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copia));
        return r;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  if (!url.pathname.startsWith(BASE)) return;
  ev.respondWith(caches.match(req).then(c => c || fetch(req)));
});
