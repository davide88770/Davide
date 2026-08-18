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
tools/verify.mjs                        verifica di rendering obbligatoria
tools/prova-dati.mjs                    prova con dati seminati, obbligatoria per fitness/
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

Per le app in `fitness/` **questo non basta**: `verify` apre un profilo vuoto, e
con il profilo vuoto metà del codice non viene mai eseguita. Serve anche la
prova con i dati dentro, che semina sedute, carichi, peso corporeo, pasti e un
esercizio sostituito, poi gira tutte le viste e tutti gli interruttori:

```sh
npm run prova fitness/<cartella>/app.html
```

Due bug sono passati per due versioni proprio perché mancava: la scheda
Progressi si rompeva appena c'era un carico registrato, e un giorno di dieta
importato da un backup vecchio rompeva la scheda Dieta. Nessuno dei due era
visibile su un profilo pulito.

## Consegna

- Pubblica come Artifact. Per aggiornarne uno esistente passa il suo `url`,
  altrimenti ne crei uno nuovo e perdi il link.
- Manda anche il **PDF** con `SendUserFile` se l'utente lo può voler stampare.
- Nella risposta: cosa è cambiato, i numeri riallineati, cosa hai verificato e
  cosa hai dovuto lasciare fuori.
