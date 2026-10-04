# Progetto — Road book di viaggio

Questo repo raccoglie il lavoro sui **road book di viaggio** di Davide: itinerari
costruiti come dashboard HTML pubblicate come Artifact su claude.ai.

Rispondi e scrivi i deliverable **in italiano**.

## Struttura del repo

```
viaggi/<anno-mese-slug>/roadbook.html   sorgente dell'Artifact
viaggi/<anno-mese-slug>/README.md       sintesi, vincoli veri, storico versioni
fitness/<slug>/app.html                 sorgente dell'Artifact
fitness/<slug>/README.md                sintesi, scelte di trascrizione, storico
fitness/<slug>/verify.json              selettori e giro delle viste per la verifica
viaggi/<anno-mese-slug>/app-mobile.html app da viaggio: stessi dati, chrome da
                                        applicazione. Il blocco 1 del sorgente
                                        è il viaggio, il 2 è il motore —
                                        identico in tutte le app
viaggi/<anno-mese-slug>/app-mobile.verify.json   selettori e giro delle schede
viaggi/<anno-mese-slug>/app-mobile.adesso.json   i momenti su cui spostare
                                        l'orologio nella prova della scheda «Oggi»
tools/verify.mjs                        verifica di rendering obbligatoria
tools/prova-conti.mjs                   ricalcolo dei totali, obbligatorio
tools/prova-adesso.mjs                  prova della scheda «Oggi» a orologio spostato
tools/prova-pwa.mjs                     prova del giro di aggiornamento della PWA
tools/build-libretto.mjs                il libretto di carta, dai dati dell'app
tools/build-stato.mjs                   cosa manca e entro quando, da appendere
tools/build-itinerario.mjs              l'itinerario di partenza, completato
out/                                    screenshot e PDF generati (non versionato)
```

Il repo è nato per i road book. Da agosto 2026 ospita anche **app di
allenamento e alimentazione** (`fitness/`): stesso standard tecnico — HTML
autonomo, due temi, CSS di stampa, verifica di rendering — ma sono strumenti da
usare tutti i giorni, non documenti da leggere. Lì contano l'inserimento veloce
da telefono, i totali ricalcolati a ogni tocco e l'onestà su cosa i piani di
partenza non dicono.

## Riferimento

Il primo road book prodotto è *Alpi, Soča & Quarnero* (Slovenia e Croazia,
6–15 settembre 2026): `viaggi/2026-09-alpi-soca-quarnero/`, pubblicato su
<https://claude.ai/code/artifact/fac61cfd-bb6d-466a-97fc-e508a9785d8c>

È lo standard da eguagliare e superare: struttura, densità di informazione,
tono, impaginazione. **Leggi il sorgente nel repo** prima di partire con una
nuova destinazione — non per copiarlo, ma per sapere da dove si riparte.

Per aggiornare un road book esistente, modifica il file nel repo e ripubblica
passando il suo `url`: il sorgente versionato e l'Artifact pubblicato devono
restare allineati.

## Livello atteso

Davide ha chiesto esplicitamente di **alzare l'asticella a ogni giro**, sia
sull'itinerario che sulla dashboard. Non consegnare la versione "che va bene":
consegna quella che aggiunge qualcosa rispetto alla precedente. Il tempo di
produzione più lungo è accettato e messo in conto — se una volta serve
qualcosa di veloce, lo dirà lui.

## Come si costruisce l'itinerario

- **Verifica alle fonti ufficiali.** Prezzi, orari, slot, aperture stagionali,
  pedaggi e vignette si controllano sui siti ufficiali, non si vanno a memoria.
  Se un dato non è verificabile, dillo esplicitamente nel documento invece di
  stimarlo in silenzio.
- **Ogni giornata ha un'ora che conta.** L'ingresso alle 7:00 a Plitvice, la
  luce radente su un borgo, la marea, l'orario di un ponte girevole. Costruisci
  la giornata attorno a quella e appendici il resto — non fare liste di cose da
  vedere.
- **Orari realistici.** Soste, parcheggio, code e cambio d'abito già dentro.
  Tempi di sola guida in tabella, con l'avvertenza di aggiungere il 15–20%.
- **Sempre due piani B**: uno meteo e uno logistico (traghetti, bora, passi
  chiusi, scioperi, chiusure stagionali).
- **Dichiara quando si prende ogni decisione.** È la cosa che ha funzionato
  meglio finora: separare ciò che va prenotato subito, ciò che si sceglie
  prenotando, e ciò che si decide la mattina stessa. Le giornate a "menù di
  scelta" servono a questo.
- **Coerenza numerica.** Ogni modifica alle tappe tocca più punti: timeline del
  giorno, tabella distanze e progressive, mappa, budget, prenotazioni,
  checklist, footer. Aggiornali tutti insieme e **ricontrolla i totali a
  calcolo**, non a occhio.
- **Attrazioni a pagamento: dì sempre cosa si vede gratis.** Se una cosa ha un
  biglietto, il documento deve dire *quali* biglietti esistono (spesso sono
  due: quello del comune e quello privato), quanto valgono davvero, e se lo
  stesso colpo d'occhio si prende da fuori senza pagare. Le **ricostruzioni**
  vanno dichiarate come tali. Riscontro dal campo, settembre 2026: Rastoke era
  scritta come «un'ora, ingresso ~8 €» e si è rivelata un borgo-museo privato
  che delude, mentre le cascate coi mulini si vedono benissimo dal ponte,
  gratis.
- **Preferisci le cose vive alle esposizioni.** A parità di posto, un rifugio
  di animali, una falesia con i grifoni o un cantiere che lavora battono un
  museo. Sempre dallo stesso viaggio: il santuario degli orsi di Kuterevo, a
  quindici chilometri dalla rotta, è stato il momento più bello di una
  giornata — e non era nell'itinerario; i musei proposti per una giornata di
  pioggia sono stati invece rifiutati in blocco.
- **Prevedi il tempo che avanza.** Ogni giornata di trasferimento dovrebbe
  proporre il proprio candidato per l'ora libera, invece di lasciare che sia
  chi viaggia a cercarselo.
- **La luce si calcola, non si copia.** Alba, ora d'oro, tramonto e crepuscolo
  si ricavano in JavaScript dalla latitudine e dalla longitudine del posto
  dove si dorme quella sera. La tabella scritta a mano del primo road book era
  sbagliata di dieci-diciotto minuti su tutte le giornate, e non se n'era
  accorto nessuno: quando metà delle giornate è costruita sulla luce radente,
  un quarto d'ora è la differenza fra esserci e arrivare dopo.
- **Sii onesto sui compromessi.** Se una scelta fa perdere qualcosa, scrivilo
  nel documento e diglielo nella risposta.

## Come si costruisce la dashboard

- HTML autonomo, pubblicato come Artifact. Nessuna risorsa esterna: CSP
  bloccante, tutto inline.
- **Tema chiaro e scuro** completi, con i token definiti su `:root` nudo e
  ridefiniti sia in `prefers-color-scheme` che in `[data-theme]`.
- **CSS di stampa** curato: la pagina deve uscire bene in PDF A4, senza
  navigazione, senza ombre, senza spezzare i blocchi a metà.
- Spingi sull'**interazione**: filtri, mappa e itinerario collegati nei due
  sensi, stato salvato su `localStorage`, blocchi che si aprono e chiudono.
- Valuta le **capacità runtime** degli Artifact quando aggiungono qualcosa di
  vero (es. una checklist condivisa tra i telefoni di chi viaggia). Carica la
  skill `artifact-capabilities` prima di dichiararle.
- Le mappe sono SVG disegnate su coordinate reali, generate in JS da array di
  tappe e tratte — non immagini.

## Verifica prima di consegnare (obbligatoria)

Non consegnare senza aver **renderizzato davvero** la pagina:

```sh
npm install
npm run verify viaggi/<cartella>/roadbook.html
```

Lo script fa i controlli da 1 a 3 e il 4, ed esce con codice diverso da zero se
qualcosa non va. I controlli 5 e 6 restano da fare a mano quando i dati
cambiano. Controlla come minimo:

1. Nessun errore in console e nessun `pageerror`.
2. Resa in **chiaro** e in **scuro**.
3. Resa a **390 px** di larghezza, senza scroll orizzontale del body.
4. **PDF di stampa** generato, con conteggio pagine ragionevole e nessuna
   pagina mezza vuota.
5. Conteggi degli elementi generati in JS (giornate, tappe, opzioni) coerenti
   con i dati.
6. **Totali ricalcolati** eseguendo il codice, non fidandosi delle tabelle.

Errori trovati solo così, in passato: regole CSS troppo larghe che
trasformavano i grassetti del testo in titoli; etichette sovrapposte sulla
mappa. A occhio non si vedevano.

### Per le app da viaggio, `verify` non basta

`verify` apre la pagina a una data qualunque e con le scelte vuote: metà del
codice non viene mai eseguito. Servono anche:

```sh
npm run prova:conti  viaggi/<cartella>/app-mobile.html
npm run prova:adesso viaggi/<cartella>/app-mobile.html
npm run prova:pwa    <nome-app>
```

- **`prova:conti`** è il controllo 6 fatto a macchina: prova **tutte** le
  combinazioni di scelte dei menù e verifica che il totale dei chilometri sia
  la somma delle giornate, che il budget sia la somma delle sue righe, che gli
  ingressi siano la somma dei biglietti accesi per il numero di persone, e che
  il numero stampato sulla barra dei totali, sulla mappa e in «Oggi» sia lo
  stesso. Ha già trovato un arrotondamento che faceva ballare il budget di un
  euro rispetto al registro dei biglietti.
- **`prova:adesso`** sposta l'orologio del browser a momenti veri del viaggio
  e controlla cosa dice la scheda «Oggi»: il conto alla rovescia prima della
  partenza, la voce in corso e quella dopo durante, il riepilogo alla fine. E
  soprattutto la **mezzanotte con l'app aperta**: un'app installata sul
  telefono resta aperta per giorni e la pagina non ricarica, quindi senza un
  riallineamento a ogni minuto e a ogni ritorno in primo piano al risveglio
  mostra ancora il giorno prima.

- **`prova:pwa`** prende il nome dell'app come argomento, perché sullo stesso
  dominio ne vive più di una: verifica che ciascuna registri il proprio service
  worker, si apra senza rete e non cancelli le cache delle altre.

Perché l'app serva anche a chi la rilegge l'anno dopo, queste prove vanno
rifatte a ogni modifica dei dati, non solo del codice.

### Un motore solo, tanti blocchi di dati

Dalla v3 di *Alpi, Soča & Quarnero* il motore (sezione 2 del sorgente) è
**identico in tutte le app da viaggio**: una modifica va riportata in tutte, e
quello che cambia da un viaggio all'altro si dichiara in `VIAGGIO`, non si
scrive nel codice. Finora ci sono finiti: il fuso per giornata (serve ai voli),
il lessico delle etichette («in viaggio» invece di «guida»), la scala del
disegno della mappa, la legenda e le inquadrature, le parole dei verdetti, e
`carburante:false` per i viaggi in cui non si guida.

Il motore **non nomina nessun posto**, nemmeno nel testo delle sezioni:
l'ordine e il contenuto della scheda «Pratico» stanno in `PRATICO` (`'@nome'`
chiama un blocco generato, un oggetto `{id,t,b}` è una sezione scritta a mano)
e i numeri di emergenza in `SOS`. La regola è nata da un errore vero: la prima
versione dell'app Vietnam mostrava i traghetti della linea 334, la vignetta
slovena e il Vršič, perché quelle sezioni erano scritte dentro il motore. Le
prove non se ne sono accorte — `verify` conta gli elementi, non li legge.
Quando aggiungi una destinazione, **leggi la scheda «Pratico» renderizzata**,
non solo i conteggi.

**`verify` non vede i colori.** Una volta un `<style>` duplicato ha azzerato
tutti i token CSS — la mappa era un rettangolo nero — e `verify` è passato lo
stesso, perché guarda errori JS, sbordature e conteggi. Prima di consegnare,
**guarda almeno uno screenshot** di `out/<cartella>/<nome>/`.

### Il libretto di carta

Il PDF che esce da `verify` è la stampa dell'app: va bene per archiviare, non
per consultare in mezzo a un aeroporto. Per la versione da portarsi dietro c'è
un documento a parte, impaginato per la carta:

```sh
npm run libretto viaggi/<cartella>/app-mobile.html
```

**Non riscrive nessun dato.** Taglia dal sorgente dell'app il blocco che va da
`const VIAGGIO={` fino alla barra della luce — i dati del viaggio più i calcoli
puri — e lo esegue in pagina: così il libretto non può stampare un orario
diverso da quello che l'app mostra a schermo. Tutto quello che viene dopo nel
sorgente è disegno a schermo, e qui non serve.

L'ordine delle pagine è quello di consultazione, non quello del racconto:
copertina con la mappa e i numeri d'emergenza, **il viaggio in una pagina**,
**spostamenti**, **prenotazioni**, poi giorno per giorno, pratico, biglietti e
budget, frasario, numeri utili e le liste da spuntare. Le prime quattro pagine
sono quelle che si aprono venti volte; il resto si legge una volta.

### Lo stato del viaggio

Il libretto si porta in viaggio; questo si guarda **prima**, e il giorno della
partenza si butta:

```sh
npm run stato viaggi/<cartella>/app-mobile.html
```

Quattro pagine A4 con le caselle da spuntare: le decisioni ancora aperte, le
cose da sbrigare, tutte le scadenze in ordine, quello che è già prenotato con
gli importi veri, gli errori trovati e corretti, e quello che resta incerto.
Esce dagli stessi dati — registro, riscontri, scadenze, liste — tranne
l'elenco delle incertezze, che è un giudizio e sta nel generatore.

### L'itinerario di partenza, completato

Quando il viaggio nasce da un itinerario scritto da qualcun altro — un travel
designer, un'agenzia — quel documento ha un valore che non si butta: struttura,
consigli, tono. Ma è pieno di link fra cui scegliere, e una volta scelto non
dice più cosa c'è davvero.

```sh
npm run itinerario viaggi/<cartella>/app-mobile.html
```

Ricostruisce **quel** documento, con le sue parole e la sua impaginazione, e
al posto di ogni «QUI» e di ogni «OPZIONE 1 / 2 / 3» mette un riquadro con
l'alloggio o il mezzo prenotato: nome, indirizzo, date, codice di conferma,
costo, telefono. I riquadri si costruiscono cercando il codice nel registro
`BOOK` dell'app, quindi non possono divergere.

Due regole, nel farlo: **il testo originale resta dell'autore** e la firma
anche — si completa, non si riscrive; e dove le prenotazioni hanno **smentito**
il piano (un orario, un hotel non disponibile) si scrive apertamente che è una
correzione, invece di far sparire la riga.

## Consegna

- Pubblica come Artifact. Per aggiornarne uno esistente passa il suo `url`,
  altrimenti ne crei uno nuovo e perdi il link.
- Manda anche il **PDF** con `SendUserFile` se l'utente lo può voler stampare.
- Nella risposta: cosa è cambiato, i numeri riallineati, cosa hai verificato e
  cosa hai dovuto lasciare fuori.
