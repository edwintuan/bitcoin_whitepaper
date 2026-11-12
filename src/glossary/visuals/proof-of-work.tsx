import { useEffect, useState } from 'react';
import { useT } from '@/i18n/settings';
import { sha256Hex } from '@/lib/hash';
import { useReducedMotion } from '@/state/useMediaQuery';
import './visuals.css';

const COPY = {
  caption: {
    en: 'Every try lands somewhere at random along the line, and only the orange stretch below the target counts.',
    zh: '每次嘗試都隨機落在這條線上的某處，只有落在目標值以下的橙色一段才算數。',
  },
  target: { en: 'target', zh: '目標值' },
  tries: { en: 'tries', zh: '次嘗試' },
};

const WIDTH = 300;
/** The valid stretch: one eighth of all hashes, i.e. three leading zero bits. */
const TARGET_X = WIDTH / 8;
const KEEP = 16;

/** Where a hash falls between 0 and the largest possible hash, scaled to the line. */
const landing = (attempt: number) => (parseInt(sha256Hex(`try ${attempt}`).slice(0, 6), 16) / 0xffffff) * WIDTH;

/** Proof-of-work as a lottery of landings on a number line. */
export default function ProofOfWorkVisual() {
  const t = useT();
  const reducedMotion = useReducedMotion();
  const [tries, setTries] = useState(reducedMotion ? KEEP : 1);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => setTries((n) => n + 1), 360);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  const shown = Array.from({ length: Math.min(tries, KEEP) }, (_, i) => tries - i);

  return (
    <div className="tv">
      <svg viewBox={`0 0 ${WIDTH} 46`} role="img" aria-label={t(COPY.caption)}>
        <rect x="0" y="20" width={WIDTH} height="6" fill="var(--color-ink-2)" />
        <rect x="0" y="20" width={TARGET_X} height="6" fill="var(--color-orange)" />
        <path d={`M${TARGET_X} 10V36`} stroke="var(--color-cream)" strokeWidth="2" />
        <text x={TARGET_X + 5} y="42" fill="currentColor" fontSize="11">
          {t(COPY.target)}
        </text>
        {shown.map((attempt, age) => {
          const x = landing(attempt);
          const hit = x <= TARGET_X;
          return (
            <rect
              key={attempt}
              x={x - (hit ? 4 : 2.5)}
              y={hit ? 4 : 10}
              width={hit ? 8 : 5}
              height={hit ? 8 : 5}
              fill={hit ? 'var(--color-orange)' : 'var(--color-cream)'}
              opacity={hit ? 1 : Math.max(0.15, 1 - age / KEEP)}
            />
          );
        })}
      </svg>
      <div className="tv-row">
        <span className="tv-hit">{tries}</span>
        <span className="tv-dim">{t(COPY.tries)}</span>
      </div>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
