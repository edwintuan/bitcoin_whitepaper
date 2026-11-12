import { useEffect, useState } from 'react';
import { MiniTree } from '@/components/viz/merkle/MiniTree';
import type { MiniTone } from '@/components/viz/merkle/MiniTree';
import { useT } from '@/i18n/settings';
import { foldProof, merkleLevels, merkleProof } from '@/lib/merkle';
import { txid } from '@/lib/tx';
import { useReducedMotion } from '@/state/useMediaQuery';
import './visuals.css';

const COPY = {
  caption: {
    en: 'Three headers and one branch: hashing up from your transaction has to land on the root inside a header.',
    zh: '三個區塊頭，加一條分支：由你的交易逐層往上計算哈希，必須得出區塊頭內的那個根。',
  },
  header: { en: 'header', zh: '區塊頭' },
  root: { en: 'root', zh: '根' },
  alt: {
    en: 'Three block headers in a chain. From the Merkle root in the middle one, a branch of two hashes leads down to one transaction.',
    zh: '三個相連的區塊頭。由中間那個區塊頭內的默克爾根，經一條由兩個哈希組成的分支，連到底下的一筆交易。',
  },
};

// A block of four transactions; the wallet holds the last one and is sent the branch for it.
const MINE = 3;
const IDS = [0, 1, 2, 3].map((index) =>
  txid({ inputs: [], outputs: [{ value: BigInt(1000 * (index + 1)), owner: 'payee' }] }),
);
const LEVELS = merkleLevels(IDS);
const ROOT = LEVELS[2][0];
// What the wallet works out itself, one hash for each sibling it is sent.
const FOLDED = foldProof(IDS[MINE], merkleProof(IDS, MINE)).map((fold) => fold.out);

/** Frames of the walk up the branch: the transaction, its parent, then the root. */
const LAST = 2;

/** A block header on the black card: a filled shape, like every other object here. */
const block = {
  flex: 1,
  minWidth: 0,
  padding: '2px 4px',
  background: 'var(--color-cream)',
  color: 'var(--color-ink)',
  textAlign: 'center',
  lineHeight: 1.35,
} as const;

/** Headers only, and one Merkle branch folded up to the root in one of them. */
export default function SpvVisual() {
  const t = useT();
  const reducedMotion = useReducedMotion();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => setStage((now) => (now + 1) % (LAST + 3)), 900);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  // Without motion, show the finished check.
  const at = reducedMotion ? LAST : Math.min(stage, LAST);
  const matched = at >= LAST && FOLDED[1] === ROOT;

  // The wallet's own path is orange as far as it has got; what the full node sent is cream; the rest it never sees.
  const tone = (level: number, index: number): MiniTone => {
    const onPath = index === MINE >> level;
    if (onPath) return at >= level ? 'hit' : 'wait';
    return index === ((MINE >> level) ^ 1) ? 'on' : 'none';
  };

  return (
    <div className="tv">
      <MiniTree
        label={t(COPY.alt)}
        levels={LEVELS}
        tone={tone}
        leafName={(index) => `Tx${index}`}
        head={
          // The chain of headers. The root the branch has to reach is inside the middle one.
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ ...block, opacity: 0.55 }}>{t(COPY.header)}</span>
            <span style={{ ...block, flex: 2, background: matched ? 'var(--color-orange)' : 'var(--color-cream)' }}>
              <span style={{ display: 'block' }}>{t(COPY.header)}</span>
              <span style={{ display: 'block' }}>
                {t(COPY.root)} {ROOT.slice(0, 8)}… {matched ? '✓' : ''}
              </span>
            </span>
            <span style={{ ...block, opacity: 0.55 }}>{t(COPY.header)}</span>
          </div>
        }
      />
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
