import { useLayoutEffect, useRef, useState } from 'react';
import { useT } from '@/i18n/settings';
import type { SimMessage, Snapshot } from '@/lib/netsim';
import { fill } from '@/text/format';
import { cx } from '@/utils/cx';
import { COPY } from './copy';
import { between, place, pointOn, stageHeightFor, tileFor } from './layout';
import { packetProgress } from './view';
import type { ChainView } from './view';

/** A turn back on itself: the mark of a node that has just left one branch for another. */
function SwitchMark({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M0.8 2v3h3" />
      <path d="M1.9 7.5a4.4 4.4 0 1 0 1.05-4.6L0.8 5" />
    </svg>
  );
}

type Kind = SimMessage['kind'];

/** Pixels a message keeps to one side of its link, so traffic both ways can be told apart. */
const LANE = 4;
/** Where a message is drawn when nothing may move: just clear of the node it left. */
const STILL_AT = 0.14;

/** One message kind as a solid mark: told apart by shape and size, with colour as a second cue. */
function PacketShape({ kind }: { kind: Kind }) {
  switch (kind) {
    case 'inv':
      return <rect className="net-pk-inv" x={-3.5} y={-3.5} width={7} height={7} />;
    case 'getdata':
      // A cross: at this size a turned square is too easily taken for the square of an `inv`.
      return <path className="net-pk-getdata" d="M-1.5 -5h3v3.5h3.5v3h-3.5v3.5h-3v-3.5h-3.5v-3h3.5z" />;
    case 'tx':
      return <rect className="net-pk-tx" x={-4.5} y={-4.5} width={9} height={9} />;
    case 'block':
      return <rect className="net-pk-block" x={-6.5} y={-6.5} width={13} height={13} />;
  }
}

export interface NetGraphProps {
  snap: Snapshot;
  view: ChainView;
  selected: number | null;
  onSelect(node: number): void;
  /** Reduced motion: draw messages where they left instead of moving them. */
  still: boolean;
  /** Nodes that changed branch in the reorg just seen. */
  switched: number[];
}

/** The ten nodes, their links, and whatever is travelling between them right now. */
export function NetGraph({ snap, view, selected, onSelect, still, switched }: NetGraphProps) {
  const t = useT();
  const frame = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    const measure = () => setWidth(element.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const height = stageHeightFor(width);
  const tile = tileFor(width);
  // The smaller tile of a narrow stage: the stylesheet closes up its lines of text.
  const compact = tile.width < tileFor(Infinity).width;
  const points = snap.nodes.map((node) => place(node, { width, height }, tile));

  return (
    <div
      ref={frame}
      className="net-graph"
      style={{ height }}
      data-compact={compact}
      role="group"
      aria-label={t(COPY.graphLabel)}
    >
      {width > 0 ? (
        <>
          <svg className="net-links" width={width} height={height} aria-hidden="true">
            {snap.nodes.flatMap((node) =>
              node.peers
                .filter((peer) => peer > node.id)
                .map((peer) => (
                  <line
                    key={`${node.id}-${peer}`}
                    x1={points[node.id].x}
                    y1={points[node.id].y}
                    x2={points[peer].x}
                    y2={points[peer].y}
                    data-live={node.online && snap.nodes[peer].online}
                  />
                )),
            )}
          </svg>

          {snap.nodes.map((node) => {
            const look = view.looks[node.id];
            const block = snap.blocks[node.tip];
            const at = points[node.id];
            return (
              <button
                key={node.id}
                type="button"
                className="net-node"
                style={{
                  left: at.x - tile.width / 2,
                  top: at.y - tile.height / 2,
                  width: tile.width,
                  height: tile.height,
                }}
                data-branch={look.branch}
                data-behind={look.behind}
                data-online={node.online}
                data-selected={selected === node.id}
                aria-pressed={selected === node.id}
                aria-label={fill(t(COPY.nodeAria), {
                  id: node.id,
                  state: node.online ? t(COPY.online) : t(COPY.offline),
                  tip: node.tip,
                  height: block.height,
                  waiting: node.mempool.length,
                })}
                onClick={() => onSelect(node.id)}
              >
                <span className="net-node-id mono" aria-hidden="true">
                  {node.id}
                </span>
                {node.mempool.length > 0 ? (
                  <span className="net-node-mp mono" aria-hidden="true">
                    <i />
                    {node.mempool.length}
                  </span>
                ) : null}
                <span
                  key={node.tip}
                  className={cx('net-node-tip', block.height > 0 && !still && 't-pop')}
                  aria-hidden="true"
                >
                  {node.tip}
                </span>
                <span className="net-node-h mono" aria-hidden="true">
                  {node.online ? `h${block.height}` : t(COPY.offShort)}
                </span>
                {switched.includes(node.id) ? (
                  <SwitchMark className="net-node-mark" />
                ) : null}
              </button>
            );
          })}

          <svg className="net-packets" width={width} height={height} aria-hidden="true">
            {snap.inFlight.map((message) => {
              const link = between(points[message.from], points[message.to], tile, 6);
              const at = pointOn(link.from, link.to, still ? STILL_AT : packetProgress(message, snap.t), LANE);
              return (
                <g key={message.id} transform={`translate(${at.x.toFixed(1)} ${at.y.toFixed(1)})`}>
                  <PacketShape kind={message.kind} />
                </g>
              );
            })}
          </svg>
        </>
      ) : null}
      <p className="net-clock mono" aria-hidden="true">
        {t(COPY.clock)} {snap.t.toFixed(1)} {t(COPY.seconds)}
      </p>
    </div>
  );
}

const KINDS: Kind[] = ['inv', 'getdata', 'tx', 'block'];
const LOOKS = ['main', 'side', 'behind', 'offline'] as const;

/** What the marks and the looks of the nodes mean. */
export function NetLegend() {
  const t = useT();
  return (
    <ul className="net-legend" aria-label={t(COPY.legend)}>
      {KINDS.map((kind) => (
        <li key={kind}>
          <svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true">
            <PacketShape kind={kind} />
          </svg>
          <span>
            <code>{kind}</code> {t(COPY.kinds[kind])}
          </span>
        </li>
      ))}
      {LOOKS.map((look) => (
        <li key={look}>
          <i className="net-swatch" data-look={look} aria-hidden="true" />
          {t(COPY.looks[look])}
        </li>
      ))}
      <li>
        <i className="net-swatch" data-look="waiting" aria-hidden="true" />
        {t(COPY.looks.waiting)}
      </li>
      <li>
        <SwitchMark className="net-glyph" />
        {t(COPY.looks.reorg)}
      </li>
    </ul>
  );
}
