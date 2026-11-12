import { useState } from 'react';
import { useT } from '@/i18n/settings';
import { sha256Hex } from '@/lib/hash';
import { buildPayment, fee, selectCoins } from '@/lib/tx';
import type { Utxo } from '@/lib/tx';
import { useReducedMotion } from '@/state/useMediaQuery';
import { formatBtc } from '@/text/format';
import './visuals.css';

const COPY = {
  caption: {
    en: 'The coin goes in whole: what you do not pay away comes back to you as a new, smaller coin.',
    zh: '整枚幣都要放進去：沒有付出去的部分，會變成一枚較小的新幣回到你手上。',
  },
  less: { en: 'Pay less', zh: '少付一點' },
  more: { en: 'Pay more', zh: '多付一點' },
  coin: { en: 'coin in', zh: '放進去的幣' },
  payment: { en: 'payment', zh: '付款' },
  change: { en: 'change', zh: '找續' },
  alt: {
    en: 'One coin drawn as a bar, cut into the payment and the change that returns.',
    zh: '一枚幣畫成一條橫條，切成付款和退回的找續兩段。',
  },
};

const COIN: Utxo = { txid: sha256Hex('glossary: a coin of half a bitcoin'), vout: 0, value: 50_000_000n, owner: 'you' };
const STEP = 5_000_000n;
const MIN = STEP;
const MAX = 45_000_000n;

/** How a stepper looks at its limit: what visuals.css gives a disabled button, for one that stays focusable. */
const AT_LIMIT = { opacity: 0.35, cursor: 'default', backgroundColor: 'transparent' } as const;

/** One coin split into a payment and its change; the payment can be moved up and down. */
export default function ChangeVisual() {
  const t = useT();
  const still = useReducedMotion();
  const [amount, setAmount] = useState(15_000_000n);
  // The cut glides to its new place, unless the reader asked for less motion.
  const grow = still ? undefined : 'flex-grow var(--duration-fast) var(--ease-smooth-out)';

  // A flat fee of 1,000 satoshis: too thin to draw, and counted all the same.
  const selection = selectCoins([COIN], amount, 0n, 1_000n);
  if (!selection) return null;
  const tx = buildPayment(selection, 'payee', amount, 'you', 546n);
  const change = tx.outputs[1]?.value ?? 0n;
  const paid = fee(tx, [COIN]);
  const atLeast = amount <= MIN;
  const atMost = amount >= MAX;

  return (
    <div className="tv">
      <div className="tv-row">
        <span className="tv-dim">{t(COPY.coin)}</span>
        <span>{formatBtc(COIN.value)}</span>
      </div>
      {/* One coin as a bar of two filled pieces: what is paid away, and what comes back. */}
      <div style={{ display: 'flex', gap: 2, height: 18, margin: '4px 0' }} role="img" aria-label={t(COPY.alt)}>
        <span style={{ flex: Number(amount), background: 'var(--color-orange)', transition: grow }} />
        <span style={{ flex: Number(change), background: 'var(--color-cream)', transition: grow }} />
      </div>
      <div className="tv-row" style={{ justifyContent: 'space-between' }}>
        <span className="tv-hit">
          {t(COPY.payment)} {formatBtc(amount)}
        </span>
        <span>
          {t(COPY.change)} {formatBtc(change)}
        </span>
      </div>
      <div className="tv-row" style={{ alignItems: 'center', marginTop: 6 }}>
        {/* aria-disabled, not disabled: at its limit a stepper would otherwise drop the focus. */}
        <button
          type="button"
          className="tv-btn"
          aria-label={t(COPY.less)}
          aria-disabled={atLeast}
          style={atLeast ? AT_LIMIT : undefined}
          onClick={() => {
            if (!atLeast) setAmount(amount - STEP);
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
            if (!atMost) setAmount(amount + STEP);
          }}
        >
          +
        </button>
        <span className="tv-dim" aria-live="polite">
          {formatBtc(COIN.value)} − {formatBtc(amount)} − {formatBtc(paid)} = {formatBtc(change)}
        </span>
      </div>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
