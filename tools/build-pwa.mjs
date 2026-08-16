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
`);

const kb = n => Math.round(fs.statSync(path.join(OUT, n)).size / 1024);
console.log(`PWA costruita da ${SRC}`);
console.log(`  index.html            ${kb('index.html')} KB`);
console.log(`  manifest.webmanifest  ${kb('manifest.webmanifest')} KB`);
console.log(`  sw.js                 ${kb('sw.js')} KB  (cache ${versione})`);
