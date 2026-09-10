/* Prova che le versioni installabili si aprano davvero senza rete, che le due
   app non si mangino il guscio a vicenda, e che una versione nuova entri da
   sola senza chiedere niente a chi la usa.
   Si lancia con: npm run prova:pwa   (dopo node tools/build-pwa.mjs) */
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const TIPI = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };

const esiti = [];
const controlla = (ok, cosa) => { esiti.push({ ok, cosa }); console.log(`  ${ok ? '✓' : '✗'} ${cosa}`); };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join('pwa', p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('no'); }
  // Le stesse intestazioni di GitHub Pages: e' la cache HTTP che fa vedere
  // la pagina vecchia dopo una pubblicazione, quindi la prova deve averla.
  res.writeHead(200, { 'content-type': TIPI[path.extname(f)] ?? 'application/octet-stream',
    'cache-control': 'max-age=600' });
  res.end(fs.readFileSync(f));
});
await new Promise(r => server.listen(0, r));
const base = 'http://localhost:' + server.address().port;

const b = await chromium.launch({ executablePath: CHROME });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const errori = [];

// ── 1. l'app alla radice, che ha scope su tutto il dominio ────────────────
console.log('\nRadice (Ghisa & Grammi)');
const g = await ctx.newPage();
g.on('pageerror', e => errori.push('radice: ' + e.message));
await g.goto(base + '/');
const swG = await g.evaluate(() => navigator.serviceWorker.ready.then(r => r.active.scriptURL));
controlla(swG.endsWith('/sw.js') && !swG.includes('viaggio'), 'service worker registrato');
await g.waitForTimeout(600);

// ── 2. l'app del viaggio, aperta per la prima volta ───────────────────────
console.log('\nViaggio, prima apertura');
const p = await ctx.newPage();
p.on('pageerror', e => errori.push('viaggio: ' + e.message));
await p.goto(base + '/viaggio/');
const swV = await p.evaluate(() => navigator.serviceWorker.ready.then(r => r.active.scriptURL));
controlla(swV.includes('/viaggio/sw.js'), 'service worker proprio, non quello della radice');
await p.waitForTimeout(900);
controlla(await p.evaluate(() => !document.getElementById('agg')),
  'nessun avviso di aggiornamento in pagina');
const man = await p.evaluate(async () => {
  const j = await (await fetch('manifest.webmanifest')).json();
  const ic = await Promise.all(j.icons.map(i => fetch(i.src).then(x => x.status)));
  return { nome: j.name, display: j.display, icone: ic };
});
controlla(man.display === 'standalone' && man.icone.every(s => s === 200),
  `manifest e ${man.icone.length} icone raggiungibili`);

// ── 3. via la rete: entrambe si riaprono ──────────────────────────────────
// Si fotografano prima i conteggi con la rete, e poi si pretende che offline
// siano identici: cosi' la prova non va aggiornata ogni volta che l'itinerario
// cambia una tappa.
const conRete = await p.evaluate(() => ({
  schede: document.querySelectorAll('.tab').length,
  giornate: document.querySelectorAll('details.day').length,
  fermate: document.querySelectorAll('.stopdot').length,
}));
console.log('\nSenza rete');
await ctx.setOffline(true);
await p.reload();
await p.waitForTimeout(600);
const v = await p.evaluate(() => ({
  schede: document.querySelectorAll('.tab').length,
  giornate: document.querySelectorAll('details.day').length,
  fermate: document.querySelectorAll('.stopdot').length,
  spia: !document.getElementById('net').hidden,
}));
controlla(v.schede === conRete.schede && v.giornate === conRete.giornate
  && v.fermate === conRete.fermate && v.fermate > 0,
  `il viaggio si apre completo (${v.schede} schede, ${v.giornate} giornate, ${v.fermate} fermate)`);
controlla(v.spia, 'la spia "offline" si accende');
await g.reload();
await g.waitForTimeout(600);
controlla(await g.evaluate(() => document.querySelectorAll('.tab').length === 5),
  'anche la radice si apre (le cache non si sono cancellate a vicenda)');
fs.mkdirSync('out', { recursive: true });
await p.screenshot({ path: 'out/pwa-offline.png' });

// ── 4. le scelte sopravvivono ─────────────────────────────────────────────
await ctx.setOffline(false);
await p.evaluate(() => { choices.d9 = 'pirano'; saveChoices(); ridisegna(); });
await ctx.setOffline(true);
await p.reload();
await p.waitForTimeout(500);
await p.click('#tab-giorni');
await p.waitForTimeout(250);
controlla((await p.evaluate(() => document.getElementById('totbar').textContent)).includes('Pirano'),
  'la scelta salvata si ritrova dopo il riavvio');
await ctx.setOffline(false);

// ── 5. una versione nuova entra da sola, con l'app aperta e ferma ─────────
// E' il caso che conta: l'app installata riprende la pagina gia' aperta senza
// nessuna navigazione, quindi il contenuto vecchio resterebbe li'.
console.log('\nAggiornamento silenzioso');
const idx = 'pwa/viaggio/index.html', sw = 'pwa/viaggio/sw.js';
const idxOrig = fs.readFileSync(idx, 'utf8'), swOrig = fs.readFileSync(sw, 'utf8');
try {
  // rimette l'app su una versione "vecchia" riconoscibile e la fa installare
  fs.writeFileSync(idx, idxOrig.replace('<main>', '<main><div id="vecchia"></div>'));
  await p.goto(base + '/viaggio/');
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.waitForTimeout(900);
  controlla(await p.evaluate(() => !!document.getElementById('vecchia')),
    'parte dalla versione vecchia');

  // esce quella nuova mentre l'app e' aperta: nessuna navigazione, solo il
  // ritorno in primo piano
  fs.writeFileSync(idx, idxOrig);
  fs.writeFileSync(sw, swOrig + '\n/* versione finta, solo per questa prova */\n');
  await p.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await p.waitForTimeout(3200);
  controlla(!(await p.evaluate(() => !!document.getElementById('vecchia'))),
    'si aggiorna da sola senza che nessuno navighi o confermi niente');
  controlla(!(await p.evaluate(() => !!document.getElementById('agg'))),
    'e senza mostrare nessun avviso');
  const stato = await p.evaluate(async () => {
    const r = await navigator.serviceWorker.getRegistration();
    return !!r.waiting;
  });
  controlla(!stato, 'nessun service worker lasciato in attesa di un permesso');
} finally {
  fs.writeFileSync(idx, idxOrig);
  fs.writeFileSync(sw, swOrig);
}

controlla(errori.length === 0, errori.length ? 'errori in pagina: ' + errori.join(' | ') : 'nessun errore in pagina');
await b.close();
server.close();

const rotti = esiti.filter(e => !e.ok).length;
console.log(rotti ? `\n${rotti} controlli falliti` : `\nTutti i ${esiti.length} controlli superati`);
process.exit(rotti ? 1 : 0);
