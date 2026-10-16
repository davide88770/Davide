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

/* ── la rotta, in KML ────────────────────────────────────────────────────
   Qui le coordinate ci sono davvero: la mappa dell'app e' disegnata su
   latitudine e longitudine vere, tratta per tratta. Quindi questo file non
   lo deve geocodificare nessuno — e, a differenza del CSV, il KML si porta
   dentro il proprio stile: My Maps lo importa gia' colorato, senza un clic.
   Resta la linea dell'app: il filo del viaggio, non la traccia GPS della
   strada vera. */
const LEGS = leggi('LEGS'), STOPS = leggi('STOPS');
let rotta = '';

/* Colori e tratteggi non si riscrivono a mano: si prendono dai token del
   foglio di stile e dalla tabella con cui l'app disegna le tratte, cosi' la
   mappa importata e' colorata come quella a schermo. */
const radice = sorgente.slice(sorgente.indexOf(':root{'),
                              sorgente.indexOf('\n}', sorgente.indexOf(':root{')));
const token = Object.fromEntries([...radice.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{6})/g)]
  .map(m => ['var(--' + m[1] + ')', m[2]]));

const stileTratte = (() => {
  const a = sorgente.indexOf('const style={out:');
  if (a < 0) return {};
  const SC = 1, w = v => v, dash = (x, y) => x + ' ' + y;      // i due aiuti dell'app
  return eval('(' + sorgente.slice(a + 'const style='.length,
                                   sorgente.indexOf('};', a) + 1) + ')');
})();

/* Il nome della tratta e' quello della legenda, trovato per colore e
   tratteggio: cosi' se la legenda cambia parole, cambiano anche qui. */
const punti = s => !s['stroke-dasharray'] ? ''
  : (parseFloat(s['stroke-dasharray']) <= 3 ? 'dotted' : 'dashed');
const etichetta = k => {
  const st = stileTratte[k] || {};
  const l = (VIAGGIO.legenda || []).find(r => r[1] === st.stroke && (r[2] || '') === punti(st));
  return l ? l[0] : k;
};

/* KML vuole il colore alla rovescia: aabbggrr. */
const kcol = (v, op) => {
  const h = (token[v] || '#777777').slice(1);
  const a = Math.round(Math.max(0, Math.min(1, op ?? 1)) * 255).toString(16).padStart(2, '0');
  return a + h.slice(4, 6) + h.slice(2, 4) + h.slice(0, 2);
};
const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Il capo di una tratta prende il nome della tappa piu' vicina, se c'e': un
   terzo di grado, trenta chilometri scarsi. Il volo che arriva da fuori
   inquadratura non ne ha una, e resta senza. */
const vicino = ([lon, lat]) => {
  let n = null, d = Infinity;
  for (const s of STOPS) {
    const q = (s.lon - lon) ** 2 + (s.lat - lat) ** 2;
    if (q < d) { d = q; n = s.n; }
  }
  return d <= 0.09 ? n : null;
};
const nomeTratta = l => {
  const a = vicino(l.p[0]), b = vicino(l.p[l.p.length - 1]), e = l.t || etichetta(l.k);
  return !a || !b ? e : a === b ? e + ' · ' + a : a + ' → ' + b + ' · ' + e;
};

/* Sulla mappa dell'app il volo intercontinentale e' un moncone che esce
   dall'inquadratura, con scritto «← Milano, 9.400 km»: li' si capisce. Su
   Google Maps, che il mondo ce l'ha tutto, diventa una linea che finisce
   nello Yunnan per nessun motivo. Le tratte con un capo fuori dal riquadro
   del viaggio non si disegnano. */
const z = (VIAGGIO.zoom && VIAGGIO.zoom.viaggio) || VIAGGIO.bbox || null;
const dentroIlRiquadro = l => !z || l.p.every(([lon, lat]) =>
  lon >= z.lon[0] && lon <= z.lon[1] && lat >= z.lat[0] && lat <= z.lat[1]);

if (LEGS.length && STOPS.length) {
  const tratte = LEGS.filter(dentroIlRiquadro);
  const kinds = [...new Set(tratte.map(l => l.k))];
  const kml = ['<?xml version="1.0" encoding="UTF-8"?>',
    '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>',
    '<name>' + esc(VIAGGIO.nome + ' · la rotta') + '</name>',
    '<description>' + esc(VIAGGIO.sub + ' — la linea del viaggio come la disegna l\'app: '
      + 'indicativa, non la traccia GPS della strada. I voli internazionali non '
      + 'sono disegnati.') + '</description>'];

  for (const k of kinds) {
    const st = stileTratte[k] || {};
    kml.push('<Style id="t-' + k + '"><LineStyle><color>' + kcol(st.stroke, st.opacity)
      + '</color><width>' + Math.max(3, Math.round(parseFloat(st['stroke-width'] || 3) + 1))
      + '</width></LineStyle></Style>');
  }
  kml.push('<Style id="tappa"><IconStyle><color>' + kcol('var(--accent)', 1) + '</color>'
    + '<scale>1.1</scale><Icon><href>https://maps.google.com/mapfiles/kml/paddle/wht-blank.png</href></Icon>'
    + '</IconStyle></Style>',
    '<Style id="passo"><IconStyle><color>' + kcol('var(--ink-3)', 1) + '</color>'
    + '<scale>0.8</scale><Icon><href>https://maps.google.com/mapfiles/kml/paddle/wht-blank.png</href></Icon>'
    + '</IconStyle></Style>');

  kml.push('<Folder><name>La rotta</name>');
  for (const l of tratte)
    kml.push('<Placemark><name>' + esc(nomeTratta(l)) + '</name>'
      + '<styleUrl>#t-' + l.k + '</styleUrl><LineString><tessellate>1</tessellate>'
      + '<coordinates>' + l.p.map(c => c[0] + ',' + c[1] + ',0').join(' ')
      + '</coordinates></LineString></Placemark>');
  kml.push('</Folder>');

  kml.push('<Folder><name>Le tappe</name>');
  for (const st of STOPS) {
    const g = DAYS.find(d => d.n === st.d);
    kml.push('<Placemark><name>' + esc(st.n) + '</name>'
      + (g ? '<description>' + esc('Giorno ' + g.n + ' · ' + g.date + ' — ' + g.title) + '</description>' : '')
      + '<styleUrl>' + (st.s ? '#passo' : '#tappa') + '</styleUrl>'
      + '<Point><coordinates>' + st.lon + ',' + st.lat + ',0</coordinates></Point></Placemark>');
  }
  kml.push('</Folder>', '</Document></kml>');

  fs.writeFileSync(path.join(outDir, 'rotta.kml'), kml.join('\n') + '\n');
  rotta = `  ${tratte.length} tratte e ${STOPS.length} tappe, già colorate → rotta.kml`
    + (LEGS.length > tratte.length
       ? `\n  ${LEGS.length - tratte.length} tratte fuori dal riquadro non disegnate (i voli da e per l'Italia)` : '');
}

const conGps = voci.filter(v => coord(v.dove)).length;
console.log(`\n  ${tot} segnaposti in ${cats.length} file, più tutto.csv`);
if (doppi) console.log(`  ${doppi} tolti perché lo stesso punto compariva in due livelli`);
if (uniti) console.log(`  ${uniti} fusi perché erano lo stesso punto scritto in due modi`);
console.log(`  ${conGps} con coordinate esatte, ${tot - conGps} da geocodificare a Google`);
if (rotta) console.log(rotta);
console.log(`  in out/${cart}/mappa/\n`);
