import type { CSSProperties, ReactNode } from 'react';
import { cx } from '@/utils/cx';

/**
 * - confirmed: part of the chain (solid ink)
 * - candidate: still being worked on (outlined)
 * - found: has just met its target (ink with orange type, lands with a slam)
 * - invalid: its hash or its link to the previous block no longer holds
 * - ghost: a placeholder for a block that does not exist yet
 */
export type BlockState = 'confirmed' | 'candidate' | 'found' | 'invalid' | 'ghost';

export interface BlockRow {
  label: ReactNode;
  value: ReactNode;
}

export interface BlockTileProps {
  title: ReactNode;
  /** Short status at the top right: "3 conf", "mining…", "PoW ✓". */
  status?: ReactNode;
  state?: BlockState;
  rows?: BlockRow[];
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** The one way a block is drawn anywhere on the site. */
export function BlockTile({ title, status, state = 'confirmed', rows, children, className, style }: BlockTileProps) {
  return (
    <div className={cx('tile', state === 'found' && 't-slam', className)} data-state={state} style={style}>
      <div className="tile-top">
        <span className="tile-title poster">{title}</span>
        {status != null ? <span className="tile-status">{status}</span> : null}
      </div>
      {rows?.map((row, index) => (
        <div className="tile-row" key={index}>
          <span className="tile-label">{row.label}</span>
          <span className="tile-value">{row.value}</span>
        </div>
      ))}
      {children}
    </div>
  );
}

/** A row of tiles joined by the links of a chain. */
export function ChainRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('chain-row', className)}>{children}</div>;
}
