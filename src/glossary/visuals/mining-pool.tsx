import { useEffect, useState } from 'react';
import { useT } from '@/i18n/settings';
import { mulberry32 } from '@/lib/rng';
import { useReducedMotion } from '@/state/useMediaQuery';
import './visuals.css';

const COPY = {
  caption: {
    en: 'One pool builds the block template and hands it to many machines, and whichever of them finds the proof-of-work, the reward is shared.',
    zh: '礦池組出區塊模板，再分派給大量礦機；不論哪一部找到工作量證明，獎勵都由大家攤分。',
  },
  pool: { en: 'pool', zh: '礦池' },
  template: { en: 'block template', zh: '區塊模板' },
  stages: {
    handing: { en: 'handing out the template', zh: '正在分派模板' },
    searching: { en: 'every machine searches', zh: '所有礦機一起搜尋' },
    found: { en: 'machine {n} finds the block', zh: '第 {n} 部礦機找到區塊' },
  },
};

const MACHINES = 6;
const WIDTH = 300;
const xOf = (index: number) => 25 + index * 50;

/** Frames of one round: the template goes out machine by machine, all search, one finds. */
const ROUND = MACHINES + 4;

/** Many machines, one pool, one template. */
export default function MiningPoolVisual() {
  const t = useT();
  const reducedMotion = useReducedMotion();
  // `frame` counts through a round; `finder` is the machine that finds the block at its end.
  const [state, setState] = useState({ frame: MACHINES, finder: 3 });

  useEffect(() => {
    if (reducedMotion) {
      setState({ frame: MACHINES, finder: 3 }); // still frame: every machine holds the template
      return;
    }
    const random = mulberry32(11);
    setState({ frame: 0, finder: Math.floor(random() * MACHINES) });
    const timer = window.setInterval(() => {
      setState(({ frame, finder }) =>
        frame + 1 >= ROUND ? { frame: 0, finder: Math.floor(random() * MACHINES) } : { frame: frame + 1, finder },
      );
    }, 520);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  const handed = Math.min(state.frame, MACHINES);
  const found = state.frame >= MACHINES + 2;
  const stage = found
    ? t(COPY.stages.found).replace('{n}', String(state.finder + 1))
    : handed < MACHINES
      ? t(COPY.stages.handing)
      : t(COPY.stages.searching);

  return (
    <div className="tv">
      {/* Drawn at its own width, not stretched to the card: the words in it are shown at the size they are set. */}
      <svg
        viewBox={`0 0 ${WIDTH} 86`}
        style={{ width: WIDTH, maxWidth: '100%' }}
        role="img"
        aria-label={t(COPY.caption)}
      >
        {/* The pool, holding the template: a solid slab. */}
        <rect x="48" y="2" width="204" height="26" fill="var(--color-ink-2)" />
        <text x="58" y="19" fontSize="11" fill="currentColor">
          {t(COPY.pool)}
        </text>
        <rect x="116" y="8" width="14" height="14" fill="var(--color-orange)" />
        <text x="136" y="19" fontSize="11" fill="currentColor" opacity="0.7">
          {t(COPY.template)}
        </text>
        {Array.from({ length: MACHINES }, (_, index) => {
          const has = index < handed;
          const winner = found && index === state.finder;
          return (
            <g key={index}>
              <path
                d={`M150 28L${xOf(index)} 56`}
                stroke={winner ? 'var(--color-orange)' : has ? 'var(--color-cream)' : 'var(--color-ink-3)'}
                strokeWidth={winner ? 3 : has ? 1.5 : 1}
              />
              {/* A machine is a solid square: faint until it holds the template, orange when it finds the block. */}
              <rect
                x={xOf(index) - 13}
                y="56"
                width="26"
                height="22"
                fill={winner ? 'var(--color-orange)' : 'var(--color-cream)'}
                opacity={has || winner ? 1 : 0.4}
              />
              {has && !winner ? (
                <rect x={xOf(index) - 4} y="63" width="8" height="8" fill="var(--color-orange)" />
              ) : null}
            </g>
          );
        })}
      </svg>
      <div className="tv-row">
        <span className="tv-hit">
          {handed}/{MACHINES}
        </span>
        <span className="tv-dim" style={{ whiteSpace: 'normal' }}>
          {stage}
        </span>
      </div>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
