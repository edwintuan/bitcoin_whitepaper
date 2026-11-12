import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Arrow, Box, Diagram, Label } from './kit';

function setup() {
  const { container } = render(
    <Diagram width={600} height={120} label="Two boxes joined by an arrow">
      <Box x={10} y={10} w={100} h={40} label="Block" />
      <Box x={200} y={10} w={100} h={40} lines={['Prev', 'Hash']} />
      <Label x={10} y={90}>
        Owner 1
      </Label>
      <Arrow from={[110, 30]} to={[200, 30]} />
    </Diagram>,
  );
  return container.querySelector('svg') as SVGSVGElement;
}

describe('the paper-diagram kit', () => {
  it('draws a labelled image at the size it was designed for', () => {
    const svg = setup();
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Two boxes joined by an arrow');
    expect(svg.getAttribute('viewBox')).toBe('0 0 600 120');
    expect(svg.style.maxWidth).toBe('600px');
  });

  it('never shrinks so far that its 13 px labels fall under 11 px: narrow screens scroll instead', () => {
    const svg = setup();
    const floor = Number.parseFloat(svg.style.minWidth);
    expect(floor).toBeLessThanOrEqual(600);
    expect((13 * floor) / 600).toBeGreaterThanOrEqual(11);
  });

  it('breaks a box label over lines and points an arrow with a head of its own', () => {
    const svg = setup();
    expect([...svg.querySelectorAll('text')].map((text) => text.textContent)).toEqual(['Block', 'Prev', 'Hash', 'Owner 1']);
    const marker = svg.querySelector('marker')?.id;
    expect(marker).toBeTruthy();
    expect(svg.querySelector('polyline')?.getAttribute('marker-end')).toBe(`url(#${marker})`);
  });
});
