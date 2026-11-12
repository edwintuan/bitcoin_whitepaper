// @vitest-environment node
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectCharset } from '../../scripts/charset.mjs';
import { UI } from '../content/ui';

/**
 * The Chinese fonts are cut down to the characters the site uses and split
 * into what a page needs when (scripts/subset-fonts.mjs writes the files and
 * the stylesheet). These checks fail when the copy has gained a character the
 * committed fonts do not hold; `npm run fonts` rebuilds them.
 */
const fonts = join(process.cwd(), 'src', 'assets', 'fonts');
const stylesheet = readFileSync(join(process.cwd(), 'src', 'styles', 'fonts-hk.css'), 'utf8');

/** family-weight of every face the site sets Chinese in. */
const WEIGHTS = ['noto-sans-hk-400', 'noto-sans-hk-500', 'noto-sans-hk-900', 'noto-serif-hk-400', 'noto-serif-hk-700'];
/** The sans weights that carry the few characters an English page shows before anything is pressed. */
const FIRST = ['noto-sans-hk-400', 'noto-sans-hk-500', 'noto-sans-hk-900'];

interface Face {
  file: string;
  family: string;
  weight: string;
  range: string;
  display: string;
}

const faces: Face[] = [...stylesheet.matchAll(/@font-face\s*\{([^}]+)\}/g)].map(([, body]) => {
  const read = (property: string) => new RegExp(`${property}:\\s*([^;]+);`).exec(body)?.[1].trim() ?? '';
  return {
    file: /url\('\.\.\/assets\/fonts\/([^']+)'\)/.exec(body)?.[1] ?? '',
    family: read('font-family'),
    weight: read('font-weight'),
    range: read('unicode-range'),
    display: read('font-display'),
  };
});

/** Whether a unicode-range descriptor takes in this character. */
function inRange(range: string, char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return range.split(',').some((part) => {
    const [from, to = from] = part.trim().replace(/^U\+/i, '').split('-');
    return code >= parseInt(from, 16) && code <= parseInt(to, 16);
  });
}

describe('the Chinese font subsets', () => {
  it('are asked for nothing the fonts cannot draw', () => {
    // No Noto font holds these: left in the copy, they would be drawn by
    // whatever the reader's system has, or as an empty box. The Bitcoin sign
    // and the turn-back arrow are drawn as pictures instead; a cross is ×.
    const unheld = ['₿', '↺', '⋅', '✕', '✗'];
    expect(collectCharset().filter((char) => unheld.includes(char))).toEqual([]);
  });

  it('cover every non-ASCII character the site writes', () => {
    const covered = new Set(readFileSync(join(fonts, 'charset.txt'), 'utf8'));
    const missing = collectCharset().filter((char) => !covered.has(char));
    expect(missing.join(''), 'run `npm run fonts` to rebuild the subsets').toBe('');
  });

  it('give every such character to some face of every weight', () => {
    for (const weight of WEIGHTS) {
      const mine = faces.filter((face) => face.file.startsWith(weight));
      const orphans = collectCharset().filter((char) => !mine.some((face) => inRange(face.range, char)));
      expect(orphans.join(''), `${weight}: no face takes these in`).toBe('');
    }
  });

  it('exist for each weight in use, and stay small', () => {
    for (const weight of WEIGHTS) {
      const size = (suffix: string) => {
        const file = join(fonts, `${weight}${suffix}.woff2`);
        expect(existsSync(file), file).toBe(true);
        return statSync(file).size;
      };
      // The Chinese text itself: a few hundred kilobytes for well over a thousand characters.
      expect(size('')).toBeGreaterThan(20_000);
      expect(size('')).toBeLessThan(600_000);
      // Arrows, check marks and other symbols the Latin fonts lack.
      expect(size('-symbols')).toBeGreaterThan(500);
      expect(size('-symbols')).toBeLessThan(40_000);
    }
    for (const weight of FIRST) {
      const file = join(fonts, `${weight}-first.woff2`);
      expect(existsSync(file), file).toBe(true);
      expect(statSync(file).size).toBeLessThan(12_000);
    }
  });

  it('are the files the stylesheet loads, each with a range of its own, none blocking the text', () => {
    const expected = [...WEIGHTS.flatMap((weight) => [`${weight}.woff2`, `${weight}-symbols.woff2`]), ...FIRST.map((weight) => `${weight}-first.woff2`)];
    expect(faces.map((face) => face.file).sort()).toEqual(expected.sort());
    for (const face of faces) {
      expect(face.range, face.file).not.toBe('');
      expect(face.display, face.file).toBe('swap');
    }
  });

  it('do not make an English page fetch the Chinese text for one line and one button', () => {
    // The paper's Chinese title under the English one, and the language switch.
    const shownInEnglish = [...new Set(`${UI.hero.title.zh.join('')}繁`)].filter((char) => (char.codePointAt(0) ?? 0) > 0x7f);
    for (const weight of FIRST) {
      const first = faces.find((face) => face.file === `${weight}-first.woff2`);
      const whole = faces.find((face) => face.file === `${weight}.woff2`);
      expect(first && whole, weight).toBeTruthy();
      const missing = shownInEnglish.filter((char) => !inRange(first!.range, char));
      expect(missing.join(''), `${weight}-first lacks these`).toBe('');
      // Where two faces claim a character, the one declared later is asked first.
      expect(faces.indexOf(first!), `${weight}-first must come after the whole face`).toBeGreaterThan(faces.indexOf(whole!));
      // The small face is exact: it claims nothing it does not hold.
      expect(first!.range.split(',').length).toBeLessThanOrEqual(shownInEnglish.length);
    }
  });

  it('keep symbols out of the face that holds the Chinese text', () => {
    for (const weight of WEIGHTS) {
      const whole = faces.find((face) => face.file === `${weight}.woff2`)!;
      // An arrow or a check mark in an English sentence must not pull in 200 kB of Chinese.
      for (const symbol of ['→', '↗', '✓', '≠', '×', '…', '’']) expect(inRange(whole.range, symbol), `${weight} takes in ${symbol}`).toBe(false);
      for (const han of ['區', '塊', '，', '。', '「']) expect(inRange(whole.range, han), `${weight} lacks ${han}`).toBe(true);
    }
  });
});
