import { useMemo, useState } from 'react';
import { useT } from '@/i18n/settings';
import { sha256Hex } from '@/lib/hash';
import { applyTx, buildPayment, selectCoins } from '@/lib/tx';
import type { Utxo } from '@/lib/tx';
import { formatBtc } from '@/text/format';
import './visuals.css';

const COPY = {
  caption: {
    en: 'A coin is an output nobody has spent yet: spending it destroys it and creates new ones in its place.',
    zh: '一枚幣，就是一個尚未有人花掉的輸出：把它花掉，它便消失，原處換成新造出來的幣。',
  },
  spend: { en: 'Spend the 0.5', zh: '花掉 0.5 那枚' },
  undo: { en: 'Start over', zh: '重新開始' },
  yours: { en: 'yours', zh: '你的' },
  theirs: { en: 'paid away', zh: '已付出' },
  list: { en: 'Unspent outputs, drawn by size', zh: '未花費輸出，按金額大小繪畫' },
};

const START: Utxo[] = [50_000_000n, 20_000_000n, 10_000_000n].map((value, i) => ({
  txid: sha256Hex(`glossary: the coin that became coin ${i}`),
  vout: 0,
  value,
  owner: 'you',
}));

const PAYMENT = 30_000_000n;
/** A flat fee in satoshis, the same as in the visual for change. */
const FEE = 1_000n;

/** Pay 0.3 from these coins: the 0.5 is the only one large enough, and what is left after the fee comes back. */
function spend(coins: Utxo[]): Utxo[] {
  const selection = selectCoins(coins, PAYMENT, 0n, FEE);
  return selection ? applyTx(coins, buildPayment(selection, 'someone else', PAYMENT, 'you', 546n)) : coins;
}

/** Side of a coin's square in pixels: area follows value. */
const side = (value: bigint) => Math.round(44 * Math.sqrt(Number(value) / 50_000_000));

/** A handful of unspent outputs; spending the largest replaces it with two new ones. */
export default function UtxoVisual() {
  const t = useT();
  const [spent, setSpent] = useState(false);
  const coins = useMemo(() => (spent ? spend(START) : START), [spent]);
  const isNew = (coin: Utxo) => !START.some((old) => old.txid === coin.txid);

  return (
    <div className="tv">
      <ul
        aria-label={t(COPY.list)}
        style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 66, margin: 0, padding: 0, listStyle: 'none' }}
      >
        {coins.map((coin) => {
          const mine = coin.owner === 'you';
          const fresh = isNew(coin);
          return (
            <li key={`${coin.txid}:${coin.vout}`} className={fresh ? 't-rise' : undefined} style={{ textAlign: 'center' }}>
              {/* A coin is a filled square: cream, orange when it has just come back, faint once it is someone else's. */}
              <span
                style={{
                  display: 'block',
                  width: side(coin.value),
                  height: side(coin.value),
                  margin: '0 auto 3px',
                  background: fresh && mine ? 'var(--color-orange)' : 'var(--color-cream)',
                  opacity: mine ? 1 : 0.35,
                }}
              />
              <span className={fresh && mine ? 'tv-hit' : mine ? undefined : 'tv-dim'}>{formatBtc(coin.value)}</span>
              {fresh ? <span className="tv-dim"> {t(mine ? COPY.yours : COPY.theirs)}</span> : null}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="tv-btn"
        style={{ width: 'auto', marginTop: 8, padding: '0 8px', fontSize: 11 }}
        onClick={() => setSpent((now) => !now)}
      >
        {t(spent ? COPY.undo : COPY.spend)}
      </button>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
