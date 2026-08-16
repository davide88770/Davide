/* Prova che la versione installabile si apra davvero senza rete, e che le due
   app non si mangino il guscio a vicenda. Si lancia con: npm run prova:pwa */
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const TIPI = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join('pwa', p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('no'); }
  res.writeHead(200, { 'content-type': TIPI[path.extname(f)] ?? 'application/octet-stream' });
  res.end(fs.readFileSync(f));
});
await new Promise(r => server.listen(0, r));
const base = 'http://localhost:' + server.address().port;

const b = await chromium.launch({ executablePath: CHROME });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();
const errori = [];
p.on('pageerror', e => errori.push('pageerror: ' + e.message));

const attendiSW = async () => p.evaluate(() => navigator.serviceWorker.ready.then(r => r.active.scriptURL));

// ── 1. l'app del viaggio ──────────────────────────────────────────────────
await p.goto(base + '/viaggio/');
console.log('sw viaggio :', (await attendiSW()).replace(base, ''));
const man = await p.evaluate(async () => {
  const r = await fetch('manifest.webmanifest'); const j = await r.json();
  const ic = await Promise.all(j.icons.map(i => fetch(i.src).then(x => x.status)));
  return { name: j.name, breve: j.short_name, display: j.display, icone: ic };
});
console.log('manifest   :', JSON.stringify(man));

// ── 2. Ghisa alla radice, che ha scope su tutto il sito ───────────────────
const p2 = await ctx.newPage();
await p2.goto(base + '/');
console.log('sw radice  :', (await p2.evaluate(() => navigator.serviceWorker.ready.then(r => r.active.scriptURL))).replace(base, ''));
await p2.waitForTimeout(600);

// ── 3. via la rete, e si riapre tutto lo stesso ───────────────────────────
await ctx.setOffline(true);
await p.reload();
await p.waitForTimeout(500);
const v = await p.evaluate(() => ({
  titolo: document.title,
  schede: document.querySelectorAll('.tab').length,
  giornate: document.querySelectorAll('details.day').length,
  fermate: document.querySelectorAll('.stopdot').length,
  km: (document.getElementById('totbar') || {}).textContent || '(non ancora reso)',
  campo: !document.getElementById('net').hidden,
}));
console.log('offline    :', JSON.stringify(v));
fs.mkdirSync('out', { recursive: true });
await p.screenshot({ path: 'out/pwa-offline.png' });

await p2.reload();
await p2.waitForTimeout(500);
const g = await p2.evaluate(() => ({ titolo: document.title, tab: document.querySelectorAll('.tab').length }));
console.log('offline gg :', JSON.stringify(g));

// ── 4. la persistenza sopravvive al riavvio ───────────────────────────────
await ctx.setOffline(false);
await p.evaluate(() => { choices.d9 = 'pirano'; saveChoices(); ridisegna(); });
await ctx.setOffline(true);
await p.reload();
await p.waitForTimeout(400);
await p.click('#tab-giorni'); await p.waitForTimeout(200);
console.log('scelta     :', await p.evaluate(() => document.getElementById('totbar').textContent.replace(/\s+/g, ' ').trim()));

console.log(errori.length ? 'ERRORI: ' + errori.join(' | ') : 'nessun errore in pagina');
await b.close();
server.close();
