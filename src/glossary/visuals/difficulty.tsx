import { useState } from 'react';
import { useT } from '@/i18n/settings';
import './visuals.css';

const COPY = {
  bits: { en: 'zero bits required', zh: '所需零位元' },
  tries: { en: 'tries on average', zh: '平均嘗試次數' },
  less: { en: 'One bit fewer', zh: '少一個位元' },
  more: { en: 'One bit more', zh: '多一個位元' },
  caption: {
    en: 'One more zero bit, twice the work.',
    zh: '每多要求一個零位元，工作量便加倍。',
  },
};

const MIN = 1;
const MAX = 40;

/** A stepper for the number of zero bits and the work it implies. */
export default function DifficultyVisual() {
  const t = useT();
  const [bits, setBits] = useState(12);
  const tries = 2 ** bits;

  return (
    <div className="tv">
      <div className="tv-row" style={{ alignItems: 'center', gap: 10 }}>
        <button type="button" className="tv-btn" aria-label={t(COPY.less)} disabled={bits <= MIN} onClick={() => setBits((n) => n - 1)}>
          −
        </button>
        <span className="tv-big" aria-live="polite" style={{ minWidth: 30, textAlign: 'center' }}>
          {bits}
        </span>
        <button type="button" className="tv-btn" aria-label={t(COPY.more)} disabled={bits >= MAX} onClick={() => setBits((n) => n + 1)}>
          +
        </button>
        <span className="tv-dim">{t(COPY.bits)}</span>
      </div>
      <div style={{ height: 8, marginTop: 10, background: '#3a3a3a' }}>
        <div
          style={{
            height: '100%',
            width: `${(bits / MAX) * 100}%`,
            background: 'var(--color-orange)',
            transition: 'width var(--duration-fast) var(--ease-smooth-out)',
          }}
        />
      </div>
      <div className="tv-row" style={{ marginTop: 8 }}>
        <span className="tv-hit">≈ {tries.toLocaleString('en-US')}</span>
        <span className="tv-dim">{t(COPY.tries)}</span>
      </div>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
