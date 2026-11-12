import { useState } from 'react';
import { useT } from '@/i18n/settings';
import { sha256Hex } from '@/lib/hash';
import { fee, inputValue } from '@/lib/tx';
import type { Tx, Utxo } from '@/lib/tx';
import { useReducedMotion } from '@/state/useMediaQuery';
import { formatCount } from '@/text/format';
import './visuals.css';

const COPY = {
  caption: {
    en: 'No field says “fee”: it is whatever the outputs leave unclaimed, so a smaller change output means a larger fee.',
    zh: '交易內沒有「手續費」這個欄位：輸出沒有領走的部分就是手續費，所以找續愈少，手續費愈多。',
  },
  inputs: { en: 'inputs', zh: '輸入' },
  outputs: { en: 'outputs', zh: '輸出' },
  fee: { en: 'fee', zh: '手續費' },
  sats: { en: 'sat', zh: '聰' },
  less: { en: 'Smaller change output', zh: '減少找續' },
  more: { en: 'Larger change output', zh: '增加找續' },
  alt: {
    en: 'Two bars to the same scale: the inputs, and beneath them the outputs. The outputs fall short by the fee.',
    zh: '兩條比例相同的橫條：上面是輸入，下面是輸出。輸出比輸入短了一截，那就是手續費。',
  },
};

const COINS: Utxo[] = [50_000n, 30_000n].map((value, i) => ({
  txid: sha256Hex(`glossary: an input of the fee example ${i}`),
  vout: 0,
  value,
  owner: 'you',
}));
const PAYMENT = 50_000n;
const STEP = 7_000n;
const MAX_CHANGE = 28_000n;

/** How a stepper looks at its limit: what visuals.css gives a disabled button, for one that stays focusable. */
const AT_LIMIT = { opacity: 0.35, cursor: 'default', backgroundColor: 'transparent' } as const;

/** Inputs against outputs, to scale; the gap is the fee, and it moves with the change output. */
export default function FeeVisual() {
  const t = useT();
  const still = useReducedMotion();
  const [change, setChange] = useState(MAX_CHANGE);

  const tx: Tx = {
    inputs: COINS.map(({ txid, vout }) => ({ txid, vout })),
    outputs: change > 0n ? [{ value: PAYMENT, owner: 'payee' }, { value: change, owner: 'you' }] : [{ value: PAYMENT, owner: 'payee' }],
  };
  const total = inputValue(tx, COINS);
  const paid = fee(tx, COINS);
  const sats = (value: bigint) => formatCount(Number(value));
  // The bars glide to their new lengths, unless the reader asked for less motion.
  const grow = still ? undefined : 'flex-grow var(--duration-fast) var(--ease-smooth-out)';

  const atLeast = change <= 0n;
  const atMost = change >= MAX_CHANGE;

  return (
    <div className="tv">
      {/* Two bars of filled pieces: what goes in, and under it what comes out. What is missing from the second is the fee. */}
      <div role="img" aria-label={t(COPY.alt)}>
        <div style={{ display: 'flex', gap: 2, height: 14 }}>
          {COINS.map((coin) => (
            <span key={coin.txid} style={{ flex: Number(coin.value), background: 'var(--color-cream)' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 2, height: 14, marginTop: 3 }}>
          {tx.outputs.map((output, i) => (
            <span key={i} style={{ flex: Number(output.value), background: 'var(--color-cream)', transition: grow }} />
          ))}
          <span style={{ flex: Number(paid), background: 'var(--color-orange)', transition: grow }} />
        </div>
      </div>
      <div className="tv-row" style={{ marginTop: 5 }}>
        <span>
          {t(COPY.inputs)} {sats(total)}
        </span>
        <span className="tv-dim">−</span>
        <span>
          {t(COPY.outputs)} {sats(total - paid)}
        </span>
        <span className="tv-dim">=</span>
      </div>
      <div className="tv-row" style={{ alignItems: 'center', marginTop: 2 }}>
        <span className="tv-big" aria-live="polite">
          {sats(paid)}
        </span>
        <span className="tv-hit">
          {t(COPY.sats)} {t(COPY.fee)}
        </span>
        {/* aria-disabled, not disabled: at its limit a stepper would otherwise drop the focus. */}
        <button
          type="button"
          className="tv-btn"
          aria-label={t(COPY.less)}
          aria-disabled={atLeast}
          style={{ marginLeft: 'auto', ...(atLeast ? AT_LIMIT : null) }}
          onClick={() => {
            if (!atLeast) setChange(change - STEP);
          }}
        >
          −
        </button>
        <button
          type="button"
          className="tv-btn"
          aria-label={t(COPY.more)}
          aria-disabled={atMost}
          style={atMost ? AT_LIMIT : undefined}
          onClick={() => {
            if (!atMost) setChange(change + STEP);
          }}
        >
          +
        </button>
      </div>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
