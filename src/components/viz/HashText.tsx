import { cx } from '@/utils/cx';

export interface HashTextProps {
  /** Hex string, display order. */
  hash: string;
  /** Characters kept at the start. Default 10. Ignored with `full`. */
  lead?: number;
  /** Characters kept at the end. Default 4. Set 0 to end with an ellipsis. */
  tail?: number;
  /** Show every character, wrapping as needed. */
  full?: boolean;
  /** Highlight the leading zeros. Default true. */
  zeros?: boolean;
  className?: string;
}

/**
 * A hash for display: monospaced, shortened in the middle, with its leading
 * zeros marked. The full value is always available to assistive technology
 * and on hover.
 */
export function HashText({ hash, lead = 10, tail = 4, full = false, zeros = true, className }: HashTextProps) {
  const zeroCount = zeros ? (/^0*/.exec(hash)?.[0].length ?? 0) : 0;
  const shown = full || hash.length <= lead + tail + 1;
  const head = shown ? hash : hash.slice(0, lead);
  const end = shown || tail === 0 ? '' : hash.slice(-tail);
  const markedInHead = Math.min(zeroCount, head.length);

  return (
    <span className={cx('hash mono', full && 'hash-full', className)} title={shown ? undefined : hash}>
      <span className="visually-hidden">{hash}</span>
      <span aria-hidden="true">
        {markedInHead > 0 ? <span className="zero">{head.slice(0, markedInHead)}</span> : null}
        {head.slice(markedInHead)}
        {shown ? null : '…'}
        {end}
      </span>
    </span>
  );
}
