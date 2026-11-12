import { useEffect, useState } from 'react';
import { useT } from '@/i18n/settings';
import { sha256Hex } from '@/lib/hash';
import { useReducedMotion } from '@/state/useMediaQuery';
import './visuals.css';

const COPY = {
  caption: {
    en: 'Same block, next nonce, completely different hash; here one that starts with 0 counts as a hit.',
    zh: '同一個區塊，換下一個隨機數，哈希便面目全非；這裏以 0 開頭的哈希當作命中。',
  },
};

const hashOf = (nonce: number) => sha256Hex(`a block of transactions|${nonce}`);
const isHit = (nonce: number) => hashOf(nonce).startsWith('0');

/** Frames to rest on a hit before counting on. */
const HOLD = 6;

/** The first nonce that qualifies, and a start a few tries short of it, so a card just opened shows a hit soon. */
const FIRST_HIT = (() => {
  let nonce = 2;
  while (!isHit(nonce)) nonce += 1;
  return nonce;
})();
const START = Math.max(2, FIRST_HIT - 3);

/** Real hashes of one block under successive nonces, counting up until one qualifies. */
export default function NonceVisual() {
  const t = useT();
  const reducedMotion = useReducedMotion();
  // The newest of the three rows shown is `top`.
  const [state, setState] = useState({ top: START, held: 0 });

  useEffect(() => {
    if (reducedMotion) {
      // Show a still frame that ends on a hit.
      setState({ top: FIRST_HIT, held: 0 });
      return;
    }
    const timer = window.setInterval(() => {
      setState(({ top, held }) => (isHit(top) && held < HOLD ? { top, held: held + 1 } : { top: top + 1, held: 0 }));
    }, 420);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  return (
    <div className="tv">
      {[state.top - 2, state.top - 1, state.top].map((nonce) => {
        const hash = hashOf(nonce);
        const hit = hash.startsWith('0');
        return (
          <div className={`tv-row ${hit ? 'tv-hit' : ''}`} key={nonce}>
            <span style={{ width: 34, textAlign: 'right' }}>{nonce}</span>
            <span aria-hidden="true">→</span>
            <span>
              {hash.slice(0, 20)}… {hit ? '✓' : ''}
            </span>
          </div>
        );
      })}
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
