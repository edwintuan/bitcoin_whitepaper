import { useT } from '@/i18n/settings';
import './visuals.css';

const COPY = {
  caption: {
    en: 'Eighty bytes, six fields. This is all a miner hashes and all a light wallet keeps.',
    zh: '八十個位元組，六個欄位。礦工計算哈希的，以及輕錢包保存的，就只有這些。',
  },
  fields: [
    { en: 'version', zh: '版本', bytes: 4 },
    { en: 'previous block hash', zh: '上一個區塊的哈希', bytes: 32 },
    { en: 'Merkle root', zh: '默克爾根', bytes: 32 },
    { en: 'time', zh: '時間', bytes: 4 },
    { en: 'target', zh: '目標值', bytes: 4 },
    { en: 'nonce', zh: '隨機數', bytes: 4 },
  ],
};

const TINTS = ['var(--color-cream)', 'var(--color-orange)', '#b8b0a0', 'var(--color-orange-soft)', 'var(--color-cream)', 'var(--color-orange)'];

/** The 80-byte header drawn to scale. */
export default function BlockHeaderVisual() {
  const t = useT();
  return (
    <div className="tv">
      <div style={{ display: 'flex', gap: 2, height: 18 }} aria-hidden="true">
        {COPY.fields.map((field, index) => (
          <span key={field.en} style={{ flex: field.bytes, background: TINTS[index] }} />
        ))}
      </div>
      <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>
        {COPY.fields.map((field, index) => (
          <li className="tv-row" key={field.en}>
            <span style={{ width: 9, height: 9, background: TINTS[index], flex: 'none', alignSelf: 'center' }} />
            <span style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 12 }}>{t(field)}</span>
            <span className="tv-dim">{field.bytes}</span>
          </li>
        ))}
      </ul>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
