#!/usr/bin/env node
/**
 * L'itinerario di Samira, completato.
 *
 *   npm run itinerario viaggi/2026-11-vietnam/app-mobile.html
 *
 * Il documento di partenza è l'itinerario personalizzato scritto da Samira
 * Vicinanza (The Ocean Nomads) per Davide e Franca: struttura, consigli e
 * parole sono suoi, e restano. Quello che cambia è che al posto dei «QUI» e
 * delle «OPZIONE 1 / 2 / 3» — i link fra cui scegliere — c'è quello che è
 * stato prenotato davvero, con indirizzo, orario, codice e telefono.
 *
 * I dati delle prenotazioni NON si riscrivono qui: si pescano dal registro
 * BOOK dell'app, cercando per codice di conferma. Se una prenotazione cambia
 * nell'app, questo documento la segue. Il testo di Samira, invece, è fisso e
 * sta qui sotto: è il motivo per cui esiste questo file e non un altro.
 *
 * Esce in out/<cartella>/itinerario.html e .pdf.
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

/* ── Font e foto dell'originale ─────────────────────────────────────────
   Il documento di Samira è fatto in Canva: fondo di lino, logo, Poppins per
   i titoli e una foto per pagina. Senza quelli non è «lo stesso documento»,
   è un altro. I font sono Poppins (licenza OFL, scaricata una volta); le
   foto sono le sue, estratte dal PDF originale e ridotte per la stampa —
   stanno nel repo solo perché questo documento si possa rigenerare, e non
   vanno ripubblicate altrove. */
const ASSET = path.resolve(path.dirname(path.resolve(src)), 'itinerario-assets');
const b64 = p => fs.readFileSync(p).toString('base64');
const FONT = Object.fromEntries(['300','400','500','600'].map(w =>
  [w, b64(path.join(ASSET, 'font', `poppins-${w}.ttf`))]));
/* logo.png ha il fondo trasparente: il PDF di Chromium non porta
   mix-blend-mode, e il logo su bianco lasciava un riquadro sul lino */
const F = Object.fromEntries(fs.readdirSync(path.join(ASSET, 'foto'))
  .filter(n => /\.(jpg|png)$/.test(n))
  .map(n => [n.replace(/\.(jpg|png)$/,''),
    'data:image/' + (n.endsWith('.png') ? 'png' : 'jpeg') + ';base64,'
    + b64(path.join(ASSET,'foto',n))]));

/* I link dell'originale che restano utili: non sono stati scelti, sono
   strumenti. Quelli di affiliazione di Samira si tengono come li ha messi
   lei — è il suo lavoro, ed è giusto che passi di lì. */
const L = {
  assicurazione: 'https://heymondo.it/?utm_medium=Afiliado&utm_source=THEOCEANNOMADS&utm_campaign=PRINCIPAL&cod_descuento=THEOCEANNOMADS&ag_campaign=SAMIRATHEOCEANOMADS&agencia=Rw8U47qVabaFyFgHQpiDINJRxse3dPgQd4wk5H4x',
  viaggiaresicuri: 'https://www.viaggiaresicuri.it/home',
  amazon: 'https://www.amazon.it/shop/samira_nomad_spirit',
  revolut: 'https://www.revolut.com/referral/?referral-code=samiratnut!APR1-25-AR-L1',
  esim: 'https://esim.holafly.com/?irclickid=ShrToSxY-xyZRwa06zzNtTMhUkuSCLwalzCt1A0&discount=&utm_source=affiliate&utm_medium=The%20Ocean%20Nomads%20-%20Samira%20Vicinanza%20Travel%20Designer&utm_campaign=7541279&irgwc=1&afsrc=1&tw_source=impact&tw_campaign=7541279&tw_term=2006335',
  caiman: 'https://maps.app.goo.gl/QZUSE9rwqTUprVBc6',
  notecafe: 'https://maps.app.goo.gl/QeAnn1rSreXaURqBA',
  bia: 'https://maps.app.goo.gl/EY687fRVng6Fq5CK8',
  sapaochau: 'https://sapaochau.org/index.php/sapa-trekking-and-homestay/sapa-trek-and-tour/trekking-tours/ta-phin-trek-1-day/',
  scooterSapa: 'https://share.google/X2zjF9BVvVXVKK0m3',
  mysonGrab: 'https://www.getyourguide.com/hoi-an-l831/il-santuario-di-mio-figlio-e-la-montagna-di-marmo-t551707/?ranking_uuid=1ba29e0d-f7ed-4e75-af7f-93ad66e16f82&referral_redirect=1',
  bici: 'https://www.getyourguide.com/hoi-an-l831/countryside-small-group-bicycle-tour-for-families-9km-t130629/?partner_id=OCZX901&utm_medium=online_publisher',
  meditazione: 'https://mindfulnessmeditation-vietnam.com/',
};

const CSS = `
@font-face{font-family:Poppins;font-weight:300;src:url(data:font/ttf;base64,${FONT['300']}) format('truetype')}
@font-face{font-family:Poppins;font-weight:400;src:url(data:font/ttf;base64,${FONT['400']}) format('truetype')}
@font-face{font-family:Poppins;font-weight:500;src:url(data:font/ttf;base64,${FONT['500']}) format('truetype')}
@font-face{font-family:Poppins;font-weight:600;src:url(data:font/ttf;base64,${FONT['600']}) format('truetype')}
@page{size:A4;margin:0}
*{box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;background:#fff;color:#44514F;font:300 9.2pt/1.55 Poppins,"Helvetica Neue",Arial,sans-serif}
a{color:#44514F;text-decoration:underline;text-underline-offset:2px}

/* la pagina: misura fissa, fondo di lino e due curve pallide come nell'originale */
/* isolation fa della pagina la radice del proprio impilamento: cosi' il lino
   e le curve stanno sotto il contenuto con z-index negativo senza finire
   dietro al fondo della pagina, e soprattutto il contenuto resta non
   posizionato — serve al logo, che e' un JPEG su bianco e si fonde col lino
   solo se nessun antenato apre un contesto di impilamento. */
.pg{position:relative;isolation:isolate;width:210mm;min-height:297mm;overflow:hidden;
  background:#FDFDFC;break-after:page;padding:0}
.pg:last-child{break-after:auto}
.lino{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.5;z-index:-2}
.curva{position:absolute;border-radius:50%;background:#F2F2F0;z-index:-1}
.c1{width:150mm;height:150mm;right:-55mm;top:-40mm}
.c2{width:190mm;height:190mm;left:-95mm;bottom:-60mm}

/* testatina delle giornate */
.cap{width:100mm;margin:11mm auto 0;text-align:left}
.cap img{display:block;width:46mm;margin:0 0 5mm}
.et{font-size:9pt;font-weight:400;letter-spacing:.09em;text-transform:uppercase;color:#7B8684}
.cap .et{padding-bottom:3.5mm;border-bottom:.5pt solid #BFC6C4}
.banda > .et{color:#4E5B59}
h1.giorno{font-size:30pt;font-weight:600;letter-spacing:.055em;color:#36433F;
  text-align:center;margin:9mm 0 0;line-height:1}
/* la pagina che continua una giornata: stessa testatina, titolo piu' piccolo */
h2.segue{font-size:16pt;font-weight:500;letter-spacing:.08em;color:#36433F;
  text-align:center;margin:10mm 0 0;line-height:1}
h2.segue span{display:block;font-size:8.6pt;font-weight:300;letter-spacing:.24em;
  color:#8C9695;margin-top:3mm}
.data{font-size:10.5pt;font-weight:400;letter-spacing:.3em;color:#5C6968;
  text-align:center;margin-top:4mm}

/* la fascia grigia che tiene il programma */
.banda{background:#E9EAE8;margin-top:9mm;padding:8mm 16mm 9mm 20mm;min-height:55mm}
.banda > .et{display:block;margin-bottom:4mm}
.banda p{margin:0 0 3mm}
ul{margin:0 0 3mm;padding-left:5mm;list-style:none}
li{position:relative;margin-bottom:1.6mm;padding-left:4mm}
li::before{content:"";position:absolute;left:0;top:1.9mm;width:1.7mm;height:1.7mm;
  border-radius:50%;background:#AEB7B5}
ul.dentro{margin-top:1.5mm}
b,strong{font-weight:500;color:#36433F}

/* la striscia di foto in fondo */
.foto{height:58mm;margin-top:auto;background-size:cover;background-position:center}
.foto.stretta{width:96mm;margin-left:auto;margin-right:auto}
/* due o tre foto affiancate, come nelle giornate piu' ricche dell'originale */
.fotoriga{display:flex;gap:2mm;height:58mm;margin-top:auto;justify-content:center}
.fotoriga > div{flex:1;max-width:96mm;background-size:cover;background-position:center}
.pg.fitta .foto,.pg.fitta .fotoriga{height:42mm}
.pg.flex{display:flex;flex-direction:column}
/* nell'originale la fascia grigia scende fino alla striscia di foto:
   senza questo resta un vuoto chiaro in mezzo alla pagina */
.pg.flex .banda{flex:1}

/* quello che e' prenotato: prende il posto del link, nello stesso tono */
.pren{background:#fff;border:.5pt solid #D5DAD8;border-left:2.6pt solid #5E736E;
  padding:3.4mm 4.5mm;margin:3mm 0;break-inside:avoid}
.pren .lab{display:block;font-size:7pt;font-weight:500;letter-spacing:.2em;
  text-transform:uppercase;color:#5E736E;margin-bottom:1.5mm}
.pren .nome{font-weight:500;font-size:10pt;color:#36433F;display:block;margin-bottom:1.5mm}
.pren .riga{font-size:8.4pt;line-height:1.5;color:#5A6665}
.pren .riga + .riga{margin-top:.8mm}
.pren .cod{font-family:"DejaVu Sans Mono",monospace;font-size:7.6pt;letter-spacing:-.02em;color:#36433F}
.pren.aperto{border-left-color:#B08A3E}
.pren.aperto .lab{color:#8E6C27}
.nb{background:#fff;border:.5pt solid #D5DAD8;padding:3mm 4.5mm;margin:3mm 0;
  font-size:8.6pt;line-height:1.48;break-inside:avoid}

/* copertina */
.cover{display:flex;flex-direction:column;height:297mm}
.cover .alto{flex:1;display:flex;flex-direction:column;align-items:center;padding-top:14mm}
.cover img.logo{width:62mm;margin-bottom:22mm}
.cover h1{font-size:40pt;font-weight:600;color:#36433F;margin:0;letter-spacing:.01em}
.cover .nomi{font-size:14pt;font-weight:600;letter-spacing:.26em;color:#36433F;margin-top:7mm}
.cover .chip{background:#EDEDEB;padding:2mm 7mm;margin-top:9mm;font-size:9pt;font-weight:400;
  letter-spacing:.22em;color:#5C6968;text-align:center;line-height:2}
.cover .fot{height:132mm;background-size:cover;background-position:center}

/* pagina delle informazioni */
.infotitolo{width:150mm;margin:14mm auto 0}
.infotitolo h2{font-size:21pt;font-weight:500;color:#36433F;line-height:1.25;margin:5mm 0 0}
.lista{width:150mm;margin:9mm auto 0}
.box{background:#EDEDEB;padding:4mm 8mm;margin-bottom:3.4mm;text-align:center;
  font-size:7.8pt;font-weight:400;letter-spacing:.11em;text-transform:uppercase;
  line-height:1.9;color:#55615F;break-inside:avoid}
.box a{letter-spacing:.11em}

/* collage e pagine di chiusura */
.collage{display:grid;grid-template-columns:1fr 1fr;height:297mm;gap:2mm;position:relative}
.collage div{background-size:cover;background-position:center}
.collage .tit{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  background:#fff;padding:3.5mm 11mm;font-size:25pt;font-weight:500;color:#36433F;z-index:2}
.citt{position:relative;height:297mm;background-size:cover;background-position:center;
  display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}
.citt .q{color:#fff;font-size:15pt;font-weight:600;line-height:1.45;max-width:172mm;
  text-shadow:0 1px 7px rgba(0,0,0,.35)}
.citt .a{color:#fff;font-size:13pt;font-weight:500;margin-top:1mm;text-shadow:0 1px 7px rgba(0,0,0,.35)}
.citt .b{color:#fff;font-size:15pt;font-weight:600;margin-top:11mm;line-height:1.5;
  text-shadow:0 1px 7px rgba(0,0,0,.35)}
.fin{display:grid;grid-template-columns:101mm 109mm;grid-template-rows:59fr 41fr;
  height:297mm;row-gap:3.5mm}
.fin .t{padding:16mm 12mm;font-size:10.5pt;line-height:1.75;color:#55615F}
.fin .t .au{font-size:7.6pt;letter-spacing:.14em;text-transform:uppercase;color:#9BA4A3;margin-top:4mm}
.fin .c{padding:0 12mm 16mm;align-self:end}
.fin .c img{width:52mm;display:block;margin-bottom:5mm}
.fin .c .r{font-size:9pt;line-height:1.75;color:#55615F}
.fin .im{background-size:cover;background-position:center}
`;

const RENDER = String.raw`
const L=__LINKS__, F=__FOTO__;
const E=s=>String(s==null?'':s);
const O=[];
const pag=h=>O.push('<section class="pg">'+sfondo()+h+'</section>');
const pagF=(h,cl)=>O.push('<section class="pg flex'+(cl?' '+cl:'')+'">'+sfondo()+h+'</section>');
const nuda=h=>O.push('<section class="pg">'+h+'</section>');
const sfondo=()=>'<div class="lino" style="background-image:url('+F.sfondo+')"></div>'
  +'<div class="curva c1"></div><div class="curva c2"></div>';
const cap=(et)=>'<div class="cap"><img src="'+F.logo+'" alt="The Ocean Nomads">'
  +'<div class="et">'+E(et)+'</div></div>';
const foto=(k,stretta)=>'<div class="foto'+(stretta?' stretta':'')+'" style="background-image:url('+F[k]+')"></div>';
const fotoRiga=(...kk)=>'<div class="fotoriga">'
  +kk.map(k=>'<div style="background-image:url('+F[k]+')"></div>').join('')+'</div>';
/* Una giornata che non sta in una A4 continua sulla pagina dopo: stessa
   testatina, titolo piu' piccolo con «segue», e la sua foto in fondo. */
const segue=(tit)=>cap('Daily schedule')
  +'<h2 class="segue">'+E(tit)+'<span>SEGUE</span></h2>';

/* Il blocco di quello che e' prenotato prende il posto del link: si costruisce
   dal registro BOOK cercando il codice, quindi non puo' divergere dall'app. */
function pren(codice, extra){
  const r=BOOK.find(x=>String(x[3]).includes(codice));
  if(!r) return '<div class="pren aperto"><span class="lab">Da sistemare</span>'
    +'<span class="nome">'+E(codice)+'</span></div>';
  const aperto = r[1]!=='Fatto';
  return '<div class="pren'+(aperto?' aperto':'')+'">'
    +'<span class="lab">'+(aperto?E(r[1]):'Prenotato')+'</span>'
    +'<span class="nome">'+E(r[2])+'</span>'
    +'<div class="riga">'+r[5]+'</div>'
    +'<div class="riga"><span class="cod">'+E(r[3])+'</span>'
      +(r[4]&&r[4]!=='—'?' · '+E(r[4]):'')+'</div>'
    +(extra?'<div class="riga">'+extra+'</div>':'')
    +'</div>';
}
const prenLibero=(lab,nome,testo,aperto)=>'<div class="pren'+(aperto?' aperto':'')+'">'
  +'<span class="lab">'+E(lab)+'</span><span class="nome">'+E(nome)+'</span>'
  +'<div class="riga">'+testo+'</div></div>';

/* ── 1 · copertina ─────────────────────────────────────────────────── */
nuda('<div class="cover">'+sfondo()
 +'<div class="alto"><img class="logo" src="'+F.logo+'" alt="The Ocean Nomads">'
 +'<h1>Vietnam</h1>'
 +'<div class="nomi">DAVIDE &amp; FRANCA</div>'
 +'<div class="chip">ITINERARIO PERSONALIZZATO<br>10 - 25 NOVEMBRE 2026</div></div>'
 +'<div class="fot" style="background-image:url('+F.copertina+')"></div></div>');

/* ── 2 · il collage ────────────────────────────────────────────────── */
nuda('<div class="collage">'
 +'<div style="background-image:url('+F['collage-1']+')"></div>'
 +'<div style="background-image:url('+F['collage-3']+')"></div>'
 +'<div style="background-image:url('+F['collage-4']+')"></div>'
 +'<div style="background-image:url('+F['collage-2']+')"></div>'
 +'<div class="tit">Vietnam</div></div>');

/* ── 3 · informazioni, prima di partire ────────────────────────────── */
pagF(cap('Informazioni')
 +'<div class="infotitolo"><h2>Info importanti<br>prima di partire</h2></div>'
 +'<div class="lista">'
 +'<div class="box">Fare assicurazione medico bagaglio<br>'
   +'<a href="'+L.assicurazione+'">a questo link avrete il 10% di sconto</a></div>'
 +'<div class="box">Controllare eventuali aggiornamenti prima della partenza su '
   +'<a href="'+L.viaggiaresicuri+'">viaggiaresicuri.it</a> alla voce Vietnam</div>'
 +'<div class="box">Portare spry per insetti e backpack invece di valigia '
   +'per comodità negli spostamenti</div>'
 +'<div class="box">Portare keyway e copri zaino per ripararvi dalla pioggia + scarpe e borsa '
   +'waterproof per la baia<br><a href="'+L.amazon+'">trova ispirazione sul mio shop Amazon</a></div>'
 +'<div class="box">Richiedere patente internazionale alla Motorizzazione</div>'
 +'<div class="box"><a href="'+L.revolut+'">Fare Revolut qui</a></div>'
 +'<div class="nb"><b>Aggiunto dopo le prenotazioni.</b> Il passaporto deve essere valido sei '
 +'mesi oltre l\'ingresso: entrate l\'11 novembre 2026, quindi non deve scadere prima '
 +'dell\'<b>11 maggio 2027</b>. L\'esenzione dal visto per gli italiani è di 45 giorni, ma va '
 +'<b>riverificata sul sito dell\'ambasciata</b> prima di partire.</div>'
 +'</div>'+foto('info-1'));

/* ── 4 · informazioni, in loco ─────────────────────────────────────── */
pagF(cap('Informazioni')
 +'<div class="infotitolo"><h2>Info importanti<br>in loco</h2></div>'
 +'<div class="lista">'
 +'<div class="box">Acquistare SIM in aeroporto oppure online '
   +'<a href="'+L.esim+'">eSIM qui</a> con 5% di sconto, codice THEOCEANNOMADS</div>'
 +'<div class="box">Cambiare euro in centro presso money exchange oppure prelevare, '
   +'e avere sempre contanti con sé</div>'
 +'<div class="box">Scarica l\'app «Grab» (come Uber) per spostamenti più economici</div>'
 +'<div class="box">Girare in tuk tuk da un punto di interesse all\'altro invece di taxi</div>'
 +'<div class="box">Affittare il motorino per spostarsi in autonomia e risparmiare, '
   +'o muoversi in tuk tuk / Grab se avete patente A + patente internazionale, '
   +'e solo dove indicato nel programma</div>'
 +'<div class="box">Keyway, impermeabile pioggia, attrezzatura waterproof in caso '
   +'di piogge per girare ugualmente sotto l\'acqua</div>'
 +'<div class="nb"><b>Aggiunto dopo le prenotazioni.</b> Un euro vale circa 30.000 VND: togli '
 +'tre zeri e dividi per tre. Gli alloggi si pagano quasi tutti <b>in struttura e in dong</b>. '
 +'Due eccezioni: <b>The Chum</b> a Hue non accetta contanti, solo carta, e <b>l\'Airport '
 +'Classic</b> accetta solo Visa e Mastercard.</div>'
 +'</div>'+foto('info-2'));

/* ── 5 · giorno 1 ──────────────────────────────────────────────────── */
pagF(cap('Daily schedule')+'<h1 class="giorno">GIORNO 1</h1><div class="data">11 NOVEMBRE</div>'
 +'<div class="banda"><span class="et">Trasporto</span>'
 +pren('9T6U9F','Il 10 novembre si parte: <b>EY82 Malpensa 10:30 → Abu Dhabi 19:30</b>, poi '
   +'<b>EY432 Abu Dhabi 20:50 → Hanoi 06:10</b> dell\'11. Scalo di 1h20 in transito, bagaglio '
   +'registrato fino a Hanoi.')
 +pren('860124030','L\'autista aspetta nella hall arrivi con la targhetta <b>Davide Mammi</b> e '
   +'ha il numero del volo. Si atterra alle 06:10 e il taxi è alle 12:00: cinque ore di margine.')
 +'<span class="et" style="display:block;margin-top:7mm">Attività</span>'
 +'<ul><li>Arrivo Hanoi e taxi per hotel e check in dall\'11 al 13</li></ul>'
 +pren('6158389407')
 +'<ul><li>La camera sarà pronta dopo le 12/14.00. Giro per l\'Old Quartier. Pomeriggio / sera '
 +'passeggiata lungo il lago Hoan Kiem, il tempio Ngoc Son e ponte Cau The Huc.</li>'
 +'<li>Ta Hien Corner: siediti in un ristorantino sulle popolari sedioline di plastica per '
 +'mangiare e goditi la night life.</li>'
 +'<li>Puoi mangiare <a href="'+L.bia+'">qui</a> Bia Phố Cổ Tạ Hiện (o simili nella stessa '
 +'strada).</li></ul></div>');

/* ── 6 · giorno 2 ──────────────────────────────────────────────────── */
pagF(cap('Daily schedule')+'<h1 class="giorno">GIORNO 2</h1><div class="data">12 NOVEMBRE</div>'
 +'<div class="banda"><span class="et">Attività</span>'
 +'<ul><li>VISITA DI HANOI con Grab o a piedi (tappe opzionali e a scelta in base ai vostri '
 +'interessi):'
 +'<ul class="dentro">'
 +'<li>Giro per l\'Old Quartier</li>'
 +'<li>Pagoda di Tran Quoc (gratis 8-16)</li>'
 +'<li>Tempio della Letteratura (1 euro 8-17)</li>'
 +'<li>Pagoda Chua Mot Cot (gratis 7-18)</li>'
 +'<li>Palazzo Presidenziale (1,50 euro 7:30–11:00 e 13:30–16:00)</li>'
 +'<li>Mausoleo di Ho Chi Minh (gratis dalle 7:30 alle 10:30)</li>'
 +'<li>Cittadella imperiale (8:00 alle 17:00 circa 4 euro)</li>'
 +'<li>Cattedrale St. Joseph (gratis h24)</li></ul></li></ul>'
 +'<p>Se vuoi per cena e caffe:</p>'
 +'<ul><li>Cena o pranzo <a href="'+L.caiman+'">Cai Man Bistro</a></li>'
 +'<li>Famosissimo <a href="'+L.notecafe+'">Note Cafe</a> (provare l\'EGG COFFEE, caffè tipo '
 +'zabaione)</li></ul>'
 +'<p>Sicuramente da non perdere:</p>'
 +'<ul><li>Visita alla <b>Train Street</b>: la strada famosa di Hanoi dove passa letteralmente '
 +'il treno tra le case. Controlla gli orari in cui passa il treno; se la strada è chiusa, devi '
 +'accettare che un proprietario di un bar ti inviti per passare e dovrai bere al suo bar per '
 +'poter accedere alla strada. Molti la vedono chiusa e non entrano, in realtà si può entrare '
 +'solo su «invito» di un\'attività commerciale come i bar. Ogni tanto per sicurezza dicono di '
 +'«chiuderla». Gli orari dei treni solitamente si trovano nei bar lungo la Train Street: vai '
 +'la mattina per controllare, così ritorni all\'ora giusta.</li></ul></div>'
 +foto('g2','stretta'));

/* ── 7 · giorno 3-5 ────────────────────────────────────────────────── */
pagF(cap('Daily schedule')+'<h1 class="giorno">GIORNO 3 - 5</h1>'
 +'<div class="data">13 - 15 NOVEMBRE</div>'
 +'<div class="banda"><span class="et">Attività</span>'
 +'<p>Il 13 check out, prendi il bus da HANOI a SAPA.</p>'
 +pren('12GO33251058')
 +'<p>Check in dal 13 al 15 a SaPa.</p>'
 +pren('6309631840','Si arriva a 03 Nguyen Chi Thanh: lì <b>Grab non prende</b>. Prendere alla '
   +'fermata del bus un taxi per l\'alloggio chiedendo prima il prezzo, oppure concordare il '
   +'pick up con l\'alloggio via chat Booking.')
 +'<p>Il pomeriggio goditi il posto con passeggiate nei pressi della homestay (o giri in scooter).</p>'
 +'<p>Il 14 trekking Ta Phin village o Ta Van con le donne delle comunità locali da organizzare '
 +'con loro — <a href="'+L.sapaochau+'">contattali qui</a> — oppure chiedi alla struttura. '
 +'Spesso non vedono le email: contattali via Whatsapp, hanno poco internet. Devi farti trovare '
 +'a SaPa town (ci vai con un taxi, chiedi alla reception).</p>'
 +'<p>OPZIONALMENTE all\'arrivo potete <a href="'+L.scooterSapa+'">noleggiare lo scooter</a> nel '
 +'centro di SaPa e andare uno con il taxi e bagagli e l\'altro con lo scooter all\'alloggio, '
 +'così da avere lo scooter con voi ed essere più flessibili: per girare tra le valli e le '
 +'risaie, per raggiungere il centro per la sera o la mattina del trekking senza prendere taxi.</p>'
 +'</div>'+foto('g35','stretta'),'fitta');

/* ── 7b · giorno 3-5, il rientro ───────────────────────────────────── */
pagF(segue('GIORNO 3 - 5')
 +'<div class="banda"><span class="et">Il rientro su Hanoi</span>'
 +'<div class="nb"><b>NB.</b> All\'andata lasciate lo zaino grande in Hotel ad Hanoi, se vuoi, e '
 +'porta solo un piccolo zaino a SaPa, poi dormite nello stesso hotel ad Hanoi al ritorno da '
 +'SaPa. <b>Correzione:</b> la notte del 15 <b>non</b> è nello stesso hotel dell\'andata — '
 +'vedi qui sotto.</div>'
 +'<p>Bus di ritorno per Hanoi il 15 il pomeriggio, e fate una notte dal 15 al 16 di nuovo ad '
 +'Hanoi.</p>'
 +pren('12GO33251059','Check out dalla Maison entro le 11:00–11:30, taxi concordato per salire '
   +'in centro.')
 +pren('5210368751','<b>Non è lo stesso hotel dell\'andata</b>: deve stare dentro l\'Old Quarter, '
   +'perché è da lì che la crociera passa a prendervi la mattina dopo. 1,5 km dalla Hanoi Opera '
   +'House, dove vi lascia il van.')
 +'</div>'+fotoRiga('g9a','g9b'));

/* ── 8 · giorno 6-7 ────────────────────────────────────────────────── */
pagF(cap('Daily schedule')+'<h1 class="giorno">GIORNO 6 - 7</h1>'
 +'<div class="data">16 - 17 NOVEMBRE</div>'
 +'<div class="banda"><span class="et">Attività</span>'
 +'<p>Mattina check out e pick up in hotel del bus (qui si chiama «limousine van») per la Baia '
 +'di Ha Long.</p>'
 +'<p>Organizza il pick up tramite la crociera dal tuo hotel: contattali via chat Booking sulla '
 +'tua prenotazione, vi verranno a prendere la mattina del 16 — digli il nome dell\'hotel.</p>'
 +pren('9800672634863520599','Due notti, tre giorni, per vedere anche <b>Lan Ha e Cat Ba</b> e '
   +'per addentrarsi in zone meno turistiche. Il prezzo include colazione, pranzo e cene e '
   +'attività come kayak, visite alle grotte, all\'isola di Cat Ba, villaggi dei pescatori '
   +'galleggianti. '
   +'Danny Do, WhatsApp +84 984 749 958.')
 +prenLibero('Richiesto, si aspetta il pagamento','Van Peony: Hanoi → baia di Ha Long',
   '20 USD a testa, 40 in due, sola andata. Da prenotare <b>almeno tre giorni prima</b> e '
   +'<b>solo dall\'Old Quarter</b> — è la ragione per cui la notte del 15 è in Phố Hàng Cân. '
   +'Richiesto per email il 3 ottobre con l\'indirizzo giusto; manca il link di pagamento.',1)
 +'<p><b>Chiedi di inviarti il programma dettagliato delle 3 giornate</b>, se vuoi.</p>'
 +'<p>La crociera è un\'esperienza turistica ma imperdibile, e facendo 3 giorni ti addentri in '
 +'zone meno turistiche come LAN HA e CAT BA: avrai meno barche in giro rispetto a chi fa 1 '
 +'giorno o 1 notte.</p>'
 +'<div class="nb"><b>Correzione sull\'originale.</b> Il programma diceva «fine crociera verso '
 +'le 14:00 circa». Peony ha confermato per email che lo <b>sbarco è alle 11:30 al Lotto 34 di '
 +'Tuan Chau</b>, lo stesso molo dell\'imbarco. È l\'orario dato a Halise per il van: con le '
 +'14:00 sarebbe arrivato tre ore tardi.</div></div>'
 +foto('g67','stretta'),'fitta');

/* ── 9 · giorno 8 ──────────────────────────────────────────────────── */
pagF(cap('Daily schedule')+'<h1 class="giorno">GIORNO 8</h1><div class="data">18 NOVEMBRE</div>'
 +'<div class="banda"><span class="et">Attività</span>'
 +'<p>Fine crociera e arrivo a Tam Coc.</p>'
 +prenLibero('Organizzato','Van dal Lotto 34 di Tuan Chau a Tam Coc',
   'Lo organizza <b>Halise</b>, a cui sono stati comunicati molo e orario il 3 ottobre: sbarco '
   +'<b>11:30</b>. 175 km, circa tre ore, arrivo verso le 14:30. Resta da farsi confermare per '
   +'iscritto prezzo e punto di presa, e da riconfermare la sera prima dalla barca.')
 +pren('Diretto','Camera con vista lago, dal 18 al 19.')
 +'<div class="nb"><b>NB.</b> Halise Home è un posto meraviglioso nella giungla, ma molto '
 +'semplice con pulizia standard asiatici. Può capitare che qualche insetto entri in camera, '
 +'come scarafaggio, o vedere fuori topini di campagna o animali: sei nella giungla. Il luogo è '
 +'autentico e le persone quindi non parlano bene inglese.</div>'
 +'<p>Chiedere noleggio scooter a Halise.</p>'
 +'<p>Visitate la <b>BICH DONG PAGODA</b> il pomeriggio con scooter se arrivate in tempo '
 +'(chiude alle 17.00, altrimenti la fate il giorno dopo).</p>'
 +'<p>Per la sera potete andare al centro presso <b>Tam Coc Night Market</b> / Walking Street.</p>'
 +'</div>'+foto('g8','stretta'));

/* ── 10 · giorno 9 ─────────────────────────────────────────────────── */
pagF(cap('Daily schedule')+'<h1 class="giorno">GIORNO 9</h1><div class="data">19 NOVEMBRE</div>'
 +'<div class="banda"><span class="et">Attività</span>'
 +'<p>Lascia bagagli in reception la mattina dopo per il check out. Con lo scooter fate le '
 +'seguenti visite:</p>'
 +'<ul><li>Visita la <b>Bai Dinh pagoda</b> (durata visita circa 2 o 3 ore e gratis)</li>'
 +'<li><b>La gita più bella di tutte è TRANG AN.</b> Dirigiti alla biglietteria per decidere '
 +'quale tour fare (circa 9-12 euro, circa 3 ore la durata). Sito UNESCO, Tràng An è un\'area di '
 +'pregio paesaggistico situata presso Ninh Bình. Situata sulla sponda meridionale del delta del '
 +'fiume Rosso, è caratterizzata da formazioni carsiche e vallate con pendii scoscesi. Sono '
 +'presenti tracce di insediamenti umani risalenti fino a quasi 30.000 anni fa. Tour guidato e '
+'gestito dal sito.</li>'
 +'<li><b>Mua Caves</b>, il punto panoramico più bello (circa 4 euro). 500 gradini fino in cima '
 +'alla montagna, e vista stupenda.</li></ul>'
 +'<div class="nb"><b>CONSIGLIO.</b> Prima di salire in cima c\'è un giardino con passerella e '
 +'con fiori di loto situato sulla destra. Non perderlo. Ideale per pomeriggio / tramonto.</div>'
 +'<p>Rientrate, prendete gli zaini e parti dopo le 21.00 con il bus da TAM COC per HUE.</p>'
 +pren('AATZ2552','Il <b>transfer dall\'hotel è gratuito</b> per i clienti 12Go, ma va chiesto '
   +'almeno <b>24 ore prima</b> su WhatsApp al +84 798 149 095, dicendo che siete a Halise Home — '
   +'meglio il 16 da Hanoi, perché il 17 e il 18 siete in barca. Se non rispondono, fatevi '
   +'portare da Halise: di sera, in campagna, Grab lì è inaffidabile. Esserci 30–45 minuti prima.')
 +'</div>'+foto('g9c','stretta'));

/* ── 11 · giorno 10-11 ─────────────────────────────────────────────── */
pagF(cap('Daily schedule')+'<h1 class="giorno">GIORNO 10 - 11</h1>'
 +'<div class="data">20 - 21 NOVEMBRE</div>'
 +'<div class="banda"><span class="et">Attività</span>'
 +'<p>Arrivo in mattinata e check in dal 20 al 21 (arrivate presto quindi lasciate lo zaino in '
 +'reception per fare le visite intanto che è pronta la camera). L\'alloggio è in pieno centro.</p>'
 +pren('6039302548')
 +'<p>Visita della cittadella imperiale, la città proibita e la Pagoda Thien Mu.</p>'
 +'<p>Il 21 lasciate lo zaino in reception per check out e visita molto speciale: in taxi o '
 +'scooter visita <b>Tu Hieu Pagoda</b>, un convento buddhista attivo con monaci residenti. '
 +'Atmosfera serena e spirituale, pochi turisti. È il luogo di meditazione del famoso monaco '
 +'<b>Thich Nhat Hanh</b>.</p>'
 +'<p>Altra opzione in scooter per il pomeriggio del 20 o il 21 mattina: <b>Thanh Toan Bridge</b>, '
 +'ponte coperto, mercatini locali, vita rurale autentica (circa 7 km da Hue).</p>'
 +'</div>'+foto('g1011a','stretta'));

/* ── 11b · giorno 10-11, da Hue a Hoi An ───────────────────────────── */
pagF(segue('GIORNO 10 - 11')
 +'<div class="banda"><span class="et">Da Hue a Hoi An</span>'
 +'<p>Prendete poi all\'hotel gli zaini e andate da HUE a HOI AN.</p>'
 +pren('AATZ5888','<b>Non è il treno</b> del passo di Hai Van: è un van su strada a 28 posti, ma '
   +'è <b>diretto fino a Hoi An</b> — e va bene così, perché Hoi An non ha una stazione. Si parte '
   +'da davanti alla stazione di Hue, check-in trenta minuti prima.')
 +pren('890180385629827714')
 +'<p>Passeggiata serale illuminata di lanterne ovunque: atmosfera magica. Giro in barca sul '
 +'fiume Thu Bon, al tramonto è molto suggestivo.</p></div>'
 +foto('g1011b','stretta'));

/* ── 12 · giorno 12-13 ─────────────────────────────────────────────── */
pagF(cap('Daily schedule')+'<h1 class="giorno">GIORNO 12 - 13</h1>'
 +'<div class="data">22 - 23 NOVEMBRE</div>'
 +'<div class="banda"><span class="et">Il 22</span>'
 +'<ul><li>OPZIONALE <b>Tra Que Vegetable Village</b>: vai la mattina presto e puoi vedere i '
 +'contadini che lavorano</li>'
 +'<li>Visita della città vecchia di <b>Hoi An</b>, patrimonio UNESCO: stradine pedonali con '
 +'lanterne colorate</li>'
 +'<li>Hoi Quan Phuoc Kien</li><li>Tan Ky old house</li>'
 +'<li>The Old House of Phung Hung</li>'
 +'<li>Mercato di Hoi An (colorato, ottimo street food) e mercato notturno sul fiume '
 +'(lanterne, souvenir)</li></ul>'
 +'<span class="et" style="display:block;margin-top:7mm">Il 23, a piacere</span>'
 +'<ul><li>OPZIONALE Santuario di My Son e Marble Mountain '
 +'<a href="'+L.mysonGrab+'">qui</a>, anche con GRAB</li>'
 +'<li><a href="'+L.bici+'">TOUR IN BICI PER LA CAMPAGNA</a></li>'
 +'<li><a href="'+L.meditazione+'">MEDITATION EXPERIENCE</a>: puoi prenotare una giornata piena '
 +'di meditazione o metà giornata</li></ul>'
 +'<div class="nb"><b>Aggiunto dopo le prenotazioni.</b> Novembre a Hoi An è ancora stagione '
 +'delle piogge, e il Thu Bồn può uscire e allagare la città vecchia per un giorno o due. Se '
 +'succede, le case-museo del biglietto cumulativo, le sartorie e i laboratori di lanterne sono '
 +'tutti al coperto — e la città girata in barca è una cosa che quasi nessuno vede.</div></div>'
 +foto('g1213','stretta'));

/* ── 13 · giorno 14-15 ─────────────────────────────────────────────── */
pagF(cap('Daily schedule')+'<h1 class="giorno">GIORNO 14 - 15</h1>'
 +'<div class="data">24 - 25 NOVEMBRE</div>'
 +'<div class="banda"><span class="et">Attività</span>'
 +'<p>La mattina check out, zaini in reception o giro per la città, oppure <b>Isola di Cam Kim</b> '
 +'appena oltre il ponte di Hoi An, molto meno turistica, con villaggi di intagliatori del legno: '
 +'stradine tranquille tra case tradizionali e risaie.</p>'
 +'<p>OPZIONALE ALL\'ALBA lungo il fiume Thu Bon fino alla foce del mare di Cua Dai per vedere i '
 +'locali scaricare e preparare il pescato.</p>'
 +'<p>Prendi il volo su Hanoi da DA NANG il pomeriggio tardi.</p>'
 +prenLibero('Da decidere','Hoi An → aeroporto di Da Nang',
   'Trenta chilometri, un\'ora con il traffico del pomeriggio. Grab 15–20 €, bus pubblico un '
   +'paio di euro ma il doppio del tempo e parte dal centro. Check out dal Signature entro le '
   +'12:00, in aeroporto per le 14:30. <b>È l\'ultima cosa rimasta da decidere.</b>',1)
 +pren('5EVNMY','Si atterra al terminal nazionale di Noi Bai. L\'hotel è a due chilometri: '
   +'<b>chiedete la navetta</b>.')
 +'</div>'+foto('g1415','stretta'));

/* ── 13b · giorno 15, la notte all'aeroporto e il rientro ──────────── */
pagF(segue('GIORNO 14 - 15')
 +'<div class="banda"><span class="et">La notte all\'aeroporto e il rientro</span>'
 +pren('5403083248','<b>All\'aeroporto e non in centro</b>, perché il volo di rientro parte alle '
   +'08:15: la sveglia è alle cinque.')
 +'<p>Il 25 volo di rientro in Italia.</p>'
 +pren('9T6U9F','<b>EY433 Hanoi 08:15 → Abu Dhabi 12:40</b>, poi <b>EY79 Abu Dhabi 14:20 → '
   +'Malpensa 18:20</b>. L\'orario dell\'EY433 è stato spostato da Etihad il 2 ottobre: era 07:40. '
   +'La coincidenza scende a <b>1h40</b>, stesso Terminal A.')
 +'</div>'+foto('fine','stretta'));

/* ── 14 · la citazione ─────────────────────────────────────────────── */
nuda('<div class="citt" style="background-image:url('+F.fine+')">'
 +'<div class="q">«Andai in Asia in cerca dell\'altro, di tutto quello che non conoscevo, '
 +'all\'inseguimento di idee, di uomini, di storie.»</div>'
 +'<div class="a">Tiziano Terzani</div>'
 +'<div class="b">Buon viaggio,<br>Samira</div></div>');

/* ── 15 · la firma ─────────────────────────────────────────────────── */
nuda('<div class="fin">'
 +'<div class="t">“To move, to<br>breathe, to fly, to<br>float, to gain all<br>'
 +'while you give, to<br>roam the roads of<br>lands remote,<br>to travel is to live.”'
 +'<div class="au">— Hans Christian Andersen</div></div>'
 +'<div class="im" style="background-image:url('+F['firma-1']+')"></div>'
 +'<div class="c"><img src="'+F.logo+'" alt="The Ocean Nomads">'
 +'<div class="r">Samira Vicinanza<br>www.theoceanomads.com<br><br>'
 +'info@theoceanomads.com<br>+41 78 717 38 13</div></div>'
 +'<div class="im" style="background-image:url('+F['firma-2']+')"></div></div>');

document.body.innerHTML=O.join('');
`.replace('__LINKS__', JSON.stringify(L)).replace('__FOTO__', JSON.stringify(F));

const html = `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><title>Vietnam — itinerario</title>
<style>${CSS}</style></head><body>
<script>${DATI}<\/script>
<script>${RENDER}<\/script>
</body></html>`;

const fileHtml = path.join(outDir, 'itinerario.html');
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
/* se un codice non trova la sua riga nel registro, il blocco esce vuoto:
   meglio accorgersene qui che sfogliando il PDF */
const orfani = await page.evaluate(() =>
  [...document.querySelectorAll('.pren')].filter(d => !d.querySelector('.riga')).length);
if (orfani) console.warn(`  ⚠ ${orfani} blocchi senza riscontro nel registro`);

/* ogni .pg deve stare in una A4 esatta: se sfora anche di poco, il PDF
   raddoppia le pagine e l'impaginazione dell'originale si perde */
const sbordi = await page.evaluate(() => {
  const mm = 297 / 25.4 * 96;
  return [...document.querySelectorAll('.pg')].map((d, i) => ({
    n: i + 1, h: Math.round(d.getBoundingClientRect().height / 96 * 25.4),
  })).filter(x => x.h > 298);
});
for (const x of sbordi) console.warn(`  ⚠ pagina ${x.n} alta ${x.h} mm: sborda`);

const filePdf = path.join(outDir, 'itinerario.pdf');
await page.pdf({
  path: filePdf, format: 'A4', printBackground: true,
  /* la pagina e' gia' disegnata a misura di A4, con le foto al vivo:
     qualunque margine di stampa la farebbe sbordare sulla pagina dopo */
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
});
await browser.close();

const kb = f => Math.round(fs.statSync(f).size / 1024);
const pdf = fs.readFileSync(filePdf, 'latin1');
const pagine = (pdf.match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log(`\n  Itinerario Vietnam · Davide & Franca`);
console.log(`  itinerario.pdf  ${kb(filePdf)} KB · ${pagine} pagine A4`);
console.log(`  in out/${cart}/\n`);
