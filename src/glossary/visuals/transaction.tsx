import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useT } from '@/i18n/settings';
import { fee, txid } from '@/lib/tx';
import type { Tx, Utxo } from '@/lib/tx';
import { formatCount } from '@/text/format';
import './visuals.css';

const COPY = {
  inputs: { en: 'inputs', zh: '輸入' },
  outputs: { en: 'outputs', zh: '輸出' },
  payee: { en: 'to Bob', zh: '付給鮑勃' },
  change: { en: 'change', zh: '找續' },
  fee: { en: 'fee', zh: '手續費' },
  less: { en: 'Take less change', zh: '少收一點找續' },
  more: { en: 'Take more change', zh: '多收一點找續' },
  caption: {
    en: 'The fee is never written down: it is whatever the inputs hold beyond what the outputs pay out, here in satoshis.',
    zh: '手續費不會寫在交易之內：輸入的總額減去輸出付出的總額，餘下的就是手續費（這裏以聰計）。',
  },
};

/** Two coins the payer already holds, each the output of an earlier transaction. */
const COINS: Utxo[] = [60_000n, 50_000n].map((value) => {
  const output = { value, owner: 'Alice' };
  return { txid: txid({ inputs: [], outputs: [output] }), vout: 0, ...output };
});
const TOTAL = COINS.reduce((sum, coin) => sum + coin.value, 0n);
const PAYMENT = 70_000n;
const STEP = 1_000n;

/** A coin going in or coming out: one solid shape, stacked on the next with a sliver of the card between. */
const coin: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 8,
  marginTop: 2,
  padding: '1px 7px',
  background: 'var(--color-cream)',
  color: 'var(--color-ink)',
};
/** What nobody claims is left for the miner: the one orange shape. */
const leftOver: CSSProperties = { ...coin, background: 'var(--color-orange)' };
/** Second-rank words on a light shape, still readable there. */
const quiet: CSSProperties = { opacity: 0.7 };
/** A button with nothing left to do keeps the focus, so it is dimmed here and not with the disabled attribute. */
const spent: CSSProperties = { opacity: 0.35, cursor: 'default', backgroundColor: 'transparent' };

/** One transaction: what goes in, what comes out, and the difference that is left for the miner. */
export default function TransactionVisual() {
  const t = useT();
  const [change, setChange] = useState(39_000n);

  const tx: Tx = {
    inputs: COINS.map(({ txid: id, vout }) => ({ txid: id, vout })),
    outputs: [
      { value: PAYMENT, owner: 'Bob' },
      { value: change, owner: 'Alice' },
    ],
  };
  const paid = fee(tx, COINS);
  const sats = (value: bigint) => formatCount(Number(value));
  const noLess = change < STEP;
  const noMore = change + PAYMENT + STEP > TOTAL;

  return (
    <div className="tv">
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.8fr) 22px minmax(0, 1.2fr)', alignItems: 'start' }}>
        <div>
          <div className="tv-dim">{t(COPY.inputs)}</div>
          {COINS.map((held) => (
            <div key={held.txid} style={coin}>
              {sats(held.value)}
            </div>
          ))}
        </div>
        <div style={{ paddingTop: 31, textAlign: 'center' }} aria-hidden="true">
          →
        </div>
        <div>
          <div className="tv-dim">{t(COPY.outputs)}</div>
          <div style={coin}>
            <span>{sats(PAYMENT)}</span>
            <span style={quiet}>{t(COPY.payee)}</span>
          </div>
          <div style={coin}>
            <span>{sats(change)}</span>
            <span style={quiet}>{t(COPY.change)}</span>
          </div>
          <div style={leftOver} role="status">
            <span>{sats(paid)}</span>
            <span>{t(COPY.fee)}</span>
          </div>
        </div>
      </div>

      <div className="tv-row" style={{ alignItems: 'center', marginTop: 8 }}>
        <button
          type="button"
          className="tv-btn"
          aria-label={t(COPY.less)}
          aria-disabled={noLess}
          style={noLess ? spent : undefined}
          onClick={() => {
            if (!noLess) setChange((value) => value - STEP);
          }}
        >
          −
        </button>
        <button
          type="button"
          className="tv-btn"
          aria-label={t(COPY.more)}
          aria-disabled={noMore}
          style={noMore ? spent : undefined}
          onClick={() => {
            if (!noMore) setChange((value) => value + STEP);
          }}
        >
          +
        </button>
        <span className="tv-dim">{t(COPY.change)}</span>
        <span style={{ marginLeft: 'auto' }}>
          {sats(TOTAL)} − {sats(PAYMENT + change)} = <span className="tv-hit">{sats(paid)}</span>
        </span>
      </div>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
