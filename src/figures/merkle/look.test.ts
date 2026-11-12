import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The parts of "Look" and "Accessibility" in docs/authoring.md that can be
 * read off the source: the figures of sections 7 to 9, the tree they share
 * and the term visuals that go with them.
 */

const STYLESHEETS = [
  'src/figures/merkle/merkle.css',
  'src/components/viz/merkle/tree.css',
  'src/figures/spv/spv.css',
  'src/figures/utxo/utxo.css',
];

/** Components that set sizes inline: the small tree and the seven term visuals. */
const INLINE_STYLED = [
  'src/components/viz/merkle/MiniTree.tsx',
  'src/glossary/visuals/merkle-tree.tsx',
  'src/glossary/visuals/merkle-branch.tsx',
  'src/glossary/visuals/spv.tsx',
  'src/glossary/visuals/utxo.tsx',
  'src/glossary/visuals/change.tsx',
  'src/glossary/visuals/fee.tsx',
  'src/glossary/visuals/block.tsx',
];

/** The smallest text the site sets, in pixels. */
const SMALLEST_TEXT = 11;

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

interface Declaration {
  file: string;
  property: string;
  value: string;
}

/** Every `property: value` of a stylesheet, comments left out. */
function declarations(file: string): Declaration[] {
  const css = read(file).replace(/\/\*[\s\S]*?\*\//g, '');
  return [...css.matchAll(/([\w-]+)\s*:\s*([^;{}]+);/g)].map(([, property, value]) => ({ file, property, value: value.trim() }));
}

const all = STYLESHEETS.flatMap(declarations);
const show = ({ file, property, value }: Declaration) => `${file}: ${property}: ${value}`;
const pixels = (value: string) => [...value.matchAll(/(\d+(?:\.\d+)?)px/g)].map((match) => Number(match[1]));

describe('the look of the figures of sections 7 to 9', () => {
  it('reads the stylesheets it claims to check', () => {
    for (const file of STYLESHEETS) expect(declarations(file).length, file).toBeGreaterThan(5);
  });

  it('never draws an outline: the focus ring is the site’s, and a step points with the shared pointer', () => {
    expect(all.filter(({ property }) => property.startsWith('outline')).map(show)).toEqual([]);
  });

  it('draws no ring around a shape with an inset shadow', () => {
    const rings = all.filter(({ property, value }) => property === 'box-shadow' && /inset\s+0\s+0\s+0\s+\d/.test(value));
    expect(rings.map(show)).toEqual([]);
  });

  it(`sets no text under ${SMALLEST_TEXT} px in a stylesheet`, () => {
    const small = all.filter(
      ({ property, value }) => (property === 'font-size' || property === 'font') && pixels(value).some((size) => size < SMALLEST_TEXT),
    );
    expect(small.map(show)).toEqual([]);
  });

  it(`sets no text under ${SMALLEST_TEXT} px inline`, () => {
    const small = INLINE_STYLED.flatMap((file) =>
      [...read(file).matchAll(/fontSize\s*[:=]\s*["'{]*\s*(\d+(?:\.\d+)?)/g)]
        .filter((match) => Number(match[1]) < SMALLEST_TEXT)
        .map((match) => `${file}: ${match[0]}`),
    );
    expect(small).toEqual([]);
  });
});
