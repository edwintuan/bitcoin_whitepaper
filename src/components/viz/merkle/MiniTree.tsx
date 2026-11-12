import type { ReactNode } from 'react';
import './tree.css';

/**
 * - `hit`: the part being pointed at (filled orange)
 * - `on`: present and plain (filled cream)
 * - `dim`: there, but beside the point (text only)
 * - `wait`: still to be worked out (a dashed place, empty)
 * - `none`: not held at all (left out, its place kept)
 */
export type MiniTone = 'hit' | 'on' | 'dim' | 'wait' | 'none';

export interface MiniTreeProps {
  /** A four-leaf tree from `merkleLevels`: four ids, two parents, one root. */
  levels: string[][];
  tone(level: number, index: number): MiniTone;
  /** Text inside a leaf, e.g. "Tx2". */
  leafName(index: number): string;
  /** Called when a leaf is pressed. Without it the leaves are plain shapes, not buttons. */
  onLeaf?(index: number): void;
  /** Accessible name of a leaf's button. */
  leafLabel?(index: number): string;
  /** Which leaves count as switched on, for `aria-pressed`. */
  pressed?(index: number): boolean;
  /** A word beside the root, such as "root". */
  rootLabel?: ReactNode;
  /** Drawn in place of the root's own row, for a tree that hangs from something else: a block header, say. */
  head?: ReactNode;
  /**
   * What the drawing shows, for readers who cannot see it. Only for a tree
   * with nothing to press: the words stand in for everything inside it.
   */
  label?: string;
}

/** The links between two rows: children joined in twos under `parents` parents. */
function Links({ parents, shown }: { parents: 1 | 2; shown(parent: number): boolean }) {
  const cell = 100 / (parents * 2);
  return (
    <svg className="mtree-mini-links" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: parents }, (_, i) => {
        if (!shown(i)) return null;
        const left = (2 * i + 0.5) * cell;
        const right = (2 * i + 1.5) * cell;
        return <path key={i} d={`M${left} 10V5H${right}V10M${(left + right) / 2} 5V0`} vectorEffect="non-scaling-stroke" />;
      })}
    </svg>
  );
}

/**
 * A four-leaf Merkle tree small enough for a term card: real hashes, each a
 * filled shape, and one colour to point with. Drawn for the black card.
 */
export function MiniTree({ levels, tone, leafName, onLeaf, leafLabel, pressed, rootLabel, head, label }: MiniTreeProps) {
  const short = (hash: string, length: number) => `${hash.slice(0, length)}…`;
  const there = (level: number, index: number) => tone(level, index) !== 'none';
  // As a picture it has one name; with leaves to press it must stay open to assistive technology.
  const picture = label !== undefined && !onLeaf;

  return (
    <div role={picture ? 'img' : undefined} aria-label={picture ? label : undefined}>
      {head ?? (
        <div className="mtree-mini-row" data-row="root">
          <span className="mtree-mini-label">{rootLabel}</span>
          <span className="mtree-mini-node" data-tone={tone(2, 0)}>
            {short(levels[2][0], 14)}
          </span>
        </div>
      )}
      <Links parents={1} shown={() => there(1, 0) || there(1, 1)} />
      <div className="mtree-mini-row" data-row="mid">
        {levels[1].map((hash, i) => (
          <span key={i} className="mtree-mini-node" data-tone={tone(1, i)}>
            {tone(1, i) === 'wait' ? '…' : short(hash, 10)}
          </span>
        ))}
      </div>
      <Links parents={2} shown={(parent) => there(0, 2 * parent) || there(0, 2 * parent + 1)} />
      <div className="mtree-mini-row" data-row="leaves">
        {levels[0].map((hash, i) => {
          const inside = (
            <>
              <span>{leafName(i)}</span>
              <span>{short(hash, 5)}</span>
            </>
          );
          return onLeaf ? (
            <button
              key={i}
              type="button"
              className="mtree-mini-node"
              data-tone={tone(0, i)}
              aria-label={leafLabel?.(i)}
              aria-pressed={pressed ? pressed(i) : undefined}
              onClick={() => onLeaf(i)}
            >
              {inside}
            </button>
          ) : (
            <span key={i} className="mtree-mini-node" data-tone={tone(0, i)}>
              {inside}
            </span>
          );
        })}
      </div>
    </div>
  );
}
