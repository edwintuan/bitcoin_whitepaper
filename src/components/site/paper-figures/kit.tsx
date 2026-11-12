import { createContext, useContext, useId } from 'react';
import type { ReactNode } from 'react';

/**
 * A small drawing kit for redrawing the paper's own diagrams: plain boxes,
 * labels and arrows in the paper's style. These are the static originals;
 * the interactive versions live in src/figures.
 */

const ArrowHead = createContext('');

/** Labels are set at 13 px. Below this share of its drawn width a diagram's labels fall under 11 px. */
const SMALLEST_SCALE = 11 / 13;

export function Diagram({
  width,
  height,
  label,
  children,
}: {
  width: number;
  height: number;
  /** What the diagram shows, for readers who cannot see it. */
  label: string;
  children: ReactNode;
}) {
  const head = useId();
  return (
    <svg
      className="paper-svg"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      // On a narrow screen the diagram stops shrinking while its labels can
      // still be read, and its frame scrolls sideways instead.
      style={{ maxWidth: width, minWidth: Math.ceil(width * SMALLEST_SCALE) }}
    >
      <defs>
        <marker id={head} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0.5L7.5 4L0 7.5Z" fill="currentColor" />
        </marker>
      </defs>
      <ArrowHead.Provider value={head}>{children}</ArrowHead.Provider>
    </svg>
  );
}

/** A box with an optional centred label. `lines` breaks the label over several lines. */
export function Box({
  x,
  y,
  w,
  h,
  label,
  lines,
  dashed = false,
  muted = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  lines?: string[];
  dashed?: boolean;
  muted?: boolean;
}) {
  const text = lines ?? (label ? [label] : []);
  const firstLine = y + h / 2 - ((text.length - 1) * 14) / 2;
  return (
    <g opacity={muted ? 0.35 : 1}>
      <rect x={x} y={y} width={w} height={h} strokeDasharray={dashed ? '4 3' : undefined} />
      {text.map((line, index) => (
        <text key={index} x={x + w / 2} y={firstLine + index * 14} textAnchor="middle" dominantBaseline="central">
          {line}
        </text>
      ))}
    </g>
  );
}

export function Label({
  x,
  y,
  children,
  anchor = 'start',
  italic = false,
  size,
}: {
  x: number;
  y: number;
  children: string;
  anchor?: 'start' | 'middle' | 'end';
  italic?: boolean;
  size?: number;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontStyle={italic ? 'italic' : undefined} fontSize={size} dominantBaseline="central">
      {children}
    </text>
  );
}

/** A straight arrow, or a polyline through `via` points. */
export function Arrow({
  from,
  to,
  via = [],
  head = true,
}: {
  from: [number, number];
  to: [number, number];
  via?: [number, number][];
  head?: boolean;
}) {
  const marker = useContext(ArrowHead);
  const points = [from, ...via, to].map(([px, py]) => `${px},${py}`).join(' ');
  return <polyline className="paper-line" points={points} markerEnd={head ? `url(#${marker})` : undefined} />;
}
