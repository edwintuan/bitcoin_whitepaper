import { useEffect, useState } from 'react';
import { useT } from '@/i18n/settings';
import { HALVING_INTERVAL, blockSubsidy } from '@/lib/subsidy';
import { useReducedMotion } from '@/state/useMediaQuery';
import { formatBtc, formatCount } from '@/text/format';
import './visuals.css';

const COPY = {
  caption: {
    en: 'Every 210,000 blocks the new coins per block are cut in half.',
    zh: '每隔 210,000 個區塊，每個區塊新造的幣便減半。',
  },
  from: { en: 'from block', zh: '由高度' },
  each: { en: 'BTC per block', zh: 'BTC／區塊' },
};

/** The first six eras, with the subsidy the engine computes for each. */
const ERAS = Array.from({ length: 6 }, (_, index) => {
  const start = index * HALVING_INTERVAL;
  return { start, subsidy: blockSubsidy(start) };
});

const WIDTH = 300;
const HEIGHT = 84;
const STEP = WIDTH / ERAS.length;
const top = (subsidy: bigint) => HEIGHT - (Number(subsidy) / Number(ERAS[0].subsidy)) * (HEIGHT - 4);

/** The subsidy staircase, from the real values. */
export default function HalvingVisual() {
  const t = useT();
  const reducedMotion = useReducedMotion();
  const [era, setEra] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      setEra(0);
      return;
    }
    const timer = window.setInterval(() => setEra((current) => (current + 1) % ERAS.length), 1300);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  return (
    <div className="tv">
      {/* Drawn at its own width, not stretched to the card: the words in it are shown at the size they are set. */}
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ width: WIDTH, maxWidth: '100%' }}
        role="img"
        aria-label={t(COPY.caption)}
      >
        {ERAS.map(({ start, subsidy }, index) => (
          <g key={start}>
            <rect
              x={index * STEP}
              y={top(subsidy)}
              width={STEP - 2}
              height={HEIGHT - top(subsidy)}
              fill={index === era ? 'var(--color-orange)' : 'var(--color-cream)'}
            />
            <text
              x={index * STEP + (STEP - 2) / 2}
              y={Math.max(top(subsidy) - 4, 9)}
              textAnchor="middle"
              fontSize="11"
              fill={index === era ? 'var(--color-orange)' : 'currentColor'}
            >
              {index === 0 ? '' : formatBtc(subsidy)}
            </text>
          </g>
        ))}
        <text x={(STEP - 2) / 2} y="15" textAnchor="middle" fontSize="11" fill="var(--color-ink)">
          {formatBtc(ERAS[0].subsidy)}
        </text>
      </svg>
      <div className="tv-row">
        <span className="tv-dim">{t(COPY.from)}</span>
        <span>{formatCount(ERAS[era].start)}</span>
        <span className="tv-hit">{formatBtc(ERAS[era].subsidy)}</span>
        <span className="tv-dim">{t(COPY.each)}</span>
      </div>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
