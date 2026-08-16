/* Prova che le versioni installabili si aprano davvero senza rete, che le due
   app non si mangino il guscio a vicenda, e che l'avviso di aggiornamento
   compaia solo quando c'e' davvero una versione nuova.
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
  res.writeHead(200, { 'content-type': TIPI[path.extname(f)] ?? 'application/octet-stream',
    'cache-control': 'no-store' });
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
controlla(!(await p.evaluate(() => !document.getElementById('agg').hidden)),
  'nessun avviso di aggiornamento (e\' la prima installazione)');
const man = await p.evaluate(async () => {
  const j = await (await fetch('manifest.webmanifest')).json();
  const ic = await Promise.all(j.icons.map(i => fetch(i.src).then(x => x.status)));
  return { nome: j.name, display: j.display, icone: ic };
});
controlla(man.display === 'standalone' && man.icone.every(s => s === 200),
  `manifest e ${man.icone.length} icone raggiungibili`);

// ── 3. via la rete: entrambe si riaprono ──────────────────────────────────
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
controlla(v.schede === 5 && v.giornate === 10 && v.fermate === 20, 'il viaggio si apre completo');
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

// ── 5. l'avviso compare solo per un aggiornamento vero ────────────────────
console.log('\nAvviso di aggiornamento');
const sw = 'pwa/viaggio/sw.js';
const orig = fs.readFileSync(sw, 'utf8');
fs.writeFileSync(sw, orig + '\n/* versione finta, solo per questa prova */\n');
try {
  await p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); });
  await p.waitForTimeout(1600);
  controlla(await p.evaluate(() => !document.getElementById('agg').hidden),
    'compare quando arriva davvero una versione nuova');
  await p.click('#aggOra');
  await p.waitForTimeout(1800);
  controlla(!(await p.evaluate(() => !document.getElementById('agg').hidden)),
    '"Aggiorna" ricarica sulla versione nuova e l\'avviso sparisce');
} finally {
  fs.writeFileSync(sw, orig);
}

controlla(errori.length === 0, errori.length ? 'errori in pagina: ' + errori.join(' | ') : 'nessun errore in pagina');
await b.close();
server.close();

const rotti = esiti.filter(e => !e.ok).length;
console.log(rotti ? `\n${rotti} controlli falliti` : `\nTutti i ${esiti.length} controlli superati`);
process.exit(rotti ? 1 : 0);
