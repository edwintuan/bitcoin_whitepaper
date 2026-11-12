/**
 * A random walk drawn as the paper describes it: the attacker's deficit after
 * every block, between two lines. Level with the honest chain at the top,
 * too far behind to go on at the bottom.
 *
 * It takes its colours from the text colour around it, so the same drawing
 * serves the figure on paper and the term card on black.
 */
export interface WalkPlotProps {
  /** The gap before the first block and after every block, as `simulateRace` records it. */
  path: readonly number[];
  /** How many blocks of the walk to draw. */
  upTo: number;
  /** The gap at which the attacker gives up: the bottom line. */
  limit: number;
  width: number;
  height: number;
  /** Words for the two lines. */
  level: string;
  quit: string;
  /** What the drawing shows, for readers who cannot see it. */
  label: string;
  /** Draw at least this many blocks wide, so short walks are not stretched. */
  minSpan?: number;
  /** Adds the class that makes the line draw itself (motion.css `t-draw`). */
  draw?: boolean;
}

/** Room above the top line and below the bottom one for a word set at 11 px. */
const TOP = 14;
const BOTTOM = 15;

export function WalkPlot({ path, upTo, limit, width, height, level, quit, label, minSpan = 24, draw = false }: WalkPlotProps) {
  const shown = Math.max(0, Math.min(upTo, path.length - 1));
  const span = Math.max(minSpan, path.length - 1);
  const x = (step: number) => 1 + (step / span) * (width - 8);
  const y = (gap: number) => TOP + (Math.min(gap, limit) / limit) * (height - TOP - BOTTOM);

  const points = path.slice(0, shown + 1).map((gap, step): [number, number] => [x(step), y(gap)]);
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  const [tipX, tipY] = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={label} style={{ maxWidth: '100%', height: 'auto' }}>
      <line x1="0" y1={y(0)} x2={width} y2={y(0)} stroke="var(--color-orange)" strokeWidth="2" />
      <line x1="0" y1={y(limit)} x2={width} y2={y(limit)} stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
      <text x={width} y={y(0) - 4} textAnchor="end" fill="currentColor" fontSize="11">
        {level}
      </text>
      <text x={width} y={y(limit) + 12} textAnchor="end" fill="currentColor" fontSize="11" opacity="0.75">
        {quit}
      </text>
      {points.length > 1 ? (
        <polyline
          key={draw ? `${path.length}-${path[path.length - 1]}-${shown}` : undefined}
          className={draw ? 't-draw' : undefined}
          style={draw ? { ['--len' as string]: Math.ceil(length) } : undefined}
          points={points.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      ) : null}
      <rect x={tipX - 4.5} y={tipY - 4.5} width="9" height="9" fill="var(--color-orange)" />
    </svg>
  );
}
