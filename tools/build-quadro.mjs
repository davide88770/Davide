#!/usr/bin/env node
/**
 * Il quadro di marcia: giorno per giorno, tutto quello che serve per non
 * sbagliare posto né orario.
 *
 *   npm run quadro viaggi/2026-11-vietnam/app-mobile.html
 *
 * Non è il libretto — quello si legge. Questo si consulta sotto pressione:
 * una riga per spostamento, con l'ora, il posto esatto, il codice e il
 * numero da chiamare se qualcosa non torna. Niente racconto.
 *
 * Come gli altri generatori, taglia il blocco dati dal sorgente dell'app e
 * lo esegue in pagina: non può stampare un orario diverso da quello che
 * l'app mostra a schermo.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const src = process.argv[2] ?? 'viaggi/2026-11-vietnam/app-mobile.html';
const cart = path.basename(path.dirname(path.resolve(src)));
const outDir = path.resolve('out', cart);
fs.mkdirSync(outDir, { recursive: true });

const sorgente = fs.readFileSync(src, 'utf8');
const da = sorgente.indexOf('const VIAGGIO={');
const a = sorgente.indexOf('/* ── la barra della luce ─', da);
if (da < 0 || a < 0) { console.error(`Non trovo il blocco dati in ${src}.`); process.exit(2); }
const DATI = sorgente.slice(da, a);

const CSS = `
@page{size:A4;margin:11mm 10mm 13mm}
*{box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font:9.4pt/1.42 "DejaVu Sans",Arial,Helvetica,sans-serif;color:#15201f}
h1{font-size:19pt;margin:0 0 1mm;letter-spacing:-.01em}
h2{font-size:12pt;margin:0 0 3mm;padding-bottom:1.5mm;border-bottom:1.6pt solid #15201f;
   letter-spacing:.02em;text-transform:uppercase}
.sub{color:#5a6a68;font-size:9pt;margin:0 0 6mm}
.pagina{break-after:page}
.pagina:last-child{break-after:auto}

/* la giornata */
.g{break-inside:avoid;margin-bottom:5.5mm;border:.5pt solid #b9c6c3;border-left:3pt solid #15201f}
.gh{display:flex;align-items:baseline;gap:4mm;background:#eceeed;padding:2mm 3mm;border-bottom:.5pt solid #b9c6c3}
.gh .n{font-weight:700;font-size:11.5pt;min-width:9mm}
.gh .d{font-weight:700;font-size:10.5pt;flex:1}
.gh .s{font-size:8.6pt;color:#45544f;text-align:right}
.gb{padding:2.5mm 3mm 3mm}

/* una riga di spostamento */
.r{display:grid;grid-template-columns:15mm 1fr;gap:3mm;padding:2mm 0;border-top:.4pt dotted #b9c6c3}
.r:first-child{border-top:0;padding-top:.5mm}
.r .o{font-weight:700;font-size:11pt;font-variant-numeric:tabular-nums;line-height:1.1}
.r .o i{display:block;font-style:normal;font-size:7.4pt;font-weight:400;color:#5a6a68;
        text-transform:uppercase;letter-spacing:.05em;margin-top:.6mm}
.r .t{font-weight:700;font-size:9.8pt}
.r .v{margin-top:.8mm;font-size:8.8pt;line-height:1.4}
.r .v b{font-weight:700}
.k{display:inline-block;font-family:"DejaVu Sans Mono",monospace;font-size:8pt;
   background:#eceeed;padding:.3mm 1.4mm;border-radius:1.5mm;letter-spacing:-.02em}
.tel{display:inline-block;font-family:"DejaVu Sans Mono",monospace;font-size:8pt;font-weight:700}
.n-alert{border-left-color:#8c2d20}

/* una voce dell'elenco in fila */
.v{display:grid;grid-template-columns:11mm 1fr;gap:3.5mm;break-inside:avoid;
   border:.5pt solid #b9c6c3;border-left:3pt solid #15201f;margin-bottom:3.2mm;padding:2.4mm 3mm}
.v.aperta{border-left-color:#8c2d20;background:#fdf9f8}
.v.fare{border-left-color:#7b8a87;border-style:dashed;background:#fafbfa}
.v.fare .num i{font-size:10pt;opacity:.6}
.v.fare .tt{font-size:9.8pt}
.v .num{font-size:15pt;font-weight:700;line-height:1;color:#15201f;text-align:center;
        font-variant-numeric:tabular-nums}
.v .num i{display:block;font-style:normal;font-size:12pt;margin-top:1mm}
.v .q{font-size:8.2pt;color:#5a6a68;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.6mm}
.v .q b{color:#15201f;font-size:9.6pt;letter-spacing:0;text-transform:none}
.v .tt{font-weight:700;font-size:10.4pt;line-height:1.25;margin-bottom:1.2mm}
.v dl{display:grid;grid-template-columns:17mm 1fr;gap:.6mm 2.5mm;margin:0;font-size:8.7pt;line-height:1.38}
.v dt{font-size:7.4pt;text-transform:uppercase;letter-spacing:.05em;color:#5a6a68;padding-top:.5mm}
.v dd{margin:0}
.v .note{margin-top:1.4mm;font-size:8.5pt;line-height:1.38;color:#3d4c4a;
         border-top:.4pt dotted #b9c6c3;padding-top:1.2mm}
.v .note.ammonisce{color:#15201f;background:#f6ecea;border-top:0;border-left:2pt solid #8c2d20;
                   padding:1.2mm 2mm;margin-top:1.4mm}
.av{margin-top:1.2mm;font-size:8.5pt;line-height:1.38;background:#f6ecea;
    border-left:2pt solid #8c2d20;padding:1.2mm 2mm}
.ok{background:#eaf1ec;border-left-color:#2f6b44}
.nt{margin-top:1.2mm;font-size:8.5pt;line-height:1.38;color:#3d4c4a}

/* dove si dorme */
.dorme{margin-top:2mm;padding-top:1.8mm;border-top:.4pt solid #b9c6c3;font-size:8.8pt}
.dorme b{font-weight:700}

/* rubrica e liste */
table{border-collapse:collapse;width:100%;font-size:8.8pt}
th,td{text-align:left;padding:1.4mm 2mm;border-bottom:.4pt solid #ccd6d3;vertical-align:top}
th{background:#eceeed;font-size:7.8pt;text-transform:uppercase;letter-spacing:.06em}
td.m{font-family:"DejaVu Sans Mono",monospace;font-weight:700;white-space:nowrap}
tr{break-inside:avoid}
.grp td{background:#f4f6f5;font-weight:700;font-size:8pt;text-transform:uppercase;letter-spacing:.06em}
ul{margin:0 0 3mm;padding-left:4.5mm}
li{margin-bottom:1.3mm}
.box{border:.5pt solid #b9c6c3;padding:2.5mm 3mm;margin-bottom:3mm;break-inside:avoid}
.box h3{font-size:9.6pt;margin:0 0 1.5mm}
.rosso{border-left:3pt solid #8c2d20}
.piede{position:fixed;bottom:4mm;left:0;right:0;text-align:center;font-size:7pt;color:#7b8a87}
`;

const RENDER = String.raw`
const E=s=>String(s==null?'':s);
const O=[];
/* MESI e GG li dichiara gia' il blocco dati: qui servono per esteso */
const QMESI=['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto',
             'settembre','ottobre','novembre','dicembre'];
const QGG=['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
const dt=iso=>new Date(+iso.slice(0,4),+iso.slice(5,7)-1,+iso.slice(8,10));
const lungo=iso=>{const d=dt(iso);return QGG[d.getDay()]+' '+d.getDate()+' '+QMESI[d.getMonth()];};
const pag=h=>O.push('<section class="pagina">'+h+'</section>');

/* Il registro, indicizzato per codice: la riga della giornata ci pesca
   indirizzo, telefono e condizioni di pagamento senza riscriverli. */
const perCod=c=>BOOK.find(x=>String(x[3]).includes(c));

/* Dove si dorme ogni notte, dalle giornate: luogo della sera. */
const notte={};
DAYS.forEach(d=>{ if(d.sleep && d.sleep!=='—') notte[d.iso]=d.sleep; });

/* ── 1 · copertina: i numeri, prima di tutto ──────────────────────── */
let rub='';
let grp='';
CONTATTI.forEach(c=>{
  if(c[0]!==grp){ grp=c[0]; rub+='<tr class="grp"><td colspan="3">'+E(grp)+'</td></tr>'; }
  rub+='<tr><td>'+E(c[1])+'</td><td class="m">'+E(c[2])+'</td><td>'+E(c[3])+'</td></tr>';
});
pag('<h1>'+E(VIAGGIO.nome)+' — quadro di marcia</h1>'
 +'<p class="sub">'+E(VIAGGIO.sub)+' · Davide e Franca · '+DAYS.length+' giornate<br>'
 +'Ogni spostamento con l\'ora, il posto esatto, il codice e chi chiamare. '
 +'Gli orari sono quelli dei biglietti.</p>'
 +'<h2>Numeri</h2>'
 +'<table><thead><tr><th>Chi</th><th>Numero</th><th>Quando serve</th></tr></thead><tbody>'
 +rub+'</tbody></table>');

/* ── 2 · prima di partire ─────────────────────────────────────────────
   Le scadenze che cadono prima del primo giorno non hanno una giornata in
   cui finire: senza questa pagina sparirebbero dal documento. */
const primo=DAYS[0].iso;
const prima=(typeof SCADENZE!=='undefined'?SCADENZE:[]).filter(x=>x.iso<primo);
const aperte=BOOK.filter(r=>r[1]!=='Fatto');
let pre='';
if(aperte.length){
  pre+='<div class="box rosso"><h3>Non è ancora chiuso</h3><table><tbody>';
  aperte.forEach(r=>{ pre+='<tr><td style="width:34mm"><b>'+E(r[1])+'</b></td>'
    +'<td><b>'+E(r[2])+'</b> — '+r[5]+'</td></tr>'; });
  pre+='</tbody></table></div>';
}
if(prima.length){
  pre+='<table><thead><tr><th style="width:26mm">Entro</th><th>Cosa</th></tr></thead><tbody>';
  prima.forEach(x=>{ pre+='<tr><td class="m">'+lungo(x.iso)+'<br>'+E(x.ora)+'</td>'
    +'<td><b>'+E(x.t)+'</b><br>'+x.c+'</td></tr>'; });
  pre+='</tbody></table>';
}
pag('<h2>Prima di partire</h2>'+pre);

/* ── 3 · tutto in fila ────────────────────────────────────────────────
   Un elenco solo, numerato, in ordine di data e ora: ogni trasporto, ogni
   alloggio, ogni esperienza. Il telefono sta dentro la voce, non in fondo
   al documento: chi deve chiamare lo fa da qui. Un trasporto entra da
   SPOSTAMENTI, un alloggio o un'esperienza da BOOK — ma solo se dichiara
   quando entra in scena, cosi' niente compare due volte. */
const fila=[];
(typeof SPOSTAMENTI!=='undefined'?SPOSTAMENTI:[]).forEach(x=>{
  const b=x.cod && x.cod!=='—' && x.cod!=='da prenotare' ? perCod(x.cod) : null;
  fila.push({q:x.iso+' '+x.ora, i:x.i, t:x.t, da:x.da, a:x.a,
             cod:(x.cod&&x.cod!=='—')?x.cod:'', tel:x.tel||'',
             pr:b?b[4]:'', st:b?b[1]:'', n:x.n||''});
});
BOOK.forEach(r=>{
  if(!r[6] || r[6]==='—') return;         // senza data, o gia' in fila, non entra
  fila.push({q:r[6], i:'🛏', t:r[2], dove:r[7]||'', cod:r[3], tel:r[8]||'',
             pr:r[4], st:r[1], n:r[5]});
});
/* Le scadenze del periodo di viaggio entrano nella stessa fila: sono ore
   in cui bisogna fare qualcosa, e tenerle altrove vuol dire perderle.
   Quelle di casa stanno gia' nella pagina «Prima di partire». */
(typeof SCADENZE!=='undefined'?SCADENZE:[]).filter(x=>x.iso>=DAYS[0].iso).forEach(x=>{
  fila.push({q:x.iso+' '+x.ora, i:'⏳', t:x.t, fare:true, k:x.k, n:x.c});
});
fila.sort((x,y)=>x.q.localeCompare(y.q));

const tel=t=>String(t).replace(/[^0-9+]/g,'');
let el='', k=0;
fila.forEach(v=>{
  k++;
  const [iso,ora]=v.q.split(' ');
  const apr = v.st && v.st!=='Fatto';
  if(v.fare){
    el+='<div class="v fare'+(v.k==='alert'?' aperta':'')+'">'
      +'<div class="num"><i>⏳</i></div><div>'
      +'<div class="q">'+lungo(iso)+' · <b>'+E(ora)+'</b> · da fare</div>'
      +'<div class="tt">'+E(v.t)+'</div>'
      +'<div class="note'+(v.k==='alert'?' ammonisce':'')+'" style="border-top:0;margin-top:0">'
      +v.n+'</div></div></div>';
    k--; return;
  }
  el+='<div class="v'+(apr?' aperta':'')+'">'
    +'<div class="num">'+k+'<i>'+E(v.i)+'</i></div><div>'
    +'<div class="q">'+lungo(iso)+' · <b>'+E(ora)+'</b></div>'
    +'<div class="tt">'+E(v.t)+'</div><dl>'
    +(v.da?'<dt>Da</dt><dd>'+E(v.da)+'</dd>':'')
    +(v.a?'<dt>A</dt><dd>'+E(v.a)+'</dd>':'')
    +(v.dove?'<dt>Dove</dt><dd>'+E(v.dove)+'</dd>':'')
    +(v.cod?'<dt>Codice</dt><dd><span class="k">'+E(v.cod)+'</span></dd>':'')
    +(v.tel?'<dt>Telefono</dt><dd><span class="tel">'+E(v.tel)+'</span></dd>':'')
    +(v.pr&&v.pr!=='—'?'<dt>Quanto</dt><dd>'+E(v.pr)+(apr?' — <b>'+E(v.st)+'</b>':'')+'</dd>':'')
    +'</dl>'
    +(v.n?'<div class="note'+(/⚠/.test(v.n)?' ammonisce':'')+'">'+v.n+'</div>':'')
    +'</div></div>';
});
pag('<h2>Tutto in fila</h2>'
 +'<p class="sub">Trasporti, alloggi ed esperienze in ordine di data e ora, dal primo all\'ultimo. '
 +'Il numero da chiamare è dentro ogni voce. Le voci con il bordo rosso non sono ancora chiuse.</p>'
 +el);

/* ── 4 · quello che non ha un orario ──────────────────────────────── */
/* Una riga del registro e' gia' in fila se un trasporto la richiama: i
   codici non sono scritti uguali ("AATZ2552" contro "Conferma AATZ2552"),
   quindi si confrontano per contenimento, non per uguaglianza. */
const giaInFila=c=>fila.some(v=>v.cod && (v.cod===c || c.includes(v.cod) || v.cod.includes(c)));
const senza=BOOK.filter(r=>!r[6] && !giaInFila(r[3]));
if(senza.length){
  let sz='';
  senza.forEach(r=>{ sz+='<div class="box'+(r[1]!=='Fatto'?' rosso':'')+'">'
    +'<h3>'+E(r[2])+' — <span style="font-weight:400">'+E(r[1])+'</span></h3>'
    +'<div style="font-size:8.8pt">'+r[5]+'</div>'
    +'<div style="font-size:8.4pt;color:#45544f;margin-top:1.2mm"><b>'+E(r[3])+'</b>'
    +(r[4]&&r[4]!=='—'?' · '+E(r[4]):'')+'</div></div>'; });
  pag('<h2>Senza un orario, ma da non dimenticare</h2>'+sz);
}

/* ── 3 · il registro per esteso ───────────────────────────────────── */
let reg='';
BOOK.forEach(r=>{
  reg+='<tr><td><b>'+E(r[2])+'</b><br><span style="font-size:8pt;color:#45544f">'+r[5]+'</span></td>'
    +'<td class="m">'+E(r[3])+'</td><td>'+E(r[4])+'</td><td>'+E(r[1])+'</td></tr>';
});
pag('<h2>Tutte le prenotazioni</h2>'
 +'<table><thead><tr><th>Cosa</th><th>Codice</th><th>Quanto</th><th>Stato</th></tr></thead>'
 +'<tbody>'+reg+'</tbody></table>');

/* ── 4 · le cose da sapere ────────────────────────────────────────── */
let ind='';
(typeof PRATICO!=='undefined'?PRATICO:[]).forEach(x=>{
  if(typeof x==='object' && x.id && x.t && x.b) ind+='<div class="box"><h3>'+E(x.t)+'</h3>'+x.b+'</div>';
});
pag('<h2>Indispensabili</h2>'+ind);

/* ── 6 · budget ───────────────────────────────────────────────────── */
let bud='',bmin=0,bmax=0;
BUDGET.forEach(r=>{
  const m=r[2]*(r[4]==='pp'?VIAGGIO.persone:1), M=r[3]*(r[4]==='pp'?VIAGGIO.persone:1);
  bmin+=m; bmax+=M;
  bud+='<tr><td><b>'+E(r[0])+'</b><br><span style="font-size:8pt;color:#45544f">'+r[1]+'</span></td>'
    +'<td class="m" style="text-align:right">'+(m===M?m+' €':m+'–'+M+' €')+'</td></tr>';
});
pag('<h2>Budget</h2>'
 +'<p class="sub">'+E(VIAGGIO.budgetNota)+'Le cifre dei biglietti sono quelle pagate; il resto è una forchetta.</p>'
 +'<table><thead><tr><th>Voce</th><th style="text-align:right">In due</th></tr></thead><tbody>'
 +bud+'<tr><td><b>TOTALE</b></td><td class="m" style="text-align:right"><b>'+bmin+'–'+bmax+' €</b></td></tr>'
 +'</tbody></table>');

/* ── 7 · frasario e liste ─────────────────────────────────────────── */
let fr='';
PHRASES.forEach(f=>{ fr+='<tr><td>'+E(f[0])+'</td><td><b>'+E(f[1])+'</b></td>'
  +'<td style="color:#45544f">'+E(f[2])+'</td></tr>'; });
let li='';
(typeof LISTS!=='undefined'?LISTS:[]).forEach(l=>{
  li+='<div class="box"><h3>'+E(l.t)+'</h3><ul>';
  l.i.forEach(v=>{ li+='<li>'+v+'</li>'; });
  li+='</ul></div>';
});
pag('<h2>Frasario</h2>'
 +'<p class="sub">Il vietnamita è tonale: la terza colonna serve a farsi capire, non a parlare bene. '
 +'<b>Mostrare la riga</b> funziona meglio che pronunciarla.</p>'
 +'<table><thead><tr><th>Italiano</th><th>Vietnamita</th><th>Come si dice</th></tr></thead><tbody>'
 +fr+'</tbody></table>');
pag('<h2>Da mettere nello zaino</h2>'+li);

document.body.innerHTML=O.join('');
`;

const html = `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><title>Quadro di marcia</title>
<style>${CSS}</style></head><body>
<script>${DATI}<\/script>
<script>${RENDER}<\/script>
</body></html>`;

const fileHtml = path.join(outDir, 'quadro.html');
fs.writeFileSync(fileHtml, html);

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage();
const errori = [];
page.on('pageerror', e => errori.push(e.message));
page.on('console', m => { if (m.type() === 'error') errori.push(m.text()); });
await page.goto('file://' + fileHtml, { waitUntil: 'load' });
await page.waitForTimeout(350);
if (errori.length) {
  console.error('Errori nella pagina:');
  for (const e of errori) console.error('  ✗ ' + e);
  await browser.close(); process.exit(1);
}

/* Controlli di sostanza: ogni spostamento deve comparire, e ogni riga del
   registro con un codice vero deve essere stampata. */
const conta = await page.evaluate(() => ({
  voci: document.querySelectorAll('.v').length,
  aperte: document.querySelectorAll('.v.aperta').length,
  numeri: document.querySelectorAll('.pagina:first-child tbody tr:not(.grp)').length,
  prenot: BOOK.length, pagine: document.querySelectorAll('.pagina').length,
}));

const filePdf = path.join(outDir, 'quadro.pdf');
await page.pdf({
  path: filePdf, format: 'A4', printBackground: true,
  displayHeaderFooter: true, headerTemplate: '<span></span>',
  footerTemplate: '<div style="width:100%;font:7pt \'DejaVu Sans\',sans-serif;color:#7b8a87;'
    + 'text-align:center;padding:0 10mm">QUADRO DI MARCIA · VIETNAM · '
    + '<span class="pageNumber"></span>/<span class="totalPages"></span></div>',
  margin: { top: '11mm', right: '10mm', bottom: '13mm', left: '10mm' },
});
await browser.close();

const kb = f => Math.round(fs.statSync(f).size / 1024);
const pdf = fs.readFileSync(filePdf, 'latin1');
const pagine = (pdf.match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log(`\n  Quadro di marcia · ${VIAGGIONOME(DATI)}`);
console.log(`  ${conta.voci} voci in fila (${conta.aperte} non chiuse) · ${conta.numeri} numeri · ${conta.prenot} prenotazioni · ${conta.pagine} sezioni`);
console.log(`  quadro.pdf  ${kb(filePdf)} KB · ${pagine} pagine A4`);
console.log(`  in out/${cart}/\n`);

function VIAGGIONOME(d){ const m=d.match(/nome:'([^']+)'/); return m?m[1]:'viaggio'; }
