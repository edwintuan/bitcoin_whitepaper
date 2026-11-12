import { BlockTile, ChainRow } from '@/components/viz/BlockTile';
import { useT } from '@/i18n/settings';
import type { SimBlock, Snapshot } from '@/lib/netsim';
import { fill } from '@/text/format';
import { cx } from '@/utils/cx';
import { COPY } from './copy';
import { chainOf, recentEvents, sideBlocks } from './view';

/** Blocks of the node's own chain shown as tiles; older ones are counted, not drawn. */
const SHOWN_BLOCKS = 3;
const SHOWN_EVENTS = 6;

export interface NodePanelProps {
  snap: Snapshot;
  node: number;
  onToggle(node: number, online: boolean): void;
  onClose(): void;
  /** What the walkthrough points at: the whole panel, or the row with the online switch. */
  pointed?: 'panel' | 'toggle' | null;
}

/** The network through one node's eyes: its tip, its mempool, the blocks it knows and what it just did. */
export function NodePanel({ snap, node: id, onToggle, onClose, pointed = null }: NodePanelProps) {
  const t = useT();
  const node = snap.nodes[id];
  const chain = chainOf(snap.blocks, node.tip);
  const shown = chain.slice(-SHOWN_BLOCKS);
  const earlier = chain.length - shown.length;
  const kept = sideBlocks(node, snap.blocks);
  const events = recentEvents(snap, id, SHOWN_EVENTS);

  const rows = (block: SimBlock) => [
    { label: 'prev', value: block.parent ?? t(COPY.none) },
    { label: 'txs', value: block.txs.length > 0 ? block.txs.join(' ') : t(COPY.none) },
    { label: 'miner', value: block.miner >= 0 ? block.miner : t(COPY.none) },
  ];

  return (
    <section className={cx('net-panel', pointed === 'panel' && 'fig-pointed')} aria-label={`${t(COPY.node)} ${id}`}>
      <header className={cx('net-panel-head', pointed === 'toggle' && 'fig-pointed')}>
        <h4 className="net-panel-title poster">
          {t(COPY.node)} {id}
        </h4>
        <span className={`tag ${node.online ? 'tag-line' : ''}`}>{node.online ? t(COPY.online) : t(COPY.offline)}</span>
        <button type="button" className="btn btn-sm btn-dark" onClick={() => onToggle(id, !node.online)}>
          {node.online ? t(COPY.takeOffline) : t(COPY.bringOnline)}
        </button>
        <button type="button" className="net-panel-close" aria-label={t(COPY.close)} onClick={onClose}>
          <svg viewBox="0 0 14 14" width="12" height="12" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        </button>
      </header>

      <dl className="net-facts">
        <div>
          <dt className="label">{t(COPY.tip)}</dt>
          <dd className="mono">
            {node.tip} · {t(COPY.height)} {snap.blocks[node.tip].height}
          </dd>
        </div>
        <div>
          <dt className="label">{t(COPY.mempool)}</dt>
          <dd className="mono">{node.mempool.length > 0 ? node.mempool.join(' ') : t(COPY.empty)}</dd>
        </div>
        <div>
          <dt className="label">{t(COPY.hashPower)}</dt>
          <dd className="mono">{(node.hashPower * 100).toFixed(1)}%</dd>
        </div>
        <div>
          <dt className="label">{t(COPY.peers)}</dt>
          <dd className="mono">{node.peers.join(' ')}</dd>
        </div>
      </dl>

      <p className="label net-cap">
        <span>{t(COPY.chain)}</span>
        {earlier > 0 ? <span>{fill(t(COPY.earlier), { count: earlier })}</span> : null}
      </p>
      <ChainRow className="net-chain">
        {shown.map((blockId) => {
          const block = snap.blocks[blockId];
          return (
            <BlockTile
              key={blockId}
              title={<span className="net-id">{blockId}</span>}
              status={
                blockId === node.tip ? t(COPY.tipTag) : block.parent === null ? t(COPY.genesis) : `h${block.height}`
              }
              rows={rows(block)}
            />
          );
        })}
      </ChainRow>

      {kept.length > 0 ? (
        <>
          <p className="label net-cap">{t(COPY.kept)}</p>
          <div className="net-kept">
            {kept.map((blockId) => (
              <BlockTile
                key={blockId}
                title={<span className="net-id">{blockId}</span>}
                status={`h${snap.blocks[blockId].height}`}
                state="candidate"
                rows={rows(snap.blocks[blockId])}
              />
            ))}
          </div>
          <p className="fig-note">{t(COPY.keptNote)}</p>
        </>
      ) : null}

      <p className="label net-cap">{t(COPY.events)}</p>
      {events.length > 0 ? (
        <ol className="net-events mono">
          {events.map((event, index) => (
            <li key={`${event.t}-${event.type}-${event.ref}-${index}`} data-type={event.type}>
              <time>
                {event.t.toFixed(1)} {t(COPY.seconds)}
              </time>
              <span>{fill(t(COPY.eventTypes[event.type]), { ref: event.ref })}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="fig-note">{t(COPY.noEvents)}</p>
      )}
    </section>
  );
}
