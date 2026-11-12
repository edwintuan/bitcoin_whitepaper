import { useEffect, useState } from 'react';
import { useT } from '@/i18n/settings';
import { createNetwork } from '@/lib/netsim';
import type { Snapshot } from '@/lib/netsim';
import { useReducedMotion } from '@/state/useMediaQuery';
import './visuals.css';

const COPY = {
  caption: {
    en: 'No node is in charge: each one tells its neighbours, and they tell theirs, until all of them have the message.',
    zh: '沒有任何節點居中指揮：每個節點把訊息告訴相鄰的節點，再由它們轉告下去，直至全部收到。',
  },
  have: { en: 'of {total} nodes have it', zh: '／{total} 個節點已收到' },
};

const NODES = 6;
const WIDTH = 300;
const HEIGHT = 104;
/** Ticks to rest on the finished picture before the message starts again somewhere else. */
const HOLD = 3;

/**
 * One message spreading from `start`, hop by hop, in the real simulation.
 * Every hop takes one simulated second, so each frame is one hop later.
 */
function spread(start: number): Snapshot[] {
  const net = createNetwork({ nodes: NODES, degree: 3, latency: [1, 1], blockInterval: 10, seed: 145 });
  net.broadcastTx(start);
  const frames = [net.snapshot()];
  while (frames[frames.length - 1].inFlight.length > 0 && frames.length < 40) {
    net.step(1);
    frames.push(net.snapshot());
  }
  return frames;
}

const runs = new Map<number, Snapshot[]>();
const runFrom = (start: number): Snapshot[] => {
  let run = runs.get(start);
  if (!run) runs.set(start, (run = spread(start)));
  return run;
};

const at = (node: { x: number; y: number }) => ({
  x: 14 + ((node.x - 0.05) / 0.9) * (WIDTH - 28),
  y: 12 + ((node.y - 0.05) / 0.9) * (HEIGHT - 24),
});

/** Six nodes, no centre: a message passed from neighbour to neighbour. */
export default function PeerToPeerVisual() {
  const t = useT();
  const reducedMotion = useReducedMotion();
  // Under reduced motion: one still frame, part of the way through.
  const [state, setState] = useState({ start: 0, tick: 3 });

  useEffect(() => {
    if (reducedMotion) {
      setState({ start: 0, tick: 3 });
      return;
    }
    setState({ start: 0, tick: 0 });
    const timer = window.setInterval(() => {
      setState(({ start, tick }) =>
        tick + 1 >= runFrom(start).length + HOLD ? { start: (start + 1) % NODES, tick: 0 } : { start, tick: tick + 1 },
      );
    }, 620);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  const run = runFrom(state.start);
  const frame = run[Math.min(state.tick, run.length - 1)];
  const points = frame.nodes.map(at);
  const informed = frame.nodes.filter((node) => node.mempool.length > 0).length;

  return (
    <div className="tv">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={t(COPY.caption)}>
        {frame.nodes.flatMap((node) =>
          node.peers
            .filter((peer) => peer > node.id)
            .map((peer) => {
              const carried = frame.inFlight.filter(
                (message) =>
                  (message.from === node.id && message.to === peer) ||
                  (message.from === peer && message.to === node.id),
              );
              const delivering = carried.some((message) => message.kind === 'tx');
              return (
                <line
                  key={`${node.id}-${peer}`}
                  x1={points[node.id].x}
                  y1={points[node.id].y}
                  x2={points[peer].x}
                  y2={points[peer].y}
                  stroke={
                    delivering
                      ? 'var(--color-orange)'
                      : carried.length > 0
                        ? 'var(--color-cream)'
                        : 'var(--color-ink-3)'
                  }
                  strokeWidth={delivering ? 3 : carried.length > 0 ? 1.5 : 1}
                />
              );
            }),
        )}
        {/* A node is a solid square: cream, and orange once it has the message. */}
        {frame.nodes.map((node) => (
          <rect
            key={node.id}
            x={points[node.id].x - 9}
            y={points[node.id].y - 9}
            width={18}
            height={18}
            fill={node.mempool.length > 0 ? 'var(--color-orange)' : 'var(--color-cream)'}
          />
        ))}
      </svg>
      <div className="tv-row">
        <span className="tv-hit">{informed}</span>
        <span className="tv-dim">{t(COPY.have).replace('{total}', String(NODES))}</span>
      </div>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
