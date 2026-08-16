#!/usr/bin/env node
/** Rigenera le icone PNG della PWA dai due SVG in pwa/icone/. */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const b = await chromium.launch({ executablePath: CHROME });
for (const [src, out, size] of [
  ['icona.svg', 'icona-192.png', 192], ['icona.svg', 'icona-512.png', 512],
  ['icona.svg', 'apple-touch-icon.png', 180],
  ['icona-maskable.svg', 'icona-maskable-512.png', 512],
]) {
  const p = await b.newPage({ viewport: { width: size, height: size } });
  await p.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>`
    + fs.readFileSync('pwa/icone/' + src, 'utf8'));
  await p.waitForTimeout(120);
  await p.screenshot({ path: 'pwa/icone/' + out, omitBackground: true });
  await p.close();
  console.log('  ' + out);
}
await b.close();
