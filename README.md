# Road book di viaggio

Itinerari costruiti come dashboard HTML autonome e pubblicate come Artifact su
claude.ai. Ogni viaggio è una cartella sotto `viaggi/`, con dentro il sorgente
della pagina e le sue note.

## Viaggi

| Viaggio | Date | Artifact |
|---|---|---|
| [Alpi, Soča & Quarnero](viaggi/2026-09-alpi-soca-quarnero/) — Slovenia e Croazia | 6–15 set 2026 | [apri](https://claude.ai/code/artifact/fac61cfd-bb6d-466a-97fc-e508a9785d8c) |

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

## Verifica

Prima di pubblicare, sempre:

```sh
npm install
npm run verify viaggi/<cartella>/roadbook.html
```

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
