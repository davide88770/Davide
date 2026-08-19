#!/usr/bin/env node
/**
 * Prova del percorso di aggiornamento della PWA.
 *
 *   node tools/prova-pwa.mjs
 *
 * L'app installata sulla schermata Home e' il modo in cui Davide la usa: se
 * l'aggiornamento non arriva, tutto il lavoro a monte non lo vede. E su iPhone
 * una PWA riaperta dalla Home spesso NON rifa' la navigazione, quindi il
 * browser non controlla sw.js da solo e la versione nuova non entra mai.
 *
 * Questo script serve pwa/ su un server locale e verifica il giro completo:
 *   1. il service worker si registra e prende il controllo;
 *   2. all'apertura, senza versioni nuove, l'avviso NON compare;
 *   3. pubblicata una versione nuova, l'app se ne accorge da sola senza
 *      navigazione (evento 'online'/ritorno in primo piano);
 *   4. e si aggiorna da sola, senza che nessuno tocchi niente: il service
 *      worker nuovo si attiva subito e ricarica la pagina rimasta indietro;
 *   5. nessun errore JS in tutto il giro.
 *
 * Lavora su una copia in una cartella temporanea: pwa/ non viene toccata.
 * Esce con codice diverso da zero se un passaggio non va.
 */
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SRC = path.resolve('pwa');
if (!fs.existsSync(path.join(SRC, 'sw.js'))) {
  console.error('pwa/ non c\'e\': esegui prima npm run build:pwa');
  process.exit(2);
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prova-pwa-'));
fs.cpSync(SRC, dir, { recursive: true });

const TIPI = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.webmanifest':'application/manifest+json', '.png':'image/png', '.svg':'image/svg+xml' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const file = path.join(dir, rel === '' ? 'index.html' : rel);
  if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end('no'); return;
  }
  /* Come GitHub Pages: una cache HTTP breve. E' proprio la condizione in cui
     sw.js rischia di arrivare vecchio, se non si registra con
     updateViaCache:'none'. */
  res.writeHead(200, { 'content-type': TIPI[path.extname(file)] ?? 'application/octet-stream',
                       'cache-control': 'max-age=600' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;

const problemi = [];
const browser = await chromium.launch({ executablePath: CHROME });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const errori = [];
page.on('pageerror', e => errori.push('pageerror: ' + (e.stack || e.message)));
page.on('console', m => { if (m.type() === 'error') errori.push('console: ' + m.text()); });

try {
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30000 });
  const build = await page.evaluate(() => window.__GG_BUILD);
  console.log(`  1-2  service worker attivo, pagina controllata · build ${build}`);

  await page.waitForTimeout(1200);
  if (await page.$eval('#agg', n => !n.hidden)) problemi.push('l\'avviso di aggiornamento compare anche senza versioni nuove');
  else console.log('  3    senza versioni nuove nessun avviso, come deve essere');

  /* Una versione nuova arriva sul server, senza che la pagina ricarichi. */
  const idx = path.join(dir, 'index.html'), swf = path.join(dir, 'sw.js');
  fs.writeFileSync(idx, fs.readFileSync(idx, 'utf8')
    .replace(`window.__GG_BUILD='${build}'`, "window.__GG_BUILD='versionenuova'")
    .replace('</body>', '<div id="marcatore"></div></body>'));
  fs.writeFileSync(swf, fs.readFileSync(swf, 'utf8').replaceAll(build, 'versionenuova'));

  /* Nessun click: l'app deve aggiornarsi da sola. Il service worker nuovo si
     attiva senza aspettare (skipWaiting), prende il controllo e ricarica la
     pagina che era rimasta indietro. E' l'unico modo di aggiornare un'app gia'
     installata sul telefono senza chiedere niente a chi la usa. */
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  /* Si guarda a intervalli invece di usare waitForFunction: in mezzo c'e' una
     navigazione, e una valutazione che parte proprio in quel momento fallisce
     senza che questo voglia dire niente. */
  let arrivata = false;
  for (let i = 0; i < 60 && !arrivata; i++) {
    await page.waitForTimeout(1000);
    arrivata = await page.evaluate(
      () => window.__GG_BUILD === 'versionenuova' && !!document.getElementById('marcatore')
    ).catch(() => false);
  }
  if (!arrivata) problemi.push("l'app non e' passata da sola alla versione nuova entro un minuto");
  else console.log('  4-5  versione nuova rilevata e caricata da sola, senza un click');
} catch (e) {
  problemi.push(e.message.split('\n')[0]);
}

await browser.close();
server.close();
fs.rmSync(dir, { recursive: true, force: true });

if (errori.length) problemi.push(...errori);
if (problemi.length) {
  console.error(`\n${problemi.length} problemi:`);
  for (const x of problemi) console.error('  ✗ ' + x);
  process.exit(1);
}
console.log('\nIl giro di aggiornamento della PWA funziona.');
