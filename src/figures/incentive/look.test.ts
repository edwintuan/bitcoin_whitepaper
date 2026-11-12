// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The parts of "Look" in docs/authoring.md that can be read off the source,
 * for the incentive figure and the term visuals that go with it: one frame and
 * nothing boxed inside it, solid shapes, the site's own focus ring, no small text.
 */

const STYLESHEET = 'src/figures/incentive/incentive.css';

const COMPONENTS = [
  'src/figures/IncentiveSupply.tsx',
  'src/figures/incentive/BlockScene.tsx',
  'src/figures/incentive/HeightBar.tsx',
  'src/figures/incentive/HonestScene.tsx',
  'src/figures/incentive/SupplyScene.tsx',
];

const VISUALS = ['halving', 'coinbase', 'mining-pool'].map((id) => `src/glossary/visuals/${id}.tsx`);

/** The smallest text the site sets, in pixels. */
const SMALLEST_TEXT = 11;

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

interface Declaration {
  selector: string;
  property: string;
  value: string;
}

/** Every `property: value` of the stylesheet with the selector it sits under, comments left out. */
function declarations(file: string): Declaration[] {
  const css = read(file).replace(/\/\*[\s\S]*?\*\//g, '');
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap(([, selector, body]) =>
    [...body.matchAll(/([\w-]+)\s*:\s*([^;]+);/g)].map(([, property, value]) => ({
      selector: selector.trim().replace(/\s+/g, ' '),
      property,
      value: value.trim(),
    })),
  );
}

const all = declarations(STYLESHEET);
const show = ({ selector, property, value }: Declaration) => `${selector} { ${property}: ${value} }`;
const pixels = (value: string) => [...value.matchAll(/(\d+(?:\.\d+)?)px/g)].map((match) => Number(match[1]));
const of = (selector: string) => all.filter((declaration) => declaration.selector === selector);

describe('the look of the incentive figure', () => {
  it('reads the stylesheet it claims to check', () => {
    expect(all.length).toBeGreaterThan(100);
    expect(of('.inc-mini').length).toBeGreaterThan(0);
  });

  it('never draws an outline: the focus ring is the site’s, and a step points with the shared bar', () => {
    expect(all.filter(({ property }) => property.startsWith('outline')).map(show)).toEqual([]);
    expect(read(STYLESHEET)).not.toMatch(/data-hl|data-region/);
    for (const file of COMPONENTS) expect(read(file), file).not.toMatch(/data-hl|data-region/);
  });

  it('draws no ring around a shape with an inset shadow', () => {
    const rings = all.filter(({ property, value }) => property === 'box-shadow' && /inset/.test(value));
    expect(rings.map(show)).toEqual([]);
  });

  it('puts a border on all four sides of nothing: rules above and between, never a box', () => {
    const boxed = all.filter(({ property, value }) => property === 'border' && !/^(0|none)$/.test(value));
    expect(boxed.map(show)).toEqual([]);
  });

  it('leaves the chart’s cursor mark without an edge', () => {
    expect(of('.inc-cursor-dot').map(({ property }) => property)).toEqual(['fill']);
  });

  it(`sets no text under ${SMALLEST_TEXT} px in the stylesheet`, () => {
    const small = all.filter(
      ({ property, value }) =>
        (property === 'font-size' || property === 'font') && pixels(value).some((size) => size < SMALLEST_TEXT),
    );
    expect(small.map(show)).toEqual([]);
  });

  it(`sets no text under ${SMALLEST_TEXT} px inline`, () => {
    const small = [...COMPONENTS, ...VISUALS].flatMap((file) =>
      [...read(file).matchAll(/fontSize\s*[:=]\s*["'{]*\s*(\d+(?:\.\d+)?)/g)]
        .filter((match) => Number(match[1]) < SMALLEST_TEXT)
        .map((match) => `${file}: ${match[0]}`),
    );
    expect(small).toEqual([]);
  });

  it('never dims text with opacity: what is quiet is set in a quieter colour, at full contrast', () => {
    const partial = all.filter(
      ({ property, value }) => property === 'opacity' && Number(value) > 0 && Number(value) < 1,
    );
    expect(partial.map(show)).toEqual([]);
  });

  it('eases the hover state of the buttons inside the block, and keeps them in reach when switched off', () => {
    expect(of('.inc-mini').find(({ property }) => property === 'transition')?.value).toBe(
      'background-color var(--duration-quick) var(--ease-out)',
    );
    // Switched off with aria-disabled, never with the disabled attribute.
    expect(all.some(({ selector }) => /\.inc-mini.*:disabled/.test(selector))).toBe(false);
    expect(of('.inc-mini[aria-disabled="true"]').length).toBeGreaterThan(0);
  });
});

describe('the look of the term visuals of section 6', () => {
  it('draws every shape solid: no stroke on a rectangle, no border around a block', () => {
    for (const file of VISUALS) {
      const source = read(file);
      const outlined = [...source.matchAll(/<rect\b[^>]*>/g)].filter(([rect]) => /\bstroke/.test(rect));
      expect(
        outlined.map(([rect]) => rect),
        file,
      ).toEqual([]);
      expect(source, file).not.toMatch(/\bborder:\s*[`'"]/);
    }
  });

  it('sets the words in a drawing at the size they are shown: a drawing with words is not scaled', () => {
    for (const file of VISUALS) {
      const source = read(file);
      if (!/<text\b/.test(source)) continue;
      // The shared rule stretches a drawing to the width of the card; one with words keeps its own width.
      const svg = source.match(/<svg\b[^>]*>/)?.[0] ?? '';
      expect(svg, file).toMatch(/style=\{\{ width: \w+, maxWidth: '100%' \}\}/);
    }
  });

  it('takes every colour from the tokens', () => {
    for (const file of VISUALS) expect(read(file), file).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
