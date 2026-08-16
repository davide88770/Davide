# Alpi, Soča & Quarnero

Road trip in Slovenia e Croazia, **6–15 settembre 2026**, partenza e rientro da
Castelnovo ne' Monti.

**Artifact:** <https://claude.ai/code/artifact/fac61cfd-bb6d-466a-97fc-e508a9785d8c>
**Sorgente:** [`roadbook.html`](roadbook.html)

Accanto al road book c'è l'**app da viaggio**, la stessa materia ma da tenere
in mano mentre si guida. Vedi [In viaggio: l'app](#in-viaggio-lapp) più sotto.

**App installabile:** <https://davide88770.github.io/Davide/viaggio/>
**Artifact:** <https://claude.ai/code/artifact/6d313e18-d2ba-46e7-b92b-777728ae408b>
**Sorgente:** [`app-mobile.html`](app-mobile.html) · **Verifica:** `npm run verify viaggi/2026-09-alpi-soca-quarnero/app-mobile.html`

## In sintesi

10 giorni · 9 notti · **4 basi** · ~2.215 km · 30h30 di guida · 2 traghetti ·
3 paesi. Budget stimato per due: **2.396–3.496 €**.

| Notti | Date | Base | |
|---|---|---|---|
| 1–3 | 6–8 set | Bohinj | 🇸🇮 dentro il Parco del Triglav |
| 4 | 9 set | Plitvice | 🇭🇷 per entrare al parco alle 7:00 |
| 5–8 | 10–13 set | Cres | 🇭🇷 quattro notti, valigia ferma |
| 9 | 14 set | a scelta | Pirano · Rovigno · Pola · Abbazia |

## L'idea

Poche basi e lunghe, contro il turismo a tappe forzate. Il perno è **Cres, con
quattro notti**: il 13 settembre non si smonta, e tutta l'Istria si fa in una
giornata sola il 14.

Gli ultimi tre giorni non hanno un programma fisso ma un **menù di scelta**,
con l'indicazione esplicita di quando si decide:

- **13 set** — quattro modi di usare la giornata su Cres (Osor e Lošinj · il
  mare in barca · Vrana, Orlec e Mali Bok · giorno zero). Si sceglie a
  colazione, non si prenota niente.
- **14 set** — dove finisce il viaggio dopo il traghetto. Unica scelta che va
  fatta prenotando, perché cambia l'alloggio e la lunghezza del rientro:
  Pirano 480 km, Rovigno 600, Pola 620, Abbazia 570.
- **15 set** — cosa infilare nel rientro. Si sceglie in strada.

## Vincoli veri

- **Plitvice**: slot orario contingentato a 300 persone/ora. Serve il 10/9 alle
  **07:00, Ingresso 2**, prenotato con settimane di anticipo. È la prenotazione
  da cui dipende la riuscita del viaggio.
- **Postojna**: slot grotta alle **13:00 del 6/9**, vincolante.
- **Traghetti Jadrolinija linea 334**: non si prenotano, si sale in ordine di
  arrivo. Con la bora la Brestova–Porozina può essere sospesa; l'alternativa è
  Merag ⇢ Valbiska e il ponte di Veglia.
- **Vignetta slovena**: la settimanale da 16 € basta, perché l'autostrada serve
  solo nei giorni 1 e 4 e al rientro il corridoio costiero H5/H6 è gratuito.

## In viaggio: l'app

`app-mobile.html` — sorgente dell'Artifact, verifica in
`app-mobile.verify.json`. Il road book è il documento che si legge alla
scrivania; questa è la cosa che si tiene in mano sul traghetto. Cinque schede
sotto il pollice: **Oggi · Giorni · Mappa · Pratico · Valigia**.

Cosa fa che il documento non fa:

- **Sa che giorno è.** Prima della partenza conta i giorni e dice quante voci
  restano aperte fra documenti e prenotazioni; durante il viaggio apre la
  tappa di oggi e marca sulla timeline l'evento in corso con l'orologio vero.
  Frecce per sbirciare avanti e indietro.
- **L'ora che conta, esplicita.** Ogni giornata dichiara in testa l'ora attorno
  a cui è costruita — le 7:00 di Plitvice, le 13:00 di Postojna, le 9:45 al
  piazzale di Porozina, le 8:30 della colazione in cui si sceglie.
- **Le tre scelte si fanno davvero.** I menù del 13, del 14 e del 15 sono
  bottoni. Ogni opzione porta i suoi chilometri, le sue ore e il suo costo, e
  toccandola si riallineano da soli: totale del viaggio, ore di guida, riga
  del carburante e degli ingressi nel budget, ramo acceso sulla mappa. La
  scelta resta salvata sul telefono.
- **Mappa a due inquadrature.** Di default è centrata su Slovenia e Quarnaro,
  dove stanno otto giornate su dieci, perché a 390 px la vista completa rende
  le etichette illeggibili. La seconda inquadratura mostra anche il
  trasferimento dall'Appennino.
- **Frasario cercabile**, e ogni frase si ingrandisce a tutto schermo per
  mostrarla a qualcuno. **Numeri utili** come pulsanti `tel:`.
- **Valigia condivisa col road book**: stessa chiave `localStorage`, quindi le
  spunte fatte sul documento si ritrovano nell'app e viceversa.
- **Stampa**: il PDF esce come libretto da cruscotto, 24 pagine A4 — mappa,
  dieci giornate, pratico, e le tre checklist con le caselle da barrare a
  penna. La scheda «Oggi» in stampa è soppressa perché duplica una giornata.
- **Riprende dove eri**: ricorda l'ultima scheda aperta e la posizione dello
  scorrimento di ognuna. Un giorno nuovo però riapre su «Oggi», che è il
  motivo per cui quella scheda esiste.
- **Dice quando sei senza campo**, con una spia in alto: l'app si apre lo
  stesso, ma gli orari che leggi sono quelli scritti, non quelli di adesso.

### Installabile, e offline sul serio

`https://davide88770.github.io/Davide/viaggio/` — icona sulla schermata Home,
schermo intero, e si **apre senza rete**. È la differenza che conta su questo
itinerario: il road book stesso avverte che il segnale sparisce a Plitvice,
sul Vršič, sul Velebit e nell'interno di Cres, che sono esattamente i posti in
cui la vorresti aprire. Sull'Artifact questo non è possibile — gira in un
iframe su claude.ai e non può registrare un service worker.

Si costruisce dal sorgente, che resta l'unica fonte di verità:

```sh
node tools/build-icone.mjs pwa/viaggio/icone   # solo se cambia l'icona
node tools/build-pwa.mjs viaggio               # oppure senza argomenti, tutte
```

Il ramo `gh-pages` serve l'intera cartella `pwa/`, quindi l'app fitness sta
alla radice e questa in `/viaggio/`. Convivere sullo stesso dominio ha due
trappole, tutte e due trovate eseguendo la prova offline e non leggendo il
codice:

- il service worker alla radice ha **scope su tutto il sito** e intercettava
  anche le navigazioni verso `/viaggio/`, salvandosi quella pagina come
  proprio guscio offline. Ora ogni service worker tratta solo il proprio
  indice;
- l'`activate` cancellava **tutte** le cache dell'origine per ripulire le
  versioni vecchie, quindi ogni aggiornamento di un'app azzerava l'offline
  dell'altra. Ora ognuno cancella solo le cache col proprio prefisso.

L'icona è una rosa dei venti a trentadue tacche nella palette del road book,
con il nord in teal: `pwa/viaggio/icone/icona.svg`.

### Numeri, ricalcolati a codice

Il totale non è più una tabella scritta a mano: si calcola sommando le
giornate con le opzioni scelte. Verificato eseguendo il codice su cinque
combinazioni:

| Scelte (13 · 14 · 15) | km | Guida |
|---|---|---|
| nessuna (riferimenti) | 2.215 | 30h30 |
| giorno zero · Pirano · dritti a casa | 2.155 | 29h00 |
| giorno zero · Abbazia · dritti a casa | **2.145** | 28h30 |
| barca · Rovigno · Trieste | 2.278 | 30h15 |
| Lošinj · Pola · laguna | **2.455** | 32h50 |

La riga senza scelte dà esattamente i 2.215 km e le 30h30 del road book: le
due fonti partono dallo stesso posto.

**Da correggere nel road book alla prossima pubblicazione.** L'intervallo
«2.155–2.475 km» stampato nella sezione *Quadro chilometrico* è stimato a
occhio. Il minimo vero è **2.145 km** (giorno zero + finale ad Abbazia, che
accorcia il giorno 9 a 80 km) e il massimo vero è **2.455 km** (Lošinj + Pola
+ deviazione in laguna). Il road book non è stato toccato per non
disallinearlo dal suo Artifact pubblicato.

Sul budget, l'app calcola il carburante sui chilometri effettivi
(6,5–7,5 l/100 km a 1,75–1,80 €/l) invece di usare un valore fisso: sulla
configurazione di riferimento sono 252–299 € contro i 245–300 € del road book,
e il totale per due passa da 2.396–3.496 € a **2.388–3.505 €**.

## Storico

- **v2** — quarta notte a Cres, finale a scelta, menù di scelta sugli ultimi
  tre giorni. Da 5 basi a 4, da 2.280 a 2.215 km. Rimossi dal percorso
  principale Parenzo e la Basilica Eufrasiana, che restano come variante.
- **v1** — versione ibrida: Postojna il giorno 1, Lubiana al posto del rientro
  su Mangart, Rastoke sulla rotta, vignetta da 7 giorni.
