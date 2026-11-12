import { useEffect, useState } from 'react';
import { useT } from '@/i18n/settings';
import { mulberry32 } from '@/lib/rng';
import { useReducedMotion } from '@/state/useMediaQuery';
import './visuals.css';

const COPY = {
  caption: {
    en: 'Transactions wait here until a block takes them, the highest fee rate first.',
    zh: '交易在這裏等候，直至被區塊收走；費率最高的最先入選。',
  },
  waiting: { en: 'waiting · fee rate in sat/vB', zh: '等候中 · 費率（sat/vB）' },
  block: { en: 'block', zh: '區塊' },
};

/** A waiting transaction: a number to tell it apart and the fee rate it offers. The rates are made-up examples. */
interface Waiting {
  id: number;
  rate: number;
}

/** How many transactions the waiting area has room to show. */
const SLOTS = 8;
/** How many transactions a block has room for here. */
const BLOCK_ROOM = 4;
/** A block comes on every sixth tick; a transaction arrives on each of the others. */
const BLOCK_EVERY = 6;
/** Ticks a block's contents stay on show after it was found. */
const SHOWN_FOR = 3;
/** The frame shown when nothing may move: a block has just been found, and some transactions still wait. */
const STILL_TICK = BLOCK_EVERY * 3;

interface State {
  tick: number;
  next: number;
  pool: Waiting[];
  /** What the latest block took. */
  taken: Waiting[];
}

const START: State = { tick: 0, next: 1, pool: [], taken: [] };

/** The transactions a block would take: the best payers, as many as fit. */
const best = (pool: Waiting[]): Waiting[] => [...pool].sort((a, b) => b.rate - a.rate).slice(0, BLOCK_ROOM);

function advance(state: State, random: () => number): State {
  const tick = state.tick + 1;
  const phase = tick % BLOCK_EVERY;
  if (phase === 0) {
    const taken = best(state.pool);
    return { tick, next: state.next, pool: state.pool.filter((tx) => !taken.includes(tx)), taken };
  }
  const taken = phase === SHOWN_FOR ? [] : state.taken;
  if (state.pool.length >= SLOTS) return { ...state, tick, taken };
  return {
    tick,
    next: state.next + 1,
    pool: [...state.pool, { id: state.next, rate: 1 + Math.floor(random() * 40) }],
    taken,
  };
}

function play(ticks: number): State {
  const random = mulberry32(21);
  let state = START;
  for (let i = 0; i < ticks; i++) state = advance(state, random);
  return state;
}

/** Transactions arriving in a waiting area, and a block taking the best payers away. */
export default function MempoolVisual() {
  const t = useT();
  const reducedMotion = useReducedMotion();
  const [state, setState] = useState<State>(() => play(STILL_TICK));

  useEffect(() => {
    if (reducedMotion) {
      setState(play(STILL_TICK));
      return;
    }
    const random = mulberry32(21);
    setState(START);
    const timer = window.setInterval(() => setState((current) => advance(current, random)), 560);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  const chosen = state.tick % BLOCK_EVERY === BLOCK_EVERY - 1 ? best(state.pool) : [];

  return (
    <div className="tv">
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 74px', gap: 12, alignItems: 'start' }}>
        <div>
          <div className="tv-dim">{t(COPY.waiting)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginTop: 4, minHeight: 52 }}>
            {/* A waiting transaction is a solid chip; the ones the next block will take turn orange. */}
            {state.pool.map((tx) => (
              <span
                key={tx.id}
                style={{
                  height: 24,
                  display: 'grid',
                  placeItems: 'center',
                  background: chosen.includes(tx) ? 'var(--color-orange)' : 'var(--color-cream)',
                  color: 'var(--color-ink)',
                  fontWeight: 500,
                }}
              >
                {tx.rate}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="tv-dim">{t(COPY.block)}</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 3,
              marginTop: 4,
              padding: 4,
              minHeight: 52,
              alignContent: 'start',
              background: 'var(--color-ink-2)',
            }}
          >
            {state.taken.map((tx) => (
              <span
                key={tx.id}
                style={{
                  height: 19,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'var(--color-orange)',
                  color: 'var(--color-ink)',
                  fontWeight: 500,
                }}
              >
                {tx.rate}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
