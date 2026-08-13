#!/usr/bin/env node
/**
 * Verifica di rendering per i road book, prima della pubblicazione.
 *
 *   node tools/verify.mjs viaggi/<cartella>/roadbook.html
 *
 * Esegue i controlli obbligatori descritti in CLAUDE.md:
 *   1. nessun errore JS in console
 *   2. resa in tema chiaro e scuro
 *   3. resa a 390 px senza scroll orizzontale
 *   4. PDF A4 di stampa, con conteggio pagine
 *   5. conteggio degli elementi generati in JS
 *
 * Gli output (screenshot, PDF, anteprima) finiscono in out/, che è ignorato
 * da git. Esce con codice 1 se un controllo fallisce.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = process.env.CHROME_PATH
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const src = process.argv[2];
if (!src) {
  console.error('Uso: node tools/verify.mjs <percorso/roadbook.html>');
  process.exit(2);
}
if (!fs.existsSync(CHROME)) {
  console.error(`Chromium non trovato in ${CHROME}. Imposta CHROME_PATH.`);
  process.exit(2);
}

const name = path.basename(path.dirname(path.resolve(src)));
const out = path.resolve('out', name);
fs.mkdirSync(out, { recursive: true });

// Il sorgente è il *contenuto* dell'Artifact: niente doctype, html, head, body.
// Qui lo avvolgiamo nello stesso scheletro che la piattaforma aggiunge in
// pubblicazione, per verificarlo nelle condizioni reali.
const body = fs.readFileSync(src, 'utf8');
for (const tag of ['<!doctype', '<html', '<head>', '<body']) {
  if (body.toLowerCase().includes(tag)) {
    console.error(`Il sorgente contiene "${tag}": va rimosso prima di pubblicare.`);
    process.exit(1);
  }
}
const preview = path.join(out, 'preview.html');
fs.writeFileSync(preview, '<!doctype html><html><head><meta charset="utf8">'
  + '<meta name="viewport" content="width=device-width,initial-scale=1">'
  + '<style>:root{color-scheme:light}body{margin:0}img{max-width:100%}</style>'
  + `</head><body>${body}</body></html>`);
const url = 'file://' + preview;

const problems = [];
const browser = await chromium.launch({ executablePath: CHROME });

const VIEWS = [
  { label: 'chiaro',  theme: 'light', width: 1280, height: 1000 },
  { label: 'scuro',   theme: 'dark',  width: 1280, height: 1000 },
  { label: 'mobile',  theme: 'light', width: 390,  height: 844  },
];

let baseline = null;

for (const v of VIEWS) {
  const page = await browser.newPage({
    viewport: { width: v.width, height: v.height },
    colorScheme: v.theme,
  });
  page.on('pageerror', e => problems.push(`[${v.label}] errore JS: ${e.message}`));
  page.on('console', m => {
    if (m.type() === 'error') problems.push(`[${v.label}] console: ${m.text()}`);
  });

  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(400);

  const stats = await page.evaluate(() => {
    const n = sel => document.querySelectorAll(sel).length;
    return {
      giornate: n('.day'),
      tappe: n('ol.tl li'),
      menu: n('.menu'),
      opzioni: n('.opt'),
      fermate: n('.stopdot'),
      tratte: n('#map path'),
      tabelle: n('table'),
      link: n('a[href^="http"]'),
      overflowX: document.documentElement.scrollWidth
        > document.documentElement.clientWidth,
      // elementi che sbordano lateralmente senza un contenitore scrollabile
      sbordano: [...document.querySelectorAll('body *')]
        .filter(el => {
          const r = el.getBoundingClientRect();
          if (r.width === 0) return false;
          if (r.right <= innerWidth + 1 && r.left >= -1) return false;
          for (let p = el.parentElement; p; p = p.parentElement) {
            if (getComputedStyle(p).overflowX !== 'visible') return false;
          }
          return true;
        })
        .map(el => el.tagName.toLowerCase()
          + (el.className && typeof el.className === 'string'
            ? '.' + el.className.trim().split(/\s+/).join('.') : ''))
        .slice(0, 5),
    };
  });

  if (stats.overflowX) problems.push(`[${v.label}] la pagina scrolla in orizzontale`);
  if (stats.sbordano.length) {
    problems.push(`[${v.label}] elementi che sbordano: ${stats.sbordano.join(', ')}`);
  }
  if (stats.giornate === 0) problems.push(`[${v.label}] nessuna giornata generata`);

  const { overflowX, sbordano, ...counts } = stats;
  if (baseline === null) baseline = counts;
  else for (const [k, val] of Object.entries(counts)) {
    if (baseline[k] !== val) {
      problems.push(`[${v.label}] ${k}: ${val} invece di ${baseline[k]}`);
    }
  }

  await page.screenshot({ path: path.join(out, `${v.label}.png`) });
  await page.close();
  console.log(`  ${v.label.padEnd(7)} ok  ${JSON.stringify(counts)}`);
}

// PDF di stampa
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'load' });
await page.emulateMedia({ media: 'print' });
await page.waitForTimeout(300);
const pdfPath = path.join(out, `${name}.pdf`);
await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
await page.close();
await browser.close();

const pdf = fs.readFileSync(pdfPath);
const pagine = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
console.log(`  stampa  ok  ${pagine} pagine A4, ${Math.round(pdf.length / 1024)} KB`);
if (pagine === 0) problems.push('il PDF di stampa non contiene pagine');

const kb = Math.round(Buffer.byteLength(body) / 1024);
console.log(`  peso    ${kb} KB` + (kb > 16 * 1024 ? '  ⚠ oltre il limite di 16 MB' : ''));
if (kb > 16 * 1024) problems.push('il sorgente supera il limite di 16 MB');

console.log();
if (problems.length) {
  console.error(`${problems.length} problemi:`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`Tutti i controlli superati. Output in ${path.relative(process.cwd(), out)}/`);
