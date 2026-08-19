# Ghisa & Grammi

App di allenamento e alimentazione per uso quotidiano, costruita sui due piani
di Davide: **Piano Master FINAL — Coach Level** (38 pagine, workout) e **Piano
Alimentare Master** (29 pagine). Copre l'intero ciclo **agosto 2025 → settembre
2026**, sei fasi.

**App installabile:** <https://davide88770.github.io/Davide/>
**Artifact:** <https://claude.ai/code/artifact/2c08979c-1b31-4f71-89c9-15375daa20d8>
**Sorgente:** [`app.html`](app.html)
**Verifica:** `npm run verify …/app.html` · `npm run prova …/app.html` · `npm run prova:pwa`

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

La sessione e il tipo di giornata alimentare si ricavano dalla data. Dalla fase 3
in poi ci sono **due schede e basta** — 5 sedute e 4 sedute — con un interruttore
in Piano; nel cut e nella transizione (fasi 1-2) vale lo split a tre giorni. La
fase si può forzare a mano dalla sezione Piano.

## La volta prima, serie per serie

Aprendo un esercizio, ogni riga mostra **come segnaposto grigio** il carico, le
ripetizioni e il RIR di quella stessa serie la volta precedente. Si vedono senza
aprire niente e non vengono registrati per sbaglio: se non scrivi nulla, nulla
viene salvato. Il tasto **Ripeti** ricopia tutta la seduta precedente in un
tocco, e poi correggi dove serve. A blocco chiuso, accanto al contatore delle
serie, compare il carico più alto dell'ultima volta.

Prima c'era solo una riga riassuntiva con tutte le serie concatenate, dentro il
blocco chiuso: i dati c'erano ma non si trovavano.

## Come vengono registrati i carichi

Carico e ripetizioni si salvano **mentre li scrivi**. La spunta verde fa partire
il cronometro di recupero e segna l'avanzamento della seduta, ma non è
necessaria per conservare i dati.

Non è sempre stato così: fino alla v11 lo storico, i suggerimenti, i record, il
volume e i grafici contavano **solo** le serie confermate col tasto. Chi
compilava i campi senza toccare la spunta non si ritrovava niente da una
settimana all'altra, anche se i numeri erano regolarmente salvati nel giorno.
Una serie ora conta se è confermata **oppure** se ha carico e ripetizioni.

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

## Le due schede

Dalla v17 l'app contiene **due programmazioni e nessun'altra**: la **5 sedute** e
la **4 sedute**. Il piano di partenza e la variante Push/Pull/Legs + full body
sono stati tolti — la richiesta era avere solo le migliori, e tenere quattro
opzioni significava tenerne due che non avrei consigliato.

| | 5 sedute | 4 sedute |
|---|---|---|
| Giorni | Lun Push · Mar Pull · Mer Legs · Ven Upper · Sab Lower | Lun Upper A · Mar Lower A · Gio Upper B · Sab Lower B |
| Liberi | Giovedì, domenica | Mercoledì, venerdì, domenica |
| Serie dirette | 86 | 70 |
| Durate | 59, 55, 47, 47, 47 min | 49, 42, 58, 52 min |

Serie **frazionali** a settimana (dirette + metà delle indirette), che è come le
conta l'app:

| Gruppo | 5 sedute | 4 sedute | Freq. |
|---|---|---|---|
| Spalle | 16,0 | 12,5 | 3× / 2× |
| Bicipiti | 16,5 | 11,0 | 2× |
| Dorso | 15,0 | 10,0 | 2× |
| Tricipiti | 12,5 | 10,5 | 2× |
| Quadricipiti | 10,5 | 10,5 | 1× |
| Gluteo | 10,5 | 10,5 | 1× |
| Petto | 10,0 | 10,5 | 2× |
| Femorali | 7,5 | 7,5 | 1× |
| Polpacci | 8,0 | 8,0 | 3× / 2× |
| Core | 4,0 | 2,0 | 2× / 1× |

**Le gambe sono identiche nelle due schede.** Quello che si perde passando a
quattro sedute è tutto sulla parte alta, e soprattutto sulle braccia. È una
scelta: il quadricipite e il gluteo hanno una sola fonte indiretta e poco
generosa, le braccia ne hanno una a ogni spinta e a ogni tirata.

### Le due sedute di gambe

Erano quasi la stessa seduta — hack squat, pressa e sissy squat in tutte e due —
e il mercoledì teneva insieme i tre esercizi più pesanti del piano. Un primo giro
le ha separate, ma ci aveva lasciato **due posizioni della pressa di fila** il
sabato: una scorciatoia logistica (la macchina è già impostata), non una scelta
di allenamento. Rifatte per **funzione**:

| | Mercoledì · Legs | Sabato · Lower |
|---|---|---|
| Tema | **Quadricipite**, su tre livelli | **Catena posteriore** |
| Il pesante | Hack squat 3 × 6-10, RIR 1-2 | Stacco romeno 3 × 8-10, RIR 1-2 |
| Secondo | Split squat bulgaro 3 × 8-10 per gamba | Pressa piede alto e largo 3 × 8-12 |
| Isolamento | Sissy squat zavorrato 3 × 10-15, a cedimento | Leg curl nordico 3 × 5-8 · Hip thrust 3 × 10-12 |
| Polpacci | Calf in piedi 5 (gastrocnemio) | Calf seduto 3 (soleo) |
| Core | Dead bug 2 | — |
| **Serie** | **16** | **15** |
| **Durata** | **47 min** | **47 min** |

Il **split squat bulgaro** è la novità e copriva un buco vero: è l'unico
esercizio unilaterale del piano, carica quadricipite e gluteo in allungamento
con metà del peso sulla schiena e senza pressione addominale — quindi è anche il
più sicuro dei tre pesanti per l'ernia.

Alla pressa si usa **una sola posizione dei piedi, una volta sola**. Il
quadricipite la sua giornata ce l'ha già il mercoledì; il gluteo la sua il
sabato.

### Le due sedute di parte alta

L'Upper B della scheda da 4 aveva **dieci esercizi**, e l'Upper A quattro
compound pesanti di fila — panca, trazioni, military, rematore: lo stesso
errore delle gambe, con due distensioni massimali nella stessa seduta e la
seconda fatta già stanchi.

Adesso le due sedute si dividono **per schema motorio**, che è il modo pulito
di ottenere la frequenza 2× senza ripetere niente:

| | Lunedì · Upper A | Giovedì · Upper B |
|---|---|---|
| Schema | Spinta **orizzontale** · tirata **verticale** | Spinta **verticale** · tirata **orizzontale** |
| Pesante di spinta | Panca piana 3 × 5-8 | Military press manubri seduto 3 × 6-8 |
| Tirata | Trazioni zavorate 3 × 5-8 | Rematore manubri a busto appoggiato 3 × 8-12 |
| Petto | Croci manubri inclinata 3, a cedimento | Panca inclinata manubri 3 |
| Dorso | — | Pulley basso 4 |
| Spalle | Alzate laterali ai cavi 3 | Face pull alla lat machine 2 |
| Braccia | Curl inclinata 3 + tricipite overhead 3, in superset | Curl hammer 3 + dip 3, in superset |
| **Esercizi** | **6** (erano 7) | **7** (erano 10) |
| **Serie** | **18** (erano 21) | **21** (erano 26) |
| **Durata** | **49 min** | **57 min** |

Cosa è uscito e perché:

- **Push-down** dall'Upper B: era la terza dose settimanale di tricipite, sullo
  stesso schema del dip e senza allungamento.
- La **quarta serie di schiena** è andata sul pulley basso e non sul rematore:
  costa meno dove il carico è più leggero, e la schiena resta l'unico gruppo
  senza nessuna fonte indiretta.
- Nella scheda da 5 sedute, il **secondo curl a martello** dell'Upper: fra Pull
  e Upper il bicipite riceveva quattro esercizi diversi a settimana, adesso tre,
  tutti portati a cedimento. L'Upper scende da 8 a 7 esercizi e da 24 a 20
  serie.

Le braccia restano in **superset antagonista** — bicipite e tricipite non si
rubano niente e si risparmiano sei minuti — e in tutte e due le sedute partono
dall'esercizio che le carica allungate.

### La passata biomeccanica sulla selezione

Il criterio è uno solo: **dove il carico è massimo rispetto a dove il muscolo è
lungo**. Tre esercizi non lo rispettavano.

| Prima | Adesso | Perché |
|---|---|---|
| Rematore bilanciere — Yates | **Rematore manubri a busto appoggiato** | Col bilanciere a busto flesso il limite lo mette la schiena bassa, non il dorso, e proprio in fondo — dove il dorso è allungato — il carico cala. Col petto sulla panca inclinata la schiena non entra in gioco, il range è pieno e il punto più duro resta dove serve |
| Alzate posteriori manubri | **Face pull alla lat machine** | Col manubrio, in basso, il braccio è appeso: il deltoide posteriore non ha carico proprio dov'è allungato. Col cavo la tensione c'è in tutto il range |
| Military press bilanciere, in piedi | **Military press manubri, seduto** | La spinta sopra la testa in piedi è il gesto che alza di più la pressione addominale, ed è il primo da togliere con un'ernia inguinale. In più i manubri scendono più in basso, dove il deltoide è allungato |

Il resto della selezione regge l'esame: le trazioni sono più dure in basso, dove
il dorso è lungo; l'hack squat e lo stacco romeno caricano al massimo nel punto
di massimo allungamento; il nordico ha il braccio di leva più lungo proprio a
ginocchio esteso; le croci coi manubri e il sissy squat sono più duri in fondo.

**Quello che non c'è qui dentro**: i contenuti specifici della masterclass di
Noha Rabasco. Da questa sessione YouTube non è raggiungibile e non esistono
trascrizioni pubbliche affidabili, quindi la passata è fatta sui principi di
biomeccanica applicata — che è il suo terreno — ma senza attribuirgli posizioni
che non ho potuto verificare.

### Serie dirette e frazionali

Il volume è contato come lo conta la ricerca che lo ha misurato: **serie dirette
più metà delle serie indirette**. Una panca non è una serie di tricipite, ma non
è nemmeno zero. È la convenzione della meta-regressione di Pelland e colleghi
(*Sports Medicine*, 2025), che ha trovato la distinzione fra dirette e indirette
necessaria per prevedere il risultato di un programma.

La mappa dei secondari è una tabella sola, per nome di esercizio: panca →
tricipiti e spalle, dip → petto e spalle, military → tricipiti, trazioni /
lat machine / rematore / pulley → bicipiti, hack squat → gluteo, pressa →
quadricipiti, stacco romeno → gluteo, hip thrust → femorali. Un esercizio
scritto a mano nella sostituzione non ha secondari e conta solo diretto.

### Il controllo sul volume per seduta

La meta-regressione sul volume **per singola seduta** (2025) colloca intorno a
**11 serie frazionali** il punto oltre il quale, nella stessa sessione, le serie
in più sullo stesso muscolo non mostrano un vantaggio rilevabile. L'app lo
controlla a ogni apertura e lo dice in chiaro nella scheda Programmazione.
Entrambe le schede sono sotto soglia su tutti i gruppi.

### Cosa è cambiato nella v17

Il **dorso** era il gruppo peggio servito e l'unico senza nessuna fonte
indiretta; il **bicipite** era il più servito di tutti, nel punto in cui la curva
del volume è piatta. Il volume si è spostato dal secondo al primo:

| | Prima | Dopo | Come |
|---|---|---|---|
| Dorso, 5 sedute | 12,0 | **15,0** | Il terzo curl dell'Upper diventa un rematore con manubrio |
| Dorso, 4 sedute | 8,0 | **12,0** | Pulley basso nell'Upper B, +1 serie di rematore nell'Upper A, −1 di alzate laterali |
| Bicipiti, 5 sedute | 20,0 | 18,5 | Conseguenza dello scambio: resta il secondo gruppo più servito |
| Polpacci | 6,0 | **8,0** | +2 serie in entrambe, nella seduta con più margine |
| Core, 5 sedute | 2,0 (1×) | **4,0 (2×)** | Pallof press nel Push: anti-rotazione, sicuro con l'ernia |

Le sedute restano tutte fra 57 e 63 minuti.

### Le sedute archiviate

Le sedute del piano di partenza e quelle della variante full body non sono più
nel programma, ma restano nel codice in forma ridotta (nome, gruppo, serie,
ripetizioni) come **archivio**: servono soltanto perché una giornata registrata
mesi fa continui a essere leggibile nello storico e nei grafici. Non compaiono in
nessuna programmazione e non si possono scegliere.

Chi aveva salvato una delle programmazioni tolte viene riportato sulla 5 sedute
al primo caricamento.

### La lente biomeccanica sugli esercizi

A parità di volume conta *dove* l'esercizio è più duro rispetto a dove il muscolo
è allungato. Da qui le scelte che si discostano dal piano originale:

- **Alzate laterali ai cavi** invece che coi manubri: col manubrio il deltoide
  non ha carico proprio in basso, dove è allungato.
- **Curl su panca inclinata**, braccio dietro la linea del busto: il capo lungo
  del bicipite parte allungato.
- **Leg curl seduto** invece che prono: con l'anca flessa il capo lungo del
  bicipite femorale lavora allungato.
- **Croci coi manubri su panca inclinata** e **tricipite overhead**: stessa
  logica su petto e capo lungo del tricipite. Sulle croci il manubrio è più duro
  proprio in basso, dove il petto è allungato: quello che si perde è la tensione
  in chiusura, che conta meno.
- **Hip thrust** tenuto accanto alla pressa profonda, non al suo posto: caricano
  il gluteo a lunghezze opposte e sono complementari.

### Sostituire un esercizio

Dentro ogni esercizio c'è **Sostituisci**: scrivi il nome che vuoi, scegli
gruppo, serie e ripetizioni. Vale **solo per quella giornata**, il piano non
cambia, e lo storico del nuovo esercizio parte per conto suo legato al nome
scritto. Un tocco su "Torna a…" ripristina quello del piano.

### Cut e transizione (fasi 1-2)

Le prime due fasi sono passate, ma restano nell'app perché lo storico le
attraversa. Lì vale lo split a tre giorni, riequilibrato con lo stesso criterio:
petto da 2 a 5 serie — due a settimana sono sotto la manutenzione — dorso da 4 a
6, femorali da 5 a 7 e da 1× a 2×. Su un PPL a tre giorni petto, dorso e gambe
restano necessariamente a frequenza 1×: è la natura dello split, non un difetto
correggibile.

Lo storico dei carichi è legato al nome dell'esercizio, quindi cambiando
programmazione tutto quello che è già registrato continua a valere.

## Nutrizione: originale e rivista

Interruttore in **Dieta**. A calorie identiche:

- **Proteine da 200-215 g a 190**, cioè 2,2 g/kg. Sopra i 2,0-2,2 non c'è
  vantaggio dimostrato, nemmeno in deficit. Le calorie liberate vanno sui
  carboidrati: in pratica 60-70 g di pollo in meno per pasto.
- **Via la cena senza carboidrati** nei giorni di riposo. Il razionale del piano
  — carbo sotto i 20 g e grassi alti per il picco di GH e la lipolisi sul grasso
  addominale basso — non è supportato: a pari calorie e macro non cambia la
  perdita di grasso, e la perdita localizzata non si indirizza con la
  composizione dei pasti.

## Orario di allenamento

Selettore in **Piano**: mattina, pomeriggio o sera. Sposta gli orari dei pasti,
marca il pasto pre e post-workout, e porta il carico di carboidrati sul pasto
dopo l'allenamento. Il piano lo prescriveva a pag. 2 ma non lo applicava. I
macro totali non cambiano: allenandosi la sera, i carboidrati della colazione
passano da 112 a 20 g e quelli della cena da 25 a 116.

## Fasi 7 e 8: dopo settembre 2026

Il piano finiva a settembre senza rispondere a "e poi?". Aggiunte due fasi:

- **Ripristino** (ottobre, 4 settimane) — calorie riportate a mantenimento con
  +100-150 kcal a settimana, carichi e volume invariati, RIR 1-2. Il peso sale
  di 1-2 kg: è acqua e glicogeno dopo mesi di deficit.
- **Costruzione lean** (novembre → febbraio) — surplus contenuto, +0,25/0,35 kg
  a settimana. Con 10-11% di grasso è la condizione migliore per costruire.

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
l'unica fonte di verità — aggiungendo manifest, service worker e icone. Un
workflow GitHub Actions ricostruisce e pubblica su `gh-pages` a ogni push:
<https://davide88770.github.io/Davide/>

### L'aggiornamento, e perché non arrivava

Fino alla v18 l'app installata poteva restare indietro per giorni. Tre cause,
tutte reali, tutte corrette nella v19:

1. **Su iPhone una PWA riaperta dalla schermata Home spesso non rifà la
   navigazione**: riprende la pagina che era in memoria. Senza navigazione il
   browser non controlla `sw.js`, e non si accorge di niente. Ora la
   registrazione usa `updateViaCache:'none'` e c'è un `reg.update()` al
   caricamento, a ogni ritorno in primo piano (`visibilitychange`) e quando la
   rete torna, con un limite di una volta al minuto.
2. **L'avviso si perdeva.** Il codice ascoltava solo `updatefound`: se
   l'aggiornamento si era installato mentre la pagina non stava ascoltando,
   quell'evento era già passato e l'avviso non compariva più. Ora all'avvio si
   controlla anche `reg.waiting`.
3. **Il bug vero.** La richiesta di rete del service worker era un `fetch(req)`
   normale, quindi finiva nella **cache HTTP di Safari**: GitHub Pages serve
   l'HTML con un `max-age` breve ma non nullo, e la pagina "nuova" che tornava
   era ancora quella vecchia. Si vedeva l'avviso, si toccava Ricarica, e non
   cambiava niente. Ora ogni fetch del service worker — sia in installazione che
   in navigazione — usa `cache:'no-store'`.

Il punto 3 è stato trovato da `npm run prova:pwa`, che serve `pwa/` su un server
locale con lo stesso `cache-control` di GitHub Pages e verifica il giro completo:
il service worker prende il controllo, senza versioni nuove l'avviso non compare,
pubblicata una versione nuova l'app se ne accorge **senza navigazione**, e il
pulsante Ricarica porta davvero alla versione nuova. Senza il `no-store` il test
falliva 3 volte su 3 all'ultimo passaggio; con il `no-store` passa sempre.

### Sapere su che versione sei

In **Piano → Dati e backup**, in fondo, c'è il numero di versione con la data e,
quando l'app è quella installata, anche l'hash della build. Se non è quello
dell'ultimo messaggio, l'app è rimasta indietro: chiuderla del tutto dal
multitasking e riaprirla online basta quasi sempre, perché al rientro controlla
da sola. In ultima istanza si esporta il backup, si toglie l'icona dalla Home, si
riaggiunge e si reimporta — e il backup prima non è un consiglio, perché togliere
l'icona cancella i dati salvati.

### Perché una PWA e non un sito

- Esce dal limite dei **7 giorni** di Safari: i dati di un sito normale vengono
  cancellati dopo una settimana di inattività, quelli di un'app aggiunta alla
  Home no.
- Funziona **senza campo** in palestra: il guscio è in cache.
- Si apre a schermo intero, senza barre, con l'icona sulla schermata Home.
- Gestione del `safe-area` per il notch e la barra inferiore.

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

Dalla v17 le **sedute** del piano di partenza non sono più selezionabili
nell'app: restano in archivio per leggere lo storico, e la trascrizione integrale
resta nella cronologia del repo. Tutto il resto dei due documenti — protocolli,
nutrizione, KPI, fasi, deload, ernia, integratori — è rimasto dov'era.

## Il consenso science-based

La scheda **Piano → Il consenso science-based** dice da dove vengono le regole
con cui è costruito il programma: prima i sette punti su cui la ricerca e i
preparatori sono d'accordo, poi i tre su cui non lo sono, con la posizione presa
qui e il perché.

Le cinque fonti dei numeri:

| Autori | Cosa | Dove |
|---|---|---|
| Pelland, Remmert, Robinson, Hinson, Zourdos | Dose-risposta di volume e frequenza, 67 studi | *Sports Medicine*, 2025 |
| Robinson, Pelland, Remmert e colleghi | Dose-risposta della vicinanza al cedimento | *Sports Medicine*, 2024 |
| Gruppo Data Driven Strength | Volume per singola seduta | Meta-regressione, 2025 |
| Wolf, Androulakis Korakakis, Schoenfeld e colleghi | Parziali in allungamento contro range completo | Meta-analisi 2023 · studio controllato 2025 |
| Morton, Murphy, McKellar e colleghi | Proteine e massa magra, 49 studi | *BJSM*, 2018 |

I tre punti di disaccordo, con la scelta fatta:

1. **Quanto volume.** Israetel e Renaissance Periodization spingono verso il
   massimo recuperabile; Beardsley sostiene che gran parte del volume alto è
   fatica senza stimolo; Helms e Nippard stanno in mezzo. → Si sta in mezzo, e
   non per prudenza: con 55-65 minuti a seduta il volume non ha dove crescere, e
   la curva è già piatta lì dove siamo.
2. **Fino a che punto tirare la serie.** → Dipende dall'esercizio, non dalla
   settimana: a cedimento dove costa poco (cavi, macchine, isolamento), 1-2
   ripetizioni di margine sui compound pesanti, dove la meta-regressione sulla
   forza dice che non si guadagna niente e il costo articolare, a 38 anni e con
   l'ernia, è reale.
3. **I parziali in allungamento.** Wolf e Rabasco li usano sistematicamente,
   Helms e Nippard li considerano un extra modesto. → Messi come coda
   dell'ultima serie su due esercizi soli, mai al posto del range completo.

Una correzione a quanto scritto nelle versioni precedenti: **la frequenza, da
sola, non fa niente**. A parità di volume settimanale la frequenza doppia non
batte quella singola in modo rilevabile. Il motivo per spezzare resta, ma è il
volume per seduta.

## Verificato

Tre script, tutti obbligatori prima di pubblicare:

```sh
npm run verify fitness/ghisa-e-grammi/app.html   # profilo vuoto
npm run prova  fitness/ghisa-e-grammi/app.html   # con i dati dentro
npm run prova:pwa                                # giro di aggiornamento dell'app installata
```

- Nessun errore in console su tutte e cinque le viste, in chiaro e in scuro.
- 390 px senza scroll orizzontale del body.
- Conteggi coerenti con i dati: sabato 15/8/2026 → fase 6, Upper, 8 esercizi,
  22 serie, 66 campi di input.
- Totali della dieta ricalcolati eseguendo il codice e confrontati con una somma
  indipendente dei pasti: coincidono.
- PDF A4 di stampa: 4 pagine, scheda compilabile a penna, senza navigazione.
- **Con i dati dentro** (`npm run prova`): 20 sedute seminate su quattro
  settimane, 396 serie, peso corporeo, pasti spuntati, un esercizio sostituito e
  un giorno di dieta incompleto come da backup vecchio. Tutte e cinque le
  schede, i quattro interruttori di programmazione e i tre tipi di settimana,
  senza un solo errore JS. È la prova che mancava: `verify` gira su un profilo
  vuoto, e con il profilo vuoto metà dell'app non viene mai eseguita — è così
  che due bug sono passati per due versioni.

## Storico

- **v23** — passata **biomeccanica** sulla selezione, col criterio "dove il
  carico è massimo rispetto a dove il muscolo è lungo". Rematore col bilanciere
  → rematore coi manubri a busto appoggiato; alzate posteriori → face pull alla
  carrucola alta; military press col bilanciere in piedi → manubri da seduto,
  che è anche il gesto peggiore per l'ernia inguinale. Volumi e frequenze
  invariati.
- **v22** — **una regola sola su tutte e nove le sedute**: un solo esercizio
  davvero pesante per giornata, e **nessun esercizio in due sedute**. Le gambe si
  dividono per funzione — mercoledì quadricipite su tre livelli (hack squat,
  split squat bulgaro, sissy), sabato catena posteriore (stacco, pressa, nordico,
  hip thrust) — e alla pressa si usa una sola posizione dei piedi, una volta
  sola. Aggiunto lo **split squat bulgaro**, l'unico unilaterale del piano e il
  più sicuro dei pesanti per l'ernia. Nel 5 sedute tolte le ultime tre
  ripetizioni: alzate laterali coi manubri il venerdì (curva di carico diversa
  da quelle ai cavi del lunedì), niente secondo dip, polpaccio tutto nelle sedute
  di gamba. Sedute da 5 a 7 esercizi, fra 42 e 59 minuti.
- **v21** — **le due sedute di parte alta rifatte** con lo stesso metro delle
  gambe. L'Upper B aveva dieci esercizi e l'Upper A quattro compound pesanti di
  fila. Ora si dividono per schema motorio: spinta orizzontale e tirata
  verticale il lunedì, spinta verticale e tirata orizzontale il giovedì, un
  pesante di spinta e uno di tirata per giornata. Sei e sette esercizi invece di
  sette e dieci. Anche l'Upper della scheda da 5 scende da 8 a 7 esercizi: fra
  Pull e Upper il bicipite riceveva quattro esercizi diversi a settimana.
  Totali: 88 serie dirette con 5 sedute, 70 con 4, tutte le sedute fra 40 e 63
  minuti.
- **v20** — **le due sedute di gambe rifatte** e l'aggiornamento dell'app reso
  automatico. Legs e Lower erano quasi la stessa seduta (hack squat, pressa e
  sissy in tutte e due) e il mercoledì teneva i tre esercizi più pesanti del
  piano insieme. Ora una giornata, un pesante: hack squat il mercoledì, stacco
  romeno il sabato; nessun esercizio ripetuto; la seconda dose di quadricipite
  arriva dalla pressa a piede basso, stessa macchina. Volume gambe da 39 a 29
  serie, sedute da 63 e 58 minuti a 40 e 47. Il rosso sul volume scatta sotto 6
  serie frazionali e non sotto 10, perché la banda 10-20 vale per serie fermate
  lontano dal cedimento. Lato app: il service worker si attiva da solo e
  ricarica la pagina rimasta indietro, quindi le versioni nuove entrano **senza
  toccare niente**.
- **v19** — **riparato l'aggiornamento dell'app installata**, che era il motivo
  per cui le versioni nuove non arrivavano sul telefono. Il bug vero: la
  richiesta di rete del service worker finiva nella cache HTTP di Safari e
  restituiva la pagina vecchia, quindi anche toccando «Ricarica» non cambiava
  niente. Ora `cache:'no-store'` su ogni fetch, `updateViaCache:'none'`,
  controllo attivo al ritorno in primo piano e alla riconnessione, e lettura di
  `reg.waiting` all'avvio. Aggiunto `npm run prova:pwa`, che ha trovato il bug e
  lo blocca in futuro, e il numero di versione visibile in Dati e backup.
- **v18** — le schede passano sull'**attrezzatura vera della home gym**, che non
  avevo mai chiesto. Quattro esercizi non erano eseguibili: leg extension →
  sissy squat zavorrato, leg curl a macchina → leg curl nordico, croci ai cavi →
  croci coi manubri su panca inclinata, pallof press → dal pulley basso in
  ginocchio. Tre rinominati per non dipendere da un attrezzo incerto. Volumi e
  frequenze invariati su tutti i gruppi. Aggiunto il costo in tempo del lavoro a
  un arto per volta (75 s invece di 45) con recupero a 60 s, e la scheda «La tua
  attrezzatura» nel Piano, perché il vincolo resti scritto.
- **v17** — due schede e basta: **5 sedute** e **4 sedute**, le migliori
  possibili sotto i vincoli. Tolti il piano di partenza e la variante
  Push/Pull/Legs + full body (restano in archivio per lo storico). Volume
  spostato dal bicipite, che era nel punto piatto della curva, al dorso, che era
  l'unico gruppo senza fonti indirette: 5 sedute 12→15 frazionali, 4 sedute
  8→12. Polpacci da 6 a 8 in entrambe, core da 1× a 2× nella 5 sedute col pallof
  press. Sedute fra 57 e 63 minuti. Confronto e raccomandazione ricostruiti sulle
  due schede.
- **v16** — passata sul consenso science-based. Volume contato in **serie
  frazionali** (dirette + metà delle indirette) ovunque, controllo automatico
  sulle 11 serie frazionali per seduta, due esercizi spostati a volume invariato
  per rientrare (bicipiti nel Pull da 13,5 a 10,5, spalle nel Push da 11,5 a
  8,5), tabella dell'intensità per settimana riscritta per la programmazione
  rivista, partial in allungamento su due esercizi, scheda «Il consenso
  science-based» con le fonti e i tre punti su cui i preparatori non sono
  d'accordo. Corretto quello che avevo scritto sulla frequenza. Corretti due
  bug trovati dalla nuova prova con i dati dentro: la scheda Progressi si
  rompeva appena c'era un carico registrato, e un giorno di dieta importato da
  un backup vecchio rompeva la scheda Dieta.
- **v15** — seconda struttura a 4 giorni: **Push, Pull, Legs, full body**, in
  alternativa a Upper/Lower. Stessa frequenza 2× e stesso budget (82 serie
  contro 83), volume spostato dalla parte bassa alla parte alta: dorso 8→12,
  bicipiti 8→12, gluteo 9→5. Nuova scheda di confronto fra le due, calcolata a
  ogni apertura dai dati delle sedute. Durate delle sedute ricalcolate col
  modello dichiarato e riallineate: sette erano fuori, la più lontana di 11
  minuti.
- **v14** — versione a 4 giorni: Upper A, Lower A, Upper B, Lower B, l'unica
  struttura che tiene ogni gruppo a 2× con quattro sedute. 83 serie contro 98,
  con le gambe intatte e il taglio concentrato sulle braccia.
- **v13** — split rifatto su richiesta: Push, Pull, Legs, riposo, Upper, Lower.
  Ogni gruppo a frequenza 2× senza sedute opzionali, 98 serie a settimana.
  Scelta degli esercizi rivista con la lente biomeccanica (alzate laterali ai
  cavi, curl hammer ai cavi, curl ai cavi). Aggiunta la sostituzione
  dell'esercizio nella singola giornata, scritta a mano.
- **v12** — la volta prima diventa visibile serie per serie: segnaposto nei
  campi con carico, ripetizioni e RIR della sessione precedente, tasto Ripeti per
  ricopiarla, e carico dell'ultima volta nella testata dell'esercizio.
- **v11** — due bug di memoria. Storico, suggerimenti, record, volume e grafici
  contavano solo le serie confermate col tasto: chi scriveva i valori senza
  spuntare non si ritrovava niente da una settimana all'altra. E la fusione
  dello stato salvato era superficiale, quindi ogni impostazione aggiunta dopo
  (programmazione, nutrizione, orario) restava invisibile a chi usava già l'app.
  In più: la seduta di un giorno già compilato non viene più riscritta cambiando
  programmazione, e riducendo il tipo di settimana non si perdono righe con dati.
- **v10** — chiusi i cinque punti aperti. Nutrizione rivista attivabile
  (proteine 2,2 g/kg, cena del riposo con carboidrati), selettore dell'orario di
  allenamento con redistribuzione dei carboidrati, revisione anche del cut,
  e le fasi 7 e 8 per il dopo-settembre. 138 combinazioni di nutrizione, orario
  e giornata verificate: scarto massimo 2,9 g su un macronutriente.
- **v9** — corretti gli incrementi di carico. Due bug: "curl su panca inclinata"
  prendeva +2,5 kg per la parola "panca" e il sissy squat per la parola "squat".
  Ma il difetto era a monte: +1,25 kg non è realizzabile con nessun attrezzo, e
  la regola è tornata a +2,5 su tutto, con l'avviso in percentuale quando il
  salto è grande.
- **v8** — programmazione rivista, attivabile. Riallocato il volume a parità di
  budget e di durata: petto 6→9, dorso 9→12, femorali 9→12 e da 1× a 3× di
  frequenza, tricipiti 14→9. Aggiunti croci ai cavi, pulley basso, leg
  extension e leg curl seduto; curl bilanciere pesante sostituito da curl su
  panca inclinata; compound a RIR 1-2 invece del cedimento.
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
