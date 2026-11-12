// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { SECTION_IDS } from '@/content/types';
import { FLOWS, PAPER_ORDER, PARTS, TOUR, builtAt, flowsOf, layoutMachine, selectionOnArrival, stepForPress } from './machine';
import type { PartId, Rect } from './machine';

const ids = PARTS.map((part) => part.id);

describe('the parts of the machine', () => {
  it('are the nine the reader has met, each from a section of the paper', () => {
    expect([...ids].sort()).toEqual(['block', 'chain', 'incentive', 'light', 'mempool', 'nodes', 'pow', 'transaction', 'wallet']);
    for (const part of PARTS) {
      expect(SECTION_IDS[part.section], part.id).toBeDefined();
      expect(part.section).toBeGreaterThanOrEqual(2);
      expect(part.section).toBeLessThanOrEqual(8);
    }
  });

  it('each have a place of their own on a three by three grid', () => {
    const cells = PARTS.map((part) => `${part.col},${part.row}`);
    expect(new Set(cells).size).toBe(9);
    for (const part of PARTS) {
      expect([0, 1, 2]).toContain(part.col);
      expect([0, 1, 2]).toContain(part.row);
    }
  });

  it('are visited in the order the paper introduces them', () => {
    expect(PAPER_ORDER).toEqual(['wallet', 'transaction', 'chain', 'pow', 'nodes', 'mempool', 'incentive', 'block', 'light']);
    const sections = PAPER_ORDER.map((id) => PARTS.find((part) => part.id === id)?.section);
    expect(sections).toEqual([...sections].sort((a, b) => (a ?? 0) - (b ?? 0)));
  });

  it('are covered by the tour once each, in that same order', () => {
    expect(TOUR.flat()).toEqual(PAPER_ORDER);
    for (const stop of TOUR) expect(stop.length).toBeGreaterThanOrEqual(1);
  });
});

describe('the guided walk', () => {
  it('has the parts of every stop so far in place, and all nine once it is over or left', () => {
    expect([...builtAt(0)]).toEqual(['wallet', 'transaction']);
    expect([...builtAt(2)]).toEqual(['wallet', 'transaction', 'chain', 'pow', 'nodes', 'mempool']);
    expect(builtAt(TOUR.length - 1).size).toBe(9);
    // The last step shows the whole machine; so does exploring freely.
    expect(builtAt(TOUR.length).size).toBe(9);
    expect(builtAt(null).size).toBe(9);
  });

  it('moves to the step that brings in a part when a part not yet in place is pressed', () => {
    expect(stepForPress(0, 'mempool')).toBe(2);
    expect(stepForPress(0, 'light')).toBe(4);
    expect(stepForPress(1, 'incentive')).toBe(3);
  });

  it('stays where it is when the part pressed is already in place', () => {
    // A part of the current stop, a part of an earlier one, and any part once all are built.
    expect(stepForPress(0, 'transaction')).toBeUndefined();
    expect(stepForPress(4, 'wallet')).toBeUndefined();
    expect(stepForPress(2, 'chain')).toBeUndefined();
    for (const id of ids) {
      expect(stepForPress(TOUR.length, id), id).toBeUndefined();
      expect(stepForPress(null, id), id).toBeUndefined();
    }
  });

  it('never sends the walkthrough backwards', () => {
    TOUR.forEach((_, step) => {
      for (const id of ids) {
        const target = stepForPress(step, id);
        if (target !== undefined) expect(target, `${id} at step ${step}`).toBeGreaterThan(step);
      }
    });
  });

  it('arrives at a step showing the part that was pressed to get there', () => {
    expect(selectionOnArrival(2, 'mempool')).toBe('mempool');
    expect(selectionOnArrival(4, 'light')).toBe('light');
  });

  it('arrives at a step showing its first part when the reader came with Next or Back', () => {
    TOUR.forEach((stop, step) => expect(selectionOnArrival(step, null)).toBe(stop[0]));
    // A press remembered from somewhere else does not belong to this stop.
    expect(selectionOnArrival(1, 'mempool')).toBe('chain');
  });

  it('leaves the selection alone on the whole machine and outside the walkthrough', () => {
    expect(selectionOnArrival(TOUR.length, null)).toBeUndefined();
    expect(selectionOnArrival(null, 'pow')).toBeUndefined();
  });
});

describe('the connections', () => {
  it('join parts that exist, and leave no part on its own', () => {
    const touched = new Set<PartId>();
    for (const flow of FLOWS) {
      expect(ids).toContain(flow.from);
      expect(ids).toContain(flow.to);
      expect(flow.from).not.toBe(flow.to);
      touched.add(flow.from);
      touched.add(flow.to);
    }
    expect([...touched].sort()).toEqual([...ids].sort());
    expect(new Set(FLOWS.map((flow) => flow.id)).size).toBe(FLOWS.length);
  });

  it('carry a payment from the wallet all the way into the chain', () => {
    const next = (from: PartId) => FLOWS.filter((flow) => flow.from === from).map((flow) => flow.to);
    const reached = new Set<PartId>(['wallet']);
    const queue: PartId[] = ['wallet'];
    while (queue.length > 0) {
      for (const to of next(queue.shift() as PartId)) {
        if (!reached.has(to)) {
          reached.add(to);
          queue.push(to);
        }
      }
    }
    for (const id of ['transaction', 'nodes', 'mempool', 'block', 'pow', 'chain', 'light'] as const) {
      expect(reached.has(id), id).toBe(true);
    }
  });

  it('close the loop: the chain goes back to the nodes that build on it', () => {
    expect(FLOWS.some((flow) => flow.from === 'chain' && flow.to === 'nodes')).toBe(true);
  });

  it('can be listed for one part, split into what arrives and what leaves', () => {
    expect(flowsOf('pow').incoming.map((flow) => flow.from).sort()).toEqual(['block', 'incentive']);
    expect(flowsOf('pow').outgoing.map((flow) => flow.to)).toEqual(['chain']);
    expect(flowsOf('light').outgoing).toEqual([]);
  });
});

describe('layoutMachine', () => {
  const onBorder = ([x, y]: [number, number], box: Rect) => {
    const insideX = x >= box.x - 0.01 && x <= box.x + box.w + 0.01;
    const insideY = y >= box.y - 0.01 && y <= box.y + box.h + 0.01;
    const onVertical = Math.abs(x - box.x) < 0.01 || Math.abs(x - (box.x + box.w)) < 0.01;
    const onHorizontal = Math.abs(y - box.y) < 0.01 || Math.abs(y - (box.y + box.h)) < 0.01;
    return (insideY && onVertical) || (insideX && onHorizontal);
  };
  const strictlyInside = ([x, y]: [number, number], box: Rect) =>
    x > box.x + 0.5 && x < box.x + box.w - 0.5 && y > box.y + 0.5 && y < box.y + box.h - 0.5;

  // 254 px is the stage of a 320 px phone, the narrowest in use.
  for (const width of [254, 324, 400, 552, 760]) {
    describe(`at ${width} px`, () => {
      const layout = layoutMachine(width);
      const boxes = Object.values(layout.boxes);

      it('fits nine boxes inside the stage without overlap', () => {
        expect(boxes).toHaveLength(9);
        for (const box of boxes) {
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.w).toBeLessThanOrEqual(width + 0.01);
          expect(box.y).toBeGreaterThanOrEqual(0);
          expect(box.y + box.h).toBeLessThanOrEqual(layout.height + 0.01);
          expect(box.w).toBeGreaterThanOrEqual(width < 300 ? 72 : 84);
        }
        for (let a = 0; a < boxes.length; a++) {
          for (let b = a + 1; b < boxes.length; b++) {
            const apart =
              boxes[a].x + boxes[a].w <= boxes[b].x ||
              boxes[b].x + boxes[b].w <= boxes[a].x ||
              boxes[a].y + boxes[a].h <= boxes[b].y ||
              boxes[b].y + boxes[b].h <= boxes[a].y;
            expect(apart).toBe(true);
          }
        }
      });

      it('runs every connection from the edge of one box to the edge of the other, through open space', () => {
        expect(layout.flows.map((flow) => flow.id)).toEqual(FLOWS.map((flow) => flow.id));
        for (const flow of layout.flows) {
          const { from, to } = FLOWS.find((entry) => entry.id === flow.id) as (typeof FLOWS)[number];
          expect(onBorder(flow.points[0], layout.boxes[from]), `${flow.id} starts on ${from}`).toBe(true);
          expect(onBorder(flow.points[flow.points.length - 1], layout.boxes[to]), `${flow.id} ends on ${to}`).toBe(true);
          for (const point of flow.points) {
            for (const box of boxes) expect(strictlyInside(point, box), `${flow.id} crosses a box`).toBe(false);
          }
          // Every segment is horizontal or vertical.
          for (let i = 1; i < flow.points.length; i++) {
            const [x1, y1] = flow.points[i - 1];
            const [x2, y2] = flow.points[i];
            expect(x1 === x2 || y1 === y2, `${flow.id} has a slanted segment`).toBe(true);
          }
        }
      });

      it('gives a name room to run to three lines on a phone, two elsewhere', () => {
        // 13 px for the section number, 2 px gap, 8 px padding, and 13.8 px per line of the name on a phone.
        for (const box of boxes) expect(box.h).toBeGreaterThanOrEqual(width < 420 ? 66 : 58);
      });

      it('never lets two connections share an end point', () => {
        const ends = layout.flows.flatMap((flow) => [flow.points[0], flow.points[flow.points.length - 1]].map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`));
        expect(new Set(ends).size).toBe(ends.length);
      });
    });
  }
});
