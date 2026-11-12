import { useEffect, useState } from 'react';
import { useT } from '@/i18n/settings';
import { createNetwork } from '@/lib/netsim';
import type { Snapshot } from '@/lib/netsim';
import { useReducedMotion } from '@/state/useMediaQuery';
import './visuals.css';

const COPY = {
  caption: {
    en: 'Two blocks found at the same moment give the chain two tips, until the next block makes one branch longer and the other is dropped.',
    zh: '同時找到的兩個區塊令鏈有了兩個末端，直至下一個區塊使其中一條分支變長，另一條便被捨棄。',
  },
  stages: [
    { en: 'one chain, one tip', zh: '一條鏈，一個末端' },
    { en: 'two blocks at once: two tips', zh: '同時出現兩個區塊：兩個末端' },
    { en: 'the next block extends one branch', zh: '下一個區塊接在其中一條分支上' },
    { en: 'everyone switches; the other block is dropped', zh: '所有節點轉過去，另一個區塊被捨棄' },
  ],
};

/**
 * A fork and its end, played once in the real simulation with two nodes:
 * both find a block on the same parent, then one of them finds the next.
 */
function story(): Snapshot[] {
  const net = createNetwork({ nodes: 2, degree: 2, latency: [1, 1], blockInterval: 10, seed: 1 });
  const settle = () => {
    for (let i = 0; i < 40 && net.snapshot().inFlight.length > 0; i++) net.step(1);
  };
  net.forceBlock(0);
  settle();
  const one = net.snapshot();
  net.forceBlock(0);
  net.forceBlock(1);
  settle();
  const two = net.snapshot();
  net.forceBlock(0);
  const longer = net.snapshot();
  settle();
  return [one, two, longer, net.snapshot()];
}

const FRAMES = story();
const LAST = FRAMES[FRAMES.length - 1];
/** The chain everyone ends up on, from its tip down to the first block. */
const WINNERS = new Set<string>();
for (let id: string | null = LAST.nodes[0].tip; id !== null; id = LAST.blocks[id].parent) WINNERS.add(id);

const BOX = { width: 44, height: 26 };
const place = (height: number, winner: boolean) => ({ x: 28 + height * 66, y: winner ? 10 : 58 });

/** A chain that splits in two and heals, drawn from the simulation's own blocks. */
export default function ForkVisual() {
  const t = useT();
  const reducedMotion = useReducedMotion();
  const [stage, setStage] = useState(1);

  useEffect(() => {
    if (reducedMotion) {
      setStage(1); // the still frame: the fork itself
      return;
    }
    setStage(0);
    const timer = window.setInterval(() => setStage((current) => (current + 1) % FRAMES.length), 1500);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  const frame = FRAMES[stage];
  const tips = new Set(frame.nodes.map((node) => node.tip));
  const blocks = Object.values(frame.blocks);

  return (
    <div className="tv">
      {/* Drawn at its own width, not stretched to the card: the words in it are shown at the size they are set. */}
      <svg viewBox="0 0 300 94" style={{ width: 300, maxWidth: '100%' }} role="img" aria-label={t(COPY.caption)}>
        {blocks.map((block) => {
          if (block.parent === null) return null;
          const from = place(frame.blocks[block.parent].height, WINNERS.has(block.parent));
          const to = place(block.height, WINNERS.has(block.id));
          const dropped = !WINNERS.has(block.id) && !tips.has(block.id);
          return (
            <path
              key={`link-${block.id}`}
              d={`M${from.x + BOX.width} ${from.y + BOX.height / 2}L${to.x} ${to.y + BOX.height / 2}`}
              stroke="var(--color-cream)"
              strokeWidth="2"
              strokeDasharray={dropped ? '3 4' : undefined}
              opacity={dropped ? 0.45 : 1}
            />
          );
        })}
        {blocks.map((block) => {
          const at = place(block.height, WINNERS.has(block.id));
          const tip = tips.has(block.id);
          const dropped = !WINNERS.has(block.id) && !tip;
          return (
            <g key={block.id} opacity={dropped ? 0.4 : 1}>
              {/* A block is a solid tile: orange while it is a tip, faded once it has been dropped. */}
              <rect
                x={at.x}
                y={at.y}
                width={BOX.width}
                height={BOX.height}
                fill={tip ? 'var(--color-orange)' : 'var(--color-cream)'}
              />
              <text
                x={at.x + BOX.width / 2}
                y={at.y + 17}
                textAnchor="middle"
                fontSize="11"
                fontWeight="500"
                fill="var(--color-ink)"
              >
                {block.id}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="tv-row">
        <span className="tv-hit">{stage + 1}</span>
        <span style={{ whiteSpace: 'normal' }}>{t(COPY.stages[stage])}</span>
      </div>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
