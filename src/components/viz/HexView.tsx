import { cx } from '@/utils/cx';

export interface HexSegment {
  name: string;
  /** First byte, inclusive. */
  start: number;
  /** Last byte, exclusive. */
  end: number;
}

export interface HexViewProps {
  bytes: Uint8Array;
  /** Fields of the message, in order, covering the bytes without gaps. */
  segments: HexSegment[];
  /** Name of the segment to emphasise. */
  active?: string | null;
  onActive?: (name: string | null) => void;
  /** Bytes per row. Default 16. */
  perRow?: number;
  className?: string;
}

const hex = (byte: number) => byte.toString(16).padStart(2, '0');

/**
 * Raw bytes with their fields told apart by alternating tints. Hovering,
 * tapping or focusing a field reports it, so a legend beside the view can
 * follow along. To assistive technology it is a list of named fields; the
 * bytes themselves are not read out one by one.
 */
export function HexView({ bytes, segments, active = null, onActive, perRow = 16, className }: HexViewProps) {
  return (
    <div className={cx('hexview mono', className)} style={{ ['--per-row' as string]: perRow }} role="list">
      {segments.map((segment, index) => (
        <span
          key={`${segment.name}-${segment.start}`}
          className="hex-seg"
          role="listitem"
          data-tint={index % 4}
          data-active={active === segment.name}
          tabIndex={onActive ? 0 : undefined}
          aria-label={`${segment.name}: ${segment.end - segment.start} bytes`}
          onMouseEnter={onActive ? () => onActive(segment.name) : undefined}
          onMouseLeave={onActive ? () => onActive(null) : undefined}
          onFocus={onActive ? () => onActive(segment.name) : undefined}
          onBlur={onActive ? () => onActive(null) : undefined}
        >
          {Array.from(bytes.subarray(segment.start, segment.end), (byte, offset) => (
            <span className="hex-byte" key={segment.start + offset} aria-hidden="true">
              {hex(byte)}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}
