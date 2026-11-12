import { render } from '@testing-library/react';
import type { ComponentType } from 'react';
import { describe, expect, it } from 'vitest';

/** Every redrawn diagram of the paper, by file name. */
const modules = import.meta.glob<{ default: ComponentType }>(['./*.tsx', '!./*.test.tsx', '!./kit.tsx'], { eager: true });

/** The smallest text allowed on the page. */
const FLOOR = 11;

describe('the paper’s diagrams, at their smallest', () => {
  const figures = Object.entries(modules);

  it('are all here', () => {
    expect(figures.length).toBe(7);
  });

  it.each(figures)('%s keeps every label at 11 px or more', (_, module) => {
    const Figure = module.default;
    const svg = render(<Figure />).container.querySelector('svg') as SVGSVGElement;
    const drawn = Number(svg.getAttribute('viewBox')?.split(' ')[2]);
    const narrowest = Number.parseFloat(svg.style.minWidth);
    expect(drawn).toBeGreaterThan(0);
    expect(narrowest).toBeGreaterThan(0);
    expect(narrowest).toBeLessThanOrEqual(drawn);

    // A diagram stops shrinking at its minimum width; below that its frame scrolls.
    const scale = narrowest / drawn;
    for (const text of svg.querySelectorAll('text')) {
      const size = Number(text.getAttribute('font-size') ?? 13);
      expect(size * scale, `"${text.textContent}" at ${size} px`).toBeGreaterThanOrEqual(FLOOR - 0.01);
    }
  });
});
