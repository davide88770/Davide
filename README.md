# Road book di viaggio

Itinerari costruiti come dashboard HTML autonome e pubblicate come Artifact su
claude.ai. Ogni viaggio è una cartella sotto `viaggi/`, con dentro il sorgente
della pagina e le sue note.

## Viaggi

| Viaggio | Date | Road book | In viaggio |
|---|---|---|---|
| [Alpi, Soča & Quarnero](viaggi/2026-09-alpi-soca-quarnero/) — Slovenia e Croazia | 6–15 set 2026 | [Artifact](https://claude.ai/code/artifact/fac61cfd-bb6d-466a-97fc-e508a9785d8c) | [app installabile](https://davide88770.github.io/Davide/viaggio/) · [Artifact](https://claude.ai/code/artifact/6d313e18-d2ba-46e7-b92b-777728ae408b) |

Ogni viaggio ha due deliverable: il **road book**, il documento che si legge
prima di partire, e l'**app da viaggio**, la stessa materia riorganizzata per
il telefono — schede sotto il pollice, la tappa di oggi in apertura, le scelte
che ricalcolano i totali, e il funzionamento **senza campo** una volta
installata.

## Com'è fatto un road book

Un solo file HTML, senza dipendenze esterne: la piattaforma degli Artifact
applica una CSP che blocca qualsiasi richiesta di rete, quindi CSS, JavaScript
e immagini sono tutti inline. Il file **non** contiene `<!doctype>`, `<html>`,
`<head>` o `<body>`: quello scheletro lo aggiunge la piattaforma in
pubblicazione.

Dentro ci sono, tipicamente:

- una **mappa SVG** disegnata su coordinate reali e generata in JavaScript da
  un array di tappe e tratte, cliccabile per saltare alla giornata;
- l'**itinerario giorno per giorno**, generato da un array `DAYS` con timeline
  oraria, cosa non perdere, dove dormire e mangiare;
- i **menù di scelta**, per le giornate deliberatamente aperte: si dichiara
  quali opzioni ci sono e *quando* va presa la decisione;
- le tabelle di **distanze, prenotazioni e budget**, che vanno tenute
  allineate ai dati delle giornate;
- una **checklist** con lo stato salvato in `localStorage`;
- tema **chiaro e scuro**, e un **CSS di stampa** che rende la pagina un PDF A4
  presentabile.

## Versioni installabili

Gli Artifact girano dentro claude.ai e non possono registrare un service
worker: per avere l'icona sulla Home e l'apertura senza rete c'è la PWA,
generata dagli stessi sorgenti e pubblicata su GitHub Pages dal ramo
`gh-pages`.

| App | Sorgente | Indirizzo |
|---|---|---|
| Ghisa & Grammi | `fitness/ghisa-e-grammi/app.html` | <https://davide88770.github.io/Davide/> |
| Alpi, Soča & Quarnero | `viaggi/2026-09-alpi-soca-quarnero/app-mobile.html` | <https://davide88770.github.io/Davide/viaggio/> |

```sh
node tools/build-pwa.mjs             # tutte
node tools/build-pwa.mjs viaggio     # una sola
node tools/build-icone.mjs           # rigenera i PNG dagli SVG
```

Le app vivono sullo stesso dominio, quindi ogni service worker serve solo il
proprio indice e ripulisce solo le cache col proprio prefisso: senza queste
due regole quella alla radice, che ha scope sull'intero sito, si mangia il
guscio offline dell'altra. Il workflow controlla che le regole ci siano, e
`npm run prova:pwa` le mette alla prova sul serio — serve le due app da un
server locale, le installa, stacca la rete e verifica che si riaprano
entrambe con le scelte salvate ancora al loro posto.

## Verifica

Prima di pubblicare, sempre:

```sh
npm install
npm run verify viaggi/<cartella>/roadbook.html
```

La configurazione dei controlli si mette accanto al sorgente: prima si cerca
`<nome>.verify.json`, poi `verify.json` di cartella, e in mancanza valgono i
valori del road book. Screenshot e PDF finiscono in `out/<cartella>/<nome>/`.

Lo script apre la pagina in Chromium e controlla errori JS, resa in tema chiaro
e scuro, resa a 390 px senza sbordature, coerenza dei conteggi fra i tre
viewport e il PDF di stampa. Screenshot e PDF finiscono in `out/`, che non è
versionato. Esce con codice diverso da zero se qualcosa non va.

Chromium è preso da `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`;
altrove, imposta `CHROME_PATH`.

## Convenzioni

`CLAUDE.md` contiene lo standard di lavoro: come si costruisce l'itinerario,
come si costruisce la dashboard e cosa va verificato prima di consegnare.
Leggilo prima di iniziare una nuova destinazione.
