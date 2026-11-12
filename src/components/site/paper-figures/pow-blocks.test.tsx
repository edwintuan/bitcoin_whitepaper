import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PowBlocks from './pow-blocks';

/** The diagram on page 3 of the paper. */
describe('the paper’s proof-of-work diagram', () => {
  const draw = () => render(<PowBlocks />).container;

  it('has two arrows: one into the first block, one from the first block into the second', () => {
    const arrows = [...draw().querySelectorAll('polyline')];
    expect(arrows).toHaveLength(2);
    for (const arrow of arrows) expect(arrow.getAttribute('marker-end')).toMatch(/^url\(#/);
  });

  it('draws two blocks, each holding five boxes', () => {
    // Prev Hash, Nonce, Tx, Tx and a box of dots, inside the box of the block itself.
    expect(draw().querySelectorAll('rect')).toHaveLength(12);
  });

  it('labels every box as the paper does, the dots included', () => {
    const labels = [...draw().querySelectorAll('g > text')].map((text) => text.textContent);
    expect(labels).toEqual(['Prev Hash', 'Nonce', 'Tx', 'Tx', '...', 'Prev Hash', 'Nonce', 'Tx', 'Tx', '...']);
  });

  it('writes “Block” inside each block, at its top left', () => {
    const container = draw();
    const outer = [...container.querySelectorAll('rect')].filter((rect) => Number(rect.getAttribute('height')) > 60);
    const names = [...container.querySelectorAll('svg > text')].filter((text) => text.textContent === 'Block');
    expect(outer).toHaveLength(2);
    expect(names).toHaveLength(2);
    names.forEach((name, index) => {
      const box = outer[index];
      const [x, y] = [Number(name.getAttribute('x')), Number(name.getAttribute('y'))];
      expect(x).toBeGreaterThan(Number(box.getAttribute('x')));
      expect(y).toBeGreaterThan(Number(box.getAttribute('y')));
      expect(y).toBeLessThan(Number(box.getAttribute('y')) + Number(box.getAttribute('height')) / 3);
    });
  });
});
