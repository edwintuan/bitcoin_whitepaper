import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { DEPTHS } from '@/content/types';
import type { Depth } from '@/content/types';
import { useSettings } from '@/i18n/settings';
import { cx } from '@/utils/cx';

const rank = (depth: Depth) => DEPTHS.indexOf(depth);

export interface CollapsibleProps {
  title: ReactNode;
  /** The shallowest reading depth at which this block starts open. */
  minDepth: Depth;
  /** Small text shown at the right of the heading, e.g. which depth it belongs to. */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * A block of a section that opens or closes with the reading depth.
 *
 * The heading is always there: closed, it is one line the reader can open.
 * The content is built the first time the block opens and kept from then on,
 * so a page of closed blocks does not carry their markup, and whatever the
 * reader did inside a block is still there when they open it again. A manual
 * choice holds until the reader picks a depth again, at which point every
 * block goes back to that depth's default.
 */
export function Collapsible({ title, minDepth, aside, className, children }: CollapsibleProps) {
  const { depth, depthEpoch } = useSettings();
  const defaultOpen = rank(depth) >= rank(minDepth);

  const [open, setOpen] = useState(defaultOpen);
  const [built, setBuilt] = useState(defaultOpen);
  const [epoch, setEpoch] = useState(depthEpoch);
  if (epoch !== depthEpoch) {
    // The reader picked a depth: forget the manual state. (Adjusting state
    // during render avoids a flash of the old state that an effect would show.)
    setEpoch(depthEpoch);
    setOpen(defaultOpen);
  }
  if (open && !built) setBuilt(true);

  const id = useId();
  const headId = `${id}-head`;
  const panelId = `${id}-panel`;

  return (
    <div className={cx('t-acc collapsible', className)} data-open={open}>
      <h3 className="m-0">
        <button
          type="button"
          id={headId}
          className="t-acc-head collapsible-head"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="collapsible-title poster">{title}</span>
          {aside ? <span className="collapsible-aside label">{aside}</span> : null}
          <span className="t-acc-chevron" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 6.5L8 10.5L12 6.5" />
            </svg>
          </span>
        </button>
      </h3>
      <div className="t-acc-panel" id={panelId} role="region" aria-labelledby={headId} inert={!open}>
        <div className="t-acc-panel-inner">
          <div className="collapsible-body">{built ? children : null}</div>
        </div>
      </div>
    </div>
  );
}
