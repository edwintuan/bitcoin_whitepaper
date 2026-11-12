/**
 * The whole system as one diagram: nine parts on a three by three grid and
 * the hand-offs between them. The grid is arranged so that a payment travels
 * clockwise from the wallet, down the right-hand side into a block, and back
 * through the proof-of-work into the chain at the centre.
 */

export type PartId = 'wallet' | 'transaction' | 'nodes' | 'mempool' | 'block' | 'pow' | 'chain' | 'incentive' | 'light';

export interface Part {
  id: PartId;
  /** The section of the paper that introduces it. */
  section: number;
  col: 0 | 1 | 2;
  row: 0 | 1 | 2;
}

export const PARTS: readonly Part[] = [
  { id: 'wallet', section: 2, col: 0, row: 0 },
  { id: 'transaction', section: 2, col: 1, row: 0 },
  { id: 'nodes', section: 5, col: 2, row: 0 },
  { id: 'light', section: 8, col: 0, row: 1 },
  { id: 'chain', section: 3, col: 1, row: 1 },
  { id: 'mempool', section: 5, col: 2, row: 1 },
  { id: 'incentive', section: 6, col: 0, row: 2 },
  { id: 'pow', section: 4, col: 1, row: 2 },
  { id: 'block', section: 7, col: 2, row: 2 },
];

/** The parts in the order the paper introduces them. */
export const PAPER_ORDER: readonly PartId[] = ['wallet', 'transaction', 'chain', 'pow', 'nodes', 'mempool', 'incentive', 'block', 'light'];

/** The guided walk: the same order, a section or two at a time. */
export const TOUR: readonly PartId[][] = [['wallet', 'transaction'], ['chain', 'pow'], ['nodes', 'mempool'], ['incentive'], ['block', 'light']];

/**
 * The parts in place at a step of the walk: those of every stop up to and
 * including it. All nine on the step after the last stop, which shows the
 * whole machine, and when the reader has left the walk (`null`).
 */
export function builtAt(step: number | null): ReadonlySet<PartId> {
  const stops = step === null || !TOUR[step] ? TOUR.length : step + 1;
  return new Set(TOUR.slice(0, stops).flat());
}

/**
 * Where pressing a part takes the walk. A part not yet in place is brought in
 * by going forward to the step that introduces it. A part already in place is
 * only selected, and the walk stays where it is: `undefined`.
 */
export function stepForPress(step: number | null, id: PartId): number | undefined {
  if (builtAt(step).has(id)) return undefined;
  return TOUR.findIndex((stop) => stop.includes(id));
}

/**
 * The part to show on arriving at a step: the one the reader pressed to get
 * there if it belongs to that step, otherwise the first the step brings in.
 * `undefined` where the step brings in nothing, and the selection is left alone.
 */
export function selectionOnArrival(step: number | null, pressed: PartId | null): PartId | undefined {
  const stop = step === null ? undefined : TOUR[step];
  if (!stop) return undefined;
  return pressed !== null && stop.includes(pressed) ? pressed : stop[0];
}

export type FlowId = 'sign' | 'broadcast' | 'hold' | 'gather' | 'hash' | 'extend' | 'accept' | 'prove' | 'reward';

export interface Flow {
  id: FlowId;
  /** Who hands something over. */
  from: PartId;
  /** Who receives it. */
  to: PartId;
}

/** Who hands what to whom. The words for each are in the figure's copy. */
export const FLOWS: readonly Flow[] = [
  { id: 'sign', from: 'wallet', to: 'transaction' },
  { id: 'broadcast', from: 'transaction', to: 'nodes' },
  { id: 'hold', from: 'nodes', to: 'mempool' },
  { id: 'gather', from: 'mempool', to: 'block' },
  { id: 'hash', from: 'block', to: 'pow' },
  { id: 'extend', from: 'pow', to: 'chain' },
  { id: 'accept', from: 'chain', to: 'nodes' },
  { id: 'prove', from: 'chain', to: 'light' },
  { id: 'reward', from: 'incentive', to: 'pow' },
];

/** The connections of one part: what it is handed, and what it hands on. */
export function flowsOf(id: PartId): { incoming: Flow[]; outgoing: Flow[] } {
  return { incoming: FLOWS.filter((flow) => flow.to === id), outgoing: FLOWS.filter((flow) => flow.from === id) };
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type Point = [number, number];

export interface FlowPath {
  id: FlowId;
  points: Point[];
  /** Where a word for the hand-off can sit, and how it is aligned there. */
  label: { x: number; y: number; anchor: 'start' | 'middle' };
}

export interface MachineLayout {
  height: number;
  boxes: Record<PartId, Rect>;
  flows: FlowPath[];
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/**
 * Places the nine boxes and routes the nine connections for a stage `width`
 * pixels wide. Coordinates are pixels, so words set on the diagram keep their
 * size on a phone and on a desktop alike.
 */
export function layoutMachine(width: number): MachineLayout {
  const narrow = width < 420;
  // On the narrowest phones the channels give way first, so that the boxes keep room for a word.
  const gapX = width < 300 ? 16 : clamp(width * 0.09, 24, 60);
  const gapY = narrow ? 34 : 44;
  const w = (width - 2 * gapX) / 3;
  // On a phone a box is about 90 px wide and the longest name runs to three lines.
  const h = narrow ? 70 : 58;

  const boxes = Object.fromEntries(
    PARTS.map((part) => [part.id, { x: part.col * (w + gapX), y: part.row * (h + gapY), w, h }]),
  ) as Record<PartId, Rect>;

  const centreX = (id: PartId) => boxes[id].x + w / 2;
  const centreY = (id: PartId) => boxes[id].y + h / 2;
  const left = (id: PartId): Point => [boxes[id].x, centreY(id)];
  const right = (id: PartId): Point => [boxes[id].x + w, centreY(id)];
  const top = (id: PartId, shift = 0): Point => [centreX(id) + shift, boxes[id].y];
  const bottom = (id: PartId, shift = 0): Point => [centreX(id) + shift, boxes[id].y + h];

  /** A straight run between neighbours; the label sits above a horizontal run, beside a vertical one. */
  const straight = (id: FlowId, from: Point, to: Point): FlowPath => {
    const horizontal = from[1] === to[1];
    return {
      id,
      points: [from, to],
      label: horizontal
        ? { x: (from[0] + to[0]) / 2, y: from[1] - 7, anchor: 'middle' }
        : { x: from[0] + 7, y: (from[1] + to[1]) / 2, anchor: 'start' },
    };
  };

  // Two connections meet the underside of "nodes": keep them a fifth of a box apart from the centre.
  const offset = w * 0.2;
  const turn = boxes.chain.y - gapY / 2;
  const accept: FlowPath = {
    id: 'accept',
    points: [top('chain', offset), [centreX('chain') + offset, turn], [centreX('nodes') - offset, turn], bottom('nodes', -offset)],
    label: { x: (centreX('chain') + offset + centreX('nodes') - offset) / 2, y: turn - 7, anchor: 'middle' },
  };

  const flows: FlowPath[] = [
    straight('sign', right('wallet'), left('transaction')),
    straight('broadcast', right('transaction'), left('nodes')),
    straight('hold', bottom('nodes', offset), top('mempool', offset)),
    straight('gather', bottom('mempool'), top('block')),
    straight('hash', left('block'), right('pow')),
    straight('extend', top('pow'), bottom('chain')),
    accept,
    straight('prove', left('chain'), right('light')),
    straight('reward', right('incentive'), left('pow')),
  ];

  return { height: 3 * h + 2 * gapY, boxes, flows };
}
