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
| **Allenamento** | Serie da compilare (kg × rep × RIR), cronometro di recupero, suggerimento di carico, dischi del bilanciere, tecnica ed ernia per esercizio, superset raggruppati, serie extra e Widowmaker, seduta spostabile su qualunque giorno |
| **Dieta** | Pasti in **alimenti e grammi risolti sul target**, spunta, scambio di ogni singolo alimento con grammatura equivalente, varianti del piano, fuori piano |
| **Progressi** | **Media dei 7 giorni** (peso, variazione settimanale contro l'attesa della fase, calorie e macro effettivi, aderenza), 1RM stimato, serie per gruppo contro target, tonnellaggio, peso, record |
| **Piano** | Le sei fasi, settimana tipo, checklist della domenica, KPI, progressione attesa, protocolli anti-plateau, deload, ernia, recupero, imprevisti, integratori, backup |

La **media dei 7 giorni** è la prima cosa che vedi nei Progressi, perché è la
regola con cui il piano decide tutto: confronta la variazione settimanale del
peso con l'attesa della fase e scrive l'azione da fare (più passi, ±100 kcal,
non toccare niente). La **lista della spesa** somma gli alimenti dei sette giorni
successivi con le grammature già risolte. Gli scambi rispettano i **tetti di
frequenza** del piano: tonno e feta massimo 3 volte a settimana, salmone 2-3.

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
- **Grammature** — risolte, non copiate. Vedi la sezione qui sotto.
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

## Scelte fatte pensando alla palestra

- **Cronometro ancorato all'orologio**, non a un contatore che scende: con lo
  schermo spento iOS congela gli intervalli e un timer a decremento tornerebbe
  indietro. Alla riapertura si riallinea da solo.
- **Schermo tenuto acceso** durante il recupero (Screen Wake Lock), rilasciato
  quando chiudi la sessione. Se il browser lo nega, l'app continua uguale.
- **Serie oltre il piano**: drop set, rest-pause allungato e Widowmaker hanno
  bisogno di una riga in più. Il pulsante `+ Serie` la aggiunge, `− Serie` la
  toglie (e si rifiuta di cancellarne una già confermata). Nelle settimane peak
  compare `+ Widowmaker`, che aggiunge una riga marcata **WM** con 20 rep
  precompilate.
- **Superset raggruppati** in un unico blocco con l'avvertenza "zero recupero
  tra i due, 90 s dopo la coppia", invece di due esercizi scollegati.
- **Seduta spostabile**: in un giorno di riposo c'è "Allenati lo stesso", in un
  giorno di allenamento "Cambia seduta". Quando la seduta non è quella prevista
  l'app lo scrive.

## Versione installabile (PWA)

Lo stesso sorgente diventa un'app che si installa sulla schermata Home
dell'iPhone. `tools/build-pwa.mjs` genera `pwa/` dall'Artifact — che resta
l'unica fonte di verità — aggiungendo manifest, service worker e icone.

```sh
npm run build:pwa      # rigenera pwa/ dal sorgente
npm run build:icone    # rigenera i PNG dai due SVG in pwa/icone/
```

Pubblicazione: il workflow `.github/workflows/pwa.yml` ricostruisce e pubblica su
GitHub Pages a ogni push su `main`. Da abilitare una volta sola in
**Settings → Pages → Source: GitHub Actions**.

Cosa cambia rispetto all'Artifact aperto in Safari:

- **I dati non vengono più cancellati.** La regola dei 7 giorni vale per Safari;
  le web app aggiunte alla Home hanno un contatore proprio, che si azzera a ogni
  apertura.
- **Funziona senza campo.** Il service worker tiene in cache tutta la pagina:
  provato staccando la rete e ricaricando, l'app si apre e risolve i pasti.
- **Si apre a schermo intero**, con icona propria e barra di stato integrata.
- **Si aggiorna da sola**: quando c'è una versione nuova compare "Nuova versione
  pronta" con il tasto per ricaricare.
- Al primo avvio su iPhone, se non è ancora installata, spiega come farlo.

Resta fuori dalla portata del web, e servirebbe un'app nativa: il timer di
recupero come Live Activity sulla schermata di blocco, l'integrazione con Salute
e i widget. Anche il feedback aptico alla conferma di una serie è predisposto ma
su iOS non è ancora disponibile al web: funziona su Android.

## Grammature: perché sono ricalcolate

I due documenti non tornano fra loro su tre livelli, e i tre errori si sommano:

1. **Le etichette dei pasti non tornano con la tabella delle fonti dello stesso
   piano.** Ricostruendo ogni pasto dai suoi alimenti con la tabella di pag.
   26-27, gli scarti vanno da −84 a +173 kcal per singolo pasto.
2. **I menù non raggiungono il target di fase.** Sommati con la tabella del
   piano, tutte e 18 le tipologie di giornata restano sotto: da −243 a −577 kcal,
   fino a −59 g di proteine e −142 g di carboidrati, con i grassi invece in
   eccesso fino a +50 g nei giorni di riposo.
3. **Le calorie dichiarate non coincidono con i macro dichiarati**: da −20 a
   +65 kcal a seconda della giornata.

L'app risolve il problema invece di mostrarlo. A ogni apertura ricalcola le
grammature perché il totale della giornata colpisca il target di pag. 3:

- **Base di pesatura: crudo**, come pesa Davide. È indicata accanto a ogni
  quantità nell'app (crudo, secca, cotti, lesse, sgocciolato).
- **Fonte dei valori**: la tabella "Fonti alimentari complete" del piano
  (pag. 26-27), verificata voce per voce e corretta dove sbagliava — vedi sotto.
- **Leve, in ordine**: carboidrati, grassi, proteine magre. Salmone, manzo e
  ricotta si muovono solo quando i grassi sfondano da soli, perché portano
  grassi e proteine insieme. Uova, feta, verdure e caffè restano fermi.
- **Limiti**: nessun alimento esce dall'intervallo 0,45×-2,6× della quantità del
  menù (0,55×-1,20× per le proteine grasse), così le porzioni restano quelle di
  un pasto vero.
- **Arrotondamento**: 5 g, 10 g per i latticini, 1 g per oli e frutta secca,
  unità intere per uova e gallette.
- **Calorie**: ricalcolate dai macro a 4/4/9. Quelle scritte nel piano restano
  affiancate come confronto.
- **Risultato**: scarto massimo **2,6 g** su un macronutriente (23 kcal), su tutte
  e 18 le tipologie di giornata. Quattordici chiudono sotto 1,5 g. Verificato
  eseguendo il risolutore dentro l'app, non a tavolino.
- **Il limite vero**: nella giornata *peak pesante* restano 2,6 g di grassi oltre
  il target anche con salmone, manzo, ricotta, uova, frutta secca e olio già al
  minimo — quel menù porta più grassi di quanti il target ne consenta. L'app lo
  dice e suggerisce lo scambio che chiude il conto (salmone → merluzzo).

Cambiando un alimento (pollo → salmone, riso → patate) l'app propone la
grammatura equivalente sul macro dominante e **poi ribilancia l'intera
giornata**, quindi il totale resta sul target anche dopo lo scambio.

### Convenzioni dichiarate

Dove il menù era ambiguo: "1 frutto" = mela 150 g · "1 frutto piccolo" = frutti
di bosco 80 g · "1 albume" = 33 ml. La tabella dei carboidrati del piano non
dichiara i grassi e la sua aritmetica torna con grassi = 0 per quelle voci: si
mantiene quella convenzione. Le verdure non sono tabellate: si assumono 1,5 g di
carboidrati per 100 g.

### Verifica della tabella del piano

Le 31 voci sono state confrontate coi valori reali misurando lo scarto **sulla
porzione tipica**, non in percentuale — altrimenti differenze irrilevanti su
alimenti leggeri sembrano gravi. Soglia: 2 g su un macronutriente.

**Sedici voci corrette, tenute come le scrive il piano**: manzo 5%, uova, yogurt
greco, fiocchi di latte, feta, whey, tonno, merluzzo, bresaola, patate, legumi,
banana, mela, frutti di bosco, miele, olio EVO, avocado.

**Quindici corrette perché sbagliate**:

| Voce | Problema | Correzione |
|---|---|---|
| Riso basmati, bianco, integrale | dati su peso cotto, con tre convenzioni diverse fra loro; Davide pesa a crudo | 78, 80 e 74 g di carbo per 100 g da crudo, e grammature del menù convertite |
| Avena, quinoa, pasta integrale | grassi non dichiarati; la pasta aveva le proteine basse di un terzo | +7, +6 e +2,5 g di grassi per 100 g; pasta a 13 g di proteine |
| Noci, mandorle, burro d'arachidi | contati come soli grassi | +15, +21 e +25 g di proteine per 100 g |
| Ricotta | grassi dimezzati | da 4 a 8 g per 100 g |
| Salmone | grassi sottostimati | da 10 a 12 g per 100 g |
| Pollo, tacchino, sgombro, pane di segale | scarti fra 2 e 4 g sulla porzione | allineati |

I tre risi erano il problema più grave: sul basmati la tabella dava 41,5 g di
carboidrati per 100 g, che non è né il valore da crudo (78) né quello da cotto
(28). Pesando a crudo con quel numero si sarebbero mangiati circa **45 g di
carboidrati in meno al giorno**.

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

- **v7** — versione installabile. Manifest, service worker con funzionamento
  offline verificato, icone disegnate, avviso d'installazione su iPhone,
  aggiornamento in-app e pubblicazione automatica su GitHub Pages. Rifiniture
  native: titolo che si raccoglie nella barra scorrendo, risposta al tocco su
  schede, spunte e righe alimento.
- **v6** — media dei 7 giorni con l'azione della fase, aderenza ai pasti, tetti
  di frequenza settimanale sugli scambi, lista della spesa dalle grammature
  risolte.
- **v5** — tabella verificata e riportata su peso crudo. Confrontate le 31 voci
  coi valori reali sulla porzione tipica: 16 confermate, 15 corrette, i tre risi
  convertiti da cotto a crudo (erano il problema più grave: −45 g di carboidrati
  al giorno). Limiti per alimento perché le porzioni restino piatti veri, leva
  sulle uova e sulle proteine grasse quando i grassi sfondano. Scarto massimo
  2,6 g su un macro, su 18 giornate.
- **v4** — grammature risolte. I pasti diventano alimenti con quantità
  ricalcolate perché ogni giornata colpisca il target di fase (scarto massimo
  1,4 g su un macro, su 18 tipologie di giornata), scambio di ogni alimento con
  grammatura equivalente e ribilanciamento automatico, calorie riconciliate dai
  macro, contraddizione sui risi segnalata.
- **v3** — passata sul comportamento reale in palestra: cronometro ancorato
  all'orologio (a schermo spento sbagliava), schermo tenuto acceso, serie extra
  e Widowmaker registrabili, superset raggruppati (la classe `.ssgroup` era
  codice morto), seduta spostabile su qualunque giorno, girovita fra le misure.
- **v2** — audit contro i sorgenti. Corretti due errori: i target di volume di
  petto, dorso, polpacci e core erano **inventati** (il piano non li fissa) e
  mancava il giorno di riposo del cut settimane 1-3 (2.050 kcal). Aggiunto il
  livello protocolli, che era assente: legenda delle tecniche, mobilità
  pre-sessione, stretching post, progressione del sissy squat, peak week
  carbo-loading, KPI, checklist della domenica interattiva, protocolli
  anti-plateau, deload attivo e passivo, progressione attesa, principi
  nutrizionali, ricette, recupero e imprevisti.
- **v1** — prima versione. Sei fasi complete, cinque viste, backup con fusione.
