import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useT } from '@/i18n/settings';
import { bytesToHex, concatBytes, utf8 } from '@/lib/bytes';
import { sha256 } from '@/lib/hash';
import { generateKeyPair, sign, verify } from '@/lib/keys';
import { useReducedMotion } from '@/state/useMediaQuery';
import './visuals.css';

const COPY = {
  coin: { en: 'coin', zh: '一枚幣' },
  payees: [
    { en: 'Bob', zh: '鮑勃' },
    { en: 'Carol', zh: '卡蘿' },
  ],
  first: { en: 'first?', zh: '在先？' },
  label: {
    en: 'One coin signed over to two payees. Both signatures are valid.',
    zh: '同一枚幣簽給了兩位收款人，兩個簽署都有效。',
  },
  caption: {
    en: 'The owner signed the same coin over twice, and both signatures check out: nothing in them says which came first.',
    zh: '擁有者把同一枚幣簽出去兩次，兩個簽署都驗證通過，卻沒有任何地方顯示誰先誰後。',
  },
};

/** Height of one payee's line, and the space between the two. */
const LINE = 24;
const GAP = 24;
/** Width of the fork that runs from the coin to the two lines. */
const FORK = 46;

/** The owner's key and one key for each payee, thrown away with the card. Only the signatures are shown. */
function signTwice() {
  const owner = generateKeyPair();
  const coin = sha256(utf8('one coin'));
  return COPY.payees.map(() => {
    const digest = sha256(concatBytes(coin, generateKeyPair().pub));
    const signature = sign(digest, owner.priv);
    return { signature: bytesToHex(signature), valid: verify(signature, digest, owner.pub) };
  });
}

/** Coin and payees are solid shapes; the words beside them are set at their own size, not scaled with the drawing. */
const shape: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: LINE,
  padding: '0 8px',
  color: 'var(--color-ink)',
};

/** One coin, two real signatures by the same key, and no way to tell them apart in time. */
export default function DoubleSpendingVisual() {
  const t = useT();
  const reducedMotion = useReducedMotion();
  // Made once, when the card opens.
  const [spends] = useState(signTwice);
  // Which branch the question is resting on.
  const [asked, setAsked] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => setAsked((row) => 1 - row), 1800);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  const top = LINE / 2;
  const bottom = LINE + GAP + LINE / 2;
  const middle = (top + bottom) / 2;

  return (
    <div className="tv">
      <div role="img" aria-label={t(COPY.label)} style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ ...shape, flex: 'none', background: 'var(--color-orange)' }}>{t(COPY.coin)}</span>
        {/* The fork is drawn at its real size: lines only, no words. */}
        <svg width={FORK} height={LINE * 2 + GAP} viewBox={`0 0 ${FORK} ${LINE * 2 + GAP}`} style={{ flex: 'none', width: FORK }} aria-hidden="true">
          <path
            d={`M0 ${middle}H18M${FORK - 8} ${top}H18V${bottom}H${FORK - 8}`}
            fill="none"
            stroke="var(--color-cream)"
            strokeWidth="2"
          />
          {[top, bottom].map((y) => (
            <path key={y} d={`M${FORK - 8} ${y - 4}L${FORK - 1} ${y}L${FORK - 8} ${y + 4}Z`} fill="var(--color-cream)" />
          ))}
        </svg>
        <div style={{ display: 'grid', gap: GAP, flex: 1, minWidth: 0 }}>
          {spends.map((spend, row) => (
            <div className="tv-row" key={row} style={{ alignItems: 'center', height: LINE }}>
              <span style={{ ...shape, flex: 'none', minWidth: 50, background: 'var(--color-cream)' }}>{t(COPY.payees[row])}</span>
              <span>
                {spend.signature.slice(0, 8)}… {spend.valid ? '✓' : '×'}
              </span>
              <span
                className="tv-hit"
                style={{
                  marginLeft: 'auto',
                  opacity: reducedMotion || asked === row ? 1 : 0,
                  transition: 'opacity var(--duration-fast) var(--ease-out)',
                }}
              >
                {t(COPY.first)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
