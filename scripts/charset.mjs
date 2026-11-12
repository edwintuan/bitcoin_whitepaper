/**
 * The characters the Chinese fonts have to cover: every non-ASCII character
 * written anywhere in the site's source, plus the punctuation Chinese text
 * may need. The page's copy is all in the source, so this is the complete set.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Folders under src whose text never reaches the page. */
const SKIP_DIRS = new Set(['__fixtures__', 'assets']);

/** Files that hold characters only to test for them: the list of renderings the Chinese copy must not use. */
const SKIP_FILES = new Set(['zhChecks.ts']);

/** Punctuation and marks kept available whether or not the copy uses them yet. */
const ALWAYS = '、。，；：？！「」『』（）《》〈〉…—·％／～＋－＝';

function* sourceFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* sourceFiles(path);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) && !SKIP_FILES.has(entry.name)) {
      yield path;
    }
  }
}

/** Sorted, unique, non-ASCII characters used by the site. */
export function collectCharset(root = ROOT) {
  const found = new Set(ALWAYS);
  const add = (text) => {
    for (const char of text) if (char.codePointAt(0) > 0x7f) found.add(char);
  };
  for (const file of sourceFiles(join(root, 'src'))) add(readFileSync(file, 'utf8'));
  add(readFileSync(join(root, 'index.html'), 'utf8'));
  return [...found].sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
}
