import { useState } from 'react';
import { useT } from '@/i18n/settings';
import { sha256Hex } from '@/lib/hash';
import './visuals.css';

const COPY = {
  label: { en: 'Type anything', zh: '隨意輸入' },
  start: { en: 'SHA-256, 64 hex digits', zh: 'SHA-256，共 64 個十六進制數位' },
  changed: { en: 'of 64 digits changed', zh: '個數位變了，共 64 個' },
  caption: {
    en: 'Each keystroke gives an unrelated hash: the digits that changed are in orange, and the few that did not are coincidence.',
    zh: '每按一下鍵，算出的都是一個毫不相干的哈希：橙色的是變了的數位，沒變的那幾個純屬巧合。',
  },
};

const ROW = 32;

/** Live SHA-256 of whatever the reader types, with the digits that changed since the last keystroke marked. */
export default function HashVisual() {
  const t = useT();
  const [state, setState] = useState<{ text: string; before: string | null }>({ text: 'bitcoin', before: null });

  const hash = sha256Hex(state.text);
  const before = state.before;
  const changed = before === null ? 0 : [...hash].filter((digit, index) => digit !== before[index]).length;

  return (
    <div className="tv">
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="tv-dim" style={{ fontFamily: 'var(--font-sans)', fontSize: 12, flex: 'none' }}>
          {t(COPY.label)}
        </span>
        <input
          type="text"
          value={state.text}
          maxLength={24}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          onChange={(event) => {
            const text = event.target.value;
            setState((current) => (text === current.text ? current : { text, before: sha256Hex(current.text) }));
          }}
          // A field cut into the card: a solid ground, no border of its own.
          style={{
            flex: 1,
            minWidth: 0,
            padding: '4px 7px',
            border: 0,
            background: 'var(--color-cream)',
            color: 'var(--color-ink)',
            font: 'inherit',
            fontSize: 12,
          }}
        />
      </label>

      <div style={{ marginTop: 8, letterSpacing: '0.02em' }} aria-hidden="true">
        {[0, ROW].map((start) => (
          <div key={start} style={{ whiteSpace: 'nowrap' }}>
            {[...hash.slice(start, start + ROW)].map((digit, offset) => (
              <span key={offset} className={before !== null && digit !== before[start + offset] ? 'tv-hit' : undefined}>
                {digit}
              </span>
            ))}
          </div>
        ))}
      </div>
      <span className="visually-hidden">{hash}</span>

      <div className="tv-row" role="status">
        {before === null ? (
          <span className="tv-dim">{t(COPY.start)}</span>
        ) : (
          <>
            <span className="tv-hit">{changed}</span>
            <span className="tv-dim">{t(COPY.changed)}</span>
          </>
        )}
      </div>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
