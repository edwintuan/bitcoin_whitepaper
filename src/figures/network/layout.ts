/** Where the network figure draws its nodes and messages. All lengths are CSS pixels. */

export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

/** Space kept between a tile and the edge of the stage. */
const EDGE = 3;

/** The simulation places nodes within this much of the unit square's centre: 0.05 … 0.95. */
const SPAN = 0.9;

/** Stages narrower than this get the phone treatment. */
const NARROW = 420;

/** The size of a node's tile for a stage of the given width. */
export function tileFor(stageWidth: number): Size {
  return stageWidth < NARROW ? { width: 44, height: 42 } : { width: 50, height: 46 };
}

/** The height of the stage for a given width: wide and low beside the text, squarer on a phone. */
export function stageHeightFor(stageWidth: number): number {
  return stageWidth < NARROW ? 304 : 340;
}

/**
 * The centre of a node's tile. The simulation's square is stretched over the
 * stage, so that a node at its edge sits just inside the stage's edge.
 */
export function place(at: Point, stage: Size, tile: Size): Point {
  const along = (value: number, length: number, size: number) =>
    length / 2 + ((value - 0.5) / SPAN) * (length - size - 2 * EDGE);
  return { x: along(at.x, stage.width, tile.width), y: along(at.y, stage.height, tile.height) };
}

/**
 * The stretch of the straight link from `a` to `b` that shows between two
 * tiles centred on those points, `gap` pixels clear of each. Messages travel
 * along it, so they are never drawn on top of a node.
 */
export function between(a: Point, b: Point, tile: Size, gap: number): { from: Point; to: Point } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  const middle = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  if (length === 0) return { from: middle, to: middle };
  const ux = dx / length;
  const uy = dy / length;
  // How far along the link the edge of a tile is from its centre.
  const inset = Math.min(tile.width / 2 / Math.abs(ux), tile.height / 2 / Math.abs(uy)) + gap;
  if (2 * inset >= length) return { from: middle, to: middle };
  return {
    from: { x: a.x + ux * inset, y: a.y + uy * inset },
    to: { x: b.x - ux * inset, y: b.y - uy * inset },
  };
}

/**
 * A point `progress` of the way from `from` to `to` (0 … 1), moved `offset`
 * pixels to one side of the line. The side depends on the direction of
 * travel, which gives each direction a lane of its own.
 */
export function pointOn(from: Point, to: Point, progress: number, offset: number): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return { x: from.x, y: from.y };
  const x = from.x + dx * progress;
  const y = from.y + dy * progress;
  if (offset === 0) return { x, y };
  return { x: x - (dy / length) * offset, y: y + (dx / length) * offset };
}
