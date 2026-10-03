#!/usr/bin/env node
/**
 * Il libretto da viaggio: la versione di carta.
 *
 *   node tools/build-libretto.mjs viaggi/2026-11-vietnam/app-mobile.html
 *
 * Il PDF che esce da `verify` è la stampa dell'app: cinquanta pagine, buone per
 * archiviare ma non per consultare in mezzo a un aeroporto. Questo è un'altra
 * cosa — un libretto pensato per la carta, con davanti le pagine che si aprono
 * venti volte (il viaggio in una pagina, gli spostamenti, i posti dove si
 * dorme) e dietro quelle che si leggono una volta sola.
 *
 * I dati NON si riscrivono: si prendono dal sorgente dell'app, tagliando il
 * blocco che va da `const VIAGGIO={` fino alla barra della luce — cioè i dati
 * del viaggio più i calcoli puri (chilometri, budget, alba e tramonto). Tutto
 * quello che viene dopo è disegno a schermo e qui non serve. Così il libretto
 * non può dire un orario diverso dall'app: è lo stesso numero, letto due volte.
 *
 * Esce in out/<cartella>/libretto.html e out/<cartella>/libretto.pdf.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const src = process.argv[2] ?? 'viaggi/2026-11-vietnam/app-mobile.html';
const cart = path.basename(path.dirname(path.resolve(src)));
const outDir = path.resolve('out', cart);
fs.mkdirSync(outDir, { recursive: true });

/* ── il taglio dei dati ───────────────────────────────────────────────── */
const sorgente = fs.readFileSync(src, 'utf8');
const da = sorgente.indexOf('const VIAGGIO={');
const a = sorgente.indexOf('/* ── la barra della luce ─', da);
if (da < 0 || a < 0) {
  console.error(`Non trovo il blocco dati in ${src}: cerco «const VIAGGIO={» e la barra della luce.`);
  process.exit(2);
}
const DATI = sorgente.slice(da, a);

/* ── il foglio di stile: carta, non schermo ───────────────────────────── */
const CSS = `
@page{size:A4;margin:15mm 14mm 17mm}
*{box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;background:#fff;color:#1A1510;
  font:10.4pt/1.42 "Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif}
h1,h2,h3,h4,.et,.num,th,.pag{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}
.et{font-size:7.4pt;letter-spacing:.16em;text-transform:uppercase;color:#7A6B55}
b,strong{font-weight:700}
i,em{font-style:italic}
a{color:inherit;text-decoration:none}
.pagina{break-after:page}
.pagina:last-child{break-after:auto}
h2{font-size:13pt;letter-spacing:.09em;text-transform:uppercase;margin:0 0 3mm;
  padding-bottom:1.6mm;border-bottom:1.6pt solid #1A1510}
h3{font-size:10pt;letter-spacing:.07em;text-transform:uppercase;margin:5mm 0 2mm;color:#8A5008}
h4{font-size:9pt;letter-spacing:.05em;text-transform:uppercase;margin:3mm 0 1.5mm}
p{margin:0 0 2mm}
ul{margin:0 0 2mm;padding-left:4.5mm}
li{margin-bottom:1mm}

/* ── copertina ── */
.cop{height:252mm;display:flex;flex-direction:column}
.cop .alto{border-bottom:1.6pt solid #1A1510;padding-bottom:4mm}
.cop h1{font-family:"Iowan Old Style",Palatino,Georgia,serif;font-size:34pt;line-height:1.02;
  margin:2mm 0 1mm;letter-spacing:-.01em}
.cop .date{font-size:13pt;color:#8A5008;letter-spacing:.04em}
.cop .chi{margin-top:1.5mm;font-size:10pt;color:#4A3F31}
.cop .mappa{flex:1;display:flex;align-items:center;justify-content:center;padding:4mm 0}
.cop .mappa svg{width:100%;height:auto;max-height:150mm}
.cifre{display:flex;gap:0;border-top:.8pt solid #CBC3B6;border-bottom:.8pt solid #CBC3B6}
.cifre div{flex:1;padding:3mm 2mm;text-align:center;border-left:.5pt solid #E2DACD}
.cifre div:first-child{border-left:0}
.cifre b{display:block;font-size:16pt;font-family:"Helvetica Neue",Arial,sans-serif;letter-spacing:-.02em}
.urg{margin-top:4mm;border:1.4pt solid #8A5008;padding:3mm 4mm;background:#FBF4E8}
.urg .et{color:#8A5008}
.urg .riga{display:flex;gap:4mm;flex-wrap:wrap;margin-top:1.5mm;font-size:9.6pt}
.urg .riga span{white-space:nowrap}
.urg .riga b{font-family:"Helvetica Neue",Arial,sans-serif;font-size:11.5pt}

/* ── tabelle ── */
table{width:100%;border-collapse:collapse;font-size:9.1pt}
th{text-align:left;font-size:7.2pt;letter-spacing:.13em;text-transform:uppercase;color:#7A6B55;
  border-bottom:.9pt solid #1A1510;padding:0 2mm 1.4mm 0;vertical-align:bottom}
td{padding:1.8mm 2mm 1.8mm 0;border-bottom:.4pt solid #E2DACD;vertical-align:top}
tr{break-inside:avoid}
td.n{font-family:"Helvetica Neue",Arial,sans-serif;font-variant-numeric:tabular-nums;white-space:nowrap}
td.g{font-family:"Helvetica Neue",Arial,sans-serif;font-size:11pt;color:#8A5008;width:9mm}
.mono{font-family:"SF Mono",Menlo,Consolas,monospace;font-size:8.4pt;letter-spacing:-.02em}
.sub{font-size:8.6pt;color:#4A3F31}
.tel{white-space:nowrap;font-family:"Helvetica Neue",Arial,sans-serif;font-size:8.8pt}

/* ── giornate ── */
.giorno{break-inside:avoid;border-top:1.2pt solid #1A1510;padding-top:2.5mm;margin-bottom:5mm;
  display:grid;grid-template-columns:1fr 62mm;gap:0 6mm}
.giorno .cap{grid-column:1/-1;display:flex;align-items:baseline;gap:3mm;margin-bottom:2mm}
.giorno .cap .n{font-family:"Helvetica Neue",Arial,sans-serif;font-size:20pt;line-height:1;color:#8A5008}
.giorno .cap h3{margin:0;font-family:"Iowan Old Style",Palatino,Georgia,serif;font-size:12.5pt;
  text-transform:none;letter-spacing:0;color:#1A1510;flex:1}
.giorno .cap .d{font-size:8.4pt;color:#7A6B55;white-space:nowrap;text-align:right}
ol.tl{list-style:none;margin:0;padding:0;font-size:9pt}
ol.tl li{display:grid;grid-template-columns:11mm 1fr;gap:2mm;padding:.9mm 0;break-inside:avoid}
ol.tl time{font-family:"Helvetica Neue",Arial,sans-serif;font-variant-numeric:tabular-nums;color:#8A5008}
ol.tl b{font-weight:700}
ol.tl small{display:block;color:#4A3F31;font-size:8.2pt;line-height:1.34}
.lato > div{border-left:.5pt solid #E2DACD;padding-left:3mm;margin-bottom:2.5mm}
.lato .et{display:block;margin-bottom:.8mm}
.lato p{font-size:8.7pt;line-height:1.36;margin:0}
.ora{border-left:1.6pt solid #8A5008 !important}
.ora p{font-size:9pt}
.ora .t{font-family:"Helvetica Neue",Arial,sans-serif;font-size:12pt;color:#8A5008}

/* ── frasario e numeri ── */
.due{column-count:2;column-gap:7mm}
.due > *{break-inside:avoid}
.blocco{break-inside:avoid;margin-bottom:4mm}
.blocco h4{margin-top:0}
.frasi{width:100%;border-collapse:collapse;font-size:9pt}
.frasi td{padding:1.3mm 2mm 1.3mm 0;border-bottom:.4pt solid #E2DACD}
.frasi .vn{font-weight:700}
.frasi .pr{color:#7A6B55;font-style:italic;font-size:8.4pt}
.sos{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin-bottom:4mm}
.sos div{border:1pt solid #1A1510;padding:3mm 2mm;text-align:center}
.sos b{display:block;font-family:"Helvetica Neue",Arial,sans-serif;font-size:19pt;line-height:1}
.sos span{display:block;font-size:7.4pt;letter-spacing:.09em;text-transform:uppercase;color:#4A3F31;margin-top:1mm}
.sos .em{grid-column:1/-1;background:#FBF4E8;border-color:#8A5008}
.sos .em b{color:#8A5008;font-size:26pt}
.ck{font-size:8.8pt;line-height:1.5}
.ck li{list-style:none;margin:0 0 .6mm;padding-left:5mm;position:relative}
.ck li::before{content:"";position:absolute;left:0;top:1.1mm;width:2.6mm;height:2.6mm;
  border:.7pt solid #8A7B64}
.nota{border-left:1.6pt solid #8A5008;padding:2mm 0 2mm 3mm;background:#FBF4E8;
  font-size:9pt;margin:2mm 0}
.testo{font-size:9.3pt}
.testo ul{padding-left:4mm}
.testo li{margin-bottom:1.2mm}
`;

/* ── il programma che impagina, eseguito nella pagina ─────────────────── */
const RENDER = String.raw`
const E=s=>String(s==null?'':s);
const el=(h)=>{const d=document.createElement('div');d.innerHTML=h;return d;};
const O=[];
const pag=h=>O.push('<section class="pagina">'+h+'</section>');

/* ---- la mappa, ridisegnata per la carta ---- */
function mappa(){
  const z=VIAGGIO.zoom.viaggio||Object.values(VIAGGIO.zoom)[0];
  const W=1000, lon0=z.lon[0], lon1=z.lon[1], lat0=z.lat[0], lat1=z.lat[1];
  const kx=W/(lon1-lon0), ky=kx/Math.cos((lat0+lat1)/2*Math.PI/180);
  const H=(lat1-lat0)*ky;
  const P=([lo,la])=>[((lo-lon0)*kx).toFixed(1),((lat1-la)*ky).toFixed(1)];
  const via=pt=>pt.map(P).map(p=>p.join(' ')).join(' L ');
  const terra='M '+via(COAST.concat(VIAGGIO.chiusura))+' Z';
  const stile={aria:'stroke-dasharray:9 7;stroke:#9A8E79;stroke-width:1.6',
               sea:'stroke-dasharray:2 5;stroke:#1A1510;stroke-width:2.4',
               exc:'stroke-dasharray:2 5;stroke:#7A6B55;stroke-width:1.8',
               back:'stroke-dasharray:8 5;stroke:#1A1510;stroke-width:2.4',
               out:'stroke:#1A1510;stroke-width:2.6'};
  let s='<svg viewBox="-16 -16 '+(W+32)+' '+(H+32)+'" xmlns="http://www.w3.org/2000/svg">';
  s+='<path d="'+terra+'" fill="#F0ECE3" stroke="#CBC3B6" stroke-width="1.4"/>';
  for(const l of LEGS) s+='<path d="M '+via(l.p)+'" fill="none" stroke-linejoin="round" '
    +'stroke-linecap="round" style="'+(stile[l.k]||stile.out)+'"/>';
  for(const i of (VIAGGIO.isole||[])){ const [x,y]=P([i[0],i[1]]);
    s+='<ellipse cx="'+x+'" cy="'+y+'" rx="'+(i[2]*kx).toFixed(1)+'" ry="'+(i[3]*ky).toFixed(1)
      +'" transform="rotate('+(i[4]||0)+' '+x+' '+y+')" fill="#F0ECE3" stroke="#CBC3B6" stroke-width="1.4"/>';
  }
  for(const t of STOPS){ const [x,y]=P([t.lon,t.lat]);
    s+='<circle cx="'+x+'" cy="'+y+'" r="'+(t.s?4:6.5)+'" fill="'+(t.s?'#fff':'#8A5008')
      +'" stroke="#1A1510" stroke-width="'+(t.s?1.8:2)+'"/>';
    s+='<text x="'+(+x+(t.dx||0))+'" y="'+(+y+(t.dy||0))+'" text-anchor="'+(t.a||'start')
      +'" font-family="Helvetica,Arial" font-size="'+(t.s?15:18)+'" font-weight="'+(t.s?400:700)
      +'" fill="#1A1510">'+E(t.n)+'</text>';
  }
  for(const e of (VIAGGIO.etichette||[])){ const [x,y]=P([e[1],e[2]]);
    s+='<text x="'+x+'" y="'+y+'" text-anchor="middle" transform="rotate('+(e[3]||0)+' '+x+' '+y+')" '
      +'font-family="Helvetica,Arial" font-size="17" letter-spacing="3" fill="#A79A84">'+E(e[0])+'</text>';
  }
  return s+'</svg>';
}

/* ---- 1. copertina ---- */
{
  const b=budget(), ing=ingressi();
  const em=SOS.n.filter(x=>x[2]==='em').concat(SOS.n.filter(x=>x[2]!=='em')).slice(0,4);
  pag('<div class="cop">'
   +'<div class="alto"><div class="et">Libretto di viaggio</div>'
   +'<h1>'+E(VIAGGIO.nome)+'</h1>'
   +'<div class="date">'+E(VIAGGIO.sub)+'</div>'
   +'<div class="chi">Davide e Franca · '+NG+' giornate · '+STOPS.filter(t=>!t.s).length+' basi</div></div>'
   +'<div class="mappa">'+mappa()+'</div>'
   +'<div class="cifre">'
     +'<div><b>'+nkm(totKm())+'</b><span class="et">km</span></div>'
     +'<div><b>'+hm(totMin())+'</b><span class="et">'+LEX.durataTot+'</span></div>'
     +(typeof SPOSTAMENTI!=='undefined'&&SPOSTAMENTI.length
        ? '<div><b>'+SPOSTAMENTI.length+'</b><span class="et">spostamenti</span></div>'
        : '<div><b>'+BIGLIETTI.length+'</b><span class="et">biglietti</span></div>')
     +'<div><b>'+nkm(b.tot[0])+'–'+nkm(b.tot[1])+' €</b><span class="et">budget in due</span></div>'
   +'</div>'
   +'<div class="urg"><div class="et">Se succede qualcosa</div><div class="riga">'
     +em.map(x=>'<span><b>'+E(x[0])+'</b> '+E(x[1]).replace(/<br>.*$/,'').replace(/<[^>]+>/g,'')+'</span>').join('')
   +'</div></div></div>');
}

/* ---- 2. il viaggio in una pagina ---- */
{
  let r='';
  for(const d of DAYS){
    const L=luceDi(d), o=scelta(d);
    r+='<tr><td class="g">'+d.n+'</td>'
      +'<td class="n">'+E(d.short)+'</td>'
      +'<td><b>'+E(d.title)+'</b>'+(o?'<br><span class="sub">scelto: '+E(o.t)+'</span>':'')+'</td>'
      +'<td class="n">'+E(d.luogo)+'</td>'
      +'<td class="n">'+E(d.key.t)+'</td>'
      +'<td class="n">'+nkm(dayKm(d))+'</td>'
      +'<td class="n">'+hhmm(L.tram)+'</td></tr>';
  }
  pag('<h2>Il viaggio in una pagina</h2>'
   +'<table><thead><tr><th></th><th>Data</th><th>Giornata</th><th>La sera</th>'
   +'<th>L\'ora che conta</th><th>Km</th><th>Tramonto</th></tr></thead><tbody>'+r+'</tbody></table>'
   +'<p class="sub" style="margin-top:3mm">Alba e tramonto sono calcolati sulla latitudine e la '
   +'longitudine del posto dove si dorme quella sera, non copiati da una tabella. '
   +E(VIAGGIO.notaKm||'')+'</p>');
}

/* ---- 3. scadenze ---- */
if(typeof SCADENZE!=='undefined' && SCADENZE.length){
  const M=['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
  const G=['dom','lun','mar','mer','gio','ven','sab'];
  let r='';
  for(const x of SCADENZE){
    const d=new Date(+x.iso.slice(0,4),+x.iso.slice(5,7)-1,+x.iso.slice(8,10));
    r+='<tr><td class="n"><b>'+G[d.getDay()]+' '+d.getDate()+' '+M[d.getMonth()]+'</b>'
      +(x.ora?'<br>'+E(x.ora):'')+'</td>'
      +'<td><input type="checkbox" disabled style="margin-right:3mm;vertical-align:1px"><b>'+E(x.t)+'</b>'
      +'<br><span class="sub">'+x.c+'</span></td></tr>';
  }
  pag('<h2>Scadenze</h2>'
   +'<p class="sub">Le date entro cui bisogna aver fatto qualcosa, o entro cui si pu\u00f2 ancora '
   +'disdire senza pagare. Succedono tutte <b>prima di partire</b>, e sono quelle che si dimenticano. '
   +'Le condizioni sono copiate dalle conferme.</p>'
   +'<table><thead><tr><th style="width:24mm">Entro</th><th>Cosa</th></tr></thead><tbody>'+r+'</tbody></table>');
}

/* ---- 3b. spostamenti ---- */
if(typeof SPOSTAMENTI!=='undefined' && SPOSTAMENTI.length){
  let r='';
  for(const s of SPOSTAMENTI){
    const d=DAYS.find(x=>x.n===s.g);
    r+='<tr><td class="n">'+E(d?d.short:s.iso)+'<br><b style="font-size:11pt">'+E(s.ora)+'</b></td>'
      +'<td><b>'+E(s.t)+'</b>'
        +'<br><span class="sub">da '+E(s.da)+'</span>'
        +'<br><span class="sub">a '+E(s.a)+'</span>'
        +(s.n?'<br><span class="sub">'+s.n+'</span>':'')+'</td>'
      +'<td class="n"><span class="mono">'+E(s.cod)+'</span>'
        +(s.tel?'<br><span class="tel">'+E(s.tel)+'</span>':'')+'</td></tr>';
  }
  pag('<h2>Spostamenti</h2>'
   +'<p class="sub">Tutto quello che ha un\'ora di partenza e un codice. '
   +'Se il telefono si spegne, questa è la pagina che serve.</p>'
   +'<table><thead><tr><th style="width:20mm">Quando</th><th>Cosa, da dove, a dove</th>'
   +'<th style="width:36mm">Codice e telefono</th></tr></thead><tbody>'+r+'</tbody></table>');
}

/* ---- 4. dove si dorme + prenotazioni ---- */
{
  const righe=BOOK.map(x=>'<tr><td class="n">'+E(x[1])+'</td><td><b>'+E(x[2])+'</b>'
    +'<br><span class="sub">'+x[5]+'</span></td>'
    +'<td class="n"><span class="mono">'+E(x[3])+'</span></td>'
    +'<td class="n">'+E(x[4])+'</td></tr>').join('');
  pag('<h2>Prenotazioni</h2>'
   +'<table><thead><tr><th style="width:20mm">Stato</th><th>Cosa</th>'
   +'<th style="width:38mm">Riferimento</th><th style="width:20mm">Costo</th></tr></thead>'
   +'<tbody>'+righe+'</tbody></table>');
}

/* ---- 5. giorno per giorno ---- */
{
  let g='';
  for(const d of DAYS){
    const L=luceDi(d), o=scelta(d);
    const tl=d.tl.map(t=>'<li><time>'+E(t[0])+'</time><div><b>'+t[1]+'</b>'
      +(t[2]?'<small>'+t[2]+'</small>':'')+'</div></li>').join('');
    let lato='<div class="ora"><span class="et">L\'ora che conta</span>'
      +'<div class="t">'+E(d.key.t)+'</div><p>'+d.key.w+'</p></div>';
    lato+='<div><span class="et">Stanotte</span><p>'+d.sleep+'</p></div>';
    if(o) lato+='<div><span class="et">Scelta</span><p>'+E(o.t)+'</p></div>';
    lato+='<div><span class="et">Luce</span><p>alba '+hhmm(L.alba)+' · oro '+hhmm(L.oroT)
      +' · tramonto '+hhmm(L.tram)+' · buio '+hhmm(L.civT)+'</p></div>';
    if(d.libera) lato+='<div><span class="et">Se avanza un\'ora</span><p>'+d.libera+'</p></div>';
    if(d.pioggia) lato+='<div><span class="et">'+E(d.pTit||'Se piove')+'</span><p>'+d.pioggia+'</p></div>';
    g+='<article class="giorno"><div class="cap"><span class="n">'+d.n+'</span>'
      +'<h3>'+E(d.title)+'</h3>'
      +'<span class="d">'+E(d.date)+'<br>'+nkm(dayKm(d))+' km · '+hm(dayMin(d))+'</span></div>'
      +'<ol class="tl">'+tl+'</ol><div class="lato">'+lato+'</div></article>';
  }
  pag('<h2>Giorno per giorno</h2>'+g);
}

/* ---- 6. pratico: le sezioni scritte a mano del viaggio ---- */
{
  const testo=PRATICO.filter(x=>typeof x==='object');
  let h='';
  for(const s of testo) h+='<h3>'+E(s.t)+'</h3><div class="testo">'+s.b+'</div>';
  pag('<h2>Pratico</h2>'+h);
}

/* ---- 7. biglietti e budget ---- */
{
  const b=budget();
  const big=BIGLIETTI.map(x=>{const d=DAYS.find(y=>y.n===x.g);
    return '<tr><td class="n">'+(d?E(d.short):'')+'</td><td><b>'+E(x.n)+'</b>'
      +'<br><span class="sub">'+x.quali+'</span>'
      +'<br><span class="sub"><b>Gratis:</b> '+x.gratis+'</span></td>'
      +'<td class="n">'+(x.p?eu(x.p)+' €':'offerta')+'</td></tr>';}).join('');
  const bud=b.rows.map(r=>'<tr><td><b>'+E(r[0])+'</b><br><span class="sub">'+r[1]+'</span></td>'
    +'<td class="n">'+(r[2]===r[3]?nkm(r[2])+' €':nkm(r[2])+'–'+nkm(r[3])+' €')+'</td></tr>').join('');
  pag('<h2>Biglietti e budget</h2>'
   +'<table><thead><tr><th style="width:17mm">Giorno</th><th>Cosa si paga, e cosa si vede gratis</th>'
   +'<th style="width:20mm">Prezzo</th></tr></thead><tbody>'+big+'</tbody></table>'
   +'<h3>Budget per '+pref.persone+' persone</h3>'
   +'<table><tbody>'+bud
   +'<tr><td><b>Totale</b></td><td class="n"><b>'+nkm(b.tot[0])+'–'+nkm(b.tot[1])+' €</b></td></tr>'
   +'</tbody></table>');
}

/* ---- 8. frasario + numeri + valigia ---- */
{
  const fr=PHRASES.map(p=>'<tr><td>'+E(p[0])+'</td><td class="vn">'+E(p[1])+'</td>'
    +'<td class="pr">'+E(p[2])+'</td></tr>').join('');
  pag('<h2>Frasario</h2>'
   +'<p class="sub">'+(VIAGGIO.notaFrasario||'')+'</p>'
   +'<table class="frasi"><tbody>'+fr+'</tbody></table>');

  const sos='<div class="sos">'+SOS.n.map(x=>'<div'+(x[2]?' class="'+x[2]+'"':'')+'><b>'+E(x[0])+'</b>'
    +'<span>'+E(x[1]).replace(/<br>/g,' · ').replace(/<[^>]+>/g,'')+'</span></div>').join('')+'</div>';
  const liste=LISTS.map(l=>'<div class="blocco"><h4>'+E(l.t)+'</h4><ul class="ck">'
    +l.i.map(x=>'<li>'+x+'</li>').join('')+'</ul></div>').join('');
  pag('<h2>Numeri utili</h2>'+sos+'<div class="testo">'+(SOS.note||'')+'</div>'
   +'<h2 style="margin-top:7mm">Da fare e da mettere in valigia</h2>'
   +'<div class="due">'+liste+'</div>');
}

document.body.innerHTML=O.join('');
`;

/* ── assemblaggio ─────────────────────────────────────────────────────── */
const html = `<!doctype html>
<html lang="it"><head><meta charset="utf-8">
<title>Libretto — dati del viaggio</title>
<style>${CSS}</style></head><body>
<script>${DATI}<\/script>
<script>${RENDER}<\/script>
</body></html>`;

const fileHtml = path.join(outDir, 'libretto.html');
fs.writeFileSync(fileHtml, html);

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage();
const errori = [];
page.on('pageerror', e => errori.push(e.message));
page.on('console', m => { if (m.type() === 'error') errori.push(m.text()); });
await page.goto('file://' + fileHtml, { waitUntil: 'load' });
await page.waitForTimeout(400);

if (errori.length) {
  console.error('Errori nella pagina:');
  for (const e of errori) console.error('  ✗ ' + e);
  await browser.close();
  process.exit(1);
}

const titolo = await page.evaluate(() => (typeof VIAGGIO !== 'undefined' ? VIAGGIO.nome + ' · ' + VIAGGIO.sub : ''));
const filePdf = path.join(outDir, 'libretto.pdf');
await page.pdf({
  path: filePdf, format: 'A4', printBackground: true,
  margin: { top: '15mm', right: '14mm', bottom: '17mm', left: '14mm' },
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate:
    `<div style="width:100%;padding:0 14mm;font:7.6pt -apple-system,Helvetica,Arial;color:#8A7B64;
      display:flex;justify-content:space-between;letter-spacing:.1em;text-transform:uppercase">
      <span>${titolo.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>
      <span class="pageNumber"></span></div>`,
});
await browser.close();

const kb = f => Math.round(fs.statSync(f).size / 1024);
/* il conteggio pagine si legge dal PDF: /Type /Page senza /Pages */
const pdf = fs.readFileSync(filePdf, 'latin1');
const pagine = (pdf.match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log(`\n  Libretto di ${titolo}`);
console.log(`  libretto.html  ${kb(fileHtml)} KB`);
console.log(`  libretto.pdf   ${kb(filePdf)} KB · ${pagine} pagine A4`);
console.log(`  in out/${cart}/\n`);
