// @vitest-environment node
import { describe, expect, it } from 'vitest';
import attackSource from '@/lib/attack.ts?raw';
import paper from '@/content/whitepaper/11-calculations';
import { markOf, tokenizeListing } from './listing';
import { paperListings } from './tables';
import { portSource } from './trace';

const C = paperListings(paper).code;
const TS = portSource(attackSource).code;

describe('tokenizeListing', () => {
  it('never alters the text: the tokens of every line join back into the line', () => {
    for (const code of [C, TS]) {
      const lines = tokenizeListing(code);
      expect(lines.map((tokens) => tokens.map((token) => token.text).join('')).join('\n')).toBe(code);
    }
  });

  it('marks the words TypeScript adds as keywords, alongside the ones C shares', () => {
    const keywords = tokenizeListing(TS).flatMap((tokens) => tokens.filter((token) => token.kind === 'keyword').map((token) => token.text));
    for (const word of ['export', 'function', 'const', 'let', 'for', 'return', 'if']) expect(keywords).toContain(word);
    // Part of a longer name is not a keyword.
    expect(tokenizeListing('letter = outlet;')[0]).toEqual([{ kind: 'plain', text: 'letter = outlet;' }]);
  });

  it('leaves comments alone, keywords inside them included', () => {
    const comment = tokenizeListing(TS)[2];
    expect(comment).toHaveLength(2);
    expect(comment[1].kind).toBe('comment');
    expect(comment[1].text).toContain(' if ');
  });
});

describe('markOf', () => {
  it('finds the same five statements in the paper’s C and in the port', () => {
    const marks = (code: string) => code.split('\n').map(markOf).filter((mark) => mark !== null);
    const expected = ['p', 'lambda', 'poisson', 'poisson', 'sum', 'return'];
    expect(marks(C)).toEqual(expected);
    expect(marks(TS)).toEqual(expected);
  });
  it('ignores everything else', () => {
    expect(markOf('    int i, k;')).toBeNull();
    expect(markOf('  if (q >= 0.5) return 1.0;')).toBeNull();
    expect(markOf('    double sum = 1.0;')).toBeNull();
  });
});
