// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { GRAPH_HEIGHT, GRAPH_WIDTH, LABEL, layoutGraph } from './graph';
import type { Graph } from './graph';
import { buildScenario } from './scenario';
import type { ScenarioOptions } from './scenario';

const MODES: ScenarioOptions[] = [
  { reuse: false, combine: false },
  { reuse: false, combine: true },
  { reuse: true, combine: false },
  { reuse: true, combine: true },
];

const graphFor = (mode: ScenarioOptions): Graph => layoutGraph(buildScenario(mode));

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}
const boxes = (graph: Graph): Box[] => [
  ...graph.txs.map((node) => ({ left: node.x - node.size / 2, right: node.x + node.size / 2, top: node.y - node.size / 2, bottom: node.y + node.size / 2 })),
  ...graph.addresses.map((node) => ({ left: node.x - node.w / 2, right: node.x + node.w / 2, top: node.y - node.h / 2, bottom: node.y + node.h / 2 })),
];

describe('the observer’s graph', () => {
  it('draws each transaction once and each address once', () => {
    for (const mode of MODES) {
      const scenario = buildScenario(mode);
      const graph = layoutGraph(scenario);
      expect(graph.txs.map((node) => node.number)).toEqual([1, 2, 3, 4, 5, 6]);
      const distinct = new Set(scenario.txs.flatMap((tx) => [...tx.inputs, ...tx.outputs].map((entry) => entry.address)));
      expect(graph.addresses.map((node) => node.address).sort()).toEqual([...distinct].sort());
    }
  });

  it('has twelve address nodes with fresh addresses and seven when one is reused', () => {
    expect(graphFor({ reuse: false, combine: false }).addresses).toHaveLength(12);
    expect(graphFor({ reuse: false, combine: true }).addresses).toHaveLength(12);
    expect(graphFor({ reuse: true, combine: false }).addresses).toHaveLength(7);
    expect(graphFor({ reuse: true, combine: true }).addresses).toHaveLength(7);
  });

  it('keeps every node inside the drawing and clear of the others', () => {
    for (const mode of MODES) {
      const all = boxes(graphFor(mode));
      for (const box of all) {
        expect(box.left).toBeGreaterThanOrEqual(0);
        expect(box.top).toBeGreaterThanOrEqual(0);
        expect(box.right).toBeLessThanOrEqual(GRAPH_WIDTH);
        expect(box.bottom).toBeLessThanOrEqual(GRAPH_HEIGHT);
      }
      for (let a = 0; a < all.length; a++) {
        for (let b = a + 1; b < all.length; b++) {
          const apart = all[a].right <= all[b].left || all[b].right <= all[a].left || all[a].bottom <= all[b].top || all[b].bottom <= all[a].top;
          expect(apart, `nodes ${a} and ${b} overlap`).toBe(true);
        }
      }
    }
  });

  it('keeps the transactions where they are when a switch is flipped', () => {
    const [first, ...rest] = MODES.map((mode) => graphFor(mode).txs.map((node) => [node.x, node.y]));
    for (const positions of rest) expect(positions).toEqual(first);
  });

  it('draws one edge for every input and every output, between nodes that exist', () => {
    for (const mode of MODES) {
      const scenario = buildScenario(mode);
      const graph = layoutGraph(scenario);
      const keys = new Set([...graph.txs.map((node) => node.key), ...graph.addresses.map((node) => node.key)]);
      for (const edge of graph.edges) {
        expect(keys.has(edge.from), edge.from).toBe(true);
        expect(keys.has(edge.to), edge.to).toBe(true);
        expect(edge.points.length).toBeGreaterThanOrEqual(2);
      }
      const coins = (kind: 'spend' | 'pay' | 'change') =>
        graph.edges.filter((edge) => edge.kind === kind).reduce((total, edge) => total + edge.coins, 0);
      expect(coins('spend')).toBe(scenario.txs.reduce((total, tx) => total + tx.inputs.length, 0));
      expect(coins('pay') + coins('change')).toBe(scenario.txs.reduce((total, tx) => total + tx.outputs.length, 0));
    }
  });

  it('marks the inputs that were spent together, and only those', () => {
    const joined = (mode: ScenarioOptions) => graphFor(mode).edges.filter((edge) => edge.joined).map((edge) => edge.txNumber);
    expect(joined({ reuse: false, combine: false })).toEqual([]);
    expect(joined({ reuse: false, combine: true })).toEqual([4, 4, 4]);
    // Three coins from one address: one edge, nothing new to join.
    expect(joined({ reuse: true, combine: true })).toEqual([]);
  });

  it('labels an address by the end of it, where addresses differ', () => {
    for (const mode of MODES) {
      for (const node of graphFor(mode).addresses) {
        expect(node.address.endsWith(node.tail)).toBe(true);
        expect(node.tail).toHaveLength(4);
      }
    }
  });
});

/** The room a node's label takes, as the scene draws it: five characters of 11 px type beside or beneath the node. */
const labelBox = (node: Graph['addresses'][number]): Box =>
  node.label === 'below'
    ? { left: node.x - LABEL.width / 2, right: node.x + LABEL.width / 2, top: node.y + node.h / 2 + LABEL.gap, bottom: node.y + node.h / 2 + LABEL.gap + LABEL.height }
    : { left: node.x + node.w / 2 + LABEL.gap + 3, right: node.x + node.w / 2 + LABEL.gap + 3 + LABEL.width, top: node.y - LABEL.height / 2, bottom: node.y + LABEL.height / 2 };

describe('the graph at the width it is shown', () => {
  // The stage of a 320, a 360 and a 390 px phone, and the full width on a desktop.
  const WIDTHS = [254, 294, 324, GRAPH_WIDTH];

  it('is laid out for the width it is given, so that nothing has to be scaled', () => {
    for (const width of WIDTHS) {
      for (const mode of MODES) {
        const graph = layoutGraph(buildScenario(mode), width);
        expect(graph.width).toBe(width);
        const all = boxes(graph);
        for (const box of all) {
          expect(box.left).toBeGreaterThanOrEqual(0);
          expect(box.right).toBeLessThanOrEqual(width);
          expect(box.bottom).toBeLessThanOrEqual(GRAPH_HEIGHT);
        }
        for (let a = 0; a < all.length; a++) {
          for (let b = a + 1; b < all.length; b++) {
            const apart = all[a].right <= all[b].left || all[b].right <= all[a].left || all[a].bottom <= all[b].top || all[b].bottom <= all[a].top;
            expect(apart, `nodes ${a} and ${b} overlap at ${width}`).toBe(true);
          }
        }
      }
    }
  });

  it('never draws wider than its full width, however wide the stage', () => {
    expect(layoutGraph(buildScenario(MODES[0]), 900).width).toBe(GRAPH_WIDTH);
  });

  it('keeps every label, set at 11 px, inside the drawing and clear of every node and every other label', () => {
    for (const width of WIDTHS) {
      for (const mode of MODES) {
        const graph = layoutGraph(buildScenario(mode), width);
        const nodes = boxes(graph);
        const labels = graph.addresses.map(labelBox);
        const overlap = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        labels.forEach((label, index) => {
          const what = `label of address ${index} at ${width} (${JSON.stringify(mode)})`;
          expect(label.left, what).toBeGreaterThanOrEqual(0);
          expect(label.right, what).toBeLessThanOrEqual(width);
          expect(label.top, what).toBeGreaterThanOrEqual(0);
          expect(label.bottom, what).toBeLessThanOrEqual(GRAPH_HEIGHT);
          for (const node of nodes) expect(overlap(label, node), `${what} runs into a node`).toBe(false);
          labels.forEach((other, otherIndex) => {
            if (otherIndex > index) expect(overlap(label, other), `${what} runs into label ${otherIndex}`).toBe(false);
          });
        });
      }
    }
  });

  it('leaves room at the left for the tag that names the one known address', () => {
    for (const width of WIDTHS) {
      const scenario = buildScenario(MODES[0]);
      const known = layoutGraph(scenario, width).addresses.find((node) => node.address === scenario.known);
      expect(known).toBeDefined();
      if (known) expect(known.x - known.w / 2 - LABEL.tagGap - LABEL.tagWidth).toBeGreaterThanOrEqual(0);
    }
  });
});
