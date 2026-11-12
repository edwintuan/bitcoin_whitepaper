#!/usr/bin/env node
/**
 * Cuts the Chinese fonts down to the characters this site uses, and splits
 * them by when a page needs them.
 *
 * A complete Noto Sans HK or Noto Serif HK weight is one to ten megabytes.
 * The site's copy is fixed, so each weight can be reduced to the characters
 * that appear in it. Each weight then becomes up to three files, told apart
 * in the stylesheet by `unicode-range`, so that a browser fetches only what
 * the text in front of it calls for:
 *
 * - the Chinese text itself (a few hundred kilobytes);
 * - the symbols the Latin fonts lack: arrows, check marks and the like (a
 *   few kilobytes), so that an arrow in an English sentence does not pull in
 *   the Chinese text;
 * - for the sans weights, the handful of characters an English page shows
 *   before anything is pressed: the paper's Chinese title in the hero and the
 *   language switch (a few kilobytes).
 *
 * Run this again whenever the copy gains characters; src/styles/fonts.test.ts
 * fails until you do.
 *
 *   npm run fonts
 *
 * Reads the full fonts from node_modules (dev dependencies) and writes
 * src/assets/fonts/*.woff2, src/assets/fonts/charset.txt and
 * src/styles/fonts-hk.css, all of which are committed.
 */
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Blob, Face } from 'harfbuzzjs';
import subsetFont from 'subset-font';
import { collectCharset } from './charset.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'assets', 'fonts');
const MODULES = join(ROOT, 'node_modules');

/** Each weight the site sets Chinese in, and the full font to cut it from. */
const FACES = [
  { name: 'noto-sans-hk-400', family: 'Noto Sans HK', weight: 400, first: true, source: '@expo-google-fonts/noto-sans-hk/400Regular/NotoSansHK_400Regular.ttf' },
  { name: 'noto-sans-hk-500', family: 'Noto Sans HK', weight: 500, first: true, source: '@expo-google-fonts/noto-sans-hk/500Medium/NotoSansHK_500Medium.ttf' },
  { name: 'noto-sans-hk-900', family: 'Noto Sans HK', weight: 900, first: true, source: '@expo-google-fonts/noto-sans-hk/900Black/NotoSansHK_900Black.ttf' },
  { name: 'noto-serif-hk-400', family: 'Noto Serif HK', weight: 400, first: false, source: '@expo-google-fonts/noto-serif-hk/400Regular/NotoSerifHK_400Regular.ttf' },
  { name: 'noto-serif-hk-700', family: 'Noto Serif HK', weight: 700, first: false, source: '@expo-google-fonts/noto-serif-hk/700Bold/NotoSerifHK_700Bold.ttf' },
];

/**
 * The blocks of Unicode that hold Chinese text and its punctuation. The face
 * with the Chinese text claims these whole: the list stays short, and a
 * character of these blocks that the copy does not use falls to the system.
 */
const CJK_BLOCKS = [
  [0x2e80, 0x2fdf], // radicals
  [0x3000, 0x303f], // CJK symbols and punctuation
  [0x3400, 0x4dbf], // extension A
  [0x4e00, 0x9fff], // unified ideographs
  [0xf900, 0xfaff], // compatibility ideographs
  [0xfe30, 0xfe4f], // compatibility forms
  [0xff00, 0xffef], // full-width forms
];

const code = (char) => char.codePointAt(0);

/** Every character a font file has a glyph for. */
function charactersOf(sfnt) {
  const blob = new Blob(sfnt);
  const face = new Face(blob, 0);
  const held = new Set(face.collectUnicodes());
  face.destroy?.();
  blob.destroy?.();
  return held;
}
const isCjk = (char) => CJK_BLOCKS.some(([from, to]) => code(char) >= from && code(char) <= to);
const hex = (value) => value.toString(16).toUpperCase().padStart(4, '0');

/** `unicode-range` for exactly these characters, runs of neighbours written as ranges. */
function exactRange(chars) {
  const codes = [...new Set(chars.map(code))].sort((a, b) => a - b);
  const parts = [];
  for (let i = 0; i < codes.length; i++) {
    let end = i;
    while (end + 1 < codes.length && codes[end + 1] === codes[end] + 1) end++;
    parts.push(end > i ? `U+${hex(codes[i])}-${hex(codes[end])}` : `U+${hex(codes[i])}`);
    i = end;
  }
  return parts.join(', ');
}

/**
 * What an English page shows in Chinese before the reader presses anything:
 * the paper's title under the English one, and the language switch. Read from
 * the copy, so that it follows the copy.
 */
async function firstPaintChars() {
  const ui = await readFile(join(ROOT, 'src', 'content', 'ui.ts'), 'utf8');
  const title = /title:\s*\{[^}]*?zh:\s*\[([^\]]+)\]/s.exec(ui);
  if (!title) throw new Error('Could not find the hero title in src/content/ui.ts');
  return [...new Set(`${title[1]}繁`)].filter((char) => code(char) > 0x7f && isCjk(char));
}

const charset = collectCharset(ROOT);
const cjk = charset.filter(isCjk);
const symbols = charset.filter((char) => !isCjk(char));
const first = await firstPaintChars();

await mkdir(OUT, { recursive: true });
for (const file of await readdir(OUT)) if (file.endsWith('.woff2')) await rm(join(OUT, file));

const report = (name, full, subset) =>
  console.log(`${name.padEnd(34)} ${(full / 1024).toFixed(0).padStart(6)} kB → ${(subset / 1024).toFixed(1).padStart(6)} kB`);

/** One @font-face rule. */
const rule = (face, file, range) => `@font-face {
  font-family: '${face.family}';
  font-style: normal;
  font-weight: ${face.weight};
  font-display: swap;
  src: url('../assets/fonts/${file}') format('woff2');
  unicode-range: ${range};
}`;

const rules = [];
/** Characters the copy uses that a source font does not hold: these would be drawn by whatever the reader's system has. */
const absent = new Map();
for (const face of FACES) {
  const full = await readFile(join(MODULES, face.source));
  const held = charactersOf(full);
  const lacking = charset.filter((char) => !held.has(code(char)));
  if (lacking.length > 0) absent.set(face.name, lacking.join(''));
  const cut = async (suffix, chars) => {
    const file = `${face.name}${suffix}.woff2`;
    const subset = await subsetFont(full, chars.join(''), { targetFormat: 'woff2' });
    await writeFile(join(OUT, file), subset);
    report(file, full.length, subset.length);
    return file;
  };

  rules.push(rule(face, await cut('', cjk), CJK_BLOCKS.map(([from, to]) => `U+${hex(from)}-${hex(to)}`).join(', ')));
  rules.push(rule(face, await cut('-symbols', symbols), exactRange(symbols)));
  // Declared after the face it overlaps: of two faces that claim a character, the later one is asked first.
  if (face.first) rules.push(rule(face, await cut('-first', first), exactRange(first)));
}

if (absent.size > 0) {
  console.error('\nThe copy uses characters these fonts do not hold. Write them another way, or draw them:');
  for (const [name, chars] of absent) console.error(`  ${name}: ${chars}`);
  process.exitCode = 1;
}

await writeFile(join(OUT, 'charset.txt'), `${charset.join('')}\n`);
await writeFile(
  join(ROOT, 'src', 'styles', 'fonts-hk.css'),
  `/*
 * Written by scripts/subset-fonts.mjs (\`npm run fonts\`). Do not edit by hand.
 *
 * Noto Sans HK and Noto Serif HK, cut down to the characters this site uses
 * and split by unicode-range: the Chinese text, the symbols the Latin fonts
 * lack, and the few characters an English page shows at first paint. Checked
 * by fonts.test.ts. Both families are licensed under the SIL Open Font
 * License 1.1.
 */
${rules.join('\n\n')}
`,
);
console.log(`${charset.length} characters: ${cjk.length} Chinese, ${symbols.length} symbols, ${first.length} at first paint.`);
