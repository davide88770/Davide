# Soldi di Davide — app installabile

L'app del budget che prima viveva come Artifact su claude.ai, trasformata in
una **web app installabile** (PWA): si apre dall'icona sulla schermata Home a
schermo intero, salva i dati su **Supabase** con accesso via email, e li tiene
sincronizzati tra telefono e computer.

Grafica, funzioni e calcoli sono quelli di prima: è cambiato solo lo strato di
salvataggio, il download dei file, e si è aggiunta la parte PWA.

- **Online:** <https://davide88770.github.io/Davide/soldi/>
- **Sorgente:** `app.html` (qui), costruita in `pwa/soldi/` da `tools/build-soldi.mjs`
- **Schema del database:** `supabase/schema.sql`
- **Configurazione:** `config.js` (URL e chiave *anon* di Supabase)

Finché `config.js` è vuoto l'app funziona lo stesso, ma salva **solo sul
dispositivo** (in alto c'è scritto «Salvato solo su questo dispositivo»).

---

## Cosa devi fare tu (una volta sola, ~15 minuti)

### 1. Crea il progetto Supabase

1. Vai su <https://supabase.com>, accedi (va bene con GitHub) e crea un
   progetto: *New project*, nome `soldi`, regione **Central EU (Frankfurt)**,
   una password del database qualsiasi (salvala, ma all'app non serve).
2. Aspetta un paio di minuti che il progetto sia pronto.

### 2. Incolla lo schema

*SQL Editor* → *New query* → incolla tutto `supabase/schema.sql` → *Run*.
Deve rispondere «Success. No rows returned». Si può rieseguire senza danni.

Crea le tabelle `settings` e `transactions`, attiva la **Row Level Security**
(ogni utente legge e scrive solo le sue righe) e il **tempo reale** su
entrambe.

### 3. Imposta l'accesso via email

*Authentication* → *URL Configuration*:

- **Site URL:** `https://davide88770.github.io/Davide/soldi/`
- **Redirect URLs:** aggiungi lo stesso indirizzo (e quello di Vercel, se lo
  usi).

*Authentication* → *Emails* → *Templates* → **Magic Link**: aggiungi il
codice nel testo della mail, per esempio sotto il link:

```html
<p>Oppure scrivi questo codice nell'app: <b>{{ .Token }}</b></p>
```

**Perché serve il codice.** Su iPhone l'app aperta dalla Home e Safari sono,
per iOS, due app diverse con dati separati. Se tocchi il link nella mail si
apre Safari e l'accesso resta in Safari, non nell'app. Con il codice invece
fai l'accesso direttamente dentro l'app installata. Il link resta comodo dal
computer.

### 4. Dammi URL e chiave anon

*Project Settings* → *API* (o *Data API* / *API Keys*):

- **Project URL** — tipo `https://abcdefgh.supabase.co`
- **anon public** key (o *publishable key*, `sb_publishable_…`)

Incollali in `finanze/soldi/config.js`, oppure **mandameli e li metto io**:
al push l'app online si aggiorna da sola.

> **Mai la chiave `service_role`** (o *secret*, `sb_secret_…`): scavalca la
> Row Level Security. Il build si rifiuta di pubblicare se la trova. La chiave
> anon invece è fatta per stare in una pagina pubblica: senza login non legge
> niente.

### 5. Primo accesso e porta i dati dalla versione vecchia

1. **Nella versione vecchia su claude.ai:** ⚙ → *Scarica backup*. È un file
   `backup-soldi-davide-AAAA-MM-GG.json`.
2. Apri <https://davide88770.github.io/Davide/soldi/> in Safari, accedi con la
   tua email (codice dalla mail).
3. ⚙ → *Ripristina backup* → scegli il file. Movimenti, impostazioni,
   ricorrenti, categorie, quote e valori del patrimonio tornano tutti.

### 6. Chiudi le iscrizioni

Dopo il tuo primo accesso: *Authentication* → *Sign In / Providers* → togli
**Allow new users to sign up**. Così nessun altro può crearsi un account sul
tuo progetto (i tuoi dati sarebbero comunque protetti dalla RLS, ma non ha
senso lasciarlo aperto).

### 7. Installa sull'iPhone

Safari → apri il link → **Condividi** → **Aggiungi alla schermata Home** →
*Aggiungi*. Compare l'icona blu con l'€ e il nome «Soldi»; si apre a schermo
intero, senza la barra di Safari. Dentro l'app installata fai di nuovo
l'accesso **con il codice** (vedi sopra il perché): poi resta collegata.

---

## Come funziona il salvataggio

Tre livelli, dal più vicino al più lontano:

1. **memoria** — quello che vedi;
2. **cache sul dispositivo** (`localStorage`: `dv_s`, `dv_t`) — all'avvio
   l'app mostra subito questi dati, anche senza campo;
3. **Supabase** — con una **coda** (`dv_q`) delle modifiche non ancora
   arrivate.

Ogni modifica va subito in memoria e in cache, poi in coda; la coda parte
appena c'è rete. Offline puoi aggiungere, modificare ed eliminare: in alto
vedi «Offline · N modifiche da inviare», e al ritorno della rete partono da
sole. Dieci modifiche allo stesso movimento fatte offline diventano una
scrittura sola.

Gli altri dispositivi ricevono le modifiche **in tempo reale**. Quando l'app
torna in primo piano dopo più di 30 secondi rilegge comunque tutto (iOS chiude
la connessione in tempo reale quando l'app va in background).

Il pallino accanto allo stato: verde sincronizzato e in ascolto, giallo
modifiche in attesa o tempo reale in pausa, rosso errore (con il motivo).

**Esci** (⚙ → Account) toglie dati e sessione da quel dispositivo; sul server
resta tutto. Se ci sono modifiche non ancora inviate, prima te lo dice.

## Scelte e differenze dal testo di partenza

- **GitHub Pages invece di Vercel.** Il repo pubblica già Ghisa & Grammi e i
  road book su GitHub Pages: Soldi sta in `/soldi/` sullo stesso sito, si
  aggiorna a ogni push e non serve un altro account. Se preferisci Vercel:
  *New Project* → importa il repo → *Root Directory* `pwa/soldi`, *Framework*
  «Other», nessun comando di build. `pwa/soldi/vercel.json` imposta già le
  intestazioni giuste. Poi aggiungi l'indirizzo Vercel nei *Redirect URLs* di
  Supabase.
- **`start_url` è `./` e non `/`**: su GitHub Pages l'app sta in
  `/Davide/soldi/`, e `/` aprirebbe Ghisa & Grammi. `./` funziona anche su
  Vercel.
- **Niente CDN.** Chart.js 4.4.1 (la stessa versione), supabase-js 2.117.2 e
  il font Manrope sono in `vendor/`: l'app si apre offline anche la prima volta
  dopo l'installazione, e nessuna richiesta parte verso Google o cdnjs.
- **Service worker:** «stale-while-revalidate» per script, font, icone e
  config, come chiesto. Per la **pagina** invece prima la rete (4 secondi di
  pazienza, poi la copia in cache): con lo stale-while-revalidate puro, ogni
  versione nuova arriverebbe solo all'apertura successiva, e su iPhone
  l'esperienza di Ghisa & Grammi dice che quella «successiva» può tardare
  giorni. Le chiamate a Supabase non passano mai dalla cache.
- **Offline si può anche scrivere**, non solo leggere: le modifiche vanno in
  coda.
- **Valori di default senza dati personali.** Il repo e il sito sono pubblici:
  i ricorrenti con gli stipendi e le rate delle quote azienda che erano scritti
  nel codice sono stati tolti dai default. Tornano con il ripristino del
  backup e da lì stanno solo nel tuo account.
- **Login via email + codice**, oltre al link (vedi sopra).
- **Download:** su telefono si apre il foglio di condivisione («Salva su
  File»), sul computer parte un download normale. Contenuto del backup JSON e
  del CSV identico a prima.
- **Aggiornamenti:** quando pubblico una versione nuova l'app si ricarica da
  sola al ritorno in primo piano; se stai scrivendo un movimento non ricarica e
  compare il pulsante «Ricarica».
- **Stampa:** aggiunto un CSS di stampa minimo (senza barra, pulsanti e
  finestre) — prima non c'era.

## Cose da sapere

- Il servizio email integrato di Supabase ha un **limite molto basso di mail
  all'ora**: per accedere su due o tre dispositivi va benissimo, ma se chiedi
  il codice molte volte di fila ti dirà di aspettare. Per alzarlo serve un SMTP
  tuo (*Authentication* → *Emails* → *SMTP*), non necessario per l'uso
  normale.
- Il piano gratuito di Supabase **mette in pausa i progetti inattivi** dopo
  circa una settimana senza richieste. Usandola tutti i giorni non succede; se
  succede, si riattiva dalla dashboard di Supabase, e nel frattempo l'app
  funziona sui dati del telefono.
- Su iPhone l'app installata e Safari hanno dati separati: l'accesso e la cache
  dell'una non valgono per l'altra.
- Lo stesso dominio (`davide88770.github.io/Davide/`) ospita anche Ghisa &
  Grammi; il service worker di Soldi risponde solo dentro `/soldi/`.

## Verifica

```sh
npm install
npm run build:soldi
npm run prova:soldi
```

La prova serve `pwa/soldi/` su un server locale e ci mette davanti un **finto
Supabase** intercettato nel browser (login con codice, tabelle con la stessa
regola della RLS, canale in tempo reale WebSocket), poi fa il giro con due
dispositivi: accesso, ripristino di un backup dell'app vecchia con movimenti
Amex da migrare, aggiunta/modifica/eliminazione viste dall'altro dispositivo
in tempo reale, impostazioni condivise, import CSV Revolut, ricorrenti,
avvisi, «Aggiorna saldo», sei grafici, download di backup e CSV, offline con
coda e riapertura dalla cache, sessione che resta, aggiornamento dell'app
installata, installabilità, tema chiaro e scuro, 390 px, PDF, «Esci», console
pulita. Screenshot e PDF in `out/soldi/`.

Non coperto dalla prova, perché richiede il progetto vero e un iPhone: la
mail reale di Supabase, il foglio di condivisione di iOS, l'aggiunta alla
schermata Home.

## Storico

- **v2** (ottobre 2026) — ritmo mensile al posto di quello giornaliero.
  L'avviso «Non registri movimenti da N giorni» lascia il posto a quello
  sull'import del mese: dal 4 (l'estratto Amex arriva il 3) ricorda di
  importare il mese scorso, diventa giallo dopo il 6 e rosso dopo il 10, e
  dice cosa manca (Revolut, Amex, o entrambi; Amex solo se la carta è stata
  usata negli ultimi tre mesi). Il pulsante «Importa» apre direttamente
  l'import. Il bonus Amex non dà più falsi allarmi a metà mese quando le spese
  non sono ancora importate: a fine mese ricorda di guardare l'app Amex.
- **v1** (2 ottobre 2026) — prima versione installabile: Supabase con login
  via email (link + codice), coda offline, tempo reale, PWA su GitHub Pages,
  librerie e font in locale, default senza dati personali.
