#!/usr/bin/env node
/**
 * Prova dell'app di allenamento con dati dentro.
 *
 *   node tools/prova-dati.mjs fitness/<cartella>/app.html
 *
 * La verifica di rendering (tools/verify.mjs) apre l'app su un profilo vuoto,
 * e le viste che dipendono dai dati registrati restano quasi tutte spente:
 * un bug nella scheda Progressi con carichi salvati e' passato inosservato per
 * due versioni proprio cosi'. Questo script semina uno stato realistico in
 * localStorage — sedute su piu' settimane, carichi, peso corporeo, pasti
 * spuntati, un esercizio sostituito — poi gira tutte le schede e fallisce se
 * compare un solo errore JS.
 *
 * Esce con codice diverso da zero se qualcosa non va.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const src = process.argv[2];
if (!src) { console.error('Uso: node tools/prova-dati.mjs <percorso/app.html>'); process.exit(2); }

const name = path.basename(path.dirname(path.resolve(src)));
const out = path.resolve('out', name);
fs.mkdirSync(out, { recursive: true });
const preview = path.join(out, 'prova.html');
fs.writeFileSync(preview,
  '<!doctype html><html><head><meta charset="utf8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' +
  fs.readFileSync(src, 'utf8') + '</body></html>');

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errori = [];
page.on('pageerror', e => errori.push('pageerror: ' + (e.stack || e.message)));
page.on('console', m => { if (m.type() === 'error') errori.push('console: ' + m.text()); });

const url = 'file://' + preview;
await page.goto(url);

/* Semina: quattro settimane di sedute, con una sostituzione e una serie extra,
   piu' peso corporeo e pasti. Le prime due settimane stanno sulle sedute
   ARCHIVIATE della vecchia scheda da 5 giorni — e' il caso vero di chi ha uno
   storico da prima del cambio scheda — le ultime due sulla "4 sedute Top". */
const seminato = await page.evaluate(() => {
  const iso = t => new Date(t).toISOString().slice(0, 10);
  const oggi = new Date();
  const vecchi = { 1: 'rv_push', 2: 'rv_pull', 3: 'rv_legs', 5: 'rv_upper', 6: 'rv_lower' };
  const nuovi  = { 1: 't_upperA', 2: 't_lowerA', 4: 't_upperB', 5: 't_lowerB' };
  const st = { v: 1, ui: { prog: 'top', nutri: 'rivista' }, sess: {}, corpo: [], pasti: {}, meta: {} };
  const nEs = { rv_push: 5, rv_pull: 5, rv_legs: 4, rv_upper: 6, rv_lower: 5,
                t_upperA: 8, t_lowerA: 6, t_upperB: 9, t_lowerB: 6 };
  let sedute = 0, serie = 0;
  for (let i = 27; i >= 0; i--) {
    const dt = new Date(oggi.getTime() - i * 864e5), d = iso(dt);
    const sid = (i > 13 ? vecchi : nuovi)[dt.getDay()];
    if (!sid) continue;
    const set = {};
    const n = nEs[sid];
    for (let j = 0; j < n; j++) {
      set[j] = [0, 1, 2].map(k => ({ kg: 40 + j * 5 + (27 - i) * 0.5, rep: 8 - k, rir: 1, ok: 1 }));
      serie += 3;
    }
    st.sess[d] = { sid, tipo: 'base', set, piu: { 0: 1 }, sost: {}, nota: '', mod: Date.now() };
    sedute++;
    if (i === 6) st.sess[d].sost = { 1: { n: 'Panca inclinata Smith', g: 'petto', s: 3, r: '8–10' } };
    st.corpo.push({ d, peso: 84 - (27 - i) * 0.03, vita: 84, mod: Date.now() });
    if (i === 13) st.pasti[d] = { tipo: null, mod: Date.now() };   // giorno incompleto, come da backup vecchio
    st.pasti[d] = { tipo: null, ok: { 0: 1, 1: 1, 2: 1 }, alt: {}, sub: {}, extra: [], mod: Date.now() };
  }
  localStorage.setItem('ghisaegrammi.v1', JSON.stringify(st));
  return { sedute, serie };
});
await page.goto(url);

const tab = ['#tab-oggi', '#tab-workout', '#tab-dieta', '#tab-progressi', '#tab-piano'];
const conta = {};
for (const t of tab) {
  await page.click(t);
  await page.waitForTimeout(280);
  const id = t.replace('#tab-', '');
  conta[id] = await page.evaluate(() => document.querySelectorAll('.card').length);
  await page.screenshot({ path: path.join(out, `prova-${id}.png`), fullPage: false });
}

/* Apre ogni esercizio della scheda e il pannello di un esercizio in Progressi. */
await page.click('#tab-workout');
await page.waitForTimeout(200);
const aperti = await page.$$eval('.exc:not([open]) > summary', ns => { ns.forEach(n => n.click()); return ns.length; });
await page.waitForTimeout(300);
const campi = await page.$$eval('input[data-k]', ns => ns.length);
await page.click('#tab-progressi');
await page.waitForTimeout(300);
const esercizi = await page.$$eval('#selEs option, select option', ns => ns.length);

/* Cambia programmazione e tipo di settimana: sono i due interruttori che
   ricalcolano tutto. */
await page.click('#tab-piano'); await page.waitForTimeout(200);
for (const p of ['rivista4', 'top']) {
  await page.click(`[data-prog="${p}"]`);
  await page.waitForTimeout(200);
}
await page.click('#tab-workout'); await page.waitForTimeout(200);
for (const w of ['peak', 'deload', 'base']) {
  const b = await page.$(`[data-sett="${w}"]`);
  if (b) { await b.click(); await page.waitForTimeout(200); }
}

await browser.close();

console.log(`  seminate  ${seminato.sedute} sedute · ${seminato.serie} serie · ${aperti} blocchi aperti · ${campi} campi`);
console.log(`  schede    ${Object.entries(conta).map(([k, v]) => `${k} ${v} card`).join(' · ')}`);
console.log(`  esercizi  ${esercizi} voci nel selettore dei progressi`);
if (errori.length) {
  console.error(`\n${errori.length} errori:`);
  for (const e of errori) console.error('  ✗ ' + e);
  process.exit(1);
}
if (!campi || Object.values(conta).some(v => v < 2)) {
  console.error('\nQualche scheda non ha reso niente.');
  process.exit(1);
}
console.log(`\nNessun errore con i dati dentro. Screenshot in out/${name}/`);
