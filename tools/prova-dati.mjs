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
const ATTESI = [
  // sid, indice, data, nome che quel giorno aveva davvero, nome che oggi occupa quell'indice
  ['t_upperA', 5, '2026-03-09', 'Curl bilanciere — focus allungamento', 'Alzate posteriori al cavo alto'],
  ['t_upperB', 5, '2026-04-09', 'Curl hammer manubri',                  'Alzate posteriori al cavo alto'],
  ['t_lowerB', 0, '2026-05-09', 'Stacco a gambe tese — manubri',        'Pressa — piede alto e basso alternati'],
  ['t_lowerA', 5, '2026-06-09', 'D’Annunzio crunch',                    'Curl bilanciere — focus allungamento'],
  // queste due cadono fra una riscrittura e l'altra: verificano le fotografie recenti
  ['t_lowerA', 6, '2026-09-19', 'D’Annunzio crunch',                    'Curl ai cavi dietro il corpo — Bayesian'],
  ['t_lowerA', 3, '2026-08-16', 'Leg curl manubri / pulley',            'Leg curl su panca — cavo basso'],
  ['t_lowerB', 3, '2026-09-23', 'Leg curl sdraiato — manubri',          'Leg curl in piedi — cavo basso'],
  // questa cade fra la v48 e la v49: il sissy era ancora in scheda
  ['t_lowerB', 2, '2026-09-30', 'Sissy squat — eccentrica 5 sec',       'Leg curl in piedi — cavo basso'],
  /* La finestra della v49 e' larga UN GIORNO SOLO (8/10/2026) e quel giorno e'
     oggi: l'app ci crea da sola la giornata corrente appena renderizza la
     scheda Allenamento, quindi non e' seminabile. La fotografia v49 resta nel
     codice per simmetria, ma le serie registrate in quella finestra hanno
     comunque il nome salvato accanto, che e' la via normale dalla v46. */
  ['q_upperA', 0, '2026-07-09', 'Panca piana bilanciere',               'Panca inclinata bilanciere'],
  ['q_upperB', 2, '2026-07-16', 'Pullover ai cavi — carrucola alta',    'Lat machine presa stretta']
];
/* Le date qui sopra sono assolute, perche' ognuna deve cadere in una finestra
   di versione precisa. La semina principale invece copre gli ULTIMI 28 GIORNI,
   quindi col passare del tempo ci scivola sopra: le riserva e le salta. */
const RISERVATE = ATTESI.map(r => r[2]);
if (new Set(RISERVATE).size !== RISERVATE.length) {
  console.error('  ERRORE  due righe di ATTESI condividono la stessa data'); process.exit(1); }

const seminato = await page.evaluate(riservate => {
  const iso = t => new Date(t).toISOString().slice(0, 10);
  const oggi = new Date();
  const vecchi = { 1: 'rv_push', 2: 'rv_pull', 3: 'rv_legs', 5: 'rv_upper', 6: 'rv_lower' };
  const nuovi  = { 1: 't_upperA', 2: 't_lowerA', 4: 't_upperB', 5: 't_lowerB' };
  const st = { v: 1, ui: { prog: 'top', nutri: 'rivista' }, sess: {}, corpo: [], pasti: {}, meta: {},
    /* un esercizio col testo riscritto: il nome mostrato cambia, la chiave dello
       storico resta quella del piano. */
    testi: { 'Panca inclinata manubri 30°': { n: 'Inclinata — 30 gradi netti', cue: 'Fermo 2 sec in basso', nota: 'Nota mia.' } } };
  const nEs = { rv_push: 5, rv_pull: 5, rv_legs: 4, rv_upper: 6, rv_lower: 5,
                t_upperA: 9, t_lowerA: 6, t_upperB: 9, t_lowerB: 6,
                q_upperA: 7, q_lowerA: 6, q_upperB: 6, q_lowerB: 7,
                t_upperA: 8, t_lowerA: 8, t_upperB: 8, t_lowerB: 8 };
  let sedute = 0, serie = 0;
  for (let i = 27; i >= 0; i--) {
    const dt = new Date(oggi.getTime() - i * 864e5), d = iso(dt);
    if (riservate.includes(d)) continue;          // giorno riservato alla prova dello storico
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
}, RISERVATE);
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

/* Il testo riscritto deve mostrarsi come nome ma non staccare lo storico: nel
   selettore dei progressi l'etichetta e' quella nuova, il value resta quello
   del piano. Due versioni fa non c'era proprio, e un rename avrebbe orfanato
   i carichi. */
await page.click('#tab-progressi'); await page.waitForTimeout(250);
const rinominato = await page.$$eval('#selEx option', os =>
  os.filter(o => o.value === 'Panca inclinata manubri 30°' && o.textContent.trim() === 'Inclinata — 30 gradi netti').length);
if (!rinominato) { console.error('  ERRORE  il testo riscritto non arriva al selettore dei progressi'); process.exit(1); }

/* Seduta spostata: il giorno di partenza non deve piu' proporre l'allenamento
   ma dire dov'e' finito, e quello di arrivo deve mostrarla con la nota. E'
   uno stato che tocca sessioneDi, log e due rami di render diversi. */
const sposta = await page.evaluate(() => {
  const st = JSON.parse(localStorage.getItem('ghisaegrammi.v1'));
  const oggi = new Date(); const iso = t => new Date(t).toISOString().slice(0, 10);
  const d = new Date(oggi); while (d.getDay() !== 1) d.setDate(d.getDate() + 1);   // un lunedi' futuro
  const da = iso(d), a = iso(new Date(d.getTime() + 2 * 864e5));                    // -> mercoledi', libero
  st.sess[da] = { sid: null, tipo: 'base', set: {}, piu: {}, sost: {}, nota: '', spostata: a, mod: Date.now() };
  st.sess[a] = { sid: 't_upperA', tipo: 'base', set: { 0: [{ kg: '80', rep: '5', ok: 1 }] }, piu: {}, sost: {},
    nota: '', manuale: true, spostataDa: da, mod: Date.now() };
  localStorage.setItem('ghisaegrammi.v1', JSON.stringify(st));
  return { da, a };
});
await page.goto(url); await page.waitForTimeout(200);
/* S.ui.data non sta in localStorage: la data riparte sempre da oggi, quindi si
   sposta a mano sulla giornata che interessa. */
await page.evaluate(d => { S.ui.data = d; vai('workout'); }, sposta.da);
await page.waitForTimeout(300);
const origine = await page.$eval('#view-workout', n => n.textContent.replace(/\s+/g, ' '));
if (!/l.hai spostata a/.test(origine)) { console.error('  ERRORE  il giorno di partenza non dice dove e\' finita la seduta'); process.exit(1); }
await page.evaluate(d => { S.ui.data = d; vai('workout'); }, sposta.a);
await page.waitForTimeout(300);
const arrivo = await page.$eval('#view-workout', n => n.textContent.replace(/\s+/g, ' '));
if (!/Spostata qui da/.test(arrivo) || !/Upper A/.test(arrivo)) {
  console.error('  ERRORE  il giorno di arrivo non mostra la seduta spostata'); process.exit(1); }

/* LO STORICO NON SI RISCRIVE.
   Il log salva le serie per INDICE dentro la seduta, e fino alla v45 il nome
   veniva letto dalla definizione viva: riscrivere una scheda riscriveva anche
   il passato, e le serie di panca piana finivano nel grafico della panca
   inclinata. Qui si semina una giornata VECCHIA senza nomi congelati e si
   controlla che il grafico la etichetti come la scheda era ALLORA, non come e'
   adesso. Gli indici scelti sono quelli che hanno cambiato esercizio. */
await page.evaluate(attesi => {
  const st = JSON.parse(localStorage.getItem('ghisaegrammi.v1'));
  for (const [sid, i, d] of attesi) {
    if (st.sess[d]) throw new Error('la data ' + d + ' e\' gia\' occupata dalla semina principale');
  }
  for (const [sid, i, d] of attesi)
    st.sess[d] = { sid, tipo: 'base', set: { [i]: [{ kg: '42.5', rep: '9', rir: 1, ok: 1 }] },
      piu: {}, sost: {}, nota: '', mod: Date.now() };
  localStorage.setItem('ghisaegrammi.v1', JSON.stringify(st));
}, ATTESI);
await page.goto(url); await page.waitForTimeout(250);
/* Si interroga lo storico PER QUELLA DATA, non la presenza del nome in
   generale: lo stesso esercizio puo' comparire in altre giornate seminate, e
   un controllo globale direbbe di si' per il motivo sbagliato. */
const esito = await page.evaluate(attesi => attesi.map(([sid, i, d, vero, adesso]) => ({
  sid, i, d, vero, adesso,
  trovato:    storico(vero).some(g => g.d === d),
  malEtichettato: storico(adesso).some(g => g.d === d)
})), ATTESI);
for (const r of esito) {
  if (!r.trovato) {
    console.error(`  ERRORE  ${r.sid}[${r.i}] del ${r.d}: lo storico ha perso «${r.vero}»`); process.exit(1); }
  if (r.malEtichettato) {
    console.error(`  ERRORE  ${r.sid}[${r.i}] del ${r.d}: una serie vecchia e' finita sotto «${r.adesso}», che oggi occupa quell'indice`);
    process.exit(1); }
}
/* E una registrata OGGI deve invece prendere il nome di oggi. */
const oggiNome = await page.evaluate(() => {
  const d = new Date().toISOString().slice(0, 10);
  S.sess[d] = { sid: 't_upperA', tipo: 'base', set: { 5: [{ kg: '10', rep: '15', ok: 1 }] },
    piu: {}, sost: {}, nomi: { 5: SESS.t_upperA.ex[5].n }, nota: '', mod: Date.now() };
  salva(); return SESS.t_upperA.ex[5].n;
});
await page.waitForTimeout(400);          // salva() e' rimandato di 220 ms
await page.goto(url); await page.waitForTimeout(250);
const oggiOk = await page.evaluate(n => {
  const d = new Date().toISOString().slice(0, 10);
  return storico(n).some(g => g.d === d);
}, oggiNome);
if (!oggiOk) {
  console.error(`  ERRORE  una serie registrata oggi non compare sotto «${oggiNome}»`); process.exit(1); }
await page.click('#tab-progressi'); await page.waitForTimeout(250);

/* TOGLI UN ESERCIZIO, TOGLI UNA SERIE, COPIA IL CARICO.
   Tre funzioni della v51. Quella che puo' fare danno e' la prima: togliere un
   esercizio NON deve cancellare le serie registrate — e' lo stesso errore che
   nella v42 fece sparire un carico appena scritto annullando uno spostamento.
   Si semina una giornata futura, si toglie l'esercizio 0 che ha dei dati, si
   controlla che i dati ci siano ancora e che il "Rimetti" lo riporti. */
const gTest = await page.evaluate(() => {
  const iso = t => new Date(t).toISOString().slice(0, 10);
  const d = new Date(); while (d.getDay() !== 2) d.setDate(d.getDate() + 1);   // un martedi' futuro
  const g = iso(d);
  S.sess[g] = { sid: 't_lowerA', tipo: 'base', set: { 0: [{ kg: '95', rep: '6', rir: 1, ok: 1 }] },
    piu: {}, sost: {}, via: {}, nomi: {}, nota: '', mod: Date.now() };
  salva(); return g;
});
await page.waitForTimeout(400);
await page.evaluate(g => { S.ui.data = g; vai('workout'); }, gTest);
await page.waitForTimeout(350);

/* I tasti stanno dentro il corpo dell'esercizio: va aperto, altrimenti
   Playwright aspetta un elemento invisibile e la prova scade. */
await page.evaluate(() => { APERTI.add(0); renderWorkout(); }); await page.waitForTimeout(250);
const esPrima = await page.$$eval('#view-workout details[data-ex]', n => n.length);
await page.click('details[data-ex="0"] [data-via="0"]'); await page.waitForTimeout(350);
const dopoVia = await page.evaluate(g => {
  const L = S.sess[g];
  return { es: document.querySelectorAll('#view-workout details[data-ex]').length,
           rimetti: !!document.querySelector('[data-torna="0"]'),
           datiVivi: ((L.set[0] || [])[0] || {}).kg };
}, gTest);
if (dopoVia.es !== esPrima - 1) {
  console.error(`  ERRORE  togliendo un esercizio la lista non scende (${esPrima} -> ${dopoVia.es})`); process.exit(1); }
if (!dopoVia.rimetti) { console.error('  ERRORE  manca il tasto Rimetti'); process.exit(1); }
if (dopoVia.datiVivi !== '95') {
  console.error(`  ERRORE  togliendo l'esercizio sono spariti i dati (kg = ${dopoVia.datiVivi})`); process.exit(1); }
await page.click('[data-torna="0"]'); await page.waitForTimeout(350);
const dopoTorna = await page.$$eval('#view-workout details[data-ex]', n => n.length);
if (dopoTorna !== esPrima) {
  console.error(`  ERRORE  il Rimetti non riporta l'esercizio (${dopoTorna} invece di ${esPrima})`); process.exit(1); }

/* Togliere serie sotto il piano, ma non sotto una. L'esercizio 4 (calf) ne ha
   2 previste e nessun dato: si scende a 1 e poi il tasto deve sparire. */
await page.evaluate(() => { APERTI.add(4); renderWorkout(); }); await page.waitForTimeout(250);
const serie0 = await page.$$eval('details[data-ex="4"] .setrow', n => n.length);
await page.click('details[data-ex="4"] [data-piu="4:-1"]'); await page.waitForTimeout(300);
const serie1 = await page.$$eval('details[data-ex="4"] .setrow', n => n.length);
if (serie1 !== serie0 - 1) {
  console.error(`  ERRORE  non si riesce a togliere una serie sotto il piano (${serie0} -> ${serie1})`); process.exit(1); }
const ancora = await page.$('details[data-ex="4"] [data-piu="4:-1"]');
if (serie1 === 1 && ancora) {
  console.error('  ERRORE  con una serie sola il tasto per togliere dovrebbe sparire'); process.exit(1); }

/* Copia la 1ª: scrive solo sulle serie vuote, e il carico si riporta da solo
   sulla serie dopo quando spunti. L'esercizio 0 ha 3 serie e la 1ª compilata. */
await page.evaluate(() => { APERTI.add(0); renderWorkout(); }); await page.waitForTimeout(250);
await page.click('details[data-ex="0"] [data-copia="0"]'); await page.waitForTimeout(300);
const copiato = await page.evaluate(g => (S.sess[g].set[0] || []).map(r => [r.kg, r.rep]), gTest);
if (!copiato.every(r => r[0] === '95' && r[1] === '6')) {
  console.error('  ERRORE  "Copia la 1ª" non ha riempito le serie vuote: ' + JSON.stringify(copiato)); process.exit(1); }
const nonSovrascrive = await page.evaluate(async g => {
  S.sess[g].set[0] = [{ kg: '100', rep: '5', ok: 1 }, { kg: '80', rep: '', ok: false }, { kg: '', rep: '', ok: false }];
  renderWorkout();
  document.querySelector('details[data-ex="0"] [data-copia="0"]').click();
  return (S.sess[g].set[0] || []).map(r => r.kg);
}, gTest);
if (nonSovrascrive[1] !== '80') {
  console.error('  ERRORE  "Copia la 1ª" ha sovrascritto una serie già compilata: ' + JSON.stringify(nonSovrascrive));
  process.exit(1); }
if (nonSovrascrive[2] !== '100') {
  console.error('  ERRORE  "Copia la 1ª" non ha riempito la serie vuota: ' + JSON.stringify(nonSovrascrive));
  process.exit(1); }
const riporta = await page.evaluate(async g => {
  S.sess[g].set[0] = [{ kg: '77.5', rep: '8', ok: false }, { kg: '', rep: '', ok: false }];
  S.sess[g].piu = { 0: -1 };
  renderWorkout();
  document.querySelector('details[data-ex="0"] [data-tick="0:0"]').click();
  const r = S.sess[g].set[0];
  return { kgDopo: r[1] ? r[1].kg : null, repDopo: r[1] ? r[1].rep : null };
}, gTest);
if (riporta.kgDopo !== '77.5') {
  console.error(`  ERRORE  spuntando una serie il carico non si riporta su quella dopo (${riporta.kgDopo})`); process.exit(1); }
if (riporta.repDopo) {
  console.error('  ERRORE  si sono riportate anche le ripetizioni: una serie non fatta risulterebbe fatta'); process.exit(1); }

/* Cambia programmazione e tipo di settimana: sono i due interruttori che
   ricalcolano tutto. */
await page.click('#tab-piano'); await page.waitForTimeout(200);
for (const p of ['rivista4', 'full', 'top']) {
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
console.log('  testi     nome riscritto mostrato, storico ancora legato al nome del piano');
console.log('  sposta    giorno di partenza e di arrivo coerenti dopo lo spostamento');
console.log(`  storico   ${ATTESI.length} giornate vecchie etichettate com'erano allora, non come sono adesso`);
console.log('  togli     esercizio via e rimesso senza perdere le serie · serie sotto il piano, mai sotto una');
console.log('  copia     la 1ª riempie solo le serie vuote · la spunta riporta il carico, non le ripetizioni');
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
