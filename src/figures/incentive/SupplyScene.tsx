import { useLayoutEffect, useRef, useState } from 'react';
import { Slider } from '@/components/base/slider/slider';
import { useSettings, useT } from '@/i18n/settings';
import { COIN, HALVING_INTERVAL, MAX_SUPPLY, supplyAt } from '@/lib/subsidy';
import { fill, formatBtc, formatCount } from '@/text/format';
import { cx } from '@/utils/cx';
import { COPY } from './copy';
import { sentences } from './sentences';
import {
  HALVINGS,
  LAST_PAYING_BLOCK,
  MAX_HEIGHT,
  SUBSIDY_END,
  clampHeight,
  eraAt,
  nextHalving,
  previousHalving,
  satsText,
  shareOfLimit,
  stairs,
  supplyCurve,
} from './supply';

/** The slider moves in steps of this many blocks; the −1 and +1 buttons do the fine work. */
const SLIDER_STEP = 10_000;
/** Round number the supply chart is scaled to, in BTC. The limit sits a hair below it. */
const SUPPLY_SCALE = 21_000_000;
const FIRST_SUBSIDY = 50;

const STAIRS = stairs();
const CURVE = supplyCurve();

/** Satoshis as a plain number of bitcoin. For placing pixels only: amounts shown as text never pass through here. */
const toBtc = (sats: bigint): number => Number(sats) / 1e8;
const px = (value: number): string => value.toFixed(1);

export type SupplyHighlight = 'height' | 'charts' | null;

export interface SupplySceneProps {
  height: number;
  onHeight(height: number): void;
  highlight: SupplyHighlight;
}

/** The issuance schedule: move along the block height and read off subsidy, halvings and supply. */
export function SupplyScene({ height, onHeight, highlight }: SupplySceneProps) {
  const t = useT();
  const { lang } = useSettings();
  const charts = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = charts.current;
    if (!element) return;
    const measure = () => setWidth(element.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const era = eraAt(height);
  const supply = supplyAt(height);
  const share = shareOfLimit(height);
  const previous = previousHalving(height);
  const next = nextHalving(height);
  const x = (at: number) => (at / MAX_HEIGHT) * width;

  /* ---- subsidy: a staircase ---- */
  const S = { height: 128, top: 16, bottom: 125 };
  const sy = (btc: number) => S.bottom - (btc / FIRST_SUBSIDY) * (S.bottom - S.top);
  const stairsPath =
    `M0 ${S.bottom}` +
    STAIRS.map(
      (step) => `L${px(x(step.from))} ${px(sy(toBtc(step.subsidy)))}L${px(x(step.to))} ${px(sy(toBtc(step.subsidy)))}`,
    ).join('') +
    `L${px(width)} ${S.bottom}Z`;

  /* ---- supply: a curve that flattens ---- */
  // Below the axis: a row of tick labels, then the name of the axis on a line of its own.
  const P = { height: 177, top: 30, bottom: 144, ticks: 161, name: 174 };
  const py = (btc: number) => P.bottom - (btc / SUPPLY_SCALE) * (P.bottom - P.top);
  const curvePoints = CURVE.map((point) => `${px(x(point.height))} ${px(py(toBtc(point.supply)))}`);
  const limitY = py(toBtc(MAX_SUPPLY));

  const cursorX = x(height);

  return (
    <div className="inc-supply fig-stack">
      <dl className="inc-stats">
        <div>
          <dt className="label">{t(COPY.subsidy)}</dt>
          <dd>
            <span className="stat-value">{formatBtc(era.subsidy)}</span>
            <span className="inc-unit">BTC</span>
            <span className="inc-sub mono">
              {satsText(era.subsidy)} {t(COPY.sat)[era.subsidy === 1n ? 0 : 1]}
            </span>
          </dd>
        </div>
        <div>
          <dt className="label">{t(COPY.halvings)}</dt>
          <dd>
            <span className="stat-value">{era.halvings}</span>
            <span className="inc-unit">{fill(t(COPY.ofHalvings), { total: HALVINGS })}</span>
          </dd>
        </div>
        <div>
          <dt className="label">{t(COPY.issued)}</dt>
          <dd>
            <span className="stat-value">{formatBtc(supply)}</span>
            <span className="inc-unit">BTC</span>
          </dd>
        </div>
        <div>
          <dt className="label">{t(COPY.share)}</dt>
          <dd>
            <span className="stat-value">{share}%</span>
          </dd>
        </div>
      </dl>

      <div className={cx(highlight === 'height' && 'fig-pointed')}>
        <Slider
          label={t(COPY.height)}
          thumbLabel={t(COPY.height)}
          minValue={0}
          maxValue={MAX_HEIGHT}
          step={SLIDER_STEP}
          value={height}
          onChange={(value) => onHeight(clampHeight(value))}
        />
        {/* A button that has reached the end of the range is switched off with aria-disabled, so the focus stays on it. */}
        <div className="fig-row inc-jumps">
          <button
            type="button"
            className="btn btn-sm btn-line"
            aria-disabled={previous === null || undefined}
            onClick={() => previous !== null && onHeight(previous)}
          >
            ← {t(COPY.prevHalving)}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-line"
            aria-disabled={next === null || undefined}
            onClick={() => next !== null && onHeight(next)}
          >
            {t(COPY.nextHalving)} →
          </button>
          <button
            type="button"
            className="btn btn-sm btn-line"
            aria-label={t(COPY.oneBack)}
            aria-disabled={height <= 0 || undefined}
            onClick={() => height > 0 && onHeight(clampHeight(height - 1))}
          >
            −1
          </button>
          <button
            type="button"
            className="btn btn-sm btn-line"
            aria-label={t(COPY.oneOn)}
            aria-disabled={height >= MAX_HEIGHT || undefined}
            onClick={() => height < MAX_HEIGHT && onHeight(clampHeight(height + 1))}
          >
            +1
          </button>
          <p className="inc-height" role="status">
            <span className="label">{t(COPY.block)}</span>
            <span className="stat-value">{formatCount(height)}</span>
          </p>
        </div>
      </div>

      <div className={cx('inc-charts', highlight === 'charts' && 'fig-pointed')} ref={charts}>
        <div className="inc-chart">
          <p className="label inc-chart-title">{t(COPY.chartSubsidy)}</p>
          <svg
            width={width}
            height={S.height}
            role="img"
            aria-label={fill(t(COPY.subsidyAlt), {
              end: formatCount(SUBSIDY_END),
              height: formatCount(height),
              subsidy: formatBtc(era.subsidy),
            })}
          >
            {width > 0 ? (
              <>
                {[50, 25, 12.5].map((level) => (
                  <line key={level} className="inc-grid" x1={0} x2={width} y1={sy(level)} y2={sy(level)} />
                ))}
                <path className="inc-stairs" d={stairsPath} />
                <line className="inc-axis" x1={0} x2={width} y1={S.bottom} y2={S.bottom} />
                <line className="inc-cursor" x1={cursorX} x2={cursorX} y1={S.top - 8} y2={S.bottom} />
                {/* The labels are drawn over the cursor, so that it never runs through a number. */}
                {STAIRS.slice(0, 3).map((step) => (
                  <text key={step.from} className="inc-tick-text" x={x(step.to) + 4} y={sy(toBtc(step.subsidy)) + 9}>
                    {formatBtc(step.subsidy)}
                  </text>
                ))}
                <rect className="inc-cursor-dot" x={cursorX - 4} y={sy(toBtc(era.subsidy)) - 4} width={8} height={8} />
              </>
            ) : null}
          </svg>
        </div>

        <div className="inc-chart">
          <p className="label inc-chart-title" data-side="left">
            {t(COPY.chartSupply)}
          </p>
          <svg
            width={width}
            height={P.height}
            role="img"
            aria-label={fill(t(COPY.supplyAlt), { height: formatCount(height), supply: formatBtc(supply), share })}
          >
            {width > 0 ? (
              <>
                <path className="inc-area" d={`M0 ${P.bottom}L${curvePoints.join('L')}L${px(width)} ${P.bottom}Z`} />
                <line
                  className="inc-grid inc-grid-over"
                  x1={0}
                  x2={width}
                  y1={py(SUPPLY_SCALE / 2)}
                  y2={py(SUPPLY_SCALE / 2)}
                />
                <path className="inc-curve" d={`M${curvePoints.join('L')}`} />
                <line className="inc-limit" x1={0} x2={width} y1={limitY} y2={limitY} />
                <line className="inc-axis" x1={0} x2={width} y1={P.bottom} y2={P.bottom} />
                {[0, 10, 20, 30].map((halvings) => {
                  const at = halvings * HALVING_INTERVAL;
                  return (
                    <g key={halvings}>
                      <line className="inc-axis" x1={x(at)} x2={x(at)} y1={P.bottom} y2={P.bottom + 5} />
                      <text
                        className="inc-tick-text"
                        x={x(at) + (halvings === 0 ? 0 : -1)}
                        y={P.ticks}
                        textAnchor={halvings === 0 ? 'start' : 'middle'}
                      >
                        {halvings === 0 ? '0' : `${(at / 1_000_000).toFixed(1)} ${t(COPY.million)}`}
                      </text>
                    </g>
                  );
                })}
                <text className="inc-tick-text" x={width} y={P.name} textAnchor="end">
                  {t(COPY.axisHeight)} →
                </text>
                <line className="inc-cursor" x1={cursorX} x2={cursorX} y1={P.top - 8} y2={P.bottom} />
                {/* As above: the labels are drawn over the cursor. */}
                <text className="inc-limit-text inc-half" x={width - 4} y={py(SUPPLY_SCALE / 2) - 5} textAnchor="end">
                  10.5 {t(COPY.million)}
                </text>
                <text className="inc-limit-text" x={width - 4} y={limitY + 16} textAnchor="end">
                  {t(COPY.limit)} {formatBtc(MAX_SUPPLY)} BTC
                </text>
                <rect className="inc-cursor-dot" x={cursorX - 4} y={py(toBtc(supply)) - 4} width={8} height={8} />
              </>
            ) : null}
          </svg>
        </div>
      </div>

      <p className="fig-note">
        {sentences(
          lang,
          era.end === null
            ? fill(t(COPY.eraFinal), { from: formatCount(era.start) })
            : fill(t(COPY.eraRange), {
                from: formatCount(era.start),
                to: formatCount(era.end),
                subsidy: formatBtc(era.subsidy),
              }),
          fill(t(COPY.limitNote), {
            btc: formatBtc(MAX_SUPPLY),
            sats: satsText(MAX_SUPPLY),
            short: formatBtc(21_000_000n * COIN - MAX_SUPPLY),
            last: formatCount(LAST_PAYING_BLOCK),
          }),
        )}
      </p>
    </div>
  );
}
