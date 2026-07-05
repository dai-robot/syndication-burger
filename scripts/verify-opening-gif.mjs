/**
 * オープニング GIF の簡易検証
 * npm run verify:opening
 */
import { readFileSync } from 'node:fs';

const path = new URL('../public/syndication_burger_opening.gif', import.meta.url);
const buf = readFileSync(path);

if (buf.slice(0, 6).toString() !== 'GIF89a') {
  throw new Error('Not a GIF89a file');
}

const hasNetscape = buf.includes(Buffer.from('NETSCAPE2.0'));
if (!hasNetscape) {
  throw new Error('Missing NETSCAPE loop extension');
}

const sizeKb = (buf.length / 1024).toFixed(1);
if (buf.length < 50_000) {
  throw new Error(`GIF too small (${sizeKb} KB) — likely corrupt`);
}

console.log(`OK: syndication_burger_opening.gif (${sizeKb} KB, NETSCAPE=${hasNetscape})`);
