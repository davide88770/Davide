# La Grande Frattura

Road trip in Giordania, **12–21 novembre 2026**. Andata e ritorno dall'aeroporto
Queen Alia di Amman, in auto a noleggio.

**Artifact:** <https://claude.ai/code/artifact/bdef90a6-e2e2-4c49-8c65-b6145f94c829>
**Sorgente:** [`roadbook.html`](roadbook.html)

## In sintesi

10 giorni · 9 notti · **5 basi** · ~835 km · 13h10 di guida · da −430 a +1.500 m.
Budget stimato per due: **1.496–3.242 JOD**, cioè 1.810–3.923 €.

| Notti | Date | Base | Quota |
|---|---|---|---|
| 1 | 12 nov | Madaba | 780 m |
| 2–3 | 13–14 nov | Dana | 1.200 m |
| 4–5 | 15–16 nov | Little Petra / Wadi Musa | 1.100 m |
| 6–7 | 17–18 nov | Wadi Rum (campo beduino) | 1.000 m |
| 8–9 | 19–20 nov | Aqaba | 0 m |

## L'idea

Il viaggio sta tutto dentro una sola cicatrice tettonica: si scende a −430 m sul
Mar Morto, si risale a 1.200 a Dana, si cammina sul bordo orientale della fossa
fino a Petra e al Wadi Rum, si finisce a quota zero nel Mar Rosso. Il documento è
costruito come un **foglio di rilevamento**: mappa, profilo altimetrico e
almanacco della luce sono i tre strumenti, e ogni giornata è appesa a un'ora
precisa di quell'almanacco.

Cinque basi, quattro cambi di valigia, e nessuna base di una notte sola tranne la
prima. Tre giornate su dieci l'auto non si muove.

## Le otto correzioni al routing di partenza

1. **Wadi Ghweir chiuso a novembre.** I sentieri d'acqua della riserva di Dana
   (RSCN) hanno stagione 15 marzo – 31 ottobre e da novembre chiudono per rischio
   di piena. Sostituito con il **Wadi Dana Trail** (Dana → Feynan), aperto tutto
   l'anno, 14–16 km, −900 m, quattro fasce climatiche.
2. **Petra chiude alle 16:00** in orario invernale, non «nel tardo pomeriggio».
   La giornata 5 è ricalcolata all'indietro da quell'ora.
3. **La Tesoreria guarda a est**: è illuminata frontalmente fra le 07:30 e le
   10:00, non «nelle ore centrali». Da qui la seconda mattina di Petra.
4. **Jordan Pass Explorer** invece del Wanderer: +5 JOD comprano il secondo
   giorno a Petra, usato la mattina del 17 prima di scendere al Wadi Rum.
5. **Il giorno 2 è venerdì**, weekend giordano: San Giorgio apre alle 9:30 e le
   spiagge del Mar Morto si riempiono dal tardo mattino.
6. **Mar Morto + Kerak + arrivo a Dana con la luce** non stanno insieme
   nell'ordine originale. Nuova sequenza: Nebo 08:00, Mar Morto 09:30, Kerak
   14:00, Dana 16:50 (tramonto 17:41).
7. **Cambio 1,21 €/JOD**, non 1,30. E **Petra by Night costa 30 JOD**, non 17.
8. **Wadi Mujib chiuso**, non «chiude se piove»: la Siq Trail apre 1 aprile –
   31 ottobre.

## Vincoli veri

- **Nessuno slot orario contingentato** in tutto l'itinerario: Petra non ha
  fasce d'ingresso. Quello che si esaurisce sono i letti, non i biglietti.
- **Jordan Pass**: va comprato **prima di entrare in Giordania**, altrimenti non
  esenta dal visto (40 JOD). Con 9 notti la condizione delle 3 notti minime è
  ampiamente soddisfatta.
- **Il 4×4 delle 6:15 al checkpoint di Little Petra** (sera del giorno 4): i
  mezzi ufficiali partono solo dopo le 7:00. È la telefonata da cui dipende la
  giornata di Petra.
- **Buio alle 18:06**, tramonto alle 17:40: ogni trasferimento è programmato per
  finire prima delle 17:00. Fuori città non si guida di notte.
- **Guida obbligatoria e maggiore età** sui sentieri RSCN; il Wadi Dana Trail si
  può fare anche in autonomia.
- **Off-road vietato** dai contratti di noleggio: al Wadi Rum l'auto resta al
  villaggio.

## Dati e verifica

- Prezzi, orari e stagioni verificati ad agosto 2026. Ogni cifra nel documento
  porta un marcatore: ✓ verificato · ~ stima dichiarata · ! da confermare.
- L'unico dato **non verificabile online** sono le tariffe RSCN 2026 di Dana
  (il sito ufficiale non è raggiungibile): vanno chieste al telefono,
  +962 6 461 6523. Nel documento è segnato con `!`.
- **Alba, tramonto e crepuscolo civile** sono calcolati con l'algoritmo solare
  NOAA sulle coordinate reali di ogni tappa, orario di Giordania UTC+3
  (permanente dal 2022). L'algoritmo è stato validato contro effemeridi note
  (Roma, Londra) con scarto ≤ 2 minuti.
- **Fasi e tramonto della luna** al Wadi Rum calcolati per le notti del 17 e 18
  novembre: 53% e 63%, tramonto verso 00:35 e 01:35.

## Cosa c'è di nuovo rispetto ad Alpi, Soča & Quarnero

- **Selettore di tema** chiaro/scuro/auto, salvato sul dispositivo.
- **Profilo altimetrico** generato in JS, con la porzione sotto il livello del
  mare campita a parte.
- **Almanacco della luce**: le dieci giornate con crepuscolo, alba, mezzogiorno
  solare e tramonto, e «l'ora che conta» piantata sopra.
- **Barra del sole** dentro la colonna di ogni giornata.
- **Marcatori di verifica** su ogni cifra.
- **Calcolatore del Jordan Pass** e **budget interattivo** in JOD ed euro.
- **Filtro delle giornate** per tipo, legato a pastiglie e mappa.
- **Due piani B espliciti** per ogni giornata, uno meteo e uno logistico.
- **Frasario arabo giordano** con grafia araba, traslitterazione, pronuncia e i
  numeri arabo-indiani.
- Mappa a striscia sul solo corridoio della frattura, invece della carta
  nazionale in cui l'itinerario sarebbe illeggibile.

## Storico

- **v1** — prima versione, dal routing di Davide del 22 agosto 2026.
