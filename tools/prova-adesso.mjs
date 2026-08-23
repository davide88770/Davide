#!/usr/bin/env node
/**
 * Prova della scheda «Adesso» del road book.
 *
 *   node tools/prova-adesso.mjs [percorso/roadbook.html]
 *
 * La scheda dice, durante il viaggio, a che punto della giornata si è. Dipende
 * dall'orologio, quindi su un rendering normale non si vede mai: `npm run
 * verify` gira ad agosto e trova solo il conto alla rovescia. Qui l'orologio
 * del browser viene spostato a quattro momenti veri del viaggio e si controlla
 * che la scheda dica la cosa giusta.
 *
 * Il caso che conta davvero è il terzo: la voce delle 01:35 (il cielo del Wadi
 * Rum dopo il tramonto della luna) appartiene alla notte successiva. Senza
 * spostarla di 24 ore risultava "già passata" alle sette di sera, e la scheda
 * annunciava le stelle mentre erano ancora a tavola.
 *
 * Esce con codice diverso da zero se un caso non torna.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const src = process.argv[2] ?? 'viaggi/2026-11-giordania/roadbook.html';
const nome = path.basename(path.dirname(path.resolve(src)));
const anteprima = path.resolve('out', nome, 'preview.html');
if (!fs.existsSync(anteprima)) {
  console.error(`Manca ${anteprima}: esegui prima npm run verify ${src}`);
  process.exit(2);
}

const CASI = [
  { q: 'prima della partenza', iso: '2026-08-23T12:00:00+03:00',
    visibile: true, contiene: ['Alla partenza', 'giorni'] },
  { q: 'giorno 2, in strada alle 07:50', iso: '2026-11-13T07:50:00+03:00',
    visibile: true, contiene: ['GIORNATA 02', 'Partenza', 'Poi alle 08:00'] },
  { q: 'giorno 5, dentro Petra alle 10:30', iso: '2026-11-16T10:30:00+03:00',
    visibile: true, contiene: ['GIORNATA 05', 'Poi alle 10:45', 'Tramonto alle 17:41'] },
  { q: 'giorno 7, dopo cena alle 19:30', iso: '2026-11-18T19:30:00+03:00',
    visibile: true, contiene: ['Cena e fuoco', 'Poi alle 01:35'],
    esclude: ['Il cielo vero Poi'] },
  { q: 'a viaggio finito', iso: '2026-11-22T12:00:00+03:00', visibile: false },
];

const problemi = [];
const browser = await chromium.launch({ executablePath: CHROME });

for (const c of CASI) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 700 }, timezoneId: 'Asia/Amman' });
  const page = await ctx.newPage();
  page.on('pageerror', e => problemi.push(`${c.q}: pageerror ${e.message}`));
  /* L'orologio del browser spostato prima che la pagina esegua una riga. */
  await page.addInitScript(`{
    const finto = new Date(${JSON.stringify(c.iso)}).getTime();
    const Vero = Date;
    Date = class extends Vero {
      constructor(...a){ return a.length ? new Vero(...a) : new Vero(finto); }
      static now(){ return finto; }
    };
    Date.parse = Vero.parse; Date.UTC = Vero.UTC;
  }`);
  await page.goto('file://' + anteprima, { waitUntil: 'load' });
  await page.waitForTimeout(600);

  const r = await page.$eval('#adesso', n => ({
    visibile: !n.hidden && getComputedStyle(n).display !== 'none' && !!n.getClientRects().length,
    testo: n.innerText.replace(/\s+/g, ' ').trim(),
  }));

  if (r.visibile !== c.visibile) {
    problemi.push(`${c.q}: la scheda ${r.visibile ? 'si vede e non dovrebbe' : 'non si vede e dovrebbe'}`);
  } else if (c.visibile) {
    /* innerText restituisce il testo come lo si legge: le etichette in
       maiuscoletto arrivano maiuscole. Il confronto ignora le maiuscole. */
    const testo = r.testo.toLowerCase();
    for (const atteso of c.contiene ?? []) {
      if (!testo.includes(atteso.toLowerCase())) problemi.push(`${c.q}: manca «${atteso}» in «${r.testo.slice(0, 120)}»`);
    }
    for (const vietato of c.esclude ?? []) {
      if (testo.includes(vietato.toLowerCase())) problemi.push(`${c.q}: non doveva esserci «${vietato}»`);
    }
    console.log(`  ${c.q}\n    ${r.testo.slice(0, 130)}`);
  } else {
    console.log(`  ${c.q}\n    nascosta, come deve essere`);
  }
  await ctx.close();
}

await browser.close();
if (problemi.length) {
  console.error(`\n${problemi.length} problemi:`);
  for (const x of problemi) console.error('  ✗ ' + x);
  process.exit(1);
}
console.log('\nLa scheda «Adesso» dice la cosa giusta in tutti i momenti provati.');
