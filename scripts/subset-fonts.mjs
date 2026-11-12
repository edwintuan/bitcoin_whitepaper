#!/usr/bin/env node
/**
 * Cuts the Chinese fonts down to the characters this site uses.
 *
 * A complete Noto Sans HK or Noto Serif HK weight is one to ten megabytes.
 * The site's copy is fixed, so each weight can be reduced to the characters
 * that appear in it: a few hundred kilobytes. Run this again whenever the
 * copy gains characters; src/styles/fonts.test.ts fails until you do.
 *
 *   npm run fonts
 *
 * Reads the full fonts from node_modules (dev dependencies) and writes
 * src/assets/fonts/*.woff2 and src/assets/fonts/charset.txt, which are
 * committed.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';
import { collectCharset } from './charset.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'assets', 'fonts');
const MODULES = join(ROOT, 'node_modules');

/** Output file name → full font to cut it from. */
const FONTS = {
  'noto-sans-hk-400.woff2': '@fontsource/noto-sans-hk/files/noto-sans-hk-chinese-hongkong-400-normal.woff2',
  'noto-sans-hk-500.woff2': '@fontsource/noto-sans-hk/files/noto-sans-hk-chinese-hongkong-500-normal.woff2',
  'noto-sans-hk-900.woff2': '@fontsource/noto-sans-hk/files/noto-sans-hk-chinese-hongkong-900-normal.woff2',
  'noto-serif-hk-400.woff2': '@expo-google-fonts/noto-serif-hk/400Regular/NotoSerifHK_400Regular.ttf',
  'noto-serif-hk-700.woff2': '@expo-google-fonts/noto-serif-hk/700Bold/NotoSerifHK_700Bold.ttf',
};

const charset = collectCharset(ROOT);
const text = charset.join('');
await mkdir(OUT, { recursive: true });

for (const [name, source] of Object.entries(FONTS)) {
  const full = await readFile(join(MODULES, source));
  const subset = await subsetFont(full, text, { targetFormat: 'woff2' });
  await writeFile(join(OUT, name), subset);
  console.log(`${name.padEnd(26)} ${(full.length / 1024).toFixed(0).padStart(6)} kB → ${(subset.length / 1024).toFixed(0).padStart(4)} kB`);
}

await writeFile(join(OUT, 'charset.txt'), `${text}\n`);
console.log(`${charset.length} characters listed in src/assets/fonts/charset.txt`);
