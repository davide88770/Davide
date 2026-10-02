/* Soldi di Davide — service worker, v1 · a2292ac06c */
const CACHE = 'soldi-a2292ac06c';
const PREFISSO = 'soldi-';
const GUSCIO = ['./', './config.js', './vendor/chart.umd.js', './vendor/supabase.js', './vendor/manrope-latin-wght-normal.woff2', './vendor/manrope-latin-ext-wght-normal.woff2', './icone/icona-32.png', './icone/icona-192.png', './icone/icona-512.png', './icone/apple-touch-icon.png', './manifest.webmanifest'];

/* Lo stesso dominio ospita altre app (Ghisa & Grammi alla radice, i road book
   nelle sottocartelle). Questo service worker risponde solo dentro /soldi/:
   lo garantisce lo scope, e qui lo si ricontrolla. */
const BASE = new URL('./', self.location).pathname;
const mio = u => new URL(u).pathname.startsWith(BASE);

/* Sempre dalla rete vera, mai dalla cache HTTP del browser: GitHub Pages serve
   con max-age=600, e senza no-store la "versione nuova" poteva essere quella
   vecchia (è il bug che teneva indietro Ghisa & Grammi su iPhone). */
const dallaRete = u => fetch(u, { cache: 'no-store', credentials: 'same-origin' });

self.addEventListener('install', ev => {
  self.skipWaiting();
  ev.waitUntil(caches.open(CACHE).then(c =>
    Promise.all(GUSCIO.map(u => dallaRete(u).then(r => { if (r.ok) return c.put(u, r); })))));
});

self.addEventListener('activate', ev => {
  ev.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith(PREFISSO) && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message', ev => { if (ev.data === 'attiva') self.skipWaiting(); });

self.addEventListener('fetch', ev => {
  const req = ev.request;
  // Supabase e qualunque altro indirizzo esterno: mai toccati, mai in cache.
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin || !mio(req.url)) return;

  // La pagina: prima la rete (con 4 secondi di pazienza, poi la copia in
  // cache), così una versione nuova arriva appena c'è campo e senza campo
  // l'app si apre lo stesso.
  if (req.mode === 'navigate') {
    ev.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const rete = dallaRete(BASE).then(r => {
        if (!r.ok) throw new Error('risposta ' + r.status);
        cache.put('./', r.clone());
        return r;
      });
      rete.catch(() => {});
      const attesa = new Promise(ok => setTimeout(ok, 4000));
      try {
        const r = await Promise.race([rete, attesa]);
        if (r) return r;
      } catch (e) { /* offline: si passa alla cache */ }
      return (await cache.match('./')) || rete;
    })());
    return;
  }

  // Tutto il resto (script, font, icone, config): stale-while-revalidate.
  // Si risponde subito dalla cache e intanto si aggiorna la copia.
  ev.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const inCache = await cache.match(req, { ignoreSearch: true });
    const fresco = dallaRete(req.url).then(r => { if (r.ok) cache.put(req, r.clone()); return r; });
    if (inCache) { ev.waitUntil(fresco.catch(() => {})); return inCache; }
    return fresco;
  })());
});
