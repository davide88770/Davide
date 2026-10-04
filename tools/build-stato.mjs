#!/usr/bin/env node
/**
 * Lo stato del viaggio: due pagine A4 da stampare e appendere.
 *
 *   npm run stato viaggi/2026-11-vietnam/app-mobile.html
 *
 * Non è il libretto — quello si porta in viaggio. Questo si guarda *prima*:
 * cosa manca, entro quando, cosa è già a posto. Serve finché il viaggio si
 * prepara, e il giorno della partenza si butta.
 *
 * Come il libretto, non riscrive nessun dato: taglia dal sorgente dell'app il
 * blocco che va da `const VIAGGIO={` fino alla barra della luce e lo esegue.
 * Le voci «fatto» e «da fare» escono dal registro delle prenotazioni e dalle
 * liste, le scadenze da SCADENZE, gli errori corretti dai riscontri. L'unica
 * cosa scritta qui dentro è l'elenco delle incertezze dichiarate, che è un
 * giudizio e non un dato.
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
if (da < 0 || a < 0) {
  console.error(`Non trovo il blocco dati in ${src}.`);
  process.exit(2);
}
const DATI = sorgente.slice(da, a);

/* Le incertezze dichiarate: l'unica parte non derivata dai dati. Sono le cose
   che restano aperte non per pigrizia ma per natura — un cambio che si muove,
   una fonte che si contraddice, un orario che sa solo l'autista. */
const INCERTEZZE = [
  ['Il cambio euro/dong', 'Le conversioni usano 30.000 VND per euro, il valore trovato per il 2026. Gli alloggi si pagano in dong al cambio del giorno, quindi gli euro qui sopra sono indicativi: gli importi veri sono quelli in VND.'],
  ['Etihad: 48 o 30 ore?', 'Il sito di Etihad dice che il check-in online apre 48 ore prima; alcune fonti terze dicono 30. Il promemoria è impostato a 48 ore — se non è ancora aperto, si riprova più tardi.'],
  ['La limousine del 21: valico o tunnel?', 'Il biglietto non dichiara il percorso. Con tre ore e dieci fisse è probabile il tunnel del Hai Van, ma lo sa solo l\'autista: chiederglielo salendo.'],
  ['Il meteo del Centro', 'Novembre a Hue e Hoi An è il mese più piovoso dell\'anno, e il Thu Bồn può allagare la città vecchia. Non è un rischio da gestire, è il calendario: i piani B sono scritti nell\'app.'],
];

const CSS = `
@page{size:A4;margin:14mm 13mm 15mm}
*{box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;background:#fff;color:#1A1510;
  font:9.6pt/1.38 "Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif}
h1,h2,h3,.et,th,.n{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}
.pagina{break-after:page}
.pagina:last-child{break-after:auto}
.testa{border-bottom:1.6pt solid #1A1510;padding-bottom:3mm;margin-bottom:5mm}
.et{font-size:7.2pt;letter-spacing:.16em;text-transform:uppercase;color:#7A6B55}
h1{font-family:"Iowan Old Style",Palatino,Georgia,serif;font-size:24pt;margin:1.5mm 0 1mm;letter-spacing:-.01em}
.sub{font-size:9pt;color:#4A3F31;margin:0}
h2{font-size:11pt;letter-spacing:.09em;text-transform:uppercase;margin:6mm 0 2.5mm;
  padding-bottom:1.3mm;border-bottom:1.1pt solid #1A1510}
h2:first-of-type{margin-top:0}
h3{font-size:8.6pt;letter-spacing:.06em;text-transform:uppercase;margin:4mm 0 1.5mm;color:#8A5008}
p{margin:0 0 2mm}

ul.ck{list-style:none;margin:0 0 3mm;padding:0}
ul.ck li{position:relative;padding-left:6.5mm;margin-bottom:1.8mm;break-inside:avoid;line-height:1.35}
ul.ck li::before{content:"";position:absolute;left:0;top:.7mm;width:3.4mm;height:3.4mm;
  border:.8pt solid #8A7B64;border-radius:.5mm}
ul.ck li b{font-weight:700}
ul.ck li small{display:block;color:#4A3F31;font-size:8.4pt;line-height:1.3;margin-top:.3mm}
ul.ck.urg li::before{border:1.3pt solid #8A5008}
/* gli errori gia' corretti: stessa lista, senza casella da spuntare */
ul.fatti{list-style:none;margin:0 0 3mm;padding:0}
ul.fatti li{margin-bottom:2.2mm;break-inside:avoid;line-height:1.35}
ul.fatti li small{display:block;color:#4A3F31;font-size:8.4pt;line-height:1.32;margin-top:.4mm}

table{width:100%;border-collapse:collapse;font-size:8.8pt}
th{text-align:left;font-size:7pt;letter-spacing:.12em;text-transform:uppercase;color:#7A6B55;
  border-bottom:.9pt solid #1A1510;padding:0 2mm 1.2mm 0;vertical-align:bottom}
td{padding:1.5mm 2mm 1.5mm 0;border-bottom:.4pt solid #E2DACD;vertical-align:top}
tr{break-inside:avoid}
td.n{font-family:"Helvetica Neue",Arial,sans-serif;font-variant-numeric:tabular-nums;white-space:nowrap}
td.ck{width:6mm;padding-top:2mm}
td.ck i{display:block;width:3.4mm;height:3.4mm;border:.8pt solid #8A7B64;border-radius:.5mm}
.pr{color:#4A3F31;font-size:8.2pt;line-height:1.3}
.mono{font-family:"SF Mono",Menlo,Consolas,monospace;font-size:8pt;letter-spacing:-.02em}
.tag{display:inline-block;font-family:"Helvetica Neue",Arial,sans-serif;font-size:6.8pt;
  letter-spacing:.1em;text-transform:uppercase;border:.6pt solid #8A7B64;border-radius:1mm;
  padding:.3mm 1.2mm;color:#6B5C46;vertical-align:1px}
.tag.ok{border-color:#2F6B3A;color:#2F6B3A}
.tag.no{border-color:#8A5008;color:#8A5008;font-weight:700}
.nota{border-left:1.5pt solid #8A5008;background:#FBF4E8;padding:2.5mm 0 2.5mm 3mm;margin:3mm 0;font-size:8.8pt}
.cifre{display:flex;border-top:.8pt solid #CBC3B6;border-bottom:.8pt solid #CBC3B6;margin:4mm 0}
.cifre div{flex:1;padding:2.5mm 1mm;text-align:center;border-left:.5pt solid #E2DACD}
.cifre div:first-child{border-left:0}
.cifre b{display:block;font-family:"Helvetica Neue",Arial,sans-serif;font-size:14pt;letter-spacing:-.02em}
.due{column-count:2;column-gap:7mm}
.due > *{break-inside:avoid}
`;

const RENDER = String.raw`
const E=s=>String(s==null?'':s);
/* togliere i tag lasciando uno spazio: senza, «dichiararlo.<br>La limousine»
   diventa «dichiararlo.La limousine» */
const puli=s=>String(s==null?'':s)
  .replace(/<[^>]+>/g,' ').replace(/\s+/g,' ')
  /* uno spazio al posto di un tag inline lascia «2027 , non»: si richiude */
  .replace(/\s+([,.;:!?»)\u2019])/g,'$1').replace(/([«(])\s+/g,'$1').trim();
const O=[];
const pag=h=>O.push('<section class="pagina">'+h+'</section>');
const M=['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
const G=['dom','lun','mar','mer','gio','ven','sab'];
const INCERTEZZE=__INCERTEZZE__;

const fatto = BOOK.filter(r=>r[1]==='Fatto');
/* le righe «Da fare» del registro sono le stesse decisioni che compaiono
   sopra, prese dai riscontri: qui si tengono solo le cose da sbrigare */
const aperte = BOOK.filter(r=>r[1]!=='Fatto' && r[1]!=='Da fare');
const corretti = RISCONTRI.filter(r=>r.q==='si');
const dubbi = RISCONTRI.filter(r=>r.q==='forse');
const scoperti = RISCONTRI.filter(r=>r.q==='no');

/* ── pagina 1: cosa manca ───────────────────────────────────────────── */
{
  const b=budget();
  let h='<div class="testa"><div class="et">Stato del viaggio · stampato il '
    +new Date().getDate()+' '+M[new Date().getMonth()]+' '+new Date().getFullYear()+'</div>'
    +'<h1>'+E(VIAGGIO.nome)+'</h1>'
    +'<p class="sub">'+E(VIAGGIO.sub)+' · Davide e Franca · '+NG+' giornate</p></div>';

  h+='<div class="cifre">'
    +'<div><b>'+fatto.length+'</b><span class="et">prenotato</span></div>'
    +'<div><b>'+aperte.length+'</b><span class="et">da chiudere</span></div>'
    +'<div><b>'+(typeof SCADENZE!=='undefined'?SCADENZE.length:0)+'</b><span class="et">scadenze</span></div>'
    +'<div><b>'+nkm(b.tot[0])+'–'+nkm(b.tot[1])+' €</b><span class="et">budget in due</span></div>'
    +'</div>';

  if(scoperti.length){
    h+='<h2>Decisioni ancora aperte</h2><ul class="ck urg">';
    for(const r of scoperti) h+='<li><b>'+E(r.t)+'</b><small>'+puli(r.c)+'</small></li>';
    h+='</ul>';
  }

  h+='<h2>Da sbrigare</h2><ul class="ck">';
  for(const r of aperte) h+='<li><b>'+E(r[2])+'</b> <span class="tag no">'+E(r[1])+'</span>'
    +'<small>'+puli(r[5])+'</small></li>';
  h+='</ul>';

  h+='<h3>E poi, senza una scadenza stampata</h3><ul class="ck due">';
  for(const x of LISTS[0].i) h+='<li>'+puli(x)+'</li>';
  h+='</ul>';

  pag(h);
}

/* ── pagina 2: le scadenze ──────────────────────────────────────────── */
if(typeof SCADENZE!=='undefined' && SCADENZE.length){
  let r='';
  for(const x of SCADENZE){
    const d=new Date(+x.iso.slice(0,4),+x.iso.slice(5,7)-1,+x.iso.slice(8,10));
    r+='<tr><td class="ck"><i></i></td>'
      +'<td class="n"><b>'+G[d.getDay()]+' '+d.getDate()+' '+M[d.getMonth()]+'</b>'
      +(x.ora?'<br>'+E(x.ora):'')+'</td>'
      +'<td><b>'+E(x.t)+'</b><br><span class="pr">'+puli(x.c)+'</span></td></tr>';
  }
  pag('<h2>Scadenze</h2>'
   +'<p class="sub">'+puli(VIAGGIO.scadenzeNota||'')+'</p>'
   +'<table><thead><tr><th></th><th style="width:22mm">Entro</th><th>Cosa</th></tr></thead>'
   +'<tbody>'+r+'</tbody></table>');
}

/* ── pagina 3: cosa è a posto, e cosa resta incerto ─────────────────── */
{
  let h='<h2>Prenotato e verificato</h2><table><tbody>';
  for(const r of fatto) h+='<tr><td><b>'+E(r[2])+'</b><br><span class="pr">'
    +puli(r[5])+'</span></td>'
    +'<td class="n"><span class="mono">'+E(r[3])+'</span><br>'+E(r[4])+'</td></tr>';
  h+='</tbody></table>';

  if(corretti.length){
    h+='<h2>Errori trovati e corretti</h2><ul class="fatti">';
    for(const r of corretti) h+='<li><b>'+E(r.t)+'</b> '
      +'<span class="tag ok">'+E(r.d)+'</span>'
      +'<small>'+puli(r.c)+'</small></li>';
    h+='</ul>';
  }

  h+='<h2>Resta incerto, e non per distrazione</h2>';
  for(const [t,c] of INCERTEZZE.concat(dubbi.map(r=>[r.t,puli(r.c)])))
    h+='<div class="nota"><b>'+E(t)+'</b> — '+E(c)+'</div>';
  pag(h);
}

document.body.innerHTML=O.join('');
`.replace('__INCERTEZZE__', JSON.stringify(INCERTEZZE));

const html = `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><title>Stato del viaggio</title>
<style>${CSS}</style></head><body>
<script>${DATI}<\/script>
<script>${RENDER}<\/script>
</body></html>`;

const fileHtml = path.join(outDir, 'stato.html');
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
  await browser.close();
  process.exit(1);
}
const titolo = await page.evaluate(() => VIAGGIO.nome + ' · ' + VIAGGIO.sub);
const filePdf = path.join(outDir, 'stato.pdf');
await page.pdf({
  path: filePdf, format: 'A4', printBackground: true,
  margin: { top: '14mm', right: '13mm', bottom: '15mm', left: '13mm' },
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate:
    `<div style="width:100%;padding:0 13mm;font:7.4pt -apple-system,Helvetica,Arial;color:#8A7B64;
      display:flex;justify-content:space-between;letter-spacing:.1em;text-transform:uppercase">
      <span>Stato del viaggio · ${titolo.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>
      <span class="pageNumber"></span></div>`,
});
await browser.close();

const kb = f => Math.round(fs.statSync(f).size / 1024);
const pdf = fs.readFileSync(filePdf, 'latin1');
const pagine = (pdf.match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log(`\n  Stato di ${titolo}`);
console.log(`  stato.pdf  ${kb(filePdf)} KB · ${pagine} pagine A4`);
console.log(`  in out/${cart}/\n`);
