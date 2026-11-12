import { useT } from '@/i18n/settings';
import { headerHash } from '@/lib/header';
import type { BlockHeader } from '@/lib/header';
import { merkleRoot } from '@/lib/merkle';
import './visuals.css';

const COPY = {
  caption: {
    en: 'A block is an 80-byte header on top of a list of transactions: this is block 170 of the real chain, hashed here from its own fields.',
    zh: '區塊就是一個 80 位元組的區塊頭，加上底下的一列交易：這是真實鏈上的第 170 號區塊，它的哈希是在這裏按各欄位即場算出來的。',
  },
  header: { en: 'header · 80 bytes', zh: '區塊頭 · 80 位元組' },
  transactions: { en: 'transactions', zh: '筆交易' },
  coinbase: { en: 'coinbase', zh: 'coinbase 交易' },
  payment: { en: 'a payment', zh: '一筆付款' },
};

/** The two transactions of mainnet block 170, in block order. */
const TXIDS = [
  'b1fea52486ce0c62bb442b530a3f0132b826c74e473d1f2c220bfa78111c5082',
  'f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16',
];

/** Its header. The Merkle root is recomputed from the two ids above, not copied. */
const HEADER: BlockHeader = {
  version: 1,
  prevHash: '000000002a22cfee1f2c846adbd12b3e183d4f97683f85dad08a79780a84bd55',
  merkleRoot: merkleRoot(TXIDS),
  time: 1231731025,
  bits: 0x1d00ffff,
  nonce: 1889418792,
};
const HASH = headerHash(HEADER);

const short = (hash: string, lead = 14) => `${hash.slice(0, lead)}…`;

/** On the block's light ground: a label set back, and the orange that still reads there. */
const quiet = { opacity: 0.7 } as const;
const accent = { color: 'var(--color-orange-ink)', fontWeight: 500 } as const;
const name = { ...quiet, width: 34 } as const;

/** A real block as its two parts: the header that gets hashed, and the transactions it commits to. */
export default function BlockVisual() {
  const t = useT();
  return (
    <div className="tv">
      {/* The block is one filled shape. Its fields are lines of text; a hairline parts the header from the transactions. */}
      <div style={{ padding: '4px 7px 5px', background: 'var(--color-cream)', color: 'var(--color-ink)' }}>
        <div className="tv-row" style={quiet}>
          {t(COPY.header)}
        </div>
        <div className="tv-row">
          <span style={name}>root</span>
          <span style={accent}>{short(HEADER.merkleRoot)}</span>
        </div>
        <div className="tv-row">
          <span style={name}>hash</span>
          <span>{short(HASH)}</span>
        </div>
        <div className="tv-row" style={{ ...quiet, marginTop: 4, paddingTop: 3, borderTop: '1px solid var(--color-rule)' }}>
          {TXIDS.length} {t(COPY.transactions)}
        </div>
        {TXIDS.map((id, index) => (
          <div className="tv-row" key={id}>
            <span style={name}>{index}</span>
            <span style={accent}>{short(id, 10)}</span>
            <span style={quiet}>{t(index === 0 ? COPY.coinbase : COPY.payment)}</span>
          </div>
        ))}
      </div>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
