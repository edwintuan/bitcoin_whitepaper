// @vitest-environment node
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectCharset } from '../../scripts/charset.mjs';

/**
 * The Chinese fonts are cut down to the characters the site uses
 * (scripts/subset-fonts.mjs). These checks fail when the copy has gained a
 * character the committed fonts do not hold; `npm run fonts` rebuilds them.
 */
const fonts = join(process.cwd(), 'src', 'assets', 'fonts');
const stylesheet = readFileSync(join(process.cwd(), 'src', 'styles', 'fonts-hk.css'), 'utf8');

const FILES = [
  'noto-sans-hk-400.woff2',
  'noto-sans-hk-500.woff2',
  'noto-sans-hk-900.woff2',
  'noto-serif-hk-400.woff2',
  'noto-serif-hk-700.woff2',
];

describe('the Chinese font subsets', () => {
  it('cover every non-ASCII character the site writes', () => {
    const covered = new Set(readFileSync(join(fonts, 'charset.txt'), 'utf8'));
    const missing = collectCharset().filter((char) => !covered.has(char));
    expect(missing.join(''), 'run `npm run fonts` to rebuild the subsets').toBe('');
  });

  it('exist for each weight in use, and stay small', () => {
    for (const file of FILES) {
      expect(existsSync(join(fonts, file)), file).toBe(true);
      const size = statSync(join(fonts, file)).size;
      expect(size, `${file} is empty`).toBeGreaterThan(20_000);
      expect(size, `${file} is not a subset`).toBeLessThan(600_000);
    }
  });

  it('are the files the stylesheet loads, one face per weight', () => {
    const loaded = [...stylesheet.matchAll(/url\('\.\.\/assets\/fonts\/([^']+)'\)/g)].map((match) => match[1]);
    expect(loaded.sort()).toEqual([...FILES].sort());
    expect(stylesheet.match(/@font-face/g)).toHaveLength(FILES.length);
    expect(stylesheet.match(/font-display: swap/g)).toHaveLength(FILES.length);
  });
});
