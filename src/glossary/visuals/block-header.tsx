import { HEADER_FIELDS } from '@/figures/pow/blocks';
import { COPY as POW } from '@/figures/pow/copy';
import { useT } from '@/i18n/settings';
import './visuals.css';

const COPY = {
  caption: {
    en: 'Eighty bytes in six fields: all a miner hashes, and all a light wallet keeps.',
    zh: '八十個位元組，六個欄位：礦工計算哈希的，以及輕錢包保存的，就只有這些。',
  },
  bytes: { en: 'bytes', zh: '位元組' },
};

/** The 80-byte header drawn to scale, its six fields numbered in the order they are written. */
export default function BlockHeaderVisual() {
  const t = useT();
  return (
    <div className="tv tv-header">
      <div className="tv-header-bar" aria-hidden="true">
        {HEADER_FIELDS.map((field, index) => (
          <span key={field.key} style={{ flex: field.bytes }}>
            {index + 1}
          </span>
        ))}
      </div>
      <ol className="tv-header-list">
        {HEADER_FIELDS.map((field) => (
          <li key={field.key}>
            <span>{t(POW.fields[field.key].name)}</span>
            <span className="tv-dim">
              {field.bytes}
              <span className="visually-hidden"> {t(COPY.bytes)}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
