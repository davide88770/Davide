#!/usr/bin/env node
/**
 * Prova che le due app installabili convivano sullo stesso dominio.
 *
 *   node tools/prova-convivenza.mjs
 *
 * Su GitHub Pages Ghisa & Grammi sta alla radice e il road book della Giordania
 * in /giordania/. Il service worker della radice ha per forza uno scope che
 * contiene anche l'altra app, e senza precauzioni fa due danni:
 *
 *   1. intercetta la navigazione verso /giordania/ e salva quella pagina come
 *      copia offline di Ghisa & Grammi — cioè, senza campo, l'app fitness apre
 *      il road book;
 *   2. serve alla Giordania i file in cache della radice.
 *
 * Qui si monta il sito completo su un server locale e si verifica che non
 * succeda: prima si attiva il service worker della radice, poi si va in
 * /giordania/, poi si torna alla radice **offline** e si controlla che la
 * pagina servita sia ancora quella giusta.
 *
 * Esce con codice diverso da zero se le due app si pestano i piedi.
 */
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const RADICE = 'pwa';
const NIDIFICATA = { dir: 'pwa-giordania', sotto: 'giordania' };

for (const d of [RADICE, NIDIFICATA.dir]) {
  if (!fs.existsSync(path.join(d, 'sw.js'))) {
    console.error(`${d}/ non c'e': esegui prima npm run build:pwa`);
    process.exit(2);
  }
}

/* Il sito come lo pubblica il workflow: la radice, e l'altra app in una
   sottocartella. */
const sito = fs.mkdtempSync(path.join(os.tmpdir(), 'convivenza-'));
fs.cpSync(RADICE, sito, { recursive: true });
fs.cpSync(NIDIFICATA.dir, path.join(sito, NIDIFICATA.sotto), { recursive: true });

const TIPI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
let offline = false;
const server = http.createServer((req, res) => {
  if (offline) { res.destroy(); return; }
  let rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
  if (rel === '' || rel.endsWith('/')) rel += 'index.html';
  const file = path.join(sito, rel);
  if (!file.startsWith(sito) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end('no'); return;
  }
  res.writeHead(200, { 'content-type': TIPI[path.extname(file)] ?? 'application/octet-stream',
                       'cache-control': 'max-age=600' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;

const problemi = [];
const browser = await chromium.launch({ executablePath: CHROME });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const titolo = () => page.title();

try {
  // 1 — la radice si installa e prende il controllo
  await page.goto(base, { waitUntil: 'load' });
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30000 });
  const tRadice = await titolo();
  console.log(`  1  service worker della radice attivo · "${tRadice}"`);

  // 2 — la sottocartella serve la sua app, non quella della radice
  await page.goto(base + NIDIFICATA.sotto + '/', { waitUntil: 'load' });
  const tSotto = await titolo();
  if (tSotto === tRadice) problemi.push(`/${NIDIFICATA.sotto}/ mostra la pagina della radice ("${tSotto}")`);
  else console.log(`  2  /${NIDIFICATA.sotto}/ mostra la sua app · "${tSotto}"`);

  /* 3 — anche la sottocartella si prende il proprio service worker.
     Arrivandoci, la pagina e' gia' controllata da quello della radice (lo
     scope della radice contiene tutto): quando il suo prende il posto, la
     pagina si ricarica da sola. Qui si aspetta quel passaggio invece di
     forzare un reload, che finirebbe in mezzo. */
  let scope = '';
  for (let i = 0; i < 40 && !scope.includes('/' + NIDIFICATA.sotto + '/'); i++) {
    await page.waitForTimeout(500);
    scope = await page.evaluate(
      () => (navigator.serviceWorker.controller || {}).scriptURL || ''
    ).catch(() => '');
  }
  if (!scope.includes('/' + NIDIFICATA.sotto + '/')) problemi.push(`la sottocartella e' controllata da "${scope}"`);
  else console.log('  3  la sottocartella e\' passata al proprio service worker');

  // 4 — il colpo vero: la radice offline deve ancora essere la radice
  offline = true;
  await page.goto(base, { waitUntil: 'load' });
  const tOffline = await titolo();
  if (tOffline !== tRadice) {
    problemi.push(`offline la radice mostra "${tOffline}" invece di "${tRadice}": `
      + 'la pagina dell\'altra app ne ha sovrascritto la copia offline');
  } else {
    console.log(`  4  offline la radice mostra ancora la sua pagina · "${tOffline}"`);
  }

  // 5 — e la sottocartella offline resta se stessa
  await page.goto(base + NIDIFICATA.sotto + '/', { waitUntil: 'load' });
  const tSottoOffline = await titolo();
  if (tSottoOffline !== tSotto) problemi.push(`offline /${NIDIFICATA.sotto}/ mostra "${tSottoOffline}"`);
  else console.log(`  5  offline /${NIDIFICATA.sotto}/ mostra ancora la sua pagina`);
} catch (e) {
  problemi.push(e.message.split('\n')[0]);
}

await browser.close();
server.close();
fs.rmSync(sito, { recursive: true, force: true });

if (problemi.length) {
  console.error(`\n${problemi.length} problemi:`);
  for (const x of problemi) console.error('  ✗ ' + x);
  process.exit(1);
}
console.log('\nLe due app convivono senza pestarsi i piedi.');
