import { describe, expect, it } from 'vitest';
import { tokenizeCpp } from './cppHighlight';
import type { CppToken } from './cppHighlight';

const kinds = (line: CppToken[]) => line.map((t) => `${t.kind}:${t.text}`);
const rejoin = (lines: CppToken[][]) => lines.map((l) => l.map((t) => t.text).join('')).join('\n');

describe('tokenizeCpp', () => {
  it('returns one token list per source line and loses nothing', () => {
    const code = [
      '#include <math.h>',
      'double AttackerSuccessProbability(double q, int z)',
      '{',
      '    double p = 1.0 - q;   // honest share',
      '    return sum;',
      '}',
      '',
    ].join('\n');
    const lines = tokenizeCpp(code);
    expect(lines).toHaveLength(7);
    expect(rejoin(lines)).toBe(code);
  });

  it('marks keywords and leaves other identifiers plain', () => {
    expect(kinds(tokenizeCpp('if (x) return false;')[0])).toEqual([
      'keyword:if',
      'plain: (x) ',
      'keyword:return',
      'plain: ',
      'keyword:false',
      'plain:;',
    ]);
    // A keyword inside a longer identifier is not a keyword.
    expect(kinds(tokenizeCpp('int interval = notify;')[0])).toEqual([
      'keyword:int',
      'plain: interval = notify;',
    ]);
  });

  it('marks line comments to the end of the line', () => {
    expect(kinds(tokenizeCpp('nBits = 1; // Check range')[0])).toEqual([
      'plain:nBits = ',
      'number:1',
      'plain:; ',
      'comment:// Check range',
    ]);
  });

  it('carries a block comment across lines', () => {
    const lines = tokenizeCpp('a /* one\n two */ b');
    expect(kinds(lines[0])).toEqual(['plain:a ', 'comment:/* one']);
    expect(kinds(lines[1])).toEqual(['comment: two */', 'plain: b']);
  });

  it('marks strings and characters, including escapes', () => {
    expect(kinds(tokenizeCpp(String.raw`s = "a \"b\" // not a comment"; c = '\n';`)[0])).toEqual([
      'plain:s = ',
      String.raw`string:"a \"b\" // not a comment"`,
      'plain:; c = ',
      String.raw`string:'\n'`,
      'plain:;',
    ]);
  });

  it('marks numbers: decimal, hex, floats, suffixes and digit separators', () => {
    const line = "x = 50 * COIN; y = 0x1d00ffff; z = 1.0; w = 210'000; v = 100000000ULL;";
    const numbers = tokenizeCpp(line)[0].filter((t) => t.kind === 'number').map((t) => t.text);
    expect(numbers).toEqual(['50', '0x1d00ffff', '1.0', "210'000", '100000000ULL']);
    // Digits inside an identifier stay part of it.
    expect(tokenizeCpp('uint256 hash2;')[0].some((t) => t.kind === 'number')).toBe(false);
  });

  it('marks a preprocessor line', () => {
    expect(kinds(tokenizeCpp('#include <math.h>')[0])).toEqual(['preproc:#include <math.h>']);
    expect(kinds(tokenizeCpp('  #define COIN 100000000')[0])).toEqual(['plain:  ', 'preproc:#define COIN 100000000']);
  });
});
