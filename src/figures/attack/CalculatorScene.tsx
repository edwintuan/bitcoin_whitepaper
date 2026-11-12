import { useMemo } from 'react';
import { useT } from '@/i18n/settings';
import { useWidth } from '@/state/useWidth';
import { fill } from '@/text/format';
import { cx } from '@/utils/cx';
import {
  DECADES,
  FLOOR,
  THRESHOLD,
  blocksToWait,
  countNoun,
  curve,
  curvePoints,
  exactValue,
  formatChance,
  formatInHundred,
  formatOneIn,
  logPosition,
  oddsForm,
  tickStep,
} from './chart';
import { COPY } from './copy';
import { withVars } from './vars';

const HEIGHT = 240;
const MARGIN = { left: 42, right: 12, top: 12, bottom: 26 };

/** Ten to a negative power, written as the chart's axis writes it. */
const power = (exponent: number) => (
  <>
    10<sup>−{Math.abs(exponent)}</sup>
  </>
);

interface ChartProps {
  share: string;
  z: number;
  zMax: number;
  values: readonly number[];
  wait: number;
}

/** P against z on a logarithmic axis, drawn at the size it is shown so its type is never scaled. */
function Chart({ share, z, zMax, values, wait }: ChartProps) {
  const t = useT();
  const [ref, width] = useWidth<HTMLDivElement>(520);

  const plotWidth = width - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const x = (at: number) => MARGIN.left + (at / zMax) * plotWidth;
  const y = (at: number) => MARGIN.top + at * plotHeight;
  const right = width - MARGIN.right;
  const bottom = HEIGHT - MARGIN.bottom;

  const points = curvePoints(values);
  const p = values[z];
  const below = !(p > FLOOR);
  const pointY = y(logPosition(p));
  const thresholdY = y(logPosition(THRESHOLD));
  const dots = plotWidth / zMax >= 9;
  const waitShown = Number.isFinite(wait) && wait <= zMax;
  const step = tickStep(zMax);
  // The label of the crossing goes to the side that has room for it.
  const waitOnLeft = x(wait) > right - 96;

  const alt = [
    fill(t(COPY.chartAlt), { share, zMax, z, p: below ? t(COPY.belowFloor) : formatChance(p) }),
    waitShown ? fill(t(COPY.chartAltWait), { wait }) : '',
  ]
    .join(' ')
    .trim();

  return (
    <div ref={ref} className="atk-plot">
      <svg viewBox={`0 0 ${width} ${HEIGHT}`} role="img" aria-label={alt}>
        {Array.from({ length: DECADES + 1 }, (_, decade) => {
          const lineY = y(decade / DECADES);
          return (
            <g key={decade}>
              <line className={decade === DECADES ? 'atk-axisline' : 'atk-grid'} x1={MARGIN.left} y1={lineY} x2={right} y2={lineY} />
              <text className="atk-tick" x={MARGIN.left - 7} y={lineY} textAnchor="end" dominantBaseline="central">
                {decade === 0 ? (
                  '1'
                ) : (
                  <>
                    10
                    <tspan className="atk-tick-exp" dy="-4">
                      −{decade}
                    </tspan>
                  </>
                )}
              </text>
            </g>
          );
        })}
        <line className="atk-axisline" x1={MARGIN.left} y1={MARGIN.top} x2={MARGIN.left} y2={bottom} />

        {Array.from({ length: zMax / step + 1 }, (_, i) => i * step).map((tick) => (
          <g key={tick}>
            <line className="atk-axisline" x1={x(tick)} y1={bottom} x2={x(tick)} y2={bottom + 5} />
            <text className="atk-tick" x={x(tick)} y={bottom + 17} textAnchor="middle">
              {tick}
            </text>
          </g>
        ))}

        <line className="atk-threshold" x1={MARGIN.left} y1={thresholdY} x2={right} y2={thresholdY} />
        <text className="atk-threshold-label" x={right} y={thresholdY - 5} textAnchor="end">
          0.1%
        </text>

        <polyline className="atk-curve" points={points.map((point) => `${x(point.z).toFixed(1)},${y(point.at).toFixed(1)}`).join(' ')} />
        {dots
          ? points
              .filter((point) => Number.isInteger(point.z))
              .map((point) => <rect key={point.z} className="atk-dot" x={x(point.z) - 2.5} y={y(point.at) - 2.5} width="5" height="5" />)
          : null}

        {waitShown ? (
          <g>
            {/* A flag standing on the line, over the first point beneath it. */}
            <path className="atk-wait-mark" d={`M${x(wait) - 5} ${thresholdY - 10}h10l-5 9z`} />
            <text className="atk-wait-label" x={x(wait) + (waitOnLeft ? -10 : 10)} y={thresholdY - 8} textAnchor={waitOnLeft ? 'end' : 'start'}>
              z = {wait}
            </text>
          </g>
        ) : null}

        <line className="atk-guide" x1={x(z)} y1={pointY} x2={x(z)} y2={bottom} />
        <line className="atk-guide" x1={MARGIN.left} y1={pointY} x2={x(z)} y2={pointY} />
        {below ? (
          <path className="atk-point" d={`M${x(z) - 6} ${bottom - 10}h12l-6 9z`} />
        ) : (
          <rect className="atk-point" x={x(z) - 5.5} y={pointY - 5.5} width="11" height="11" />
        )}
      </svg>
    </div>
  );
}

interface CalculatorSceneProps {
  percent: number;
  z: number;
  zMax: number;
  /** True while the walkthrough is talking about how long to wait. */
  pointed?: boolean;
}

/** The paper's function as a dial: one probability, large, and the curve it sits on. */
export function CalculatorScene({ percent, z, zMax, pointed = false }: CalculatorSceneProps) {
  const t = useT();
  const q = percent / 100;
  const share = `${percent}%`;

  const values = useMemo(() => curve(q, zMax), [q, zMax]);
  const wait = useMemo(() => blocksToWait(q), [q]);

  const p = values[z];
  const form = oddsForm(p);
  const exact = exactValue(p);

  const callout = !Number.isFinite(wait)
    ? fill(t(COPY.waitUnknown), { share })
    : fill(t(wait <= zMax ? COPY.wait : COPY.waitBeyond), { share, z: wait, conf: wait + 1 });

  // A likely outcome reads as so many in a hundred, a rare one as one in so many.
  const likely = form === 'inHundred' || form === 'certain';
  const status =
    z === 0
      ? t(COPY.statusZero)
      : fill(t(form === 'belowFloor' ? COPY.statusFloor : likely ? COPY.statusLikely : COPY.status), {
          share,
          blocks: countNoun(z, t(COPY.blocksOne), t(COPY.blocksMany)),
          conf: z + 1,
          n: likely ? formatInHundred(p) : form === 'oneIn' ? formatOneIn(p) : '',
        });

  // At z = 0 the formula's 1 is where it starts counting, not odds worth putting into words.
  const odds =
    form === 'belowFloor'
      ? t(COPY.belowFloor)
      : form === 'inHundred'
        ? fill(t(COPY.inHundred), { n: formatInHundred(p) })
        : form === 'oneIn'
          ? fill(t(COPY.oneIn), { n: formatOneIn(p) })
          : null;

  return (
    <div className="atk-calc fig-stack">
      <div className="atk-result">
        <p className="label atk-result-cap">{t(COPY.result)}</p>
        <p className="atk-result-big">
          <span className="atk-p">{formatChance(p)}</span>
          {odds ? <span className="atk-odds mono">{odds}</span> : null}
        </p>
        <p className="atk-exact mono">
          {exact.kind === 'decimal' ? (
            <>P = {exact.text}</>
          ) : exact.kind === 'power' ? (
            <>
              P = {exact.mantissa} × {power(exact.exponent)}
            </>
          ) : (
            <>P &lt; {power(exact.exponent)}</>
          )}
        </p>
      </div>

      <p className="label atk-axis">{t(COPY.axisP)}</p>
      <Chart share={share} z={z} zMax={zMax} values={values} wait={wait} />
      <p className="label atk-axis atk-axis-x">{withVars(t(COPY.axisZ))} →</p>

      <p className={cx('fig-band atk-callout', pointed && 'fig-pointed')}>{callout}</p>

      <p className="fig-status" role="status">
        {status}
      </p>
    </div>
  );
}
