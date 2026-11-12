// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The parts of "Look" in docs/authoring.md that can be read off the source,
 * for the network figure and the term visuals that go with it: one frame and
 * nothing boxed inside it, solid shapes, the site's own focus ring, no small text.
 */

const STYLESHEET = 'src/figures/network/network.css';

const COMPONENTS = [
  'src/figures/NetworkSim.tsx',
  'src/figures/network/NetGraph.tsx',
  'src/figures/network/NetworkScene.tsx',
  'src/figures/network/NodePanel.tsx',
  'src/figures/network/WireScene.tsx',
];

const VISUALS = ['peer-to-peer', 'mempool', 'fork', 'longest-chain'].map((id) => `src/glossary/visuals/${id}.tsx`);

/** The smallest text the site sets, in pixels. */
const SMALLEST_TEXT = 11;

/**
 * The only edges the figure draws on all four sides: form controls, and the
 * dashed edge that is the offline state itself (on a node and in the key).
 */
const MAY_HAVE_A_BORDER = [
  '.net-panel-close',
  '.net-agent input',
  '.net-node[data-online="false"]::before',
  '.net-swatch[data-look="offline"]',
];

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

describe('the look of the network figure', () => {
  it('reads the stylesheet it claims to check', () => {
    expect(all.length).toBeGreaterThan(100);
    for (const selector of MAY_HAVE_A_BORDER) expect(of(selector).length, selector).toBeGreaterThan(0);
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

  it('puts a border on all four sides of form controls and of the offline state only', () => {
    const boxed = all.filter(
      ({ selector, property, value }) =>
        property === 'border' && !/^(0|none)$/.test(value) && !MAY_HAVE_A_BORDER.includes(selector),
    );
    expect(boxed.map(show)).toEqual([]);
    // Of those, only the offline state is dashed, and only a control is solid.
    for (const selector of MAY_HAVE_A_BORDER) {
      const [border] = of(selector).filter(({ property }) => property === 'border');
      expect(border.value, selector).toMatch(
        selector.includes('offline') || selector.includes('online') ? /dashed/ : /solid/,
      );
    }
  });

  it('draws nodes and messages as solid shapes: no stroke on a mark, no edge on a tile', () => {
    const marks = all.filter(({ selector }) => /\.net-pk-/.test(selector));
    expect(marks.length).toBeGreaterThan(0);
    expect(marks.filter(({ property }) => property.startsWith('stroke')).map(show)).toEqual([]);
    const tiles = all.filter(({ selector }) => /^\.net-node(\[[^\]]+\])*$/.test(selector));
    expect(
      tiles.filter(({ property }) => /^(border|box-shadow)/.test(property) && property !== 'border').map(show),
    ).toEqual([]);
    expect(of('.net-node').find(({ property }) => property === 'border')?.value).toBe('0');
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

  it('switches every animation off under reduced motion with a rule that outweighs the one that starts it', () => {
    // Weight of a selector: classes, attributes and pseudo-classes count; later rules win ties.
    const weight = (selector: string) => (selector.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g) ?? []).length;
    const css = read(STYLESHEET).replace(/\/\*[\s\S]*?\*\//g, '');
    const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    const off = [...reduced.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(([, , body]) => /animation:\s*none/.test(body))
      .flatMap(([, selector]) => selector.split(',').map((part) => part.trim().replace(/\s+/g, ' ')));
    const animated = all.filter(({ property, value }) => property === 'animation' && value !== 'none');
    expect(animated.length).toBeGreaterThan(0);
    for (const { selector } of animated) {
      // The rule that stops it names the same element and weighs at least as much.
      const target = selector.split(' ').at(-1);
      const stops = off.filter(
        (candidate) => candidate.split(' ').at(-1) === target && weight(candidate) >= weight(selector),
      );
      expect(stops, selector).not.toEqual([]);
    }
  });

  it('eases the hover states that change colour', () => {
    for (const selector of ['.net-panel-close', '.net-seq-name']) {
      const transition = of(selector).find(({ property }) => property === 'transition');
      expect(transition?.value, selector).toBe('background-color var(--duration-quick) var(--ease-out)');
    }
  });
});

describe('the look of the term visuals of section 5', () => {
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
