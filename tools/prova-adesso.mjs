#!/usr/bin/env node
/**
 * Prova della scheda «Oggi», spostando l'orologio.
 *
 *   node tools/prova-adesso.mjs [percorso/app.html]
 *
 * «Oggi» è la scheda su cui l'app si apre, e dipende interamente dall'ora: su
 * un rendering normale — che gira mesi prima o mesi dopo — metà del suo codice
 * non viene mai eseguito. Qui l'orologio del browser viene portato a momenti
 * veri del viaggio e si controlla che la scheda dica la cosa giusta:
 *
 *   1. prima della partenza, il conto alla rovescia;
 *   2. la mattina del primo giorno, la voce in corso e quella dopo;
 *   3. a metà viaggio, la giornata giusta e l'ultima voce in corso la sera;
 *   4. a viaggio finito, il riepilogo;
 *   5. e soprattutto: con l'app rimasta aperta, il passaggio della mezzanotte
 *      deve cambiare giornata da solo. Un'app installata sul telefono resta
 *      aperta per giorni e la pagina non ricarica: senza questo, al risveglio
 *      mostra ancora il giorno prima.
 *
 * Esce con codice diverso da zero se un caso non torna.
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

/* L'orologio finto va installato prima che la pagina parta, e deve restare
   spostabile dopo: il caso della mezzanotte serve proprio a muoverlo mentre la
   pagina è aperta. La pagina viene anche dichiarata sempre «visibile», così
   l'evento di ritorno in primo piano fa quello che farebbe sul telefono. */
const orologio = `(() => {
  const Vero = Date; let off = 0;
  class D extends Vero {
    constructor(...a){ if (a.length === 0) super(Vero.now() + off); else super(...a); }
    static now(){ return Vero.now() + off; }
  }
  window.Date = D;
  window.__ORA = iso => { off = new Vero(iso).getTime() - Vero.now(); };
  Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });
  Object.defineProperty(document, 'hidden', { get: () => false });
})()`;

const problemi = [];
const browser = await chromium.launch({ executablePath: CHROME });

async function apri(iso) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', e => problemi.push('errore JS: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') problemi.push('console: ' + m.text()); });
  await page.addInitScript(orologio + `; window.__ORA(${JSON.stringify(iso)});`);
  await page.goto('file://' + anteprima, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  return page;
}
const testo = (page, sel) => page.$eval(sel, n => n.textContent.replace(/\s+/g, ' ').trim()).catch(() => '');

/* I casi sono dati, non codice: ogni viaggio mette i suoi in
   <cartella>/<nome>.adesso.json. Senza quel file valgono questi, che sono
   quelli del primo road book. */
const cfgCasi = path.join(path.dirname(path.resolve(src)), path.basename(src, '.html') + '.adesso.json');
const casi = fs.existsSync(cfgCasi)
  ? JSON.parse(fs.readFileSync(cfgCasi, 'utf8')).casi.map(c => ({
      ...c, attesi: c.attesi.map(([sel, re]) => [sel, new RegExp(re)]) }))
  : [
  { iso: '2026-08-20T10:00:00', nome: 'due settimane prima',
    attesi: [['#view-oggi .countdown span', /giorni alla partenza/],
             ['#brandsub', /fra 17 giorni/], ['#view-oggi .hero .lab', /Tappa 1 di 10/]] },
  { iso: '2026-09-06T07:30:00', nome: 'la mattina della partenza',
    attesi: [['#view-oggi .hero .lab', /Oggi · tappa 1 di 10/],
             ['#view-oggi ol.tl li.now', /Partenza/],
             ['#view-oggi ol.tl li.next', /Caffè.*fra 45 min/]] },
  { iso: '2026-09-10T20:30:00', nome: 'la sera dell\'arrivo a Cres',
    attesi: [['#view-oggi .hero .lab', /Oggi · tappa 5 di 10/],
             ['#view-oggi ol.tl li.now', /Cena sul porto/],
             ['#brandsub', /Tappa 5 di 10/]] },
  { iso: '2026-09-12T09:05:00', nome: 'il ponte girevole di Osor',
    attesi: [['#view-oggi ol.tl li.now', /Partenza per Osor/],
             ['#view-oggi ol.tl li.next', /Osor.*fra 5 min/]] },
  { iso: '2026-10-02T12:00:00', nome: 'a viaggio finito',
    attesi: [['#view-oggi .in p.sub', /Il viaggio è finito/],
             ['#brandsub', /concluso/]] },
];
const mezzanotte = fs.existsSync(cfgCasi)
  ? JSON.parse(fs.readFileSync(cfgCasi, 'utf8')).mezzanotte
  : { prima: '2026-09-08T23:58:00', dopo: '2026-09-09T00:02:00',
      attesoPrima: 'tappa 3 di 10', attesoDopo: 'tappa 4 di 10' };

for (const c of casi) {
  const page = await apri(c.iso);
  for (const [sel, re] of c.attesi) {
    const t = await testo(page, sel);
    if (!re.test(t)) problemi.push(`[${c.nome}] ${sel}: «${t.slice(0, 90)}» non contiene ${re}`);
  }
  console.log(`  ${c.nome.padEnd(30)} ok`);
  await page.close();
}

/* La mezzanotte, con l'app rimasta aperta. */
{
  const page = await apri(mezzanotte.prima);
  const prima = await testo(page, '#view-oggi .hero .lab');
  await page.evaluate(t => window.__ORA(t), mezzanotte.dopo);
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForTimeout(200);
  const dopo = await testo(page, '#view-oggi .hero .lab');
  if (!prima.includes(mezzanotte.attesoPrima)) problemi.push(`prima di mezzanotte: «${prima}»`);
  if (!dopo.includes(mezzanotte.attesoDopo)) problemi.push(`dopo mezzanotte l'app mostra ancora «${dopo}»`);
  else console.log('  la mezzanotte con l\'app aperta   ok');
  await page.close();
}

await browser.close();
console.log();
if (problemi.length) {
  console.error(`${problemi.length} problemi:`);
  for (const p of problemi) console.error('  ✗ ' + p);
  process.exit(1);
}
console.log('La scheda «Oggi» dice la cosa giusta a ogni ora del viaggio.');
