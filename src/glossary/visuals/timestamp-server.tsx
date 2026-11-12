import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useT } from '@/i18n/settings';
import { sha256Hex } from '@/lib/hash';
import { useReducedMotion } from '@/state/useMediaQuery';
import './visuals.css';

const COPY = {
  items: { en: 'items', zh: '項目' },
  caption: {
    en: 'Each batch is hashed together with the hash of the batch before it, so the hashes form a chain.',
    zh: '每一批項目都連同上一批的哈希一併計算哈希，於是環環相扣，連成一條鏈。',
  },
};

/** Real SHA-256, each over the hash before it and the name of its own batch. */
const chain: string[] = [];
function hashOf(index: number): string {
  for (let i = chain.length; i <= index; i++) {
    chain.push(sha256Hex(`${i === 0 ? '' : chain[i - 1]}|batch ${i}`));
  }
  return chain[index];
}
const short = (hash: string) => hash.slice(0, 4);

const SLOT = 100 / 3;
/** A batch: one solid shape. */
const batch: CSSProperties = { flex: 1, minWidth: 0, padding: '2px 6px 3px', background: 'var(--color-cream)', color: 'var(--color-ink)' };
/** Second-rank words on a light shape, still readable there. */
const quiet: CSSProperties = { opacity: 0.7 };
/** The hash that the newest batch repeats from the one before: marked in both places. */
const linked: CSSProperties = { padding: '0 2px', background: 'var(--color-orange)' };

/** Three timestamps of an endless chain; a new one is published every few seconds. */
export default function TimestampServerVisual() {
  const t = useT();
  const reducedMotion = useReducedMotion();
  // Number of the newest batch on show.
  const [newest, setNewest] = useState(2);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => setNewest((n) => n + 1), 2600);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  return (
    <div className="tv">
      <div style={{ overflow: 'hidden' }}>
        {/* Remounted for each new batch: the row starts one slot to the right and slides into place. */}
        <div key={newest} className="t-shift" style={{ display: 'flex', ['--shift-from' as string]: `${SLOT}%` }}>
          {[newest - 2, newest - 1, newest].map((index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', flex: `0 0 ${SLOT}%`, minWidth: 0 }}>
              {/* The link back to the batch before. The very first batch has none. */}
              <span style={{ width: 18, flex: 'none', textAlign: 'center' }} aria-hidden="true">
                {index > 0 ? '→' : ''}
              </span>
              <div style={batch}>
                <div style={quiet}>
                  {t(COPY.items)} {index + 1}
                </div>
                <div>
                  <span style={quiet}>prev </span>
                  <span style={index === newest ? linked : undefined}>{index === 0 ? '····' : short(hashOf(index - 1))}</span>
                </div>
                <div>
                  <span style={quiet}>hash </span>
                  <span style={index === newest - 1 ? linked : undefined}>{short(hashOf(index))}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
