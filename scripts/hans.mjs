#!/usr/bin/env node
/**
 * Writes the table the site uses to show its Chinese copy in Simplified
 * characters: src/i18n/hans-table.ts.
 *
 * The copy is written once, in Traditional Chinese as used in Hong Kong. The
 * Simplified edition is derived from it: whole words that differ between the
 * two (scripts/hans-terms.mjs) are swapped first, then every remaining
 * character is mapped to its Simplified form. The full conversion dictionary
 * is several hundred kilobytes; the copy is fixed, so only the characters it
 * uses are kept, and the table is a few kilobytes.
 *
 * Run this again whenever the copy gains characters; src/i18n/hans.test.ts
 * fails until you do. Then run `npm run fonts`, since the Simplified
 * characters need glyphs too.
 *
 *   npm run hans
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as OpenCC from 'opencc-js';
import { collectCharset } from './charset.mjs';
import { HANS_TERMS } from './hans-terms.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const TABLE_FILE = 'hans-table.ts';

/** The file's text for the copy as it stands. */
export function buildTable(root = ROOT) {
  const convert = OpenCC.Converter({ from: 'hk', to: 'cn' });
  const pairs = collectCharset(root, { skipFiles: [TABLE_FILE] })
    .map((char) => [char, convert(char)])
    // One character in, one out; anything else would shift the text around it.
    .filter(([from, to]) => from !== to && [...to].length === 1);
  const terms = [...HANS_TERMS].sort((a, b) => b[0].length - a[0].length);
  return `// Written by scripts/hans.mjs (npm run hans). Do not edit by hand.

/** Words replaced whole, longest first: [Hong Kong usage, mainland usage]. */
export const HANS_TERMS: readonly (readonly [string, string])[] = ${JSON.stringify(terms)};

/** Traditional characters the copy uses, and the Simplified form of each, in the same order. */
export const HANS_FROM = '${pairs.map(([from]) => from).join('')}';
export const HANS_TO = '${pairs.map(([, to]) => to).join('')}';
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = join(ROOT, 'src', 'i18n', TABLE_FILE);
  const text = buildTable();
  writeFileSync(file, text);
  console.log(`${file}: ${/HANS_FROM = '(.*)'/.exec(text)[1].length} characters, ${HANS_TERMS.length} terms`);
}
