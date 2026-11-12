import { useMemo, useState } from 'react';
import { UI } from '@/content/ui';
import { useT } from '@/i18n/settings';
import { bytesToHex, utf8 } from '@/lib/bytes';
import { sha256 } from '@/lib/hash';
import { deriveChild, derivePath, masterFromSeed } from '@/lib/hd';
import { pubkeyToAddress } from '@/lib/keys';
import { useWidth } from '@/state/useWidth';
import { shortHex } from '@/text/format';
import './visuals.css';

const COPY = {
  next: { en: 'Next address', zh: '下一個地址' },
  seed: { en: 'seed', zh: '種子' },
  tree: {
    en: 'One seed at the top; beneath it, the keys derived from it one after another.',
    zh: '最上面是一個種子，下面是由它逐一推導出來的密鑰。',
  },
  caption: {
    en: 'Every address comes from the one seed, so a single backup covers them all, however many are used.',
    zh: '每個地址都出自同一個種子；所以不論用了多少個地址，只需備份一次。',
  },
};

/** A fixed, public seed: this wallet exists only to be looked at. */
const SEED = sha256(utf8('bitcoin-whitepaper-explainer/demo-wallet/card'));
/** The receiving chain of the first account, as BIP 84 lays it out. */
const CHAIN = "m/84'/0'/0'/0";

const SLOTS = 4;
const TREE = { height: 76, seedWidth: 136, seedHeight: 22, branchY: 37, leafTop: 51, leafHeight: 24 };

/** A real BIP 32 tree: one seed, and a fresh address derived each time the button is pressed. */
export default function HdWalletVisual() {
  const t = useT();
  // Drawn at the width it is shown, so the addresses in it are never scaled.
  const [ref, width] = useWidth<HTMLDivElement>(300);
  const chain = useMemo(() => derivePath(masterFromSeed(SEED), CHAIN), []);
  // How many addresses have been asked for so far.
  const [used, setUsed] = useState(1);

  const first = Math.max(0, used - SLOTS);
  const leaves = Array.from({ length: SLOTS }, (_, slot) => {
    const index = first + slot;
    return { index, address: index < used ? pubkeyToAddress(deriveChild(chain, index).pub, 'p2wpkh') : null };
  });
  const latest = leaves.find((leaf) => leaf.index === used - 1);

  const lane = width / SLOTS;
  const centre = (slot: number) => lane * (slot + 0.5);
  const leafWidth = Math.min(68, lane - 8);

  return (
    <div ref={ref} className="tv">
      <svg viewBox={`0 0 ${width} ${TREE.height}`} role="img" aria-label={t(COPY.tree)}>
        {/* The seed and every key derived from it are solid shapes. A key not yet asked for is only a dashed place. */}
        <rect x={width / 2 - TREE.seedWidth / 2} y="0" width={TREE.seedWidth} height={TREE.seedHeight} fill="var(--color-cream)" />
        <text x={width / 2} y="15" textAnchor="middle" fill="var(--color-ink)" fontSize="11">
          {t(COPY.seed)} {shortHex(bytesToHex(SEED), 6, 4)}
        </text>
        <path d={`M${width / 2} ${TREE.seedHeight}V${TREE.branchY}M${centre(0)} ${TREE.branchY}H${centre(SLOTS - 1)}`} fill="none" stroke="currentColor" strokeWidth="1.5" />
        {leaves.map((leaf, slot) => {
          const x = centre(slot);
          const isLatest = leaf.index === used - 1;
          return (
            <g key={leaf.index} className={isLatest && used > 1 ? 't-swap-soft' : undefined}>
              <path d={`M${x} ${TREE.branchY}V${TREE.leafTop}`} stroke="currentColor" strokeWidth="1.5" opacity={leaf.address ? 1 : 0.4} />
              <rect
                x={x - leafWidth / 2}
                y={TREE.leafTop}
                width={leafWidth}
                height={TREE.leafHeight}
                fill={leaf.address ? (isLatest ? 'var(--color-orange)' : 'var(--color-cream)') : 'none'}
                stroke={leaf.address ? 'none' : 'currentColor'}
                strokeWidth="1.5"
                strokeDasharray="3 3"
                strokeOpacity="0.6"
              />
              <text x={x} y={TREE.leafTop + 16} textAnchor="middle" fontSize="11" fill={leaf.address ? 'var(--color-ink)' : 'currentColor'} opacity={leaf.address ? 1 : 0.7}>
                {leaf.address ? `…${leaf.address.slice(-5)}` : `/${leaf.index}`}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="tv-row" style={{ alignItems: 'center', marginTop: 8 }}>
        <button
          type="button"
          className="tv-btn"
          onClick={() => setUsed((count) => count + 1)}
          style={{ width: 'auto', padding: '0 9px', fontFamily: 'var(--font-sans)', fontSize: 12 }}
        >
          {t(COPY.next)}
        </button>
        <span className="tv-hit" role="status">
          {CHAIN}/{used - 1} → {latest?.address ? shortHex(latest.address, 6, 5) : ''}
        </span>
      </div>
      <p className="tv-cap">{t(COPY.caption)}</p>
      {/* At full strength: dimmed, the warning falls short of the contrast a warning needs. */}
      <p className="tv-cap">{t(UI.demoKeysWarning)}</p>
    </div>
  );
}
