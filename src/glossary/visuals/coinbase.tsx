import { useEffect, useState } from 'react';
import { useT } from '@/i18n/settings';
import { blockSubsidy } from '@/lib/subsidy';
import { useReducedMotion } from '@/state/useMediaQuery';
import { formatBtc } from '@/text/format';
import './visuals.css';

const COPY = {
  caption: {
    en: 'The first transaction of a block spends no earlier coin: it creates the block subsidy and collects the fees of the others.',
    zh: '區塊的第一筆交易不動用任何先前的幣：它造出區塊補貼，並收取其餘交易的手續費。',
  },
  coinbase: { en: 'coinbase', zh: 'coinbase' },
  spendsNothing: { en: 'spends nothing', zh: '不動用舊幣' },
  tx: { en: 'transaction', zh: '交易' },
  fee: { en: 'fee', zh: '手續費' },
  subsidy: { en: 'subsidy', zh: '補貼' },
  fees: { en: 'fees', zh: '手續費' },
};

/** The height of the fourth halving, where the subsidy is 3.125 BTC. */
const HEIGHT = 840_000;
const SUBSIDY = blockSubsidy(HEIGHT);
/** Fees of the three other transactions, in satoshis. Examples, not typical values. */
const FEES = [4_000n, 2_000n, 9_000n];

/** A block whose first transaction pays out the subsidy plus the fees of the rest, added up one at a time. */
export default function CoinbaseVisual() {
  const t = useT();
  const reducedMotion = useReducedMotion();
  // How many of the fees have been added to the coinbase so far.
  const [counted, setCounted] = useState(FEES.length);

  useEffect(() => {
    if (reducedMotion) {
      setCounted(FEES.length);
      return;
    }
    setCounted(0);
    const timer = window.setInterval(() => setCounted((current) => (current + 1) % (FEES.length + 3)), 900);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  const shown = Math.min(counted, FEES.length);
  const fees = FEES.slice(0, shown).reduce((sum, fee) => sum + fee, 0n);

  return (
    <div className="tv">
      {/* The block is a solid slab; its transactions are rows with a hairline between them. */}
      <div style={{ background: 'var(--color-ink-2)' }}>
        <div
          className="tv-row"
          style={{ padding: '3px 6px', background: 'var(--color-orange)', color: 'var(--color-ink)', fontWeight: 500 }}
        >
          <span>{t(COPY.coinbase)}</span>
          <span style={{ opacity: 0.75 }}>{t(COPY.spendsNothing)}</span>
          <span style={{ marginLeft: 'auto' }}>→ {formatBtc(SUBSIDY + fees)} BTC</span>
        </div>
        {FEES.map((fee, index) => (
          <div
            className="tv-row"
            key={index}
            style={{ padding: '2px 6px', borderTop: index > 0 ? '1px solid var(--color-ink-3)' : undefined }}
          >
            <span className="tv-dim">
              {t(COPY.tx)} {index + 1}
            </span>
            <span className={index < shown ? 'tv-hit' : 'tv-dim'} style={{ marginLeft: 'auto' }}>
              {t(COPY.fee)} {formatBtc(fee)} {index < shown ? '↑' : ''}
            </span>
          </div>
        ))}
      </div>
      <div className="tv-row" style={{ marginTop: 5 }}>
        <span className="tv-dim">{t(COPY.subsidy)}</span>
        <span>{formatBtc(SUBSIDY)}</span>
        <span className="tv-dim">+ {t(COPY.fees)}</span>
        <span className="tv-hit">{formatBtc(fees)}</span>
      </div>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
