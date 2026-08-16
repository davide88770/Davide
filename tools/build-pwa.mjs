#!/usr/bin/env node
/**
 * Costruisce le versioni installabili (PWA) a partire dai sorgenti degli
 * Artifact, che restano l'unica fonte di verità.
 *
 *   node tools/build-pwa.mjs            tutte
 *   node tools/build-pwa.mjs viaggio    solo una
 *
 * Ogni app produce <out>/index.html, <out>/manifest.webmanifest e <out>/sw.js.
 * Le icone stanno in <out>/icone/ e si rigenerano con tools/build-icone.mjs.
 *
 * Il ramo gh-pages serve l'intera cartella pwa/, quindi l'app alla radice e
 * quelle nelle sottocartelle convivono sullo stesso dominio. È il motivo per
 * cui il service worker qui sotto tratta solo le navigazioni verso il proprio
 * indice: quello alla radice ha scope su tutto il sito e senza il controllo si
 * mangerebbe anche le pagine delle altre app, salvandosele come proprio
 * guscio offline.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const APP = {
  'ghisa-e-grammi': {
    src: 'fitness/ghisa-e-grammi/app.html',
    out: 'pwa',
    nome: 'Ghisa & Grammi',
    breve: 'Ghisa & Grammi',
    chiave: 'gg',
    tema: { chiaro: '#EAEDEC', scuro: '#0B0F12' },
    sfondo: '#0B0F12',
    categorie: ['health', 'fitness', 'lifestyle'],
    descrizione: 'Allenamento e alimentazione, giorno per giorno: carichi, '
      + 'progressioni, protocolli e pasti in grammi risolti sul target della fase.',
    installa: 'Tocca Condividi in fondo a Safari, poi "Aggiungi a Home". Si apre a schermo intero, '
      + 'funziona senza campo e i dati non vengono più cancellati dopo una settimana.',
  },
  viaggio: {
    src: 'viaggi/2026-09-alpi-soca-quarnero/app-mobile.html',
    out: 'pwa/viaggio',
    nome: 'Alpi, Soča & Quarnero',
    breve: 'Alpi & Soča',
    chiave: 'asq',
    tema: { chiaro: '#E9EDEA', scuro: '#091316' },
    sfondo: '#091316',
    categorie: ['travel', 'navigation', 'lifestyle'],
    descrizione: 'Road trip in Slovenia e Croazia, 6–15 settembre 2026: la tappa di oggi, '
      + 'le tre scelte che ricalcolano chilometri e budget, mappa, frasario e valigia.',
    installa: 'Tocca Condividi in fondo a Safari, poi "Aggiungi a Home". Si apre a schermo intero e '
      + '<b>funziona senza campo</b> — a Plitvice alle 7:00, sul Vršič e nell\'interno di Cres, '
      + 'dove il segnale non c\'è.',
  },
};

const amp = s => s.replace(/&/g, '&amp;');

function costruisci(id) {
  const a = APP[id];
  const corpo = fs.readFileSync(a.src, 'utf8');
  const titolo = (corpo.match(/<title>([\s\S]*?)<\/title>/) ?? [, amp(a.nome)])[1];
  const senzaTitolo = corpo.replace(/<title>[\s\S]*?<\/title>\s*/, '');
  const versione = crypto.createHash('sha256').update(corpo).digest('hex').slice(0, 10);

  const testa = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${titolo}</title>
<meta name="description" content="${a.descrizione}">
<meta name="theme-color" content="${a.tema.chiaro}" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="${a.tema.scuro}" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="${amp(a.breve)}">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icone/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="icone/icona-192.png">
<style>:root{color-scheme:light dark}*{box-sizing:border-box}body{margin:0}img{max-width:100%}</style>
</head>
<body>
`;

  // Il guscio installato usa i token dell'app che lo ospita, con un ripiego
  // per ogni nome che quella app potrebbe non definire.
  const coda = `
<div class="agg" id="agg" hidden role="status">
  <span>Nuova versione pronta</span>
  <button class="btn sm" id="aggOra">Ricarica</button>
</div>
<style>
.agg{position:fixed;left:50%;transform:translateX(-50%);z-index:90;
  bottom:calc(var(--tab-h,60px) + 22px + env(safe-area-inset-bottom));
  display:flex;align-items:center;gap:12px;padding:9px 12px 9px 17px;border-radius:999px;
  background:var(--solid,var(--ink));color:var(--on-solid,var(--surface));
  box-shadow:var(--shadow-2,var(--shadow));font-size:14px}
/* background esplicito: senza, il bottone eredita la superficie chiara
   dell'app e il testo chiaro del banner scuro ci sparisce sopra. */
.agg .btn{background:none;border-color:color-mix(in srgb,var(--on-solid,var(--surface)) 35%,transparent);
  color:var(--on-solid,var(--surface))}
@media (min-width:900px){.agg{bottom:26px}}
.installa{margin:0 0 16px;display:flex;gap:11px;align-items:flex-start;padding:13px 15px;
  border-radius:var(--r,12px);background:var(--accent-soft);color:var(--accent-text,var(--accent));
  font-size:13.5px;line-height:1.45}
.installa b{display:block;font-family:var(--display);font-size:12px;letter-spacing:.1em;text-transform:uppercase}
.installa button{margin-left:auto;background:none;border:0;color:inherit;opacity:.7;
  font-size:20px;line-height:1;padding:0 4px;cursor:pointer}
@media print{.agg,.installa{display:none !important}}
</style>
<script>
(function(){
  "use strict";
  // ── service worker: la pagina si apre anche senza campo ──
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('sw.js').then(function(reg){
        reg.addEventListener('updatefound', function(){
          var nuovo = reg.installing;
          if (!nuovo) return;
          nuovo.addEventListener('statechange', function(){
            if (nuovo.state === 'installed' && navigator.serviceWorker.controller) {
              var box = document.getElementById('agg');
              box.hidden = false;
              document.getElementById('aggOra').onclick = function(){
                nuovo.postMessage('attiva');
                nuovo.addEventListener('statechange', function(){
                  if (nuovo.state === 'activated') location.reload();
                });
              };
            }
          });
        });
      }).catch(function(){ /* senza service worker l'app funziona lo stesso */ });
    });
  }
  // ── suggerimento d'installazione, solo su iPhone e solo se non installata ──
  var standalone = window.matchMedia('(display-mode: standalone)').matches
                || window.navigator.standalone === true;
  var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (!standalone && iOS && !localStorage.getItem('${a.chiave}.installa.visto')) {
    window.addEventListener('load', function(){
      var main = document.querySelector('main');
      if (!main) return;
      var el = document.createElement('div');
      el.className = 'installa';
      el.innerHTML = '<div><b>Mettila sulla schermata Home</b>'
        + '${a.installa.replace(/'/g, "\\'")}</div>'
        + '<button aria-label="Ho capito">&times;</button>';
      el.querySelector('button').onclick = function(){
        localStorage.setItem('${a.chiave}.installa.visto', '1');
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

  fs.mkdirSync(a.out, { recursive: true });
  fs.writeFileSync(path.join(a.out, 'index.html'), testa + senzaTitolo + coda);

  fs.writeFileSync(path.join(a.out, 'manifest.webmanifest'), JSON.stringify({
    name: a.nome,
    short_name: a.breve,
    description: a.descrizione,
    start_url: './',
    scope: './',
    display: 'standalone',
    orientation: 'portrait',
    background_color: a.sfondo,
    theme_color: a.sfondo,
    lang: 'it',
    categories: a.categorie,
    icons: [
      { src: 'icone/icona-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icone/icona-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icone/icona-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }, null, 2));

  fs.writeFileSync(path.join(a.out, 'sw.js'), `/* ${a.nome} — service worker, versione ${versione} */
const CACHE = '${id}-${versione}';
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
const miaCache = k => k.startsWith('${id}-');

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
`);

  const kb = n => Math.round(fs.statSync(path.join(a.out, n)).size / 1024);
  console.log(`${a.nome} → ${a.out}/  (da ${a.src})`);
  console.log(`  index.html            ${kb('index.html')} KB`);
  console.log(`  manifest.webmanifest  ${kb('manifest.webmanifest')} KB`);
  console.log(`  sw.js                 ${kb('sw.js')} KB  (cache ${versione})`);
}

const quali = process.argv[2] ? [process.argv[2]] : Object.keys(APP);
for (const id of quali) {
  if (!APP[id]) {
    console.error(`App sconosciuta: ${id}. Disponibili: ${Object.keys(APP).join(', ')}`);
    process.exit(1);
  }
  costruisci(id);
}
