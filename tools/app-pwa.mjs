/**
 * Le app installabili del repo, una voce per app.
 *
 * Ogni sorgente resta l'unica fonte di verità: la PWA si rigenera da lì con
 * tools/build-pwa.mjs e non si modifica mai a mano. Le cartelle di uscita sono
 * separate perché le due app convivono sullo stesso sito: `pwa/` sta alla
 * radice di GitHub Pages (è dove Davide ha già installato Ghisa & Grammi, e
 * quel percorso non si tocca) e le altre stanno in sottocartelle.
 */

/* Frammenti di codice emessi tali e quali nei file generati: restano scritti
   come li leggeresti a mano, perché li si legge davvero quando qualcosa non va. */
const guscioComune = `['./', './index.html', './manifest.webmanifest',
  './icone/icona-192.png', './icone/icona-512.png',
  './icone/icona-maskable-512.png', './icone/apple-touch-icon.png']`;

export const APP = {
  'ghisa-e-grammi': {
    src: 'fitness/ghisa-e-grammi/app.html',
    out: 'pwa',
    percorso: './',
    nome: 'Ghisa & Grammi',
    nomeBreve: 'Ghisa & Grammi',
    titoloRipiego: 'Ghisa &amp; Grammi',
    descrizione: 'Allenamento e alimentazione, giorno per giorno: carichi, '
      + 'progressioni, protocolli e pasti in grammi risolti sul target della fase.',
    temaChiaro: '#EAEDEC',
    temaScuro: '#0B0F12',
    sfondo: '#0B0F12',
    tema: '#0B0F12',
    orientamento: 'portrait',
    categorie: ['health', 'fitness', 'lifestyle'],
    cache: 'ghisa-e-grammi',
    chiaveInstalla: 'gg.installa.visto',
    guscio: guscioComune,
    installa: `'Tocca Condividi in fondo a Safari, poi "Aggiungi a Home". Si apre a schermo intero, '
        + 'funziona senza campo e i dati non vengono più cancellati dopo una settimana.</div>'`,
    stile: `.agg{position:fixed;left:50%;transform:translateX(-50%);z-index:90;
  bottom:calc(var(--tab-h) + 22px + env(safe-area-inset-bottom));
  display:flex;align-items:center;gap:12px;padding:9px 12px 9px 17px;border-radius:999px;
  background:var(--solid);color:var(--on-solid);box-shadow:var(--shadow-2);font-size:14px}
.agg .btn{border-color:color-mix(in srgb,var(--on-solid) 35%,transparent);color:var(--on-solid)}
@media (min-width:900px){.agg{bottom:26px}}
.installa{margin:0 0 16px;display:flex;gap:11px;align-items:flex-start;padding:13px 15px;
  border-radius:var(--r);background:var(--accent-soft);color:var(--accent-text);font-size:13.5px;line-height:1.45}
.installa b{display:block;font-family:var(--display);font-size:12px;letter-spacing:.1em;text-transform:uppercase}
.installa button{margin-left:auto;color:inherit;opacity:.7;font-size:20px;line-height:1;padding:0 4px}`,
  },

  giordania: {
    src: 'viaggi/2026-11-giordania/roadbook.html',
    out: 'pwa-giordania',
    percorso: './giordania/',
    nome: 'La Grande Frattura — Giordania 2026',
    nomeBreve: 'Giordania',
    titoloRipiego: 'La Grande Frattura',
    descrizione: 'Road book della Giordania, 12–21 novembre 2026: dieci giornate costruite '
      + 'attorno alla luce, con mappa, profilo altimetrico, almanacco solare e budget.',
    temaChiaro: '#E9E2D6',
    temaScuro: '#100D0B',
    sfondo: '#231310',
    tema: '#100D0B',
    categorie: ['travel', 'navigation', 'lifestyle'],
    cache: 'giordania',
    chiaveInstalla: 'giordania.installa.visto',
    guscio: guscioComune,
    installa: `'Tocca Condividi in fondo a Safari, poi "Aggiungi a Home". Si apre a schermo intero '
        + 'e funziona senza campo: a Dana, nel Wadi Dana e dentro il Wadi Rum il segnale sparisce, '
        + 'ed è proprio lì che il road book serve.</div>'`,
    stile: `.agg{position:fixed;left:50%;transform:translateX(-50%);z-index:90;
  bottom:calc(22px + env(safe-area-inset-bottom));
  display:flex;align-items:center;gap:12px;padding:9px 12px 9px 17px;border-radius:999px;
  background:var(--ink);color:var(--surface);box-shadow:var(--shadow);font-size:14px;font-family:var(--ui)}
.agg button{font-family:var(--display);font-size:12px;letter-spacing:.1em;text-transform:uppercase;
  background:none;border:1px solid color-mix(in srgb,var(--surface) 42%,transparent);
  color:var(--surface);border-radius:7px;padding:5px 11px;cursor:pointer}
.agg button:hover{border-color:var(--surface)}
@media (min-width:900px){.agg{bottom:26px}}
.installa{margin:18px 0 4px;display:flex;gap:11px;align-items:flex-start;padding:13px 15px;
  border:1px solid color-mix(in srgb,var(--accent) 28%,transparent);
  border-radius:var(--r);background:var(--accent-soft);color:var(--accent-2);font-size:13.5px;line-height:1.45}
.installa b{display:block;font-family:var(--display);font-size:12px;letter-spacing:.1em;text-transform:uppercase}
.installa button{margin-left:auto;background:none;border:none;color:inherit;opacity:.7;
  font-size:20px;line-height:1;padding:0 4px;cursor:pointer}`,
  },
};
