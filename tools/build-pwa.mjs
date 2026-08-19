#!/usr/bin/env node
/**
 * Costruisce la versione installabile (PWA) a partire dal sorgente
 * dell'Artifact, che resta l'unica fonte di verità.
 *
 *   node tools/build-pwa.mjs
 *
 * Produce pwa/index.html, pwa/manifest.webmanifest e pwa/sw.js. Le icone
 * stanno in pwa/icone/ e si rigenerano con tools/build-icone.mjs.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const SRC = 'fitness/ghisa-e-grammi/app.html';
const OUT = 'pwa';
const corpo = fs.readFileSync(SRC, 'utf8');

const titolo = (corpo.match(/<title>([\s\S]*?)<\/title>/) ?? [, 'Ghisa &amp; Grammi'])[1];
const senzaTitolo = corpo.replace(/<title>[\s\S]*?<\/title>\s*/, '');
const versione = crypto.createHash('sha256').update(corpo).digest('hex').slice(0, 10);

const descrizione = 'Allenamento e alimentazione, giorno per giorno: carichi, '
  + 'progressioni, protocolli e pasti in grammi risolti sul target della fase.';

const testa = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${titolo}</title>
<meta name="description" content="${descrizione}">
<meta name="theme-color" content="#EAEDEC" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0B0F12" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Ghisa &amp; Grammi">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icone/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="icone/icona-192.png">
<style>:root{color-scheme:light dark}*{box-sizing:border-box}body{margin:0}img{max-width:100%}</style>
<script>window.__GG_BUILD='${versione}';</script>
</head>
<body>
`;

const coda = `
<div class="agg" id="agg" hidden role="status">
  <span>Nuova versione pronta</span>
  <button class="btn sm" id="aggOra">Ricarica</button>
</div>
<style>
.agg{position:fixed;left:50%;transform:translateX(-50%);z-index:90;
  bottom:calc(var(--tab-h) + 22px + env(safe-area-inset-bottom));
  display:flex;align-items:center;gap:12px;padding:9px 12px 9px 17px;border-radius:999px;
  background:var(--solid);color:var(--on-solid);box-shadow:var(--shadow-2);font-size:14px}
.agg .btn{border-color:color-mix(in srgb,var(--on-solid) 35%,transparent);color:var(--on-solid)}
@media (min-width:900px){.agg{bottom:26px}}
.installa{margin:0 0 16px;display:flex;gap:11px;align-items:flex-start;padding:13px 15px;
  border-radius:var(--r);background:var(--accent-soft);color:var(--accent-text);font-size:13.5px;line-height:1.45}
.installa b{display:block;font-family:var(--display);font-size:12px;letter-spacing:.1em;text-transform:uppercase}
.installa button{margin-left:auto;color:inherit;opacity:.7;font-size:20px;line-height:1;padding:0 4px}
</style>
<script>
(function(){
  "use strict";
  // ── service worker: la pagina funziona anche senza campo, in palestra ──
  //
  // Su iPhone una PWA aperta dalla schermata Home spesso NON rifa' la
  // navigazione quando la riapri: riprende la pagina che era in memoria. Senza
  // navigazione il browser non controlla sw.js, e l'aggiornamento non arriva
  // mai da solo. Per questo qui:
  //   1. updateViaCache:'none' — sw.js non viene mai preso dalla cache HTTP;
  //   2. reg.update() al caricamento e ogni volta che l'app torna in primo
  //      piano (al massimo una volta al minuto);
  //   3. si guarda anche reg.waiting, perche' l'aggiornamento puo' essersi
  //      installato mentre la pagina non stava ascoltando: in quel caso
  //      'updatefound' e' gia' passato e senza questo controllo l'avviso non
  //      comparirebbe piu'.
  if ('serviceWorker' in navigator) {
    var REG = null, ultimo = 0;

    function mostra(nuovo){
      if (!nuovo) return;
      var box = document.getElementById('agg');
      if (!box || !box.hidden) return;
      box.hidden = false;
      document.getElementById('aggOra').onclick = function(){
        nuovo.postMessage('attiva');
        nuovo.addEventListener('statechange', function(){
          if (nuovo.state === 'activated') location.reload();
        });
        // se per qualche motivo lo statechange non arriva, si ricarica comunque
        setTimeout(function(){ location.reload(); }, 1500);
      };
    }
    function segui(nuovo){
      if (!nuovo) return;
      if (nuovo.state === 'installed') return mostra(nuovo);
      nuovo.addEventListener('statechange', function(){
        if (nuovo.state === 'installed' && navigator.serviceWorker.controller) mostra(nuovo);
      });
    }
    function controlla(){
      if (!REG) return;
      var ora = Date.now();
      if (ora - ultimo < 60000) return;
      ultimo = ora;
      REG.update().catch(function(){ /* offline: si riprova alla prossima apertura */ });
    }

    window.addEventListener('load', function(){
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function(reg){
        REG = reg;
        if (reg.waiting && navigator.serviceWorker.controller) mostra(reg.waiting);
        segui(reg.installing);
        reg.addEventListener('updatefound', function(){ segui(reg.installing); });
        ultimo = Date.now();
        setTimeout(function(){ ultimo = 0; controlla(); }, 3000);
      }).catch(function(){ /* senza service worker l'app funziona lo stesso */ });
    });

    document.addEventListener('visibilitychange', function(){
      if (document.visibilityState === 'visible') controlla();
    });
    window.addEventListener('online', function(){ ultimo = 0; controlla(); });

    // Quando il service worker nuovo prende il controllo, la pagina che stai
    // guardando e' ancora quella vecchia: si ricarica da sola, una volta sola.
    // Solo se la pagina era gia' controllata: alla primissima installazione il
    // controllo arriva per la prima volta e non c'e' niente da aggiornare.
    var eraControllata = !!navigator.serviceWorker.controller;
    var ricaricato = false;
    navigator.serviceWorker.addEventListener('controllerchange', function(){
      if (!eraControllata || ricaricato) return;
      ricaricato = true;
      location.reload();
    });
    navigator.serviceWorker.addEventListener('message', function(ev){
      if (ev.data && ev.data.gg === 'aggiornata' && !ricaricato) {
        ricaricato = true;
        setTimeout(function(){ location.reload(); }, 400);
      }
    });
  }
  // ── suggerimento d'installazione, solo su iPhone e solo se non installata ──
  var standalone = window.matchMedia('(display-mode: standalone)').matches
                || window.navigator.standalone === true;
  var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (!standalone && iOS && !localStorage.getItem('gg.installa.visto')) {
    window.addEventListener('load', function(){
      var main = document.querySelector('main');
      if (!main) return;
      var el = document.createElement('div');
      el.className = 'installa';
      el.innerHTML = '<div><b>Mettila sulla schermata Home</b>'
        + 'Tocca Condividi in fondo a Safari, poi "Aggiungi a Home". Si apre a schermo intero, '
        + 'funziona senza campo e i dati non vengono più cancellati dopo una settimana.</div>'
        + '<button aria-label="Ho capito">&times;</button>';
      el.querySelector('button').onclick = function(){
        localStorage.setItem('gg.installa.visto', '1');
        el.remove();
      };
      main.insertBefore(el, main.firstChild);
    });
  }
})();
</script>
</body>
</html>
`;

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), testa + senzaTitolo + coda);

fs.writeFileSync(path.join(OUT, 'manifest.webmanifest'), JSON.stringify({
  name: 'Ghisa & Grammi',
  short_name: 'Ghisa & Grammi',
  description: descrizione,
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#0B0F12',
  theme_color: '#0B0F12',
  lang: 'it',
  categories: ['health', 'fitness', 'lifestyle'],
  icons: [
    { src: 'icone/icona-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icone/icona-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icone/icona-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2));

fs.writeFileSync(path.join(OUT, 'sw.js'), `/* Ghisa & Grammi — service worker, versione ${versione} */
const CACHE = 'ghisa-e-grammi-${versione}';
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
    for (const c of clienti) { try { c.postMessage({ gg: 'aggiornata', versione: '${versione}' }); } catch (e) {} }
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
`);

const kb = n => Math.round(fs.statSync(path.join(OUT, n)).size / 1024);
console.log(`PWA costruita da ${SRC}`);
console.log(`  index.html            ${kb('index.html')} KB`);
console.log(`  manifest.webmanifest  ${kb('manifest.webmanifest')} KB`);
console.log(`  sw.js                 ${kb('sw.js')} KB  (cache ${versione})`);
