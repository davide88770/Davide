#!/usr/bin/env node
/**
 * Prova completa di "Soldi" (pwa/soldi/), prima di pubblicare.
 *
 *   node tools/build-soldi.mjs && node tools/prova-soldi.mjs
 *
 * Serve pwa/soldi/ in /Davide/soldi/ su un server locale (max-age=600, come
 * GitHub Pages) e ci mette davanti un FINTO Supabase, intercettato nel
 * browser: login con codice, tabelle settings/transactions con la stessa
 * regola della Row Level Security, e il canale in tempo reale (WebSocket,
 * protocollo Phoenix vsn 2.0.0) che avvisa gli altri dispositivi.
 *
 * Il giro ricalca le verifiche richieste per l'app:
 *   A. senza Supabase configurato: l'app funziona solo in locale e i dati
 *      restano dopo il ricaricamento;
 *   1. accesso con email + codice, e sessione che resta al riavvio;
 *   2. aggiungi, modifica, elimina un movimento: si aggiorna subito, e anche
 *      sul secondo dispositivo;
 *   3. ripristino di un backup dell'app vecchia ({S, TX}) con movimenti Amex
 *      da migrare: tutto sul server, migrazione fatta una volta sola;
 *   4. import CSV, ricorrenti, avvisi, "Aggiorna saldo", grafici;
 *   5. offline: l'app si riapre dalla cache, le modifiche vanno in coda e
 *      partono al ritorno della rete;
 *   6. installabilità (manifest, service worker, icone) e console pulita;
 *   7. backup JSON ed export CSV scaricati e identici nel contenuto;
 *   + resa chiara/scura, 390 px senza scroll orizzontale, PDF di stampa.
 *
 * Screenshot e PDF in out/soldi/. Esce con codice 1 se qualcosa non va.
 */
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DIR = path.resolve('pwa/soldi');
const OUT = path.resolve('out/soldi');
if (!fs.existsSync(path.join(DIR, 'sw.js'))) { console.error('Manca pwa/soldi: esegui npm run build:soldi'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });

let falliti = 0;
const ok = (cond, msg) => { console.log(`  ${cond ? '✓' : '✗'} ${msg}`); if (!cond) falliti++; return cond; };
const sezione = t => console.log(`\n${t}`);
const attendi = async (fn, ms = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await fn()) return true; } catch (e) {} await new Promise(r => setTimeout(r, 100)); } return false; };

// ───────────────────────── server statico ─────────────────────────
const TIPI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2' };
const SUPA = 'https://finto-progetto.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiJ9.' + Buffer.from(JSON.stringify({ role: 'anon', iss: 'supabase' })).toString('base64url') + '.firma';
function server(cloud, dir = DIR) {
  return new Promise(res => {
    const s = http.createServer((req, rsp) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (!p.startsWith('/Davide/soldi/')) { rsp.writeHead(404); return rsp.end(); }
      p = p.slice('/Davide/soldi/'.length) || 'index.html';
      if (p === 'config.js' && cloud) {
        rsp.writeHead(200, { 'content-type': TIPI['.js'], 'cache-control': 'max-age=600' });
        return rsp.end(`window.SOLDI_CONFIG={supabaseUrl:'${SUPA}',supabaseAnonKey:'${ANON}'};`);
      }
      const f = path.join(dir, p);
      if (!f.startsWith(dir) || !fs.existsSync(f)) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'content-type': TIPI[path.extname(f)] ?? 'application/octet-stream', 'cache-control': 'max-age=600' });
      fs.createReadStream(f).pipe(rsp);
    }).listen(0, '127.0.0.1', () => res(s));
  });
}

// ───────────────────────── finto Supabase ─────────────────────────
const DB = { settings: new Map(), transactions: new Map() }; // chiave: user_id[|id]
const UTENTE = { id: '6b1f3c2e-0d4a-4f7e-9a51-2c8e7d9b1a00', email: 'davide@example.com' };
let OFFLINE = false;
const contatori = { otp: 0, verify: 0, upsert: 0, delete: 0, select: 0 };
const jwt = sub => 'eyJhbGciOiJIUzI1NiJ9.' + Buffer.from(JSON.stringify({ sub, role: 'authenticated', aud: 'authenticated',
  exp: Math.floor(Date.now() / 1000) + 3600, email: UTENTE.email })).toString('base64url') + '.firma';
const sessione = () => ({ access_token: jwt(UTENTE.id), token_type: 'bearer', expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'rt-' + Date.now(),
  user: { id: UTENTE.id, email: UTENTE.email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} } });
const chiDalToken = h => { try { return JSON.parse(Buffer.from((h ?? '').replace(/^Bearer /, '').split('.')[1], 'base64url')).sub; } catch (e) { return null; } };

const iscritti = new Set(); // { ws, topic, bindings:[{id,event,table,filter}] }
let bindId = 100;
const COLONNE = { transactions: ['id:text', 'user_id:uuid', 'data:jsonb', 'updated_at:timestamptz'],
  settings: ['user_id:uuid', 'data:jsonb', 'updated_at:timestamptz'] };
function avvisa(table, type, record, old) {
  const rif = record ?? old;
  for (const s of iscritti) {
    const ids = s.bindings.filter(b => b.table === table && (b.event === '*' || b.event === type)
      && (!b.filter || b.filter === `user_id=eq.${rif.user_id}`)).map(b => b.id);
    if (!ids.length) continue;
    s.ws.send(JSON.stringify([null, null, s.topic, 'postgres_changes', { ids, data: {
      schema: 'public', table, commit_timestamp: new Date().toISOString(), type,
      columns: COLONNE[table].map(c => ({ name: c.split(':')[0], type: c.split(':')[1] })),
      record: record ?? {}, old_record: old ? { id: old.id, user_id: old.user_id } : {}, errors: null } }]));
  }
}
const filtroEq = (u, k) => { const v = u.searchParams.get(k); return v && v.startsWith('eq.') ? v.slice(3) : null; };

async function rotteSupabase(ctx) {
  await ctx.route(SUPA + '/**', async route => {
    if (OFFLINE) return route.abort('internetdisconnected');
    const req = route.request(), u = new URL(req.url()), m = req.method();
    const json = (b, st = 200) => route.fulfill({ status: st, contentType: 'application/json', body: JSON.stringify(b) });
    if (u.pathname === '/auth/v1/otp') { contatori.otp++; return json({}); }
    if (u.pathname === '/auth/v1/verify') {
      contatori.verify++;
      const b = req.postDataJSON();
      if (b.token !== '123456') return json({ code: 403, error_code: 'otp_expired', msg: 'Token has expired or is invalid' }, 403);
      return json(sessione());
    }
    if (u.pathname === '/auth/v1/token') return json(sessione());
    if (u.pathname === '/auth/v1/logout') return route.fulfill({ status: 204, body: '' });
    if (u.pathname === '/auth/v1/user') return json(sessione().user);
    const tab = u.pathname.replace('/rest/v1/', '');
    if (!DB[tab]) return json({ message: 'tabella sconosciuta' }, 404);
    const chi = chiDalToken(req.headers()['authorization']);
    if (!chi) return json({ message: 'JWT mancante' }, 401);
    if (m === 'GET') {
      contatori.select++;
      if (filtroEq(u, 'user_id') !== chi) return json([]);
      let righe = [...DB[tab].values()].filter(r => r.user_id === chi).sort((a, b) => a.id < b.id ? -1 : 1);
      const off = +(u.searchParams.get('offset') ?? 0), lim = +(u.searchParams.get('limit') ?? 1e9);
      righe = righe.slice(off, off + lim);
      const sel = (u.searchParams.get('select') ?? '*').split(',');
      return json(righe.map(r => sel[0] === '*' ? r : Object.fromEntries(sel.map(c => [c, r[c]]))));
    }
    if (m === 'POST') {
      contatori.upsert++;
      let b = req.postDataJSON(); if (!Array.isArray(b)) b = [b];
      // stessa regola della Row Level Security: solo righe tue
      if (b.some(r => r.user_id !== chi)) return json({ code: '42501', message: 'new row violates row-level security policy' }, 403);
      for (const r of b) {
        const k = tab === 'settings' ? r.user_id : r.user_id + '|' + r.id;
        const c = DB[tab].has(k);
        DB[tab].set(k, structuredClone(r));
        avvisa(tab, c ? 'UPDATE' : 'INSERT', r, null);
      }
      return route.fulfill({ status: 201, body: '' });
    }
    if (m === 'DELETE') {
      contatori.delete++;
      if (filtroEq(u, 'user_id') !== chi) return json({ message: 'filtro utente mancante' }, 400);
      const inn = (u.searchParams.get('id') ?? '').match(/^in\.\((.*)\)$/);
      const ids = inn ? inn[1].split(',').map(x => x.replace(/^"|"$/g, '')) : [];
      for (const id of ids) {
        const k = chi + '|' + id;
        if (DB[tab].has(k)) { DB[tab].delete(k); avvisa(tab, 'DELETE', null, { id, user_id: chi }); }
      }
      return route.fulfill({ status: 204, body: '' });
    }
    return json({ message: 'metodo non gestito' }, 405);
  });
  await ctx.routeWebSocket(/finto-progetto\.supabase\.co\/realtime/, ws => {
    const mie = new Set();
    ws.onMessage(raw => {
      if (OFFLINE) return;
      const [jref, ref, topic, ev, payload] = JSON.parse(raw);
      const rispondi = (response = {}) => ws.send(JSON.stringify([jref, ref, topic, 'phx_reply', { status: 'ok', response }]));
      if (ev === 'heartbeat') return rispondi();
      if (ev === 'phx_join') {
        const bindings = (payload.config?.postgres_changes ?? []).map(b => ({ ...b, id: ++bindId }));
        const s = { ws, topic, bindings }; iscritti.add(s); mie.add(s);
        return rispondi({ postgres_changes: bindings });
      }
      if (ev === 'phx_leave') { for (const s of mie) if (s.topic === topic) { iscritti.delete(s); mie.delete(s); } return rispondi(); }
      if (ev === 'access_token') return;
    });
    ws.onClose(() => { for (const s of mie) iscritti.delete(s); });
  });
}

// ───────────────────────── il giro ─────────────────────────
const browser = await chromium.launch({ executablePath: CHROME });
const errori = [];
function sorveglia(page, nome) {
  page.on('pageerror', e => errori.push(`${nome}: pageerror ${e.message}`));
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const t = m.text();
    // a rete staccata Chromium scrive in console le richieste fallite: sono attese
    if (/status of 403/.test(t) && contatori.verify > 0 && contatori.verify < 3) return; // il codice sbagliato, voluto
    if (/ERR_INTERNET_DISCONNECTED|Failed to load resource|ERR_FAILED|WebSocket/.test(t) && (OFFLINE || /realtime|websocket/i.test(t))) return;
    errori.push(`${nome}: ${t}`);
  });
}
const sLocale = await server(false), sCloud = await server(true);
const urlDi = s => `http://127.0.0.1:${s.address().port}/Davide/soldi/`;

// ── A. senza Supabase ──
sezione('A. Senza Supabase configurato (solo questo dispositivo)');
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage(); sorveglia(p, 'locale');
  await p.goto(urlDi(sLocale)); await p.waitForLoadState('networkidle');
  ok(!(await p.isVisible('#login')), 'nessuna schermata di accesso');
  ok((await p.textContent('#sync')).includes('solo su questo dispositivo'), `stato: «${(await p.textContent('#sync')).trim()}»`);
  ok(await p.evaluate(() => S.recurring.length === 0 && S.quote.length === 0), 'valori di default senza stipendi né quote');
  await p.click('#fab'); await p.fill('#tAmt', '12.5'); await p.click('#tSave');
  await p.waitForTimeout(200);
  await p.reload(); await p.waitForLoadState('networkidle');
  ok(await p.evaluate(() => TX.length === 1 && TX[0].amt === 12.5), 'il movimento resta dopo il ricaricamento');
  ok(!(await p.isVisible('#uOut')), 'niente "Esci" senza account');
  await ctx.close();
}

// ── 1. accesso ──
sezione('1. Accesso con email + codice');
const ctxA = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
await rotteSupabase(ctxA);
const A = await ctxA.newPage(); sorveglia(A, 'A');
const cdp = await ctxA.newCDPSession(A);
await A.goto(urlDi(sCloud)); await A.waitForLoadState('networkidle');
ok(await A.isVisible('#login'), 'senza sessione compare la schermata di accesso');
await A.screenshot({ path: path.join(OUT, 'accesso.png') });
await A.fill('#lgMail', 'non-una-mail'); await A.click('#lgSend');
ok((await A.textContent('#lgErr')).includes('valido'), 'email sbagliata: messaggio chiaro');
await A.fill('#lgMail', UTENTE.email); await A.click('#lgSend');
await attendi(() => A.isVisible('#lgCode'));
ok(contatori.otp === 1, 'richiesta del link/codice partita');
await A.fill('#lgCode', '999999');
await attendi(async () => (await A.textContent('#lgErr')).length > 0);
ok((await A.textContent('#lgErr')).includes('Codice'), 'codice sbagliato: messaggio chiaro');
await A.fill('#lgCode', '123456');
ok(await attendi(async () => !(await A.isVisible('#login'))), 'codice giusto: entra');
ok(await attendi(async () => (await A.textContent('#sync')).includes('Sincronizzato')), `stato: «${(await A.textContent('#sync')).trim()}»`);
ok(await attendi(() => DB.settings.has(UTENTE.id)), 'al primo accesso le impostazioni vanno sul server');
ok(await attendi(async () => (await A.evaluate(() => rtOk))), 'canale in tempo reale collegato');

// ── 3. ripristino del backup dell'app vecchia ──
sezione('3. Ripristino di un backup dell\'app vecchia');
const vecchio = (() => {
  const TX = [];
  const mk = (i, o) => ({ id: 't17000000000' + String(i).padStart(2, '0') + 'ab', note: '', date: '2026-09-' + String(1 + i % 28).padStart(2, '0'), ...o });
  for (let i = 0; i < 40; i++) TX.push(mk(i, { type: 'out', amt: 10 + i, acc: i % 2 ? 'trad' : 'rev', cat: 'Vita quotidiana', ...(i % 5 === 0 ? { pay: 'amex' } : {}) }));
  TX.push(mk(40, { type: 'in', amt: 2500, acc: 'trad', cat: 'Stipendio' }));
  TX.push(mk(41, { type: 'move', amt: 1500, acc: 'trad', to: 'inv' }));
  TX.push(mk(42, { type: 'out', amt: 99, acc: 'amex', cat: 'Ristoranti' }));      // vecchio conto Amex
  TX.push(mk(43, { type: 'out', amt: 45, acc: 'amex', cat: 'Altro', det: 'multa' }));
  TX.push(mk(44, { type: 'move', amt: 300, acc: 'trad', to: 'amex' }));           // pagamento carta: sparisce
  TX.push({ id: 'rotto', type: 'out', amt: -3, acc: 'trad', date: 'ieri' });      // dato rotto: clean() lo scarta
  const S = { v: 2, budget: { 'Vita quotidiana': 900, Viaggi: 1000 }, start: { trad: 1000, rev: 500, amex: -200 },
    goals: { inv: 1500, emerg: 12000, amex: 2000, amexStart: '', pens: 5164 },
    recurring: [{ id: 'r1', type: 'in', amt: 2500, acc: 'trad', cat: 'Stipendio', note: 'Stipendio', day: 1 },
      { id: 'r9', type: 'out', amt: 20, acc: 'amex', cat: 'Spese fisse', note: 'vecchio', day: 2 }],
    quote: [{ y: 2027, a: 1000, ok: false }], cats: [{ n: 'Animali', i: '🐶' }], snaps: {}, values: {} };
  return { S, TX };
})();
const fileBackup = path.join(OUT, 'backup-vecchio.json');
fs.writeFileSync(fileBackup, JSON.stringify(vecchio));
await A.click('#goSet');
await A.setInputFiles('#bImp', fileBackup);
await attendi(() => A.isVisible('#askYes'));
await A.click('#askYes');
const attesi = 40 + 1 + 1 + 2; // il move verso amex e il dato rotto non ci sono
ok(await attendi(async () => [...DB.transactions.values()].length === attesi && (await A.evaluate(() => pendingN())) === 0, 10000),
  `sul server ${DB.transactions.size} movimenti (attesi ${attesi})`);
ok(![...DB.transactions.values()].some(r => r.data.acc === 'amex' || r.data.to === 'amex'), 'nessun movimento sul vecchio conto Amex');
ok([...DB.transactions.values()].filter(r => r.data.pay === 'amex').length === 8 + 2, 'le spese Amex sono sul Tradizionale, segnate Amex');
const sSrv = DB.settings.get(UTENTE.id).data;
ok(sSrv.start.trad === 800 && !('amex' in sSrv.start), `saldo di partenza Amex confluito nel Tradizionale (${sSrv.start.trad})`);
ok(sSrv.recurring.length === 1 && sSrv.cats[0].n === 'Animali' && sSrv.quote[0].a === 1000, 'ricorrenti, categorie e quote ripristinati');

// ── 2. due dispositivi ──
sezione('2. Aggiungi, modifica, elimina — e il secondo dispositivo');
const ctxB = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await rotteSupabase(ctxB);
const B = await ctxB.newPage(); sorveglia(B, 'B');
await B.goto(urlDi(sCloud)); await B.waitForLoadState('networkidle');
await B.fill('#lgMail', UTENTE.email); await B.click('#lgSend'); await attendi(() => B.isVisible('#lgCode'));
await B.fill('#lgCode', '123456');
ok(await attendi(async () => (await B.evaluate(() => TX.length)) === attesi), 'il secondo dispositivo scarica tutti i movimenti');
ok(await attendi(() => B.evaluate(() => rtOk)), 'anche B è in ascolto');

// aggiunta su A
await A.click('#tabs button[data-v="tx"]');
await A.click('#fab'); await A.fill('#tAmt', '23.40');
await A.click('#tCat .chip[data-v="Ristoranti"]'); await A.fill('#tNote', 'pizza prova');
await A.click('#tSave');
const nuovo = await A.evaluate(() => TX.find(t => t.note === 'pizza prova')?.id);
ok(!!nuovo && await attendi(() => A.evaluate(id => !!document.querySelector(`.tx[data-id="${id}"]`), nuovo), 300), 'A: il movimento compare subito nella lista');
ok(await attendi(() => B.evaluate(id => TX.some(t => t.id === id && t.amt === 23.4), nuovo)), 'B: il movimento arriva in tempo reale');
// modifica su B
await B.click('#tabs button[data-v="tx"]');
await B.click(`.tx[data-id="${nuovo}"]`); await B.fill('#tAmt', '31'); await B.click('#tSave');
ok(await attendi(() => A.evaluate(id => TX.find(t => t.id === id)?.amt === 31, nuovo)), 'modifica fatta su B: A la vede');

ok(await attendi(() => A.evaluate(id => document.querySelector(`.tx[data-id="${id}"] .amt`)?.textContent.includes('31'), nuovo)), 'A: la lista si ridisegna da sola');
// eliminazione su A
await A.click(`.tx[data-id="${nuovo}"]`); await A.click('#tDel'); await A.click('#askYes');
ok(await attendi(() => B.evaluate(id => !TX.some(t => t.id === id), nuovo)), 'eliminazione fatta su A: sparisce anche da B');
ok(!DB.transactions.has(UTENTE.id + '|' + nuovo), 'e dal server');
// impostazioni su B
await B.click('#goSet');
await B.fill('#sBud input[data-b="Ristoranti"]', '345');
ok(await attendi(() => A.evaluate(() => S.budget.Ristoranti === 345), 8000), 'budget cambiato su B: arriva su A');

// ── 4. funzioni dell'app ──
sezione('4. Import CSV, ricorrenti, avvisi, Aggiorna saldo, grafici');
const csv = 'Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance\n'
  + 'CARD_PAYMENT,Current,2026-09-20 10:00:00,2026-09-20 11:00:00,Esselunga Milano,-54.30,0,EUR,COMPLETED,100\n'
  + 'CARD_PAYMENT,Current,2026-09-21 10:00:00,2026-09-21 11:00:00,Trattoria da Mario,-38.00,0,EUR,COMPLETED,60\n'
  + 'TOPUP,Current,2026-09-22 10:00:00,2026-09-22 11:00:00,Top-up by *1234,200.00,0,EUR,COMPLETED,260\n'
  + 'CARD_PAYMENT,Current,2026-09-23 10:00:00,2026-09-23 11:00:00,Rifiutato,-9.00,0,EUR,REVERTED,260\n';
const fileCsv = path.join(OUT, 'revolut.csv'); fs.writeFileSync(fileCsv, csv);
await A.click('#tabs button[data-v="tx"]'); await A.click('#openImp');
await A.setInputFiles('#iFile', fileCsv);
await attendi(() => A.isVisible('#iGo'));
ok((await A.textContent('#iGo')).includes('2'), `import: «${(await A.textContent('#iGo')).trim()}» (top-up saltato, revert scartato)`);
const prima = await A.evaluate(() => TX.length);
await A.click('#iGo');
ok(await attendi(() => A.evaluate(n => TX.length === n + 2, prima)), 'import: 2 movimenti in più');
ok(await A.evaluate(() => TX.some(t => t.cat === 'Vita quotidiana' && t.amt === 54.3) && TX.some(t => t.cat === 'Ristoranti' && t.amt === 38)), 'import: categorie riconosciute');
ok(await attendi(() => B.evaluate(n => TX.length === n + 2, prima)), 'import: arrivato anche su B');
// ricorrenti del mese corrente
await A.click('#tabs button[data-v="home"]');
await A.evaluate(() => { cur = new Date(new Date().getFullYear(), new Date().getMonth(), 1); render(); });
const kRec = await A.evaluate(() => curKey());
if (await A.isVisible('#recGo')) await A.click('#recGo');
ok(await attendi(() => A.evaluate(k => TX.some(t => t.id === `r_r1_${k}`), kRec)), 'ricorrenti registrati nel mese');
ok(await attendi(() => B.evaluate(k => TX.some(t => t.id === `r_r1_${k}`), kRec)), 'e visti da B');
ok(await A.evaluate(() => Array.isArray(getAlerts())), `avvisi calcolati: ${await A.evaluate(() => getAlerts().map(a => a.t).join(' | ') || 'nessuno')}`);
// aggiorna saldo
await A.click('#tabs button[data-v="acc"]'); await A.click('[data-sel="rev"]');
await A.fill('#aFix', '1234.56'); await A.click('#aFixGo');
ok(await A.evaluate(() => Math.abs(balances().rev - 1234.56) < 0.005), 'Aggiorna saldo: Revolut a 1.234,56 €');
await A.click('[data-sel="trad"]'); await A.fill('#aFix', '5000'); await A.fill('#aFix2', '250'); await A.click('#aFixGo');
ok(await A.evaluate(() => Math.abs(balances().trad - 4750) < 0.005), 'Aggiorna saldo Tradizionale meno Amex da addebitare: 4.750 €');
ok(await attendi(() => B.evaluate(() => Math.abs(balances().trad - 4750) < 0.005)), 'saldo corretto anche su B');
// grafici
for (const v of ['home', 'acc', 'year', 'nw']) await A.click(`#tabs button[data-v="${v}"]`);
const grafici = await A.evaluate(() => Object.keys(charts).sort().join(','));
ok(grafici === 'cAcc,cDonut,cHist,cNw,cStack,cYear', `grafici disegnati: ${grafici}`);
ok(await A.evaluate(() => typeof Chart !== 'undefined' && Chart.version === '4.4.1'), 'Chart.js 4.4.1 caricato in locale');

// ── 7. download ──
sezione('7. Backup e CSV');
await A.click('#goSet');
let [dl] = await Promise.all([A.waitForEvent('download'), A.click('#bExp')]);
const bk = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
ok(dl.suggestedFilename().startsWith('backup-soldi-davide-') && Array.isArray(bk.TX) && bk.S && bk.TX.length === await A.evaluate(() => TX.length),
  `backup ${dl.suggestedFilename()}: ${bk.TX.length} movimenti`);
ok(await A.evaluate(() => S.lastBackup === today()), 'data dell\'ultimo backup registrata');
[dl] = await Promise.all([A.waitForEvent('download'), A.click('#bCsv')]);
const csvOut = fs.readFileSync(await dl.path(), 'utf8');
ok(dl.suggestedFilename() === 'movimenti.csv' && csvOut.startsWith('﻿Data;Tipo;Conto;Verso;Categoria;Dettaglio;Importo;Nota\n')
  && csvOut.trim().split('\n').length === bk.TX.length + 1, `CSV: ${csvOut.trim().split('\n').length - 1} righe, stesso formato di prima`);

// ── 5. offline ──
sezione('5. Offline');
ok(await attendi(() => A.evaluate(() => !!navigator.serviceWorker.controller), 8000), 'service worker attivo e in controllo');
OFFLINE = true; await ctxA.setOffline(true);
await A.evaluate(() => dispatchEvent(new Event('offline')));
await A.click('#tabs button[data-v="tx"]');
await A.click('#fab'); await A.fill('#tAmt', '7'); await A.fill('#tNote', 'caffè offline'); await A.click('#tSave');
ok(await attendi(async () => (await A.textContent('#sync')).includes('Offline')), `stato: «${(await A.textContent('#sync')).trim()}»`);
await A.waitForTimeout(400);
await A.reload(); await A.waitForLoadState('domcontentloaded'); await A.waitForTimeout(800);
ok(await A.evaluate(() => typeof render === 'function' && !document.getElementById('login').classList.contains('on')), 'senza rete l\'app si riapre dalla cache, senza chiedere l\'accesso');
ok(await A.evaluate(() => TX.some(t => t.note === 'caffè offline') && pendingN() >= 1), 'il movimento fatto offline è lì, in coda');
ok(await A.evaluate(() => typeof Chart !== 'undefined' && document.fonts.check('16px Manrope')), 'Chart.js e font serviti dalla cache');
ok(!(await B.evaluate(() => TX.some(t => t.note === 'caffè offline'))), 'B non lo ha ancora');
await A.screenshot({ path: path.join(OUT, 'offline.png') });
OFFLINE = false; await ctxA.setOffline(false);
await A.evaluate(() => dispatchEvent(new Event('online')));
ok(await attendi(() => A.evaluate(() => pendingN() === 0), 10000), 'tornata la rete: la coda si svuota');
ok(await attendi(() => B.evaluate(() => TX.some(t => t.note === 'caffè offline'))), 'e B lo riceve');

// ── 1b. sessione persistente ──
sezione('1b. Sessione che resta');
const statoA = await ctxA.storageState();
const ctxA2 = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: statoA });
await rotteSupabase(ctxA2);
const A2 = await ctxA2.newPage(); sorveglia(A2, 'A2');
await A2.goto(urlDi(sCloud)); await A2.waitForLoadState('networkidle');
ok(!(await A2.isVisible('#login')) && await attendi(() => A2.evaluate(() => !!uid)), 'riaprendo l\'app non chiede di nuovo l\'accesso');
await ctxA2.close();

// ── resa ──
sezione('Resa: chiaro, scuro, 390 px, stampa');
await A.click('#tabs button[data-v="home"]');
for (const tema of ['light', 'dark']) {
  await A.emulateMedia({ colorScheme: tema });
  await A.waitForTimeout(150);
  await A.screenshot({ path: path.join(OUT, `mese-390-${tema}.png`), fullPage: true });
  const largo = await A.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok(largo <= 0, `${tema}: nessuno scroll orizzontale a 390 px (${largo})`);
}
await A.emulateMedia({ colorScheme: 'light' });
for (const v of ['tx', 'acc', 'year', 'nw', 'set']) {
  if (v === 'set') await A.click('#goSet'); else await A.click(`#tabs button[data-v="${v}"]`);
  await A.waitForTimeout(120);
  const largo = await A.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok(largo <= 0, `vista ${v}: nessuno scroll orizzontale (${largo})`);
  await A.screenshot({ path: path.join(OUT, `vista-${v}.png`), fullPage: true });
}
await B.emulateMedia({ colorScheme: 'dark' }); await B.click('#tabs button[data-v="home"]'); await B.waitForTimeout(150);
await B.screenshot({ path: path.join(OUT, 'mese-desktop-dark.png'), fullPage: true });
await B.click('#tabs button[data-v="home"]');
await B.emulateMedia({ media: 'print', colorScheme: 'light' });
const pdf = await B.pdf({ path: path.join(OUT, 'mese.pdf'), format: 'A4', printBackground: true });
const pagine = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
ok(pagine >= 1 && pagine <= 4, `PDF del mese: ${pagine} pagine`);

// ── 6. installabilità ──
sezione('6. Installabilità');
// i contesti di Playwright sono "incognito" e Chromium lì non installa niente:
// per questo controllo serve un profilo vero, su disco
{
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'soldi-profilo-'));
  const pc = await chromium.launchPersistentContext(prof, { executablePath: CHROME });
  const pp = pc.pages()[0] ?? await pc.newPage();
  await pp.goto(urlDi(sLocale)); await pp.waitForLoadState('networkidle');
  await attendi(() => pp.evaluate(() => !!navigator.serviceWorker.controller), 8000);
  const pcdp = await pc.newCDPSession(pp);
  let inst = { installabilityErrors: ['?'] };
  await attendi(async () => (inst = await pcdp.send('Page.getInstallabilityErrors')).installabilityErrors.length === 0, 8000);
  ok(inst.installabilityErrors.length === 0, 'installabile (manifest, icone, service worker)' + (inst.installabilityErrors.length ? ': ' + JSON.stringify(inst.installabilityErrors) : ''));
  await pc.close(); fs.rmSync(prof, { recursive: true, force: true });
}

// ── aggiornamento: una versione nuova arriva sul telefono da sola ──
sezione('Aggiornamento dell\'app installata');
{
  const copia = fs.mkdtempSync(path.join(os.tmpdir(), 'soldi-pub-'));
  fs.cpSync(DIR, copia, { recursive: true });
  const sv = await server(false, copia);
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'soldi-profilo-'));
  const pc = await chromium.launchPersistentContext(prof, { executablePath: CHROME, viewport: { width: 390, height: 844 } });
  const pp = pc.pages()[0] ?? await pc.newPage(); sorveglia(pp, 'agg');
  await pp.goto(urlDi(sv)); await pp.waitForLoadState('networkidle');
  ok(await attendi(() => pp.evaluate(() => !!navigator.serviceWorker.controller), 8000), 'prima versione installata');
  await pp.reload(); await pp.waitForLoadState('networkidle');
  ok(await pp.isHidden('#agg'), 'senza versioni nuove nessun avviso');
  const pubblica = n => {
    fs.writeFileSync(path.join(copia, 'sw.js'), fs.readFileSync(path.join(DIR, 'sw.js'), 'utf8').replace(/soldi-[0-9a-f]{10}/, 'soldi-prova0000' + n));
    fs.writeFileSync(path.join(copia, 'index.html'), fs.readFileSync(path.join(DIR, 'index.html'), 'utf8').replace('</body>', `<i id="versione-${n}"></i></body>`));
  };
  // 1. nessun modulo aperto: si ricarica da solo, senza navigazione
  pubblica(1);
  await pp.evaluate(() => dispatchEvent(new Event('online'))); // come il ritorno in primo piano
  ok(await attendi(() => pp.evaluate(() => !!document.getElementById('versione-1')), 10000), 'versione nuova presa da sola, senza toccare niente');
  // 2. mentre scrivi un movimento: non ricarica, compare il pulsante
  await pp.waitForLoadState('networkidle');
  await pp.click('#fab'); await pp.fill('#tAmt', '5');
  pubblica(2);
  await pp.evaluate(() => dispatchEvent(new Event('online')));
  ok(await attendi(() => pp.isVisible('#agg'), 10000), 'con un movimento a metà: niente ricarica, compare "Ricarica"');
  ok(await pp.inputValue('#tAmt') === '5', 'e l\'importo che stavi scrivendo è ancora lì');
  await pp.click('#tCancel'); await pp.click('#aggOra');
  ok(await attendi(() => pp.evaluate(() => !!document.getElementById('versione-2')), 8000), '"Ricarica" porta alla versione nuova');
  await pc.close(); sv.close(); fs.rmSync(prof, { recursive: true, force: true }); fs.rmSync(copia, { recursive: true, force: true });
}
const man = await cdp.send('Page.getAppManifest');
const mj = JSON.parse(man.data ?? '{}');
ok(mj.short_name === 'Soldi' && mj.name === 'Soldi di Davide' && mj.display === 'standalone', `manifest: ${mj.name} / ${mj.short_name} / ${mj.display}`);
ok(await A.evaluate(async () => (await fetch('icone/apple-touch-icon.png')).ok && !!document.querySelector('link[rel=apple-touch-icon]')), 'apple-touch-icon presente');
ok(await A.evaluate(async () => { const k = await caches.keys(); const c = await caches.open(k.find(x => x.startsWith('soldi-')));
  return !(await c.keys()).some(r => r.url.includes('supabase.co')); }), 'nessuna chiamata a Supabase nella cache del service worker');

// ── 1c. uscita ──
sezione('Esci');
await A.click('#goSet'); await A.click('#uOut'); await A.click('#askYes');
ok(await attendi(() => A.isVisible('#login')), 'dopo "Esci" torna la schermata di accesso');
ok(await A.evaluate(() => !localStorage.getItem('dv_t') && !localStorage.getItem('dv_auth') && TX.length === 0), 'dati e sessione tolti dal dispositivo');
ok(DB.transactions.size > 0, 'sul server restano tutti');

sezione('Console');
ok(errori.length === 0, errori.length ? `errori:\n    ${errori.join('\n    ')}` : 'nessun errore JS né pageerror');
console.log(`\nChiamate al finto Supabase: ${JSON.stringify(contatori)}`);
await browser.close(); sLocale.close(); sCloud.close();
console.log(falliti ? `\n${falliti} controlli falliti` : '\nTutto a posto.');
process.exit(falliti ? 1 : 0);
