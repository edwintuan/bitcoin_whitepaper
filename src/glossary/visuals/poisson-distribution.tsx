import { useState } from 'react';
import { formatChance } from '@/figures/attack/chart';
import { poisson, tallest } from '@/figures/attack/trace';
import { useT } from '@/i18n/settings';
import { useWidth } from '@/state/useWidth';
import { fill } from '@/text/format';
import './visuals.css';

const COPY = {
  mean: { en: 'expected on average', zh: '平均預期的數目' },
  less: { en: 'Lower the average', zh: '調低平均值' },
  more: { en: 'Raise the average', zh: '調高平均值' },
  chart: {
    en: 'Bars for the chance of exactly 0, 1, 2 and so on up to 10 events when {mean} are expected. The tallest is {k}, at {p}.',
    zh: '柱狀圖：預期發生 {mean} 次時，剛好發生 0、1、2 以至 10 次的概率。最高的一條是 {k} 次，概率為 {p}。',
  },
  // A whole-number average has two equally likely counts.
  chartTwo: {
    en: 'Bars for the chance of exactly 0, 1, 2 and so on up to 10 events when {mean} are expected. The two tallest, {a} and {b}, are equal at {p}.',
    zh: '柱狀圖：預期發生 {mean} 次時，剛好發生 0、1、2 以至 10 次的概率。最高的兩條是 {a} 次和 {b} 次，概率同為 {p}。',
  },
  caption: {
    en: 'When the attacker is expected to find this many blocks while the merchant waits, bar k is his chance of finding exactly k.',
    zh: '若攻擊者在商戶等待期間預期找到這麼多個區塊，第 k 條柱就是他剛好找到 k 個的概率。',
  },
};

/** The averages on offer, in halves. */
const MIN = 0.5;
const MAX = 6;
const BARS = 11;
const GAP = 7;
const CHART = { height: 80, top: 16, floor: 62 };
/** How a button at the end of its range looks. It keeps the focus, so it is not `disabled`. */
const AT_END = { opacity: 0.35, cursor: 'default', backgroundColor: 'transparent' } as const;

/** The Poisson probabilities for a mean the reader steps up and down, computed as the paper's loop computes them. */
export default function PoissonDistributionVisual() {
  const t = useT();
  // Drawn at the width it is shown, so the numbers in it are never scaled.
  const [ref, width] = useWidth<HTMLDivElement>(290);
  const [mean, setMean] = useState(2);
  const bars = Array.from({ length: BARS }, (_, k) => poisson(mean, k));
  const peaks = tallest(bars);
  const top = bars[peaks[0]];
  // The tallest bar always fills the height and carries its value, so the shape reads at any average.
  const scale = (CHART.floor - CHART.top) / top;
  const bar = (width - (BARS - 1) * GAP) / BARS;
  const x = (k: number) => k * (bar + GAP);
  const meanX = x(mean) + bar / 2;
  // One value over the tallest bar, or between the two that share it. Kept inside the drawing.
  const peakX = Math.max(18, (x(peaks[0]) + x(peaks[peaks.length - 1]) + bar) / 2);
  const canLower = mean > MIN;
  const canRaise = mean < MAX;

  const alt =
    peaks.length > 1
      ? fill(t(COPY.chartTwo), { mean, a: peaks[0], b: peaks[1], p: formatChance(top) })
      : fill(t(COPY.chart), { mean, k: peaks[0], p: formatChance(top) });

  return (
    <div ref={ref} className="tv">
      <div className="tv-row" style={{ alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          className="tv-btn"
          aria-label={t(COPY.less)}
          aria-disabled={!canLower}
          style={canLower ? undefined : AT_END}
          onClick={() => {
            if (canLower) setMean((value) => value - 0.5);
          }}
        >
          −
        </button>
        <span className="tv-big" aria-live="polite" style={{ minWidth: 38, textAlign: 'center' }}>
          {mean}
        </span>
        <button
          type="button"
          className="tv-btn"
          aria-label={t(COPY.more)}
          aria-disabled={!canRaise}
          style={canRaise ? undefined : AT_END}
          onClick={() => {
            if (canRaise) setMean((value) => value + 0.5);
          }}
        >
          +
        </button>
        <span className="tv-dim">λ · {t(COPY.mean)}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${CHART.height}`} role="img" aria-label={alt} style={{ marginTop: 8 }}>
        {bars.map((p, k) => {
          const height = Math.max(1, p * scale);
          return (
            <g key={k}>
              <rect x={x(k)} y={CHART.floor - height} width={bar} height={height} fill={peaks.includes(k) ? 'var(--color-orange)' : 'var(--color-cream)'} />
              <text x={x(k) + bar / 2} y={CHART.floor + 14} textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.75">
                {k}
              </text>
            </g>
          );
        })}
        <text x={peakX} y={CHART.top - 5} textAnchor="middle" fill="var(--color-orange)" fontSize="11" fontWeight="500">
          {formatChance(top)}
        </text>
        <path d={`M${meanX} ${CHART.floor - 1}v6`} stroke="var(--color-orange)" strokeWidth="3" />
        <path d={`M0 ${CHART.floor}H${width}`} stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
