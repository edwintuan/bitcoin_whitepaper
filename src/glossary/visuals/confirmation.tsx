import { useEffect, useState } from 'react';
import { formatChance } from '@/figures/attack/chart';
import { useT } from '@/i18n/settings';
import { attackerSuccessProbability } from '@/lib/attack';
import { useReducedMotion } from '@/state/useMediaQuery';
import { fill } from '@/text/format';
import './visuals.css';

const COPY = {
  one: { en: 'confirmation', zh: '個確認' },
  many: { en: 'confirmations', zh: '個確認' },
  payment: { en: 'pay', zh: '付款' },
  // The paper's sum counts only the blocks on top of the payment's own: with none, it has nothing to say yet.
  riskNone: {
    en: 'Nothing on top yet: the paper’s formula starts counting with the next block.',
    zh: '上面還沒有區塊：白皮書的公式由下一個區塊數起。',
  },
  risk: {
    en: '{z} on top: by the paper’s formula a 10% attacker still undoes it {p} of the time',
    zh: '上面有 {z} 個區塊：按白皮書的公式，掌握 10% 算力的攻擊者仍有 {p} 的機會推翻它',
  },
  caption: {
    en: 'The block that holds the payment is the first confirmation, and every block on top adds one more that an attacker would have to redo.',
    zh: '付款所在的區塊是第一個確認；上面每多接上一個區塊，確認數加一，攻擊者要重做的區塊亦多一個。',
  },
};

/** The payment's block and five on top: the familiar six confirmations, where the paper's last table puts a 10% attacker under one in a thousand. */
const SLOTS = 6;
/** Ticks to rest on the full stack before starting again. */
const HOLD = 3;

/** A payment's block with blocks stacking on top of it, and the paper's risk falling as they do. */
export default function ConfirmationVisual() {
  const t = useT();
  const reducedMotion = useReducedMotion();
  // Blocks in the chain from the payment's block on: 1 is the payment alone.
  const [state, setState] = useState({ blocks: reducedMotion ? SLOTS : 1, held: 0 });

  useEffect(() => {
    if (reducedMotion) {
      setState({ blocks: SLOTS, held: 0 });
      return;
    }
    const timer = window.setInterval(() => {
      setState(({ blocks, held }) =>
        blocks < SLOTS ? { blocks: blocks + 1, held: 0 } : held < HOLD ? { blocks, held: held + 1 } : { blocks: 1, held: 0 },
      );
    }, 1100);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  const onTop = state.blocks - 1;

  return (
    <div className="tv">
      {/* Solid blocks, each in its place from the start, so that the row does not shift as they arrive. */}
      <div style={{ display: 'flex', gap: 5 }} aria-hidden="true">
        {Array.from({ length: SLOTS }, (_, slot) => {
          const there = slot < state.blocks;
          return (
            <span
              key={`${slot}-${there}`}
              className={there && slot === state.blocks - 1 && slot > 0 && !reducedMotion ? 't-slam' : undefined}
              style={{
                flex: 1,
                height: 24,
                display: 'grid',
                placeItems: 'center',
                color: 'var(--color-ink)',
                background: there ? (slot === 0 ? 'var(--color-orange)' : 'var(--color-cream)') : 'transparent',
              }}
            >
              {slot === 0 ? t(COPY.payment) : there ? `+${slot}` : ''}
            </span>
          );
        })}
      </div>
      <div className="tv-row" style={{ alignItems: 'baseline', marginTop: 8 }}>
        <span className="tv-big">{state.blocks}</span>
        <span>{t(state.blocks === 1 ? COPY.one : COPY.many)}</span>
      </div>
      {/* The live reading, in the accent; the caption beneath it stays quiet. */}
      <p className="tv-cap" style={{ marginTop: 2, color: 'var(--color-orange)' }}>
        {onTop === 0 ? t(COPY.riskNone) : fill(t(COPY.risk), { z: onTop, p: formatChance(attackerSuccessProbability(0.1, onTop)) })}
      </p>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
