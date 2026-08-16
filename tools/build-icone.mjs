#!/usr/bin/env node
/**
 * Rigenera le icone PNG delle PWA dai due SVG di ogni cartella icone/.
 *
 *   node tools/build-icone.mjs                     tutte
 *   node tools/build-icone.mjs pwa/viaggio/icone   solo una
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const CARTELLE = process.argv.length > 2 ? process.argv.slice(2) : ['pwa/icone', 'pwa/viaggio/icone'];
const MISURE = [
  ['icona.svg', 'icona-192.png', 192],
  ['icona.svg', 'icona-512.png', 512],
  ['icona.svg', 'apple-touch-icon.png', 180],
  ['icona-maskable.svg', 'icona-maskable-512.png', 512],
];

const b = await chromium.launch({ executablePath: CHROME });
for (const dir of CARTELLE) {
  console.log(dir + '/');
  for (const [src, out, size] of MISURE) {
    const p = await b.newPage({ viewport: { width: size, height: size } });
    await p.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>`
      + fs.readFileSync(path.join(dir, src), 'utf8'));
    await p.waitForTimeout(120);
    await p.screenshot({ path: path.join(dir, out), omitBackground: true });
    await p.close();
    console.log('  ' + out);
  }
}
await b.close();
