#!/usr/bin/env node
/**
 * Rigenera le icone PNG di una PWA dai due SVG della sua cartella icone/.
 *
 *   node tools/build-icone.mjs [cartella-icone ...]
 *
 * Senza argomenti le rigenera tutte, per ogni app dichiarata in
 * tools/app-pwa.mjs.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { APP } from './app-pwa.mjs';

const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const cartelle = process.argv.slice(2).length
  ? process.argv.slice(2)
  : Object.values(APP).map(a => path.join(a.out, 'icone'));

const b = await chromium.launch({ executablePath: CHROME });
for (const dir of cartelle) {
  console.log(dir);
  for (const [src, out, size] of [
    ['icona.svg', 'icona-192.png', 192], ['icona.svg', 'icona-512.png', 512],
    ['icona.svg', 'apple-touch-icon.png', 180],
    ['icona-maskable.svg', 'icona-maskable-512.png', 512],
  ]) {
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
