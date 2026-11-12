import { cx } from '@/utils/cx';

export interface HexSegment {
  /** Identifies the field: reported through `onActive` and matched against `active`. */
  name: string;
  /** What to call the field aloud, in the reader's language. Defaults to `name`. */
  label?: string;
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
  /** The word for "bytes" in the reader's language, used in each field's accessible name. */
  unit?: string;
  className?: string;
}

const hex = (byte: number) => byte.toString(16).padStart(2, '0');

/**
 * Raw bytes with their fields told apart by alternating tints. Hovering,
 * tapping or focusing a field reports it, so a legend beside the view can
 * follow along. To assistive technology it is a list of named fields; the
 * bytes themselves are not read out one by one.
 */
export function HexView({ bytes, segments, active = null, onActive, perRow = 16, unit = 'bytes', className }: HexViewProps) {
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
          aria-label={`${segment.label ?? segment.name}: ${segment.end - segment.start} ${unit}`}
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
