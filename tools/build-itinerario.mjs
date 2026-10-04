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
@page{size:A4;margin:16mm 15mm 16mm}
*{box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;background:#fff;color:#2A2119;
  font:10pt/1.43 "Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif}
h1,h2,h3,.et,.lab{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;font-weight:400}
a{color:#A4572A;text-decoration:none;border-bottom:.5pt solid #D9BFA4}
.pagina{break-after:page;min-height:252mm;position:relative}
.pagina:last-child{break-after:auto}
.et{font-size:7.6pt;letter-spacing:.22em;text-transform:uppercase;color:#A08B6F}

/* copertina */
.cop{display:flex;flex-direction:column;justify-content:center;height:250mm;text-align:center}
.cop .paese{font-family:"Iowan Old Style",Palatino,Georgia,serif;font-size:52pt;line-height:1;
  letter-spacing:-.02em;margin:0}
.cop .nomi{font-family:"Helvetica Neue",Arial,sans-serif;font-size:13pt;letter-spacing:.3em;
  text-transform:uppercase;color:#A4572A;margin:5mm 0 0}
.cop hr{border:0;border-top:.8pt solid #D9BFA4;width:40mm;margin:10mm auto}
.cop .tipo{font-family:"Helvetica Neue",Arial,sans-serif;font-size:10pt;letter-spacing:.26em;
  text-transform:uppercase;color:#6B5847}
.cop .date{font-family:"Helvetica Neue",Arial,sans-serif;font-size:11pt;letter-spacing:.2em;
  text-transform:uppercase;margin-top:3mm}
.cop .firma{margin-top:18mm;font-size:9.4pt;color:#6B5847;line-height:1.6}
.cop .agg{margin-top:12mm;font-size:8.6pt;color:#A08B6F;max-width:120mm;margin-left:auto;margin-right:auto;line-height:1.5}

/* testatina di sezione */
.sez{text-align:center;margin-bottom:7mm}
.sez .et{display:block;margin-bottom:3mm}
.sez h2{font-family:"Iowan Old Style",Palatino,Georgia,serif;font-size:25pt;line-height:1.05;
  margin:0;letter-spacing:-.01em}
.sez .gg{font-family:"Helvetica Neue",Arial,sans-serif;font-size:10pt;letter-spacing:.2em;
  text-transform:uppercase;color:#A4572A;margin-top:2.5mm}

/* riquadri delle info */
.info{border:.7pt solid #E0D3C2;border-radius:2mm;padding:4.5mm 6mm;margin-bottom:3.5mm;
  text-align:center;font-size:9.8pt;line-height:1.45;background:#FFFDF9;break-inside:avoid}
.info b{font-weight:700}

h3{font-size:8.4pt;letter-spacing:.18em;text-transform:uppercase;color:#A08B6F;
  margin:5.5mm 0 2mm;padding-bottom:1.3mm;border-bottom:.6pt solid #E0D3C2}
p{margin:0 0 2.4mm}
ul{margin:0 0 3mm;padding-left:5mm}
li{margin-bottom:1.3mm}
.nb{font-size:9pt;color:#5C4C3C;background:#F7F1E8;border-radius:2mm;padding:3mm 4mm;margin:2.5mm 0;break-inside:avoid}

/* il blocco di quello che è prenotato: prende il posto del link */
.pren{border-left:2.4pt solid #A4572A;background:#FBF4EC;padding:3mm 4.5mm;margin:2.5mm 0;
  break-inside:avoid}
.pren .lab{display:block;font-size:7.4pt;letter-spacing:.2em;text-transform:uppercase;
  color:#A4572A;margin-bottom:1.2mm}
.pren .nome{font-weight:700;font-size:10.4pt}
.pren .riga{font-size:9pt;color:#5C4C3C;line-height:1.4;margin-top:.8mm}
.pren .cod{font-family:"SF Mono",Menlo,Consolas,monospace;font-size:8.6pt;letter-spacing:-.02em;
  color:#2A2119}
.pren.aperto{border-left-color:#B0892F;background:#FDF8EC}
.pren.aperto .lab{color:#8A6410}

.chiusura{display:flex;flex-direction:column;justify-content:center;height:250mm;text-align:center}
.chiusura .cit{font-family:"Iowan Old Style",Palatino,Georgia,serif;font-size:14pt;line-height:1.5;
  font-style:italic;max-width:120mm;margin:0 auto}
.chiusura .aut{font-family:"Helvetica Neue",Arial,sans-serif;font-size:9pt;letter-spacing:.2em;
  text-transform:uppercase;color:#A08B6F;margin-top:4mm}
.chiusura hr{border:0;border-top:.8pt solid #D9BFA4;width:30mm;margin:14mm auto}
.chiusura .cont{font-size:9.6pt;color:#6B5847;line-height:1.7}
`;

const RENDER = String.raw`
const L=__LINKS__;
const E=s=>String(s==null?'':s);
const O=[];
const pag=h=>O.push('<section class="pagina">'+h+'</section>');

/* Il blocco «prenotato» si costruisce dal registro dell'app cercando per
   codice: così l'itinerario non può dire una conferma diversa da quella che
   l'app mostra, e se cambia la segue. */
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

/* ── copertina ─────────────────────────────────────────────────────── */
pag('<div class="cop">'
 +'<div class="et">Itinerario personalizzato</div>'
 +'<h1 class="paese">Vietnam</h1>'
 +'<div class="nomi">Davide &amp; Franca</div>'
 +'<hr>'
 +'<div class="tipo">10 → 25 novembre 2026</div>'
 +'<div class="date">16 giorni · Hanoi · Sa Pa · Ha Long · Ninh Binh · Hue · Hoi An</div>'
 +'<div class="firma">Itinerario di <b>Samira Vicinanza</b><br>The Ocean Nomads</div>'
 +'<div class="agg">Questa è la stessa struttura dell\'itinerario originale, completata con '
 +'tutto quello che è stato prenotato: al posto dei link fra cui scegliere, l\'alloggio o il '
 +'mezzo che c\'è davvero, con indirizzo, orario, codice di conferma e telefono.</div>'
 +'</div>');

/* ── informazioni, prima di partire ────────────────────────────────── */
pag('<div class="sez"><span class="et">Informazioni</span>'
 +'<h2>Info importanti<br>prima di partire</h2></div>'
 +'<div class="info"><b>Fare assicurazione medico-bagaglio.</b><br>'
   +'<a href="'+L.assicurazione+'">A questo link avrete il 10% di sconto</a></div>'
 +'<div class="info">Controllare eventuali aggiornamenti prima della partenza su '
   +'<a href="'+L.viaggiaresicuri+'">viaggiaresicuri.it</a> alla voce Vietnam</div>'
 +'<div class="info">Portare <b>spray per insetti</b> e <b>backpack invece di valigia</b>, '
   +'per comodità negli spostamenti</div>'
 +'<div class="info">Portare <b>k-way e copri-zaino</b> per ripararvi dalla pioggia, '
   +'più <b>scarpe e borsa waterproof</b> per la baia.<br>'
   +'<a href="'+L.amazon+'">Trova ispirazione sullo shop Amazon</a></div>'
 +'<div class="info">Richiedere la <b>patente internazionale</b> alla Motorizzazione</div>'
 +'<div class="info">Fare <a href="'+L.revolut+'">Revolut qui</a></div>'
 +'<div class="nb"><b>Aggiunto dopo le prenotazioni.</b> Il passaporto deve essere valido '
 +'sei mesi oltre l\'ingresso: entrate l\'11 novembre 2026, quindi non deve scadere prima '
 +'dell\'<b>11 maggio 2027</b>. L\'esenzione dal visto per gli italiani esiste ed è di 45 '
 +'giorni, ma va <b>riverificata sul sito dell\'ambasciata</b> prima di partire.</div>');

/* ── informazioni, in loco ─────────────────────────────────────────── */
pag('<div class="sez"><span class="et">Informazioni</span>'
 +'<h2>Info importanti<br>in loco</h2></div>'
 +'<div class="info">Acquistare SIM in aeroporto oppure online '
   +'<a href="'+L.esim+'">eSIM qui</a>, con 5% di sconto, codice <b>THEOCEANNOMADS</b></div>'
 +'<div class="info">Cambiare euro in centro presso un <b>money exchange</b> oppure '
   +'prelevare, e avere sempre contanti con sé</div>'
 +'<div class="info">Scaricare l\'app <b>Grab</b> (come Uber) per spostamenti più economici</div>'
 +'<div class="info">Girare in <b>tuk tuk</b> da un punto di interesse all\'altro invece che in taxi</div>'
 +'<div class="info">Affittare il <b>motorino</b> per spostarsi in autonomia e risparmiare, '
   +'o muoversi in tuk tuk / Grab. Serve patente A più patente internazionale, '
   +'e solo dove indicato nel programma</div>'
 +'<div class="info">K-way, impermeabile e attrezzatura waterproof in caso di piogge, '
   +'per girare ugualmente sotto l\'acqua</div>'
 +'<div class="nb"><b>Aggiunto dopo le prenotazioni.</b> Un euro vale circa 30.000 VND: '
 +'togli tre zeri e dividi per tre. Gli alloggi si pagano quasi tutti <b>in struttura e in '
 +'dong</b>. Attenzione a due: <b>The Chum</b> a Hue non accetta contanti, solo carta; '
 +'<b>l\'Airport Classic</b> accetta solo Visa e Mastercard.</div>');

/* ── GIORNO 1 ──────────────────────────────────────────────────────── */
pag('<div class="sez"><span class="et">Daily schedule</span>'
 +'<h2>Giorno 1</h2><div class="gg">11 novembre</div></div>'
 +'<h3>Trasporto</h3>'
 +pren('9T6U9F','Il 10 novembre si parte: <b>EY82 Malpensa 10:30 → Abu Dhabi 19:30</b>, poi '
   +'<b>EY432 Abu Dhabi 20:50 → Hanoi 06:10</b> dell\'11. Scalo di 1h20 in transito, '
   +'bagaglio registrato fino a Hanoi.')
 +pren('860124030','L\'autista aspetta nella hall arrivi con la targhetta <b>Davide Mammi</b> '
   +'e ha il numero del volo. Si atterra alle 06:10 e il taxi è alle 12:00: '
   +'cinque ore di margine.')
 +'<h3>Attività</h3>'
 +'<p>Arrivo a Hanoi, taxi per l\'hotel e check-in dall\'11 al 13.</p>'
 +pren('6158389407')
 +'<p>La camera sarà pronta dopo le 12/14:00. Giro per l\'Old Quarter.</p>'
 +'<p>Pomeriggio e sera: passeggiata lungo il <b>lago Hoan Kiem</b>, il tempio <b>Ngoc Son</b> '
 +'e il ponte <b>Cau The Huc</b>.</p>'
 +'<p><b>Ta Hien Corner</b>: siediti in un ristorantino sulle popolari sedioline di plastica '
 +'per mangiare e goditi la night life.</p>'
 +'<p>Puoi mangiare <a href="'+L.bia+'">qui</a>: Bia Phố Cổ Tạ Hiện, o simili nella stessa strada.</p>');

/* ── GIORNO 2 ──────────────────────────────────────────────────────── */
pag('<div class="sez"><span class="et">Daily schedule</span>'
 +'<h2>Giorno 2</h2><div class="gg">12 novembre</div></div>'
 +'<h3>Attività</h3>'
 +'<p><b>Visita di Hanoi</b> con Grab o a piedi. Tappe opzionali e a scelta in base ai vostri '
 +'interessi:</p>'
 +'<ul>'
 +'<li>Giro per l\'Old Quarter</li>'
 +'<li>Pagoda di Tran Quoc — gratis, 8–16</li>'
 +'<li>Tempio della Letteratura — 1 €, 8–17</li>'
 +'<li>Pagoda Chua Mot Cot — gratis, 7–18</li>'
 +'<li>Palazzo Presidenziale — 1,50 €, 7:30–11:00 e 13:30–16:00</li>'
 +'<li>Mausoleo di Ho Chi Minh — gratis, dalle 7:30 alle 10:30</li>'
 +'<li>Cittadella imperiale — circa 4 €, 8:00–17:00</li>'
 +'<li>Cattedrale di St. Joseph — gratis, h24</li>'
 +'</ul>'
 +'<h3>Se vuoi, per cena e caffè</h3>'
 +'<ul><li>Cena o pranzo al <a href="'+L.caiman+'">Cai Man Bistro</a></li>'
 +'<li>Il famosissimo <a href="'+L.notecafe+'">Note Cafe</a> — provare l\'<b>egg coffee</b>, '
 +'caffè tipo zabaione</li></ul>'
 +'<h3>Sicuramente da non perdere</h3>'
 +'<p><b>La Train Street</b>: la strada famosa di Hanoi dove passa letteralmente il treno fra '
 +'le case. Controlla gli orari in cui passa il treno. Se la strada è chiusa, devi accettare '
 +'che un proprietario di un bar ti inviti per passare, e dovrai bere al suo bar per poter '
 +'accedere. Molti la vedono chiusa e non entrano: in realtà si può entrare solo su «invito» '
 +'di un\'attività commerciale come i bar — ogni tanto, per sicurezza, dicono di chiuderla. '
 +'Gli orari dei treni di solito si trovano nei bar lungo la Train Street: vai la mattina per '
 +'controllare, così ritorni all\'ora giusta.</p>');

/* ── GIORNO 3-5 ────────────────────────────────────────────────────── */
pag('<div class="sez"><span class="et">Daily schedule</span>'
 +'<h2>Giorno 3 – 5</h2><div class="gg">13 – 15 novembre</div></div>'
 +'<h3>Attività</h3>'
 +'<p>Il 13 check-out, e si prende il bus da Hanoi a Sa Pa.</p>'
 +pren('12GO33251058')
 +pren('6309631840','Si arriva a 03 Nguyen Chi Thanh: lì <b>Grab non prende</b>, si prende un '
   +'taxi alla fermata chiedendo prima il prezzo, oppure si concorda il pick-up con l\'alloggio '
   +'via chat Booking.')
 +'<div class="nb"><b>NB.</b> All\'andata lasciate lo zaino grande in hotel ad Hanoi, se volete, '
 +'e portate solo un piccolo zaino a Sa Pa: al ritorno dormite di nuovo ad Hanoi.</div>'
 +'<p>Il pomeriggio goditi il posto con passeggiate nei pressi della homestay, o giri in scooter.</p>'
 +'<p>Il <b>14 trekking</b> a Ta Phin village o Ta Van con le donne delle comunità locali, da '
 +'organizzare con loro — <a href="'+L.sapaochau+'">contattali qui</a> — oppure chiedi alla '
 +'struttura. Spesso non vedono le email: contattali via WhatsApp, hanno poco internet. '
 +'Devi farti trovare a Sa Pa town, ci vai con un taxi: chiedi alla reception.</p>'
 +'<p><b>Opzionalmente</b>, all\'arrivo potete <a href="'+L.scooterSapa+'">noleggiare lo '
 +'scooter</a> nel centro di Sa Pa: uno va con il taxi e i bagagli e l\'altro con lo scooter '
 +'fino all\'alloggio, così da averlo con voi ed essere più flessibili — per girare tra le valli '
 +'e le risaie, per raggiungere il centro la sera, o per arrivarci la mattina del trekking '
 +'senza prendere il taxi.</p>'
 +'<p>Bus di ritorno per Hanoi il 15, e una notte dal 15 al 16 di nuovo ad Hanoi.</p>'
 +pren('12GO33251059','Check-out dalla Maison entro le 11:00–11:30, taxi concordato per salire in centro.')
 +pren('5210368751','<b>Non è lo stesso hotel dell\'andata</b>: deve stare dentro l\'Old '
   +'Quarter, perché è da lì che la crociera passa a prendervi la mattina dopo. 1,5 km dalla '
   +'Hanoi Opera House, dove vi lascia il van.')
 );

/* ── GIORNO 6-7 ────────────────────────────────────────────────────── */
pag('<div class="sez"><span class="et">Daily schedule</span>'
 +'<h2>Giorno 6 – 7</h2><div class="gg">16 – 17 novembre</div></div>'
 +'<h3>Attività</h3>'
 +'<p>Mattina check-out e pick-up in hotel del bus — qui si chiama <i>limousine van</i> — '
 +'per la Baia di Ha Long.</p>'
 +pren('9800672634863520599','Due notti a bordo, pensione completa e attività incluse: le '
   +'bevande no. Il secondo giorno si va a <b>Lan Ha e Cat Ba</b>, la parte meno turistica '
   +'della baia. Danny Do, WhatsApp +84 984 749 958.')
 +'<p>Il pick-up dall\'hotel è organizzato dalla crociera, ma <b>non è compreso nel prezzo</b>.</p>'
 +'<div class="pren aperto"><span class="lab">Richiesto, si aspetta il pagamento</span>'
 +'<span class="nome">Van Peony: Hanoi → baia di Ha Long</span>'
 +'<div class="riga">20 USD a testa, 40 in due, sola andata. Da prenotare <b>almeno tre giorni '
 +'prima</b> e <b>solo dall\'Old Quarter</b> — è la ragione per cui la notte del 15 è stata '
 +'presa in Phố Hàng Cân. Richiesto per email il 3 ottobre con l\'indirizzo giusto; manca il '
 +'link di pagamento, che mandano loro.</div></div>'
 +'<p>Il prezzo della crociera include colazione, pranzo e cene, e attività come kayak, visite '
 +'alle grotte, all\'isola di Cat Ba e ai villaggi dei pescatori galleggianti. '
 +'<b>Chiedi di inviarti il programma dettagliato delle tre giornate</b>, se vuoi.</p>'
 +'<p>La crociera è un\'esperienza turistica ma imperdibile, e facendo tre giorni ti addentri '
 +'in zone meno turistiche come Lan Ha e Cat Ba: avrai meno barche in giro rispetto a chi fa '
 +'un giorno o una notte.</p>'
 +'<div class="nb"><b>Correzione sull\'originale.</b> Il programma diceva «fine crociera verso '
 +'le 14:00 circa». Peony ha confermato per email che lo <b>sbarco è alle 11:30 al Lotto 34 di '
 +'Tuan Chau</b>, lo stesso molo dell\'imbarco. È l\'orario che è stato dato a Halise per il van: '
 +'con le 14:00 sarebbe arrivato tre ore tardi.</div>');

/* ── GIORNO 8 ──────────────────────────────────────────────────────── */
pag('<div class="sez"><span class="et">Daily schedule</span>'
 +'<h2>Giorno 8</h2><div class="gg">18 novembre</div></div>'
 +'<h3>Attività</h3>'
 +'<p>Fine crociera e arrivo a Tam Coc.</p>'
 +'<div class="pren"><span class="lab">Organizzato</span>'
 +'<span class="nome">Van dal Lotto 34 di Tuan Chau a Tam Coc</span>'
 +'<div class="riga">Lo organizza <b>Halise</b>, a cui sono stati comunicati molo e orario il '
 +'3 ottobre: sbarco <b>11:30</b>. 175 km, circa tre ore, arrivo verso le 14:30. Resta da farsi '
 +'confermare per iscritto prezzo e punto di presa, e da riconfermare la sera prima dalla barca.'
 +'</div></div>'
 +pren('Diretto','Camera con vista lago, dal 18 al 19.')
 +'<div class="nb"><b>NB.</b> Halise Home è un posto meraviglioso nella giungla, ma molto '
 +'semplice, con pulizia da standard asiatici. Può capitare che qualche insetto entri in camera, '
 +'o di vedere fuori topini di campagna e animali: sei nella giungla. Il luogo è autentico e '
 +'le persone, quindi, non parlano bene inglese.</div>'
 +'<p><b>Chiedere il noleggio dello scooter a Halise.</b></p>'
 +'<p>Visitate la <b>Bich Dong Pagoda</b> nel pomeriggio, con lo scooter, se arrivate in tempo: '
 +'chiude alle 17:00, altrimenti la fate il giorno dopo.</p>'
 +'<p>Per la sera potete andare in centro, al <b>Tam Coc Night Market</b> / Walking Street.</p>');

/* ── GIORNO 9 ──────────────────────────────────────────────────────── */
pag('<div class="sez"><span class="et">Daily schedule</span>'
 +'<h2>Giorno 9</h2><div class="gg">19 novembre</div></div>'
 +'<h3>Attività</h3>'
 +'<p>Lascia i bagagli in reception la mattina dopo per il check-out. Con lo scooter fate le '
 +'seguenti visite:</p>'
 +'<p><b>Bai Dinh pagoda</b> — durata della visita circa due o tre ore, gratis.</p>'
 +'<p><b>La gita più bella di tutte è Trang An.</b> Dirigiti alla biglietteria per decidere '
 +'quale tour fare: circa 9–12 €, tre ore di durata. Sito UNESCO, Tràng An è un\'area di pregio '
 +'paesaggistico presso Ninh Bình. Situata sulla sponda meridionale del delta del Fiume Rosso, '
 +'è caratterizzata da formazioni carsiche e vallate con pendii scoscesi. Sono presenti tracce '
 +'di insediamenti umani risalenti fino a quasi 30.000 anni fa. Tour guidato e gestito dal sito.</p>'
 +'<p><b>Mua Caves</b>, il punto panoramico più bello — circa 4 €. Cinquecento gradini fino in '
 +'cima alla montagna, e vista stupenda.</p>'
 +'<div class="nb"><b>Consiglio.</b> Prima di salire in cima c\'è un giardino con passerella e '
 +'fiori di loto, sulla destra. Non perderlo. Ideale per il pomeriggio o il tramonto.</div>'
 +'<p>Rientrate, prendete gli zaini e si parte dopo le 21:00 con il bus da Tam Coc per Hue.</p>'
 +pren('AATZ2552','Il <b>transfer dall\'hotel è gratuito</b> per i clienti 12Go, ma va chiesto '
   +'almeno <b>24 ore prima</b> su WhatsApp al +84 798 149 095, dicendo che siete a Halise Home. '
   +'Esserci 30–45 minuti prima. Mangiare prima di salire.'));

/* ── GIORNO 10-11 ──────────────────────────────────────────────────── */
pag('<div class="sez"><span class="et">Daily schedule</span>'
 +'<h2>Giorno 10 – 11</h2><div class="gg">20 – 21 novembre</div></div>'
 +'<h3>Attività</h3>'
 +'<p>Arrivo in mattinata e check-in dal 20 al 21. Arrivate presto, quindi lasciate lo zaino '
 +'in reception per fare le visite intanto che è pronta la camera. L\'alloggio è in pieno centro.</p>'
 +pren('6039302548')
 +'<p>Visita della <b>cittadella imperiale</b>, della <b>città proibita</b> e della '
 +'<b>Pagoda Thien Mu</b>.</p>'
 +'<p>Il 21 lasciate lo zaino in reception per il check-out e fate una visita molto speciale: '
 +'in taxi o scooter, la <b>Tu Hieu Pagoda</b>, un convento buddhista attivo con monaci '
 +'residenti. Atmosfera serena e spirituale, pochi turisti. È il luogo di meditazione del '
 +'famoso monaco <b>Thich Nhat Hanh</b>.</p>'
 +'<p>Altra opzione in scooter, per il pomeriggio del 20 o la mattina del 21: il '
 +'<b>Thanh Toan Bridge</b> — ponte coperto, mercatini locali, vita rurale autentica, '
 +'a circa 7 km da Hue.</p>'
 +'<p>Prendete poi gli zaini in hotel e andate da Hue a Hoi An.</p>'
 +pren('AATZ5888','<b>Attenzione:</b> non è il treno del passo di Hai Van, è un van su strada a '
   +'28 posti, ma è <b>diretto fino a Hoi An</b> — e va bene così, perché Hoi An non ha una '
   +'stazione: la ferrovia arriva a Da Nang e resterebbero trenta chilometri da fare con un '
   +'secondo mezzo. Si parte da davanti alla stazione di Hue, check-in trenta minuti prima.')
 +pren('890180385629827714')
 +'<p>Passeggiata serale illuminata di lanterne ovunque: atmosfera magica. Giro in barca sul '
 +'fiume <b>Thu Bon</b>, al tramonto è molto suggestivo.</p>');

/* ── GIORNO 12-13 ──────────────────────────────────────────────────── */
pag('<div class="sez"><span class="et">Daily schedule</span>'
 +'<h2>Giorno 12 – 13</h2><div class="gg">22 – 23 novembre</div></div>'
 +'<h3>Il 22</h3>'
 +'<ul>'
 +'<li><b>Opzionale: Tra Que Vegetable Village.</b> Vai la mattina presto e puoi vedere i '
 +'contadini che lavorano</li>'
 +'<li>Visita della <b>città vecchia di Hoi An</b>, patrimonio UNESCO: stradine pedonali con '
 +'lanterne colorate</li>'
 +'<li>Hoi Quan Phuoc Kien</li>'
 +'<li>Tan Ky old house</li>'
 +'<li>The Old House of Phung Hung</li>'
 +'<li>Mercato di Hoi An — colorato, ottimo street food — e mercato notturno sul fiume, '
 +'con lanterne e souvenir</li>'
 +'</ul>'
 +'<h3>Il 23, a piacere</h3>'
 +'<ul>'
 +'<li><b>Opzionale:</b> Santuario di <b>My Son</b> e <b>Marble Mountain</b> — '
 +'<a href="'+L.mysonGrab+'">qui</a>, anche con Grab</li>'
 +'<li><a href="'+L.bici+'">Tour in bici per la campagna</a></li>'
 +'<li><a href="'+L.meditazione+'">Meditation experience</a>: puoi prenotare una giornata piena '
 +'di meditazione o mezza giornata</li>'
 +'</ul>'
 +'<div class="nb"><b>Aggiunto dopo le prenotazioni.</b> Novembre a Hoi An è ancora stagione '
 +'delle piogge, e il Thu Bồn può uscire e allagare la città vecchia per un giorno o due. '
 +'Se succede, le case-museo del biglietto cumulativo, le sartorie e i laboratori di lanterne '
 +'sono tutti al coperto — e la città girata in barca è una cosa che quasi nessuno vede.</div>');

/* ── GIORNO 14-15 ──────────────────────────────────────────────────── */
pag('<div class="sez"><span class="et">Daily schedule</span>'
 +'<h2>Giorno 14 – 15</h2><div class="gg">24 – 25 novembre</div></div>'
 +'<h3>Attività</h3>'
 +'<p>La mattina check-out, zaini in reception, e giro per la città. Oppure l\'<b>isola di '
 +'Cam Kim</b>, appena oltre il ponte di Hoi An, molto meno turistica, con villaggi di '
 +'intagliatori del legno: stradine tranquille fra case tradizionali e risaie.</p>'
 +'<p><b>Opzionale all\'alba</b>: lungo il fiume Thu Bon fino alla foce del mare di Cua Dai, '
 +'per vedere i locali scaricare e preparare il pescato.</p>'
 +'<p>Poi il volo su Hanoi da Da Nang.</p>'
 +'<div class="pren aperto"><span class="lab">Da decidere</span>'
 +'<span class="nome">Hoi An → aeroporto di Da Nang</span>'
 +'<div class="riga">Trenta chilometri, un\'ora con il traffico del pomeriggio. Grab 15–20 €, '
 +'bus pubblico un paio di euro ma il doppio del tempo e parte dal centro. Check-out dal '
 +'Signature entro le 12:00, in aeroporto per le 14:30. <b>È l\'ultima cosa rimasta da '
 +'decidere.</b></div></div>'
 +pren('5EVNMY','Si atterra al terminal nazionale di Noi Bai. L\'hotel è a due chilometri: '
   +'<b>chiedete la navetta</b>.')
 +pren('5403083248','<b>Non in centro ma all\'aeroporto</b>, perché il volo di rientro parte '
   +'alle 08:15: la sveglia è alle cinque. Chiedete la navetta la sera prima.')
 +'<p>Il 25, volo di rientro in Italia.</p>'
 +pren('9T6U9F','<b>EY433 Hanoi 08:15 → Abu Dhabi 12:40</b>, poi <b>EY79 Abu Dhabi 14:20 → '
   +'Malpensa 18:20</b>. L\'orario dell\'EY433 è stato spostato da Etihad il 2 ottobre: era '
   +'07:40. La coincidenza scende a <b>1h40</b>, stesso Terminal A — si fa, ma senza margine.'));

/* ── chiusura ──────────────────────────────────────────────────────── */
pag('<div class="chiusura">'
 +'<div class="cit">«Andai in Asia in cerca dell\'altro, di tutto quello che non conoscevo, '
 +'all\'inseguimento di idee, di uomini, di storie.»</div>'
 +'<div class="aut">Tiziano Terzani</div>'
 +'<hr>'
 +'<div class="cit">“To move, to breathe, to fly, to float, to gain all while you give, '
 +'to roam the roads of lands remote, to travel is to live.”</div>'
 +'<div class="aut">Hans Christian Andersen</div>'
 +'<hr>'
 +'<div class="cont"><b>Buon viaggio,<br>Samira</b><br><br>'
 +'Samira Vicinanza · The Ocean Nomads<br>'
 +'www.theoceanomads.com · info@theoceanomads.com<br>+41 78 717 38 13</div>'
 +'</div>');

document.body.innerHTML=O.join('');
`.replace('__LINKS__', JSON.stringify(L));

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

const filePdf = path.join(outDir, 'itinerario.pdf');
await page.pdf({
  path: filePdf, format: 'A4', printBackground: true,
  margin: { top: '16mm', right: '15mm', bottom: '16mm', left: '15mm' },
});
await browser.close();

const kb = f => Math.round(fs.statSync(f).size / 1024);
const pdf = fs.readFileSync(filePdf, 'latin1');
const pagine = (pdf.match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log(`\n  Itinerario Vietnam · Davide & Franca`);
console.log(`  itinerario.pdf  ${kb(filePdf)} KB · ${pagine} pagine A4`);
console.log(`  in out/${cart}/\n`);
