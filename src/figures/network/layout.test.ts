// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createDirector } from './director';
import { between, place, pointOn, stageHeightFor, tileFor } from './layout';

/** The figure's stage is about this wide beside the text on a desktop, and on a phone. */
const WIDTHS = [550, 324];

describe('place', () => {
  it('maps the corners of the simulation’s square to tiles that just fit inside the stage', () => {
    const stage = { width: 500, height: 300 };
    const tile = { width: 50, height: 40 };
    const topLeft = place({ x: 0.05, y: 0.05 }, stage, tile);
    const bottomRight = place({ x: 0.95, y: 0.95 }, stage, tile);
    expect(topLeft.x - tile.width / 2).toBeCloseTo(3, 6);
    expect(topLeft.y - tile.height / 2).toBeCloseTo(3, 6);
    expect(bottomRight.x + tile.width / 2).toBeCloseTo(stage.width - 3, 6);
    expect(bottomRight.y + tile.height / 2).toBeCloseTo(stage.height - 3, 6);
    expect(place({ x: 0.5, y: 0.5 }, stage, tile)).toEqual({ x: 250, y: 150 });
  });
});

describe('the figure’s network, drawn', () => {
  const { nodes } = createDirector().snapshot();

  it.each(WIDTHS)('keeps every tile inside a stage %i px wide', (width) => {
    const stage = { width, height: stageHeightFor(width) };
    const tile = tileFor(width);
    for (const node of nodes) {
      const at = place(node, stage, tile);
      expect(at.x - tile.width / 2).toBeGreaterThanOrEqual(0);
      expect(at.x + tile.width / 2).toBeLessThanOrEqual(stage.width);
      expect(at.y - tile.height / 2).toBeGreaterThanOrEqual(0);
      expect(at.y + tile.height / 2).toBeLessThanOrEqual(stage.height);
    }
  });

  it.each(WIDTHS)('leaves a clear gap between any two tiles at %i px', (width) => {
    const stage = { width, height: stageHeightFor(width) };
    const tile = tileFor(width);
    const points = nodes.map((node) => place(node, stage, tile));
    for (let a = 0; a < points.length; a++) {
      for (let b = a + 1; b < points.length; b++) {
        const gapX = Math.abs(points[a].x - points[b].x) - tile.width;
        const gapY = Math.abs(points[a].y - points[b].y) - tile.height;
        expect(Math.max(gapX, gapY), `nodes ${a} and ${b}`).toBeGreaterThanOrEqual(8);
      }
    }
  });

  it('uses a smaller tile and a squarer stage on a phone', () => {
    expect(tileFor(324).width).toBeLessThan(tileFor(550).width);
    expect(stageHeightFor(324)).toBeLessThan(stageHeightFor(550));
    expect(stageHeightFor(324) / 324).toBeGreaterThan(stageHeightFor(550) / 550);
  });
});

describe('between', () => {
  const tile = { width: 50, height: 46 };

  it('keeps the part of a link that lies outside both tiles, a little clear of each', () => {
    expect(between({ x: 100, y: 100 }, { x: 300, y: 100 }, tile, 4)).toEqual({
      from: { x: 129, y: 100 },
      to: { x: 271, y: 100 },
    });
    expect(between({ x: 100, y: 100 }, { x: 100, y: 300 }, tile, 4)).toEqual({
      from: { x: 100, y: 127 },
      to: { x: 100, y: 273 },
    });
  });

  it('leaves a tile through whichever side the link crosses', () => {
    const square = { width: 40, height: 40 };
    const { from, to } = between({ x: 0, y: 0 }, { x: 200, y: 200 }, square, 0);
    expect(from.x).toBeCloseTo(20, 6);
    expect(from.y).toBeCloseTo(20, 6);
    expect(to.x).toBeCloseTo(180, 6);
    expect(to.y).toBeCloseTo(180, 6);
    // A shallow link leaves through the side, not the corner.
    const shallow = between({ x: 0, y: 0 }, { x: 200, y: 20 }, square, 0);
    expect(shallow.from.x).toBeCloseTo(20, 6);
    expect(shallow.from.y).toBeCloseTo(2, 6);
  });

  it('collapses to the midpoint when the tiles touch or overlap', () => {
    expect(between({ x: 0, y: 0 }, { x: 30, y: 0 }, tile, 4)).toEqual({ from: { x: 15, y: 0 }, to: { x: 15, y: 0 } });
    expect(between({ x: 7, y: 9 }, { x: 7, y: 9 }, tile, 4)).toEqual({ from: { x: 7, y: 9 }, to: { x: 7, y: 9 } });
  });
});

describe('pointOn', () => {
  const from = { x: 0, y: 0 };
  const to = { x: 100, y: 0 };

  it('moves from one end to the other as progress goes from 0 to 1', () => {
    expect(pointOn(from, to, 0, 0)).toEqual({ x: 0, y: 0 });
    expect(pointOn(from, to, 0.25, 0)).toEqual({ x: 25, y: 0 });
    expect(pointOn(from, to, 1, 0)).toEqual({ x: 100, y: 0 });
  });

  it('keeps to one side of the line, so traffic in opposite directions does not collide', () => {
    expect(pointOn(from, to, 0.5, 3)).toEqual({ x: 50, y: 3 });
    expect(pointOn(to, from, 0.5, 3)).toEqual({ x: 50, y: -3 });
  });

  it('stays put when the two ends are the same point', () => {
    expect(pointOn(from, from, 0.5, 3)).toEqual({ x: 0, y: 0 });
  });
});
