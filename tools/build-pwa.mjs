#!/usr/bin/env node
/**
 * Costruisce le versioni installabili (PWA) a partire dai sorgenti degli
 * Artifact, che restano l'unica fonte di verità.
 *
 *   node tools/build-pwa.mjs [id ...]
 *
 * Senza argomenti costruisce tutte le app dichiarate in tools/app-pwa.mjs.
 * Per ciascuna produce <out>/index.html, manifest.webmanifest e sw.js; le
 * icone stanno in <out>/icone/ e si rigenerano con tools/build-icone.mjs.
 *
 * Ogni app ha la sua cartella e la sua cache: `pwa/` sta alla radice di
 * GitHub Pages e le altre in sottocartelle, così le app installate sul
 * telefono non si sovrascrivono a vicenda.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { APP } from './app-pwa.mjs';

const richieste = process.argv.slice(2);
for (const id of richieste) {
  if (!APP[id]) { console.error(`app sconosciuta: ${id}`); process.exit(2); }
}
const daFare = richieste.length ? richieste : Object.keys(APP);

for (const id of daFare) costruisci(id, APP[id]);

function costruisci(id, app) {
const SRC = app.src;
const OUT = app.out;
const corpo = fs.readFileSync(SRC, 'utf8');

const titolo = (corpo.match(/<title>([\s\S]*?)<\/title>/) ?? [, app.titoloRipiego])[1];
const senzaTitolo = corpo.replace(/<title>[\s\S]*?<\/title>\s*/, '');
const versione = crypto.createHash('sha256').update(corpo).digest('hex').slice(0, 10);

const descrizione = app.descrizione;

const testa = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${titolo}</title>
<meta name="description" content="${descrizione}">
<meta name="theme-color" content="${app.temaChiaro}" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="${app.temaScuro}" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="${app.nomeBreve.replace(/&/g, '&amp;')}">
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
${app.stile}
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
  if (!standalone && iOS && !localStorage.getItem('${app.chiaveInstalla}')) {
    window.addEventListener('load', function(){
      var main = document.querySelector('main');
      if (!main) return;
      var el = document.createElement('div');
      el.className = 'installa';
      el.innerHTML = '<div><b>Mettila sulla schermata Home</b>'
        + ${app.installa}
        + '<button aria-label="Ho capito">&times;</button>';
      el.querySelector('button').onclick = function(){
        localStorage.setItem('${app.chiaveInstalla}', '1');
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

const manifest = {
  name: app.nome,
  short_name: app.nomeBreve,
  description: descrizione,
  start_url: './',
  scope: './',
  display: 'standalone',
  ...(app.orientamento ? { orientation: app.orientamento } : {}),
  background_color: app.sfondo,
  theme_color: app.tema,
  lang: 'it',
  categories: app.categorie,
  icons: [
    { src: 'icone/icona-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icone/icona-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icone/icona-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};
fs.writeFileSync(path.join(OUT, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));

fs.writeFileSync(path.join(OUT, 'sw.js'), `/* ${app.nome} — service worker, versione ${versione} */
const CACHE = '${app.cache}-${versione}';
const GUSCIO = ${app.guscio};

/* Le due app stanno sullo stesso dominio: Ghisa & Grammi alla radice e il road
   book in /giordania/. Il service worker della radice ha per forza uno scope
   che contiene anche l'altra, quindi qui si dichiara esattamente quali
   indirizzi sono suoi. Senza questo, aprire /giordania/ mentre e' attivo il
   service worker della radice salvava il road book come pagina offline di
   Ghisa & Grammi: senza campo, l'app fitness avrebbe aperto la Giordania. */
const BASE = new URL('./', self.location).pathname;
const MIE = new Set([BASE, BASE + 'index.html']);
const miaNavigazione = req => MIE.has(new URL(req.url).pathname);

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
    const vecchie = chiavi.filter(k => k.startsWith('${app.cache}-') && k !== CACHE);
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
    if (!miaNavigazione(req)) return;   // e' una pagina dell'altra app: non la tocco
    ev.respondWith(
      dallaRete(req.url).then(r => {
        if (!r.ok) throw new Error('risposta ' + r.status);
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copia));
        return r;
      }).catch(() => caches.open(CACHE).then(c => c.match('./index.html')))
    );
    return;
  }
  ev.respondWith(caches.open(CACHE).then(c => c.match(req)).then(r => r || fetch(req)));
});
`);

const kb = n => Math.round(fs.statSync(path.join(OUT, n)).size / 1024);
console.log(`${app.nome} — costruita da ${SRC} in ${OUT}/`);
console.log(`  index.html            ${kb('index.html')} KB`);
console.log(`  manifest.webmanifest  ${kb('manifest.webmanifest')} KB`);
console.log(`  sw.js                 ${kb('sw.js')} KB  (cache ${app.cache}-${versione})`);
}
