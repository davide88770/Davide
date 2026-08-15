# Ghisa & Grammi

App di allenamento e alimentazione per uso quotidiano, costruita sui due piani
di Davide: **Piano Master FINAL — Coach Level** (38 pagine, workout) e **Piano
Alimentare Master** (29 pagine). Copre l'intero ciclo **agosto 2025 → settembre
2026**, sei fasi.

**Artifact:** <https://claude.ai/code/artifact/2c08979c-1b31-4f71-89c9-15375daa20d8>
**Sorgente:** [`app.html`](app.html) · **Verifica:** `npm run verify fitness/ghisa-e-grammi/app.html`

## Cosa fa

| Sezione | Contenuto |
|---|---|
| **Oggi** | Fase e tipo di settimana in corso, sessione del giorno, anelli dei macro, peso |
| **Allenamento** | Serie da compilare (kg × rep × RIR), cronometro di recupero, suggerimento di carico, dischi del bilanciere, tecnica ed ernia per esercizio |
| **Dieta** | Pasti da spuntare, sostituzioni equivalenti, fuori piano, somma pasti contro target |
| **Progressi** | 1RM stimato per esercizio, serie per gruppo contro target, tonnellaggio settimanale, peso con media a 7 giorni, record |
| **Piano** | Le sei fasi, settimana tipo, checklist della domenica, KPI, progressione attesa, protocolli anti-plateau, deload, ernia, recupero, imprevisti, integratori, backup |

Ogni sessione si apre con la **mobilità 10 min** della seduta giusta e si chiude
con lo **stretching 8 min**; le sigle di intensità (rest-pause, drop set,
myo-reps, widowmaker, F→V) sono toccabili e aprono la definizione del piano; il
sissy squat porta con sé la sua progressione del range per l'ernia. La
**checklist della domenica** è interattiva: a tre parametri in attenzione scatta
da sola la regola 3 su 7 con l'indicazione di anticipare il deload.

La sessione e il tipo di giornata alimentare si ricavano dalla data: lo split
cambia da solo passando da PPL 3× (cut, transizione) a PPL + Upper (dalle fase 3
in poi). La fase si può forzare a mano dalla sezione Piano.

## Dati e sincronizzazione

Non esiste uno storage condiviso dichiarabile da un Artifact per questo account
(le capacità disponibili sono `downloads` e `mcp`, e non ci sono connettori
attivi): **la sincronizzazione automatica iPhone ↔ PC non è possibile**.

Al suo posto: dati in `localStorage` su ogni dispositivo, più **esporta/importa
con fusione**. L'import non sovrascrive — per ogni giornata tiene la versione con
`mod` più recente, e unisce le pesate per data. In alternativa, per trasferimenti
piccoli, "Copia codice" / "Incolla codice" via appunti.

Safari su iOS cancella i dati dei siti dopo circa 7 giorni di inattività: la
sezione Piano mostra da quanto manca un backup.

## Scelte fatte in trascrizione

Dove i due documenti si contraddicono, l'app applica una regola dichiarata (ed è
scritta anche dentro l'app, in fondo alla sezione Piano):

- **Serie nel cut** — vale la tabella *Progressione volume*, che dice di seguirla
  alla lettera. Dove dà un intervallo ("2–3") si prende il minore, salvo quando
  la colonna NOTE lo risolve: il military press resta a 3 serie già dal base,
  anche se la tabella della sessione scrive `2 × 6–8`.
- **Deload in PPL + Upper** — non è tabellato. Si applica la regola generale del
  piano ("stesso carico, −40% serie"): `round(serie × 0,6)`, minimo 1.
- **Somma dei pasti** — i pasti elencati sommano 300-400 kcal e 30-35 g di
  proteine **meno** del target di fase, in tutte le fasi. L'app mostra i due
  numeri affiancati con lo scarto, invece di allinearli d'ufficio.
- **Incremento di carico** — il piano dice "+2,5 kg". L'app propone +2,5 kg sui
  compound e +1,25 kg sugli isolamenti (laterali, curl, leg curl), dove 2,5 kg
  sono spesso un salto troppo grande.
- **Curl bilanciere F→V** — spezzato in due esercizi distinti ("FORZA" 2×5-6 e
  "VOLUME" 3×8-10) perché usano carichi diversi e vanno registrati separatamente.
- **Target di volume** — il piano ne dà due letture diverse: la colonna *target*
  (pag. 24) e un range più stretto per i punti deboli (pag. 20). Sono riportate
  entrambe. Per petto, dorso, polpacci e core il piano **non fissa alcun
  target**: l'app mostra il conteggio in grigio e nessuna soglia.
- **Stretching dopo l'Upper** — la tabella assegna all'Upper il solo
  quadricipite, pur essendo una seduta di petto, schiena, spalle e braccia. Gli
  allungamenti di Push e Pull compaiono marcati come "dedotto", con la nota che
  non sono scritti nel documento.
- **Riposo intensificazione e peak** — il piano alimentare dà i macro del giorno
  di riposo ma rimanda al menù Pull/Upper con le correzioni scritte nei TIP
  ("riduci il riso a 130 g", "togli il riso serale"). L'app usa quel menù e
  mostra i TIP.

## Copertura dei documenti

Controllo automatico sulle 34 sezioni dei due PDF: tutte rappresentate. Gli 84
esercizi trascritti, i loro range di ripetizioni e i 18 target di macro tracciano
al testo dei sorgenti. Le pagine 6, 13, 18, 25, 32 del workout e 4, 8, 11, 15,
18, 22 dell'alimentare sono divisori senza contenuto né grafica.

## Verificato

- Nessun errore in console su tutte e cinque le viste, in chiaro e in scuro.
- 390 px senza scroll orizzontale del body.
- Conteggi coerenti con i dati: sabato 15/8/2026 → fase 6, Upper, 8 esercizi,
  22 serie, 66 campi di input.
- Totali della dieta ricalcolati eseguendo il codice e confrontati con una somma
  indipendente dei pasti: coincidono.
- PDF A4 di stampa: 4 pagine, scheda compilabile a penna, senza navigazione.

## Storico

- **v2** — audit contro i sorgenti. Corretti due errori: i target di volume di
  petto, dorso, polpacci e core erano **inventati** (il piano non li fissa) e
  mancava il giorno di riposo del cut settimane 1-3 (2.050 kcal). Aggiunto il
  livello protocolli, che era assente: legenda delle tecniche, mobilità
  pre-sessione, stretching post, progressione del sissy squat, peak week
  carbo-loading, KPI, checklist della domenica interattiva, protocolli
  anti-plateau, deload attivo e passivo, progressione attesa, principi
  nutrizionali, ricette, recupero e imprevisti.
- **v1** — prima versione. Sei fasi complete, cinque viste, backup con fusione.
