import { useMemo, useState } from 'react';
import { raceSeed } from '@/figures/attack/race';
import { WalkPlot } from '@/figures/attack/WalkPlot';
import { useT } from '@/i18n/settings';
import { giveUpGap, simulateRace } from '@/lib/attack';
import { mulberry32 } from '@/lib/rng';
import { useWidth } from '@/state/useWidth';
import { fill } from '@/text/format';
import './visuals.css';

const COPY = {
  replay: { en: 'Play again', zh: '再玩一次' },
  level: { en: 'caught up', zh: '追上' },
  quit: { en: 'too far behind', zh: '落後太遠' },
  caught: { en: 'Walk {n}: caught up after {steps} blocks.', zh: '第 {n} 次：{steps} 個區塊之後追上了。' },
  lost: { en: 'Walk {n}: gave up after {steps} blocks.', zh: '第 {n} 次：{steps} 個區塊之後放棄。' },
  plot: {
    en: 'A random walk that starts two blocks behind, between a line for catching up and a line for giving up.',
    zh: '一次隨機漫步：由落後兩個區塊開始，上方的線代表追上，下方的線代表放棄。',
  },
  caption: {
    en: 'Two blocks behind with 35% of the hash power, about 29 walks in 100 reach the top line and the rest drift away for good.',
    zh: '掌握 35% 算力、落後兩個區塊：每一百次漫步，大約有 29 次碰到上面那條線，其餘則愈落愈後，一去不返。',
  },
};

/** (0.35 / 0.65)² is 0.29: often enough to see both endings within a few presses. */
const Q = 0.35;
const Z = 2;
const LIMIT = giveUpGap(Q, Z);

/** The engine's random walk for one seed after another: sometimes it reaches breakeven, mostly it does not. */
export default function GamblersRuinVisual() {
  const t = useT();
  // Drawn at the width it is shown, so the two words on it are never scaled.
  const [ref, width] = useWidth<HTMLDivElement>(300);
  const [walk, setWalk] = useState(0);
  const race = useMemo(() => simulateRace(Q, Z, mulberry32(raceSeed(walk))), [walk]);

  return (
    <div ref={ref} className="tv">
      <WalkPlot path={race.path} upTo={race.steps} limit={LIMIT} width={width} height={88} level={t(COPY.level)} quit={t(COPY.quit)} label={t(COPY.plot)} minSpan={30} draw />
      <div className="tv-row" style={{ alignItems: 'center', marginTop: 8, whiteSpace: 'normal' }}>
        <button
          type="button"
          className="tv-btn"
          onClick={() => setWalk((n) => n + 1)}
          style={{ width: 'auto', flex: 'none', padding: '0 9px', fontFamily: 'var(--font-sans)', fontSize: 12 }}
        >
          {t(COPY.replay)}
        </button>
        <span className="tv-hit" role="status">
          {fill(t(race.caughtUp ? COPY.caught : COPY.lost), { n: walk + 1, steps: race.steps })}
        </span>
      </div>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
