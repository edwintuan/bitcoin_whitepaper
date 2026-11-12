import { useT } from '@/i18n/settings';
import { blockSubsidy } from '@/lib/subsidy';
import { fill, formatBtc, formatCount } from '@/text/format';
import { COPY } from './copy';
import { nextHalving, previousHalving } from './supply';

/**
 * The block height chosen in the supply scene, with a way to step to the next
 * halving from where the reader is. An arrow that has reached the end of the
 * range is switched off with aria-disabled, so the focus stays on it.
 */
export function HeightBar({ height, onHeight }: { height: number; onHeight(height: number): void }) {
  const t = useT();
  const previous = previousHalving(height);
  const next = nextHalving(height);
  return (
    <div className="inc-at">
      <button
        type="button"
        className="btn btn-sm btn-line"
        aria-label={t(COPY.prevHalving)}
        aria-disabled={previous === null || undefined}
        onClick={() => previous !== null && onHeight(previous)}
      >
        ←
      </button>
      <span className="inc-at-text">
        <span className="label">{t(COPY.block)}</span>
        <span className="mono inc-at-height">{formatCount(height)}</span>
        <span className="mono inc-dim">{fill(t(COPY.subsidyHere), { subsidy: formatBtc(blockSubsidy(height)) })}</span>
      </span>
      <button
        type="button"
        className="btn btn-sm btn-line"
        aria-label={t(COPY.nextHalving)}
        aria-disabled={next === null || undefined}
        onClick={() => next !== null && onHeight(next)}
      >
        →
      </button>
    </div>
  );
}
