/* Ghisa & Grammi — service worker, versione 847dbfdb1e */
const CACHE = 'ghisa-e-grammi-847dbfdb1e';
const GUSCIO = ['./', './index.html', './manifest.webmanifest',
  './icone/icona-192.png', './icone/icona-512.png',
  './icone/icona-maskable-512.png', './icone/apple-touch-icon.png'];

/* Sempre dalla rete vera, mai dalla cache HTTP del browser: GitHub Pages serve
   l'HTML con un max-age breve ma non nullo, e senza no-store la pagina "nuova"
   che arrivava era ancora quella vecchia. E' il motivo per cui l'app installata
   restava indietro anche dopo aver ricaricato. */
const dallaRete = u => fetch(u, { cache: 'no-store', credentials: 'same-origin' });

/* skipWaiting subito, senza aspettare che qualcuno tocchi un pulsante: la
   versione nuova prende il posto della vecchia da sola. Si puo' fare perche'
   l'app e' un unico file HTML — non ci sono pezzi di due versioni diverse che
   rischiano di incontrarsi. */
self.addEventListener('install', ev => {
  self.skipWaiting();
  ev.waitUntil(caches.open(CACHE).then(c =>
    Promise.all(GUSCIO.map(u => dallaRete(u).then(r => r.ok && c.put(u, r))))));
});

self.addEventListener('activate', ev => {
  ev.waitUntil((async () => {
    const chiavi = await caches.keys();
    /* Se c'era una cache di una versione precedente, questo e' un aggiornamento
       e non una prima installazione. Il segnale sta nella cache e non in una
       variabile, perche' il service worker puo' essere spento e riacceso fra
       install e activate. */
    const vecchie = chiavi.filter(k => k.startsWith('ghisa-e-grammi-') && k !== CACHE);
    await Promise.all(vecchie.map(k => caches.delete(k)));
    await self.clients.claim();
    if (!vecchie.length) return;

    /* La pagina che l'utente ha davanti e' ancora quella vecchia: sta in
       memoria e non ricarica da sola. Qui la si ricarica dal service worker,
       che funziona anche con le versioni installate prima di questo codice —
       e' l'unico modo di aggiornare un'app gia' sul telefono senza chiedere
       niente a chi la usa.
       Prima si avvisa la pagina (le versioni nuove salvano e ricaricano da
       sole), poi si aspetta un attimo perche' il salvataggio su localStorage e'
       ritardato di 220 ms, poi si naviga. */
    const clienti = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of clienti) { try { c.postMessage({ gg: 'aggiornata', versione: '847dbfdb1e' }); } catch (e) {} }
    await new Promise(r => setTimeout(r, 1200));
    for (const c of clienti) {
      if (typeof c.navigate !== 'function') continue;
      try { await c.navigate(c.url); } catch (e) { /* niente da fare: resta il pulsante Ricarica */ }
    }
  })());
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
