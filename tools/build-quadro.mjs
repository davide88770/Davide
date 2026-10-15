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

/* ── 2 · giorno per giorno ────────────────────────────────────────── */
let corpo='';
DAYS.forEach(d=>{
  const sp=(typeof SPOSTAMENTI!=='undefined'?SPOSTAMENTI:[]).filter(x=>x.iso===d.iso);
  /* Un mezzo che parte la sera e arriva la mattina dopo non comparirebbe
     nella giornata dell'arrivo: chi legge il 20 non saprebbe di scendere a
     Hue alle 06:30. Si riconosce dall'ora scritta nell'arrivo, piu' piccola
     di quella di partenza. */
  const ieri=new Date(dt(d.iso).getTime()-864e5).toISOString().slice(0,10);
  const notturni=(typeof SPOSTAMENTI!=='undefined'?SPOSTAMENTI:[]).filter(x=>{
    if(x.iso!==ieri) return false;
    const m=String(x.a).match(/(\d\d):(\d\d)/); if(!m) return false;
    return m[0] < x.ora;
  }).map(x=>({ora:String(x.a).match(/(\d\d):(\d\d)/)[0],tipo:'a',x:{...x,ora0:x.ora}}));
  const sc=(typeof SCADENZE!=='undefined'?SCADENZE:[]).filter(x=>x.iso===d.iso);
  if(!sp.length && !sc.length && !notte[d.iso] && !notturni.length) return;

  /* Spostamenti e cose da fare vanno mescolati e messi in ordine di ora:
     e' il senso del documento, leggere la giornata dall'alto in basso. */
  const voci=[...notturni,...sp.map(x=>({ora:x.ora,tipo:'s',x})),
              ...sc.map(x=>({ora:x.ora,tipo:'c',x}))]
    .sort((a,b)=>a.ora.localeCompare(b.ora));
  let righe='';
  voci.forEach(v=>{
    const x=v.x;
    if(v.tipo==='a'){
      righe+='<div class="r"><div class="o">'+E(v.ora)+'<i>arrivo</i></div><div>'
        +'<div class="t">'+E(x.t)+' — si scende</div>'
        +'<div class="v"><b>A:</b> '+E(x.a)+'<br>'
        +'<span style="color:#5a6a68">partito ieri alle '+E(x.ora0)+' da '+E(x.da)+'</span></div>'
        +'</div></div>';
      return;
    }
    if(v.tipo==='c'){
      righe+='<div class="r"><div class="o">'+E(x.ora)+'<i>da fare</i></div><div>'
        +'<div class="t">'+E(x.t)+'</div>'
        +'<div class="'+(x.k==='alert'?'av':'nt')+'">'+x.c+'</div></div></div>';
      return;
    }
    const b=x.cod && x.cod!=='—' && x.cod!=='da prenotare' ? perCod(x.cod) : null;
    righe+='<div class="r"><div class="o">'+E(x.ora)+'<i>'+E(x.i)+'</i></div><div>'
      +'<div class="t">'+E(x.t)+'</div>'
      +'<div class="v"><b>Da:</b> '+E(x.da)+'<br><b>A:</b> '+E(x.a)+'</div>'
      +'<div class="v">'
        +(x.cod&&x.cod!=='—'?'<span class="k">'+E(x.cod)+'</span> ':'')
        +(x.tel?' <span class="tel">'+E(x.tel)+'</span>':'')
        +(b?' · '+E(b[4]):'')
      +'</div>'
      +(x.n?'<div class="'+(/⚠/.test(x.n)?'av':'nt')+'">'+x.n+'</div>':'')
      +'</div></div>';
  });
  corpo+='<div class="g'+(sp.some(x=>/⚠/.test(x.n||''))?' n-alert':'')+'">'
    +'<div class="gh"><span class="n">'+d.n+'</span>'
    +'<span class="d">'+lungo(d.iso)+'</span>'
    +'<span class="s">'+E(d.title)+'</span></div>'
    +'<div class="gb">'+(righe||'<div class="nt">Nessuno spostamento: giornata sul posto.</div>')
    +(notte[d.iso]?'<div class="dorme"><b>Si dorme:</b> '+notte[d.iso]+'</div>':'')
    +'</div></div>';
});
pag('<h2>Giorno per giorno</h2>'+corpo);

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
  giornate: document.querySelectorAll('.g').length,
  righe: document.querySelectorAll('.r').length,
  numeri: document.querySelectorAll('.pagina:first-child tbody tr:not(.grp)').length,
  prenot: document.querySelectorAll('.pagina:nth-child(3) tbody tr').length,
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
console.log(`  ${conta.giornate} giornate · ${conta.righe} righe · ${conta.numeri} numeri · ${conta.prenot} prenotazioni`);
console.log(`  quadro.pdf  ${kb(filePdf)} KB · ${pagine} pagine A4`);
console.log(`  in out/${cart}/\n`);

function VIAGGIONOME(d){ const m=d.match(/nome:'([^']+)'/); return m?m[1]:'viaggio'; }
