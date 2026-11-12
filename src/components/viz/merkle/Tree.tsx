import { Fragment } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { centre, childrenOf } from './layout';
import type { Slot, TreeLayout } from './layout';
import './tree.css';

/**
 * - `solid`: both ends are known and the link holds
 * - `live`: the link being worked on right now
 * - `faint`: there, but not held or no longer kept
 * - `none`: not drawn
 */
export type LinkTone = 'solid' | 'live' | 'faint' | 'none';

export interface TreeProps {
  layout: TreeLayout;
  /** What the drawing shows, for readers who cannot see it. */
  label: string;
  /** The box at a slot, or null to leave the slot empty. */
  renderNode(slot: Slot): ReactNode;
  /** How to draw the link from a child up to its parent. Default: solid. */
  linkTone?(parent: Slot, child: Slot): LinkTone;
  /** Row heights in pixels: the row of transactions, and every row above it. */
  leafHeight?: number;
  nodeHeight?: number;
  /** Height of the root's row, where it holds more than one line. Default: `nodeHeight`. */
  rootHeight?: number;
  /** Vertical room for the links between two rows. */
  gap?: number;
  /** While set, a marker travels up every link into this level: hashes flowing into their parents. */
  flowInto?: number | null;
  className?: string;
}

/**
 * A Merkle tree drawn as a bracket, root on top. Positions come from
 * `treeLayout`: columns as percentages of the width, rows in pixels, so the
 * same drawing fits a desktop stage and a phone without measuring anything.
 * What goes in each box, and what state it is in, is the caller's business.
 */
export function Tree({
  layout,
  label,
  renderNode,
  linkTone,
  leafHeight = 44,
  nodeHeight = 30,
  rootHeight = nodeHeight,
  gap = 22,
  flowInto = null,
  className,
}: TreeProps) {
  const { cols, rows } = layout;
  const top = rows.length - 1;
  const heightOf = (level: number) => (level === 0 ? leafHeight : level === top ? rootHeight : nodeHeight);
  // Rows are stacked from the root down.
  const topOf = (level: number) => {
    let y = 0;
    for (let above = top; above > level; above--) y += heightOf(above) + gap;
    return y;
  };
  const total = topOf(0) + heightOf(0);

  // Where the bracket under a parent runs: its own centre, its children's, and the heights it bends at.
  const bracket = (parent: Slot) => {
    const pair = childrenOf(layout, parent);
    if (!pair) return null;
    const tones = pair.map((child) => linkTone?.(parent, child) ?? 'solid');
    if (tones.every((tone) => tone === 'none')) return null;
    const stemTop = topOf(parent.level) + heightOf(parent.level);
    return {
      tones,
      xp: centre(parent, cols),
      xl: centre(pair[0], cols),
      xr: centre(pair[1], cols),
      stemTop,
      mid: stemTop + gap / 2,
    };
  };

  return (
    <div
      className={`mtree${className ? ` ${className}` : ''}`}
      style={{ height: total }}
      data-cols={cols}
      role="group"
      aria-label={label}
    >
      {/* Links first, so the boxes sit on top of their ends. */}
      {rows.slice(1).map((row) =>
        row.map((parent) => {
          const at = bracket(parent);
          if (!at) return null;
          const { tones, xp, xl, xr, stemTop, mid } = at;
          const stemTone = tones.includes('live') ? 'live' : tones.includes('solid') ? 'solid' : 'faint';
          return (
            <Fragment key={`${parent.level}-${parent.index}`}>
              <i
                className="mtree-stem"
                data-tone={stemTone}
                style={{ left: `calc(${xp}% - 1px)`, top: stemTop, height: gap / 2 + 2 }}
                aria-hidden="true"
              />
              {tones[0] !== 'none' ? (
                <i
                  className="mtree-arm"
                  data-side="l"
                  data-tone={tones[0]}
                  style={{ left: `calc(${xl}% - 1px)`, width: `calc(${xp - xl}% + 1px)`, top: mid, height: gap / 2 }}
                  aria-hidden="true"
                />
              ) : null}
              {tones[1] !== 'none' ? (
                <i
                  className="mtree-arm"
                  data-side="r"
                  data-tone={tones[1]}
                  style={{ left: `${xp}%`, width: `calc(${xr - xp}% + 1px)`, top: mid, height: gap / 2 }}
                  aria-hidden="true"
                />
              ) : null}
            </Fragment>
          );
        }),
      )}

      {/* The markers travel in one layer that clips them: each is as wide as the tree and is moved by
          a share of that width, so left to itself it would reach past the edge and widen the page. */}
      {flowInto !== null && rows[flowInto] ? (
        <div className="mtree-flows" aria-hidden="true">
          {rows[flowInto].map((parent) => {
            const at = bracket(parent);
            if (!at) return null;
            return [at.xl, at.xr].map((x, side) => (
              <i
                key={`${parent.index}-${side}`}
                className="mtree-flow"
                style={
                  {
                    '--x0': `${x}%`,
                    '--x1': `${at.xp}%`,
                    '--y0': `${at.stemTop + gap}px`,
                    '--ym': `${at.mid}px`,
                    '--y1': `${at.stemTop}px`,
                  } as CSSProperties
                }
              />
            ));
          })}
        </div>
      ) : null}

      {rows.map((row) =>
        row.map((slot) => {
          const node = renderNode(slot);
          if (node === null || node === undefined || node === false) return null;
          return (
            <div
              key={`${slot.level}-${slot.index}`}
              className="mtree-slot"
              data-level={slot.level}
              data-top={slot.level === top}
              style={{
                left: `${(slot.col / cols) * 100}%`,
                width: `${(slot.span / cols) * 100}%`,
                top: topOf(slot.level),
                height: heightOf(slot.level),
              }}
            >
              {node}
            </div>
          );
        }),
      )}
    </div>
  );
}
