#!/usr/bin/env node
/**
 * Costruisce la versione installabile di "Soldi" (PWA) dal sorgente.
 *
 *   node tools/build-soldi.mjs
 *
 * Sorgente: finanze/soldi/ (app.html, config.js, vendor/, icone/).
 * Uscita:   pwa/soldi/ — è la cartella che va online, così com'è, su GitHub
 *           Pages (in /soldi/) oppure su Vercel (cartella radice del progetto).
 *
 * La versione del service worker è l'impronta di tutti i file pubblicati: se
 * cambia anche solo config.js, il telefono riceve l'aggiornamento.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const SRC = 'finanze/soldi';
const OUT = 'pwa/soldi';

// ── la chiave service_role non deve mai finire in una pagina pubblica ──
const config = fs.readFileSync(path.join(SRC, 'config.js'), 'utf8');
for (const jwt of config.match(/eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+/g) ?? []) {
  const ruolo = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString()).role;
  if (ruolo !== 'anon') {
    console.error(`ERRORE: in ${SRC}/config.js c'è una chiave con ruolo "${ruolo}". Serve la chiave anon.`);
    process.exit(1);
  }
}
if (/sb_secret_/.test(config)) {
  console.error(`ERRORE: in ${SRC}/config.js c'è una secret key. Serve la publishable/anon key.`);
  process.exit(1);
}

const FILE = [
  'config.js',
  'vendor/chart.umd.js', 'vendor/supabase.js',
  'vendor/manrope-latin-wght-normal.woff2', 'vendor/manrope-latin-ext-wght-normal.woff2',
  'icone/icona-32.png', 'icone/icona-192.png', 'icone/icona-512.png', 'icone/apple-touch-icon.png',
];

const app = fs.readFileSync(path.join(SRC, 'app.html'), 'utf8');
const h = crypto.createHash('sha256').update(app);
for (const f of FILE) h.update(f).update(fs.readFileSync(path.join(SRC, f)));
const swTemplate = fs.readFileSync(new URL(import.meta.url));
h.update(swTemplate);
const versione = h.digest('hex').slice(0, 10);
const n = (app.match(/__SOLDI_V=(\d+)/) ?? [])[1];
if (!n) { console.error('ERRORE: manca window.__SOLDI_V in app.html'); process.exit(1); }

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'vendor'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'icone'), { recursive: true });
for (const f of FILE) fs.copyFileSync(path.join(SRC, f), path.join(OUT, f));
fs.writeFileSync(path.join(OUT, 'index.html'),
  app.replace("window.__SOLDI_BUILD='sviluppo'", `window.__SOLDI_BUILD='${versione}'`));

fs.writeFileSync(path.join(OUT, 'manifest.webmanifest'), JSON.stringify({
  id: './',
  name: 'Soldi di Davide',
  short_name: 'Soldi',
  description: 'Il budget personale di Davide: entrate, spese, conti, patrimonio.',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#F3F5F8',
  theme_color: '#1E5EFF',
  lang: 'it',
  categories: ['finance', 'productivity'],
  icons: [
    { src: 'icone/icona-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icone/icona-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    // L'icona è a fondo pieno e il contenuto sta dentro la zona sicura
    // (cerchio di raggio 40%): va bene anche ritagliata da Android.
    { src: 'icone/icona-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2));

// Su Vercel: sw.js e index.html mai dalla cache HTTP, così gli aggiornamenti
// arrivano. Su GitHub Pages questo file viene semplicemente ignorato.
fs.writeFileSync(path.join(OUT, 'vercel.json'), JSON.stringify({
  headers: [
    { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
    { source: '/(index.html)?', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
    { source: '/config.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
  ],
}, null, 2));

fs.writeFileSync(path.join(OUT, 'sw.js'), `/* Soldi di Davide — service worker, v${n} · ${versione} */
const CACHE = 'soldi-${versione}';
const PREFISSO = 'soldi-';
const GUSCIO = ['./', ${FILE.map(f => `'./${f}'`).join(', ')}, './manifest.webmanifest'];

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
`);

const kb = f => (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(0).padStart(4) + ' KB';
console.log(`Soldi v${n} costruita in ${OUT}/ (cache soldi-${versione})`);
for (const f of ['index.html', 'sw.js', 'manifest.webmanifest', 'config.js', 'vendor/chart.umd.js', 'vendor/supabase.js'])
  console.log(`  ${f.padEnd(22)} ${kb(f)}`);
console.log(`  Supabase: ${/supabaseUrl:\s*'https?:/.test(config) ? 'configurato' : 'NON configurato (solo dati locali)'}`);
