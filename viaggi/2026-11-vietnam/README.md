# Vietnam

Dal nord al centro, **10 → 25 novembre 2026**, due persone, partenza e rientro
da Malpensa. Viaggio **non ancora fatto**: questa cartella è lo strumento per
non sbagliare niente una volta là.

| | |
|---|---|
| **App da viaggio** | [`app-mobile.html`](app-mobile.html) |
| **App installabile** (PWA, funziona senza campo) | <https://davide88770.github.io/davide/vietnam/> |

## In sintesi

16 giorni · 15 notti · **8 basi** · **21.577 km** in 67h15 di spostamenti
(19.000 in aria, 2.500 via terra) · 4 voli · 2 minivan · 1 treno · 1 bus notturno · 2 notti in barca.
Budget per due: **2.608–3.728 €**, con gli importi dei voli e della crociera
dichiarati come intervallo perché le conferme non li riportano.

Tutti i numeri sono **calcolati dal codice**: `npm run prova:conti` li rifà in
tutte le combinazioni di scelte.

| Notti | Date | Base | |
|---|---|---|---|
| 1 | 10 nov | in volo | MXP → AUH → HAN |
| 2–3 | 11–13 nov | Hanoi | Serene Central, Hoan Kiem |
| 4–5 | 13–15 nov | Sa Pa | Maison de Lao Chai, nella valle |
| 6 | 15 nov | Hanoi | **da riprenotare** |
| 7–8 | 16–18 nov | Baia di Ha Long | Peony Cruises, 2 notti a bordo |
| 9 | 18 nov | Tam Coc | Halise Home |
| 10 | 19 nov | sul bus | notturno Tam Coc → Hue |
| 11 | 20 nov | Hue | The Chum Boutique |
| 12–14 | 21–24 nov | Hoi An | The Signature, 3 notti |
| 15 | 24 nov | Noi Bai | Airport Classic Hotel 2 |

## Da dove vengono i dati

- **Orari, codici e indirizzi**: dalle conferme di prenotazione nella casella
  di Davide — Etihad, VietJet, Booking, 12Go, SeatOS, Peony Cruises. Nessun
  orario è stimato.
- **Attività, consigli e tempi**: dall'itinerario personalizzato di **Samira
  Vicinanza** (theoceanomads.com) del 2 ottobre 2026.
- **Luce**: calcolata con l'algoritmo NOAA sulla latitudine e la longitudine
  del posto dove si dorme ogni sera, con il fuso che cambia nelle giornate di
  volo.

## Errori trovati controllando le prenotazioni

- **Golden Rooster Hotel, Hanoi** — prenotato per il **15–16 novembre 2027**,
  non 2026. La conferma dice «arrivo lunedì 15 novembre 2027» e il 15 novembre
  2026 è una domenica. La notte fra il 15 e il 16 novembre 2026, al ritorno da
  Sa Pa, **non è coperta**. Da riprenotare.
- **Airport Classic Hotel 2** — era prenotato per il **10–11 gennaio 2027**.
  Corretto il 3 ottobre: ora è 24 → 25 novembre 2026.
- **EY433 del 25 novembre** — spostato da 07:40 a **08:15**. La coincidenza ad
  Abu Dhabi scende a 1h40.
- **Fine crociera** — il programma ipotizzava le 14:00, Peony ha confermato
  **11:30 al Lotto 34 di Tuan Chau**. È l'orario da dare a Halise.

## Cosa resta da fare

Sta anche dentro l'app, in Pratico → «Da fare, prima di partire», e come
checklist spuntabile in Valigia.

1. Riprenotare la notte del 15 a Hanoi.
2. Organizzare con Halise il van dal molo di Tuan Chau a Tam Coc (sbarco 11:30).
3. Decidere come andare da Hoi An all'aeroporto di Da Nang il 24.
4. Chiedere a Peony il pick-up a Hanoi del 16, con il nome dell'albergo nuovo.
5. Chiedere a HK Buslines il transfer per il bus notturno del 19, 24 ore prima.
6. Verificare l'ingresso in Vietnam sul sito dell'ambasciata.
7. Patente internazionale, se si vuole lo scooter a Sa Pa e a Tam Coc.

## L'app

Cinque schede, stesso motore del road book alpino: **Oggi** (la giornata in
corso, la voce di programma in corso e quella dopo, la barra della luce),
**Giorni** (16 giornate, due menù di scelta), **Mappa** (SVG su coordinate
reali più il profilo delle quote), **Pratico** (budget, registro dei biglietti
con l'alternativa gratuita, 16 indirizzi a tavola, almanacco della luce, cose
da fare, prenotazioni, frasario, numeri utili), **Valigia** (43 voci).

### Verifica

```sh
npm run verify       viaggi/2026-11-vietnam/app-mobile.html
npm run prova:conti  viaggi/2026-11-vietnam/app-mobile.html
npm run prova:adesso viaggi/2026-11-vietnam/app-mobile.html
npm run prova:pwa    vietnam
```

I casi della prova dell'orologio stanno in
[`app-mobile.adesso.json`](app-mobile.adesso.json): per un viaggio nuovo si
riscrivono quelli, non il codice.

## Storico

- **v1** — prima versione, 3 ottobre 2026. Costruita sul motore della v3 di
  *Alpi, Soča & Quarnero*: riscritto solo il blocco 1 dei dati. In quel giro il
  motore ha guadagnato il fuso per giornata (serve ai voli), il lessico
  configurabile («in viaggio» invece di «guida»), la scala del disegno della
  mappa, la legenda e le inquadrature dichiarate nei dati, e il budget senza
  carburante per i viaggi in cui non si guida.
