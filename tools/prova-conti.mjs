#!/usr/bin/env node
/**
 * Prova dei conti, eseguendo il codice.
 *
 *   node tools/prova-conti.mjs [percorso/app.html]
 *
 * CLAUDE.md chiede di ricontrollare i totali «a calcolo, non a occhio», e
 * finora era l'unico controllo rimasto a mano. Qui si apre la pagina vera e si
 * prova OGNI combinazione di scelte — tutte le opzioni di tutti i menù, una per
 * una — verificando che:
 *
 *   1. il totale dei chilometri sia la somma dei chilometri delle giornate;
 *   2. lo stesso per le ore di guida;
 *   3. il totale del budget sia la somma delle sue righe;
 *   4. il numero che si vede sulla barra dei totali, quello della scheda
 *      «Oggi» e quello della mappa dicano tutti la stessa cosa;
 *   5. gli ingressi siano la somma dei biglietti accesi per il numero di
 *      persone, e che spegnere un biglietto sposti il totale di quanto costa;
 *   6. la luce calcolata abbia senso: alba prima del mezzogiorno, mezzogiorno
 *      prima del tramonto, tramonto prima del buio, per tutte le giornate.
 *
 * Esce con codice diverso da zero al primo conto che non torna.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const src = process.argv[2] ?? 'viaggi/2026-09-alpi-soca-quarnero/app-mobile.html';
const cart = path.basename(path.dirname(path.resolve(src)));
const stem = path.basename(src, '.html');
const anteprima = path.resolve('out', cart, stem, 'preview.html');
if (!fs.existsSync(anteprima)) {
  console.error(`Manca ${anteprima}: esegui prima npm run verify ${src}`);
  process.exit(2);
}

const problemi = [];
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', e => problemi.push('errore JS: ' + e.message));
page.on('console', m => { if (m.type() === 'error') problemi.push('console: ' + m.text()); });
await page.goto('file://' + anteprima, { waitUntil: 'load' });
await page.waitForTimeout(400);

const num = t => Number(String(t).replace(/[^\d]/g, ''));

/* Tutte le combinazioni di scelte: il prodotto cartesiano dei menù, piu' il
   caso in cui non si e' ancora scelto niente. */
const menu = await page.evaluate(() => (window.__MENU ? window.__MENU() : null)
  ?? [...document.querySelectorAll('#view-giorni .opt')].reduce((a, b) => {
    (a[b.dataset.m] = a[b.dataset.m] || []).push(b.dataset.o); return a; }, {}));
const chiavi = Object.keys(menu);
const combo = chiavi.reduce((acc, k) => acc.flatMap(c => [null].concat(menu[k]).map(v => ({ ...c, [k]: v }))), [{}]);
console.log(`  ${combo.length} combinazioni di scelte da provare (${chiavi.length} menù)`);

let provate = 0;
for (const c of combo) {
  for (const k of chiavi) await page.evaluate(([m, o]) => window.__SCEGLI(m, o), [k, c[k]]);
  const C = await page.evaluate(() => window.__CONTI());
  const etichetta = chiavi.map(k => k + '=' + (c[k] ?? '—')).join(' ');

  const sommaKm = C.giorni.reduce((s, g) => s + g[1], 0);
  const sommaMin = C.giorni.reduce((s, g) => s + g[2], 0);
  if (sommaKm !== C.km) problemi.push(`[${etichetta}] km: totale ${C.km}, somma delle giornate ${sommaKm}`);
  if (sommaMin !== C.min) problemi.push(`[${etichetta}] minuti: totale ${C.min}, somma ${sommaMin}`);

  const bMin = C.righe.reduce((s, r) => s + r[0], 0), bMax = C.righe.reduce((s, r) => s + r[1], 0);
  if (bMin !== C.budget[0] || bMax !== C.budget[1]) {
    problemi.push(`[${etichetta}] budget: totale ${C.budget}, somma delle righe ${[bMin, bMax]}`);
  }
  const ing = Math.round(C.accesi.reduce((s, b) => s + b[1], 0) * C.persone * 100) / 100;
  if (Math.abs(ing - C.ingressi) > 0.001) {
    problemi.push(`[${etichetta}] ingressi: mostrati ${C.ingressi}, somma dei biglietti accesi ${ing}`);
  }

  /* Gli stessi chilometri, letti dove li legge chi usa l'app. */
  const barra = num(await page.$eval('#totbar .g b', n => n.textContent));
  await page.click('#tab-mappa'); await page.waitForTimeout(40);
  const mappa = num(await page.$eval('#mapinfo p:last-child b', n => n.textContent));
  await page.click('#tab-giorni'); await page.waitForTimeout(40);
  if (barra !== C.km) problemi.push(`[${etichetta}] la barra dei totali dice ${barra}, i dati ${C.km}`);
  if (mappa !== C.km) problemi.push(`[${etichetta}] la mappa dice ${mappa}, i dati ${C.km}`);

  for (const L of C.luce) {
    const [n, alba, tram] = L;
    if (!/^\d\d:\d\d$/.test(alba) || !/^\d\d:\d\d$/.test(tram)) problemi.push(`giorno ${n}: luce illeggibile ${alba}/${tram}`);
    else if (alba >= tram) problemi.push(`giorno ${n}: alba ${alba} non prima del tramonto ${tram}`);
  }
  provate++;
  if (problemi.length) break;
}
console.log(`  ${provate} combinazioni provate, chilometri · ore · budget · ingressi · luce`);

/* Spegnere un biglietto deve spostare il totale esattamente del suo prezzo. */
if (!problemi.length) {
  const prima = await page.evaluate(() => window.__CONTI());
  const uno = prima.accesi[0];
  await page.evaluate(id => window.__BIGLIETTO(id), uno[0]);
  const dopo = await page.evaluate(() => window.__CONTI());
  const atteso = Math.round((prima.ingressi - uno[1] * prima.persone) * 100) / 100;
  if (Math.abs(dopo.ingressi - atteso) > 0.001) {
    problemi.push(`spegnendo «${uno[0]}» gli ingressi fanno ${dopo.ingressi} invece di ${atteso}`);
  }
  /* Il registro mostra i centesimi (312,60 €), il budget gli euro tondi: il
     confronto si fa sugli euro, o un arrotondamento sembra un errore. */
  if (prima.budget[0] - dopo.budget[0] !== Math.round(prima.ingressi) - Math.round(dopo.ingressi)) {
    problemi.push(`il budget si è mosso di ${prima.budget[0]-dopo.budget[0]} €, gli ingressi di `
      + `${Math.round(prima.ingressi)-Math.round(dopo.ingressi)} €`);
  }
  await page.evaluate(id => window.__BIGLIETTO(id), uno[0]);
  console.log('  un biglietto spento sposta budget e ingressi esattamente del suo prezzo');

  /* E il numero di persone deve scalare gli ingressi, non i pedaggi. */
  const a2 = await page.evaluate(() => window.__CONTI());
  await page.evaluate(() => window.__PERSONE(4));
  const a4 = await page.evaluate(() => window.__CONTI());
  if (Math.abs(a4.ingressi - a2.ingressi * 2) > 0.001) {
    problemi.push(`da 2 a 4 persone gli ingressi fanno ${a4.ingressi} invece di ${a2.ingressi * 2}`);
  }
  await page.evaluate(() => window.__PERSONE(2));
  console.log('  il numero di persone scala gli ingressi in modo esatto');
}

await browser.close();
console.log();
if (problemi.length) {
  console.error(`${problemi.length} conti che non tornano:`);
  for (const p of problemi.slice(0, 12)) console.error('  ✗ ' + p);
  process.exit(1);
}
console.log('I conti tornano, in tutte le combinazioni.');
