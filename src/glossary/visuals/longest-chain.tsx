import { useEffect, useState } from 'react';
import { START, buildingOn, grow } from '@/figures/network/branches';
import type { Branch, Branches } from '@/figures/network/branches';
import { useT } from '@/i18n/settings';
import { mulberry32 } from '@/lib/rng';
import { useReducedMotion } from '@/state/useMediaQuery';
import './visuals.css';

const COPY = {
  caption: {
    en: 'Nodes build on the branch with more work in it, here the one with more blocks; while the two are level, each stays on the one it had first.',
    zh: '節點在累計工作量較多的分支上建造，在這裏即是區塊較多的一條；兩邊相等時，則各自留在最先得到的一條上。',
  },
  building: { en: 'nodes build here', zh: '節點在此建造' },
};

/** The frame shown when nothing may move: the tie is broken, and only the longer branch has grown since. */
const STILL: Branches = { upper: 1, lower: 3 };

const SIZE = 22;
const GAP = 12;
const xOf = (index: number) => 54 + index * (SIZE + GAP);

/** Two branches from one block: the longer one is where the work goes. */
export default function LongestChainVisual() {
  const t = useT();
  const reducedMotion = useReducedMotion();
  const [state, setState] = useState<Branches>(STILL);

  useEffect(() => {
    if (reducedMotion) {
      setState(STILL);
      return;
    }
    const random = mulberry32(5);
    setState(START);
    const timer = window.setInterval(() => setState((current) => grow(current, random)), 1100);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  const rows: { branch: Branch; y: number }[] = [
    { branch: 'upper', y: 8 },
    { branch: 'lower', y: 58 },
  ];

  return (
    <div className="tv">
      {/* Drawn at its own width, not stretched to the card: the words in it are shown at the size they are set. */}
      <svg viewBox="0 0 300 96" style={{ width: 300, maxWidth: '100%' }} role="img" aria-label={t(COPY.caption)}>
        {/* The block both branches grow from. Blocks are solid tiles; the tip nodes build on is orange. */}
        <rect x="6" y="33" width={SIZE} height={SIZE} fill="var(--color-cream)" />
        {rows.map(({ branch, y }) => {
          const count = state[branch];
          const live = buildingOn(state).includes(branch);
          return (
            <g key={branch}>
              <path
                d={`M${6 + SIZE} 44L40 44L40 ${y + SIZE / 2}L${xOf(0)} ${y + SIZE / 2}`}
                fill="none"
                stroke="var(--color-cream)"
                strokeWidth="2"
                opacity={live ? 1 : 0.5}
              />
              {Array.from({ length: count }, (_, index) => {
                const tip = index === count - 1;
                return (
                  <g key={index}>
                    {index > 0 ? (
                      <path
                        d={`M${xOf(index) - GAP} ${y + SIZE / 2}H${xOf(index)}`}
                        stroke="var(--color-cream)"
                        strokeWidth="2"
                        opacity={live ? 1 : 0.5}
                      />
                    ) : null}
                    <rect
                      x={xOf(index)}
                      y={y}
                      width={SIZE}
                      height={SIZE}
                      fill={live && tip ? 'var(--color-orange)' : 'var(--color-cream)'}
                      opacity={live ? 1 : 0.5}
                    />
                  </g>
                );
              })}
              <text
                x={xOf(count) + 2}
                y={y + 15}
                fontSize="11"
                fill={live ? 'var(--color-orange)' : 'currentColor'}
                opacity={live ? 1 : 0.55}
              >
                {count}
              </text>
              {live ? (
                <text x={xOf(0)} y={y + SIZE + 12} fontSize="11" fill="var(--color-orange)">
                  ↑ {t(COPY.building)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
