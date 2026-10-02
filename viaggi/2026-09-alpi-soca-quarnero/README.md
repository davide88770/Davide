# Alpi, Soča & Quarnero

Road trip in Slovenia e Croazia, **6–15 settembre 2026**, partenza e rientro da
Castelnovo ne' Monti. Viaggio **fatto**: da settembre 2026 questa cartella
contiene anche i riscontri dal campo.

| | |
|---|---|
| **Road book** (il documento che leggi prima) | [`roadbook.html`](roadbook.html) → <https://claude.ai/code/artifact/fac61cfd-bb6d-466a-97fc-e508a9785d8c> |
| **App da viaggio** (quella che tieni in mano) | [`app-mobile.html`](app-mobile.html) → <https://claude.ai/code/artifact/6d313e18-d2ba-46e7-b92b-777728ae408b> |
| **App installabile** (PWA, funziona senza campo) | <https://davide88770.github.io/davide/viaggio/> |

## In sintesi

10 giorni · 9 notti · **4 basi** · **2.235 km** · **30h45** di sola guida ·
2 traghetti · 3 paesi. Budget per due: **2.373–3.491 €**, che diventano
**2.391–3.359 €** scegliendo Lubenice il 13, Pirano il 14 e il rientro diretto.

Tutti i numeri sopra sono **calcolati dal codice**, non scritti a mano:
`npm run prova:conti` li rifà in tutte le 125 combinazioni di scelte possibili.

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
con l'indicazione esplicita di quando si decide: a colazione il 13, prenotando
il 14, in strada il 15.

## Vincoli veri

- **Plitvice**: slot orario contingentato a 300 persone/ora. Serve il 10/9 alle
  **07:00, Ingresso 2**, prenotato con settimane di anticipo.
- **Postojna**: slot grotta alle **13:00 del 6/9**, vincolante.
- **Traghetti Jadrolinija linea 334**: non si prenotano, si sale in ordine di
  arrivo. Con la bora la Brestova–Porozina può essere sospesa; l'alternativa è
  Merag ⇢ Valbiska e il ponte di Veglia.
- **Vignetta slovena**: la settimanale da 16 € basta.

## Riscontri dal campo (settembre 2026)

Stanno anche dentro l'app, nella sezione «Riscontri dal campo» di Pratico.

- **Rastoke, corretto.** Il road book diceva «un'ora, ingresso ~8 €». Sul posto
  i biglietti sono **due** — ~5 € il camminamento del comune, ~8 € a testa un
  borgo-museo privato — e quello a pagamento è una ricostruzione che delude. Le
  cascate coi mulini si vedono meglio **dal ponte, gratis**. Nel registro dei
  biglietti dell'app la voce è ora spenta di default.
- **Kuterevo, aggiunto.** Il rifugio per orsi orfani sopra Otočac non era in
  programma: lo hanno aggiunto loro, avendo tempo, ed è stata la cosa più bella
  della giornata. Da qui viene la regola nuova: **ogni giornata propone il suo
  candidato per l'ora che avanza**.
- **Mostnica invece di Vintgar**: confermata. Stessa acqua, 4 € invece di 15.
- **Musei nelle giornate di pioggia**: rifiutati in blocco. Il piano maltempo è
  stato riscritto su paesi, porti, strade interne e konobe.
- **Quattro notti a Cres**: la scelta strutturale che ha retto meglio. Il giorno
  del temporale è costato zero perché non c'era niente da smontare.

## L'app, cosa fa

Cinque schede, barra sotto il pollice, stato salvato su `localStorage` (le
spunte sono **le stesse del road book**).

- **Oggi** — la giornata in corso, con la voce di programma in corso e quella
  dopo («fra 25 min»), la barra della luce, l'ora che conta e il candidato per
  l'ora che avanza. Si riallinea ogni minuto e a ogni ritorno in primo piano:
  la mezzanotte cambia giornata anche con l'app rimasta aperta.
- **Giorni** — le dieci giornate, i tre menù di scelta, i totali che si
  riallineano a ogni tocco.
- **Mappa** — SVG su coordinate reali, cliccabile nei due sensi, più il
  **profilo altimetrico** del viaggio (dal livello del mare ai 1.611 m del
  Vršič, due volte).
- **Pratico** — budget con il numero di persone e il prezzo alla pompa che
  muovi tu; **registro dei biglietti** (quali esistono, quanto valgono, cosa si
  vede gratis); 19 indirizzi a tavola con i filtri; **almanacco della luce**;
  riscontri dal campo; traghetti, prenotazioni, auto, parcheggi, piani B,
  frasario, numeri utili.
- **Valigia** — 36 voci, tre liste, progressione.

### La luce è calcolata

Alba, ora d'oro, tramonto e crepuscolo civile si ricavano con l'algoritmo NOAA
dalla latitudine e dalla longitudine del posto dove si dorme quella sera — e se
scegli il finale, dalla base che hai scelto. Verificato su riferimenti noti
(Roma 21 giugno 20:49, Londra 6 settembre 19:38, Milano 20 marzo 18:35).

**Ha trovato un errore vero**: i tramonti scritti a mano nel road book erano
sbagliati di 10–18 minuti su tutte le giornate (6 set: 19:47 scritto, **19:35**
reale; 13 set: 19:31 scritto, **19:19** reale). Corretti in entrambi i file.

## Riusare l'app per un altro viaggio

Il sorgente è diviso in due blocchi dichiarati:

1. **`1 · IL VIAGGIO`** — `VIAGGIO`, `DAYS`, `BIGLIETTI`, `TAVOLA`, `PROFILO`,
   `BUDGET`, `BOOK`, `METEO`, `PHRASES`, `LISTS`, `RISCONTRI` e la geografia
   (`COAST`, `LEGS`, `STOPS`). È l'unica parte da riscrivere.
2. **`2 · MOTORE`** — da lì in giù non si nomina nessun posto: proiezione della
   mappa, calcolo della luce, totali, budget, viste. Non si tocca.

Per una destinazione nuova:

```sh
cp viaggi/2026-09-alpi-soca-quarnero/app-mobile.html viaggi/<nuovo>/app-mobile.html
cp viaggi/2026-09-alpi-soca-quarnero/app-mobile.verify.json viaggi/<nuovo>/
# riscrivi il blocco 1, poi:
npm run verify       viaggi/<nuovo>/app-mobile.html
npm run prova:conti  viaggi/<nuovo>/app-mobile.html
npm run prova:adesso viaggi/<nuovo>/app-mobile.html
```

Cosa guardare nel blocco 1:

- `VIAGGIO.chiave` — prefisso di tutto quello che si salva. Se è la stessa del
  road book, le spunte sono condivise.
- `VIAGGIO.tz` e `lat`/`lon` di ogni giornata — servono al calcolo della luce.
- `VIAGGIO.bbox` — il riquadro della mappa: la proiezione e la scala verticale
  si ricavano da lì, non ci sono più costanti magiche.
- `menu.modo` — `"aggiunge"` se l'opzione aggiunge chilometri alla giornata
  (una sosta), altrimenti sostituisce. Un'opzione con `applica` cambia una
  **altra** giornata: è il caso del finale che decide la lunghezza del rientro.
- `BIGLIETTI[].conta` — `false` se quel biglietto è già dentro il costo di
  un'opzione a scelta, così non viene contato due volte.
- `PROFILO` — progressive in chilometri e quote reali; `l:1` sui punti da
  etichettare, `f:1` su quelli che non si guidano (funivie).

## Storico

- **v3 — definitiva.** Luce calcolata (NOAA) al posto dei tramonti scritti a
  mano, e tre tramonti corretti anche nel road book. Registro dei biglietti con
  l'alternativa gratuita di ognuno, che ora **genera** la voce «ingressi» del
  budget. Budget con persone e prezzo alla pompa regolabili. Profilo
  altimetrico. 19 indirizzi a tavola con filtri. Almanacco della luce.
  Riscontri dal campo. «Se avanza un'ora» su ogni giornata. «Oggi» viva, che
  mostra la prossima voce e supera la mezzanotte da sola. Dati separati dal
  motore, per riusarla. Service worker indurito: `updateViaCache:'none'`,
  `cache:'no-store'` ovunque, controllo di `reg.waiting`. Due prove nuove:
  `prova:conti` e `prova:adesso`.
- **v2.1** — rotazione per il maltempo dell'11 settembre, Rastoke corretto,
  Kuterevo aggiunto, piano pioggia riscritto senza musei.
- **v2** — quarta notte a Cres, finale a scelta, menù di scelta sugli ultimi
  tre giorni. Da 5 basi a 4.
- **v1** — versione ibrida: Postojna il giorno 1, Lubiana al posto del rientro
  su Mangart, Rastoke sulla rotta, vignetta da 7 giorni.
