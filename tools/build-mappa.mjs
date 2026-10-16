#!/usr/bin/env node
/**
 * I segnaposti per Google My Maps.
 *
 *   npm run mappa viaggi/2026-11-vietnam/app-mobile.html
 *
 * Non piazza i pin: produce i CSV che My Maps importa e geocodifica da sé.
 * È l'unico modo onesto — inventare coordinate per ottanta indirizzi vuol
 * dire piantare pin sbagliati, e un pin sbagliato lo scopri quando sei lì.
 * Dove le coordinate vere ci sono (molo, stazione, ufficio della guida) le
 * mette al posto dell'indirizzo: My Maps accetta «lat, lon» nella stessa
 * colonna e in quel caso non geocodifica niente.
 *
 * Un file per categoria, perché in My Maps un file = un livello = un'icona.
 */
import fs from 'node:fs';
import path from 'node:path';

const src = process.argv[2] ?? 'viaggi/2026-11-vietnam/app-mobile.html';
const cart = path.basename(path.dirname(path.resolve(src)));
const outDir = path.resolve('out', cart, 'mappa');
fs.mkdirSync(outDir, { recursive: true });

const sorgente = fs.readFileSync(src, 'utf8');
const leggi = n => {
  const a = sorgente.indexOf('const ' + n + '=');
  if (a < 0) return [];
  const b = sorgente.indexOf('\n];', a);
  return eval(sorgente.slice(a, b + 3).replace('const ' + n + '=', ''));
};
const VIAGGIO = eval('(' + sorgente.slice(sorgente.indexOf('const VIAGGIO={') + 14,
  sorgente.indexOf('\n};', sorgente.indexOf('const VIAGGIO={'))) + '})');
const DAYS = leggi('DAYS'), BOOK = leggi('BOOK'), BIGLIETTI = leggi('BIGLIETTI');
const POSTI = leggi('POSTI'), TAVOLA = leggi('TAVOLA'), SCHEDE = leggi('SCHEDE');
const SPOST = leggi('SPOSTAMENTI');

const pulito = s => String(s ?? '').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ')
  .replace(/\s+([,.;:!?»)’])/g, '$1').replace(/([«(])\s+/g, '$1').trim();
const taglia = (s, n) => { s = pulito(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; };

/* Le coordinate che abbiamo davvero, prese dalle conferme: qui non si
   geocodifica, si va al punto esatto. */
const GPS = {
  'Tam Coc Agency': '20.216561, 105.938483',
  'Hue Railway Station': '16.456529, 107.578357',
  "Sapa O'Chau, 689B Dien Bien Phu, Sa Pa": '22.3399711, 103.8408636',
};

/* L'indirizzo scritto nei dati non è sempre identico alla chiave: «Davanti
   alla Hue Railway Station» contiene la stazione ma non le è uguale. */
const gps = d => {
  for (const [k, v] of Object.entries(GPS)) if (String(d).includes(k)) return v;
  return d;
};

/* Da «Chua Cau Japanese Covered Bridge, Hoi An» a «Chua Cau Japanese
   Covered Bridge»: sulla mappa la citta' si vede da sola. */
const CITTA = /,\s*(Hanoi|Hoan Kiem, Hanoi|Sa Pa|Lao Cai|Ha Long Bay|Ha Long|Ninh Binh|Hue|Hoi An|Da Nang|Noi Bai)$/i;
const nomeDaIndirizzo = d => String(d).replace(CITTA, '').trim() || String(d);

/* Due righe possono indicare lo stesso punto scrivendolo in modi diversi:
   «Lotto 34, Tuan Chau» e «Molo di Peony, Lotto 34, Tuan Chau». Per
   confrontarle si toglie tutto quello che non distingue: accenti,
   punteggiatura, maiuscole, e la citta' o il quartiere in coda. */
const chiave = d => String(d).replace(CITTA, '')
  .replace(/,\s*(Hoan Kiem|Hoàn Kiếm|Hai Ba Trung|Soc Son|Sóc Sơn|Lao Chai|Sa Pa town)\b/gi, '')
  .normalize('NFD').replace(/[\u0300-\u036f\u1dc0-\u1dff]/g, '')
  .replace(/\u0111/g, 'd').replace(/\u0110/g, 'D')   // la d sbarrata non si scompone
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const voci = [];
const metti = (cat, nome, dove, giorni, note) => {
  if (!dove) return;
  voci.push({ cat, nome: pulito(nome), dove: gps(dove),
              giorni: giorni ?? '', note: taglia(note, 320) });
};

/* ── dormire ed esperienze: dal registro, che ha indirizzo e telefono ── */
for (const r of BOOK) {
  if (!r[7]) continue;                       // solo le righe con un indirizzo
  const quando = r[6] && r[6] !== '—' ? r[6].slice(0, 10) : '';
  /* Il registro tiene insieme alloggi ed esperienze: su una mappa un letto
     e un trekking non sono la stessa cosa, e meritano icone diverse. */
  const cat = /trek|tour|corso|lezione|crocier/i.test(r[2]) ? 'Da vedere' : 'Dormire';
  metti(cat, nomeDaIndirizzo(r[2]), r[7], quando,
        (r[8] ? 'Tel ' + r[8] + ' · ' : '') + r[5]);
}

/* ── da vedere: biglietti e schede, senza ripetere lo stesso posto ───── */
const visti = new Set();
for (const b of BIGLIETTI) {
  if (!b.m || visti.has(b.m)) continue; visti.add(b.m);
  const d = DAYS.find(x => x.n === b.g);
  metti('Da vedere', b.n, b.m, d ? 'G' + d.n : '',
        (b.p ? b.p.toFixed(2).replace('.', ',') + ' € · ' : 'gratis · ') + b.quali);
}
for (const s of SCHEDE) {
  if (!s.m || visti.has(s.m)) continue; visti.add(s.m);
  /* Sulla mappa il pin si chiama come il posto, non come la scheda: «Il
     ponte giapponese, e le scimmie sul calendario» e' un bel titolo e un
     pessimo nome di segnaposto. Il titolo finisce nella nota. */
  metti('Da vedere', nomeDaIndirizzo(s.m), s.m, 'G' + s.g.join(', G'),
        s.t + ' — ' + s.b);
}

/* ── mangiare: i posti nuovi e gli indirizzi del road book ───────────── */
const ETI = { famoso: 'Famoso', locale: 'Locale', strada: 'Di strada' };
const mangiati = new Set();
for (const p of POSTI) {
  if (!p.m || mangiati.has(p.m)) continue; mangiati.add(p.m);
  metti('Mangiare', p.n, p.m, 'G' + p.g.join(', G'), ETI[p.k] + ' · ' + p.c);
}
for (const t of TAVOLA) {
  if (!t.m || mangiati.has(t.m)) continue; mangiati.add(t.m);
  metti('Mangiare', t.n, t.m, 'G' + t.g.join(', G'), t.c);
}

/* ── spostamenti: i punti dove bisogna presentarsi a un'ora ──────────── */
const partenze = new Set();
/* Un pin a Malpensa o ad Abu Dhabi su una mappa del Vietnam è rumore. */
const FUORI = /malpensa|zayed|abu dhabi/i;
for (const x of SPOST) {
  if (!x.da || partenze.has(x.da) || FUORI.test(x.da)) continue; partenze.add(x.da);
  metti('Spostamenti', nomeDaIndirizzo(x.da), x.da,
        x.iso.slice(8, 10) + '/' + x.iso.slice(5, 7) + ' ' + x.ora,
        x.t + ' · ' + (x.cod && x.cod !== '—' ? 'Codice ' + x.cod + ' · ' : '')
        + (x.tel ? x.tel + ' · ' : '') + x.n);
}

/* Lo stesso punto in due livelli e' due pin sovrapposti. Si tiene quello
   del livello piu' operativo: dove dormi > dove devi essere a un'ora >
   dove mangi > cosa guardi. */
const PRIO = ['Dormire', 'Spostamenti', 'Mangiare', 'Da vedere'];
const tenuti = new Map();
for (const cat of PRIO)
  for (const v of voci) {
    if (v.cat !== cat) continue;
    const k = chiave(v.dove);
    if (!tenuti.has(k)) tenuti.set(k, v);
  }
const doppi = voci.length - tenuti.size;
voci.length = 0; voci.push(...tenuti.values());

/* Dentro lo stesso livello, lo stesso punto scritto piu' lungo resta lo
   stesso punto: «Lotto 34, Tuan Chau» e «Molo di Peony, Lotto 34, Tuan
   Chau» sono il molo di Tuan Chau. Si fondono in un pin solo che tiene
   tutte le date, invece di perderne una. */
const dentro = (a, b) => a.length >= 12 && b.length > a.length
  && (b.startsWith(a + ' ') || b.endsWith(' ' + a) || b.includes(' ' + a + ' '));
const coord = d => /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(d);
const unisci = (a, b) => !a ? b : !b ? a
  : a.includes(b) ? a : b.includes(a) ? b : a + ' · ' + b;
const fusi = [];
let uniti = 0;
for (const v of voci) {
  const g = fusi.find(w => w.cat === v.cat
    && (dentro(chiave(w.dove), chiave(v.dove)) || dentro(chiave(v.dove), chiave(w.dove))));
  if (!g) { fusi.push(v); continue; }
  uniti++;
  /* il nome che dice di piu', e l'indirizzo che Google geocodifica meglio:
     le coordinate se ci sono, altrimenti il piu' corto */
  if (v.nome.length > g.nome.length) g.nome = v.nome;
  if (coord(v.dove) || (!coord(g.dove) && v.dove.length < g.dove.length)) g.dove = v.dove;
  g.giorni = unisci(g.giorni, v.giorni);
  g.note = taglia(unisci(g.note, v.note), 320);
}
voci.length = 0; voci.push(...fusi);

/* ── i file ──────────────────────────────────────────────────────────── */
const csv = righe => {
  const c = v => { v = String(v ?? ''); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  return '﻿' + ['Nome,Posizione,Quando,Note']
    .concat(righe.map(r => [r.nome, r.dove, r.giorni, r.note].map(c).join(','))).join('\r\n') + '\r\n';
};

const cats = [...new Set(voci.map(v => v.cat))];
let tot = 0;
for (const cat of cats) {
  const righe = voci.filter(v => v.cat === cat);
  const f = path.join(outDir, cat.toLowerCase().replace(/\s/g, '-') + '.csv');
  fs.writeFileSync(f, csv(righe));
  console.log(`  ${cat.padEnd(14)} ${String(righe.length).padStart(3)} segnaposti → ${path.basename(f)}`);
  tot += righe.length;
}
fs.writeFileSync(path.join(outDir, 'tutto.csv'),
  '﻿' + ['Nome,Posizione,Categoria,Quando,Note'].concat(voci.map(v =>
    [v.nome, v.dove, v.cat, v.giorni, v.note].map(x => {
      x = String(x ?? ''); return /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x;
    }).join(','))).join('\r\n') + '\r\n');

const conGps = voci.filter(v => coord(v.dove)).length;
console.log(`\n  ${tot} segnaposti in ${cats.length} file, più tutto.csv`);
if (doppi) console.log(`  ${doppi} tolti perché lo stesso punto compariva in due livelli`);
if (uniti) console.log(`  ${uniti} fusi perché erano lo stesso punto scritto in due modi`);
console.log(`  ${conGps} con coordinate esatte, ${tot - conGps} da geocodificare a Google`);
console.log(`  in out/${cart}/mappa/\n`);
