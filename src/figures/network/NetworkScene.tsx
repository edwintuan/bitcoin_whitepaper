import { useId, useMemo, useRef } from 'react';
import { SegmentedControl, SegmentedControlItem } from '@/components/base/segmented-control/segmented-control';
import { Switch } from '@/components/base/switch/switch';
import { Rich } from '@/components/site/Rich';
import { useSettings, useT } from '@/i18n/settings';
import { fill, formatCount } from '@/text/format';
import { cx } from '@/utils/cx';
import { COPY } from './copy';
import { MAX_BLOCKS, forkPair } from './director';
import { NetGraph, NetLegend } from './NetGraph';
import { NodePanel } from './NodePanel';
import { sentences } from './sentences';
import { SPEEDS } from './useNetwork';
import type { NetworkControls } from './useNetwork';
import { chainView, lastReorg, situation } from './view';
import type { Hint } from './walkthrough';

/** English needs a singular form; Chinese does not, but the copy carries two forms either way. */
const plural = (count: number, forms: readonly string[]): string => (count === 1 ? forms[0] : forms[1]);

export interface NetworkSceneProps {
  net: NetworkControls;
  /** What the walkthrough asks the reader to press next, if anything. */
  hint: Hint;
  selected: number | null;
  onSelect(node: number | null): void;
  /** Reduced motion: nothing travels; the reader steps instead. */
  still: boolean;
}

/** Ten nodes gossiping transactions and blocks, with the controls to make things happen. */
export function NetworkScene({ net, hint, selected, onSelect, still }: NetworkSceneProps) {
  const t = useT();
  const { lang } = useSettings();
  const speedLabel = useId();
  const scene = useRef<HTMLDivElement>(null);
  const { snap } = net;
  const view = useMemo(() => chainView(snap), [snap]);
  const now = useMemo(() => situation(snap), [snap]);
  const reorg = useMemo(() => lastReorg(snap), [snap]);
  // A reorg is news until the next block arrives.
  const freshReorg = reorg !== null && reorg.block === view.leader ? reorg : null;

  const anyOnline = snap.nodes.some((node) => node.online);
  const canFork = forkPair(snap) !== null;
  const canHop = snap.inFlight.length > 0 || net.mining;
  const canStep = canHop && (still || !net.playing);
  // The walkthrough points at the row a control is in, or at the node's panel.
  const actionAsked = hint === 'send' || hint === 'mine' || hint === 'fork';
  const panelAsked = hint === 'panel' ? 'panel' : hint === 'offline' || hint === 'online' ? 'toggle' : null;

  // The button that closes the panel goes with it: the focus returns to the node the panel was about.
  const closePanel = () => {
    if (selected !== null) scene.current?.querySelectorAll<HTMLButtonElement>('.net-node')[selected]?.focus();
    onSelect(null);
  };

  const S = COPY.status;
  const list = (nodes: number[]) => nodes.join(lang === 'zh' ? '、' : ', ');
  // A reorg is reported after whatever else is going on, except during a fork, which is the bigger news.
  const reorgNews =
    freshReorg && now.kind !== 'fork'
      ? fill(plural(freshReorg.nodes.length, t(S.reorg)), { nodes: list(freshReorg.nodes), block: freshReorg.block })
      : null;
  let live: string;
  let detail: string | null = null;
  switch (now.kind) {
    case 'dark':
      live = t(S.dark);
      break;
    case 'rest':
      live = sentences(
        lang,
        fill(t(S.rest), { tip: now.tip, height: now.height }),
        now.waiting > 0 && fill(plural(now.waiting, t(S.waiting)), { count: now.waiting }),
      );
      break;
    case 'tx-spreading':
      live = fill(t(S.txSpreading), { tx: now.tx });
      detail = fill(t(S.txReach), { have: now.have, online: now.online });
      break;
    case 'block-spreading':
      live = fill(t(S.blockSpreading), { block: now.block, height: now.height });
      detail = fill(t(S.blockReach), { have: now.have, online: now.online });
      break;
    case 'fork': {
      const [a, b] = now.groups;
      live = fill(t(S.fork), { height: a.height, a: a.tip, b: b.tip });
      detail = fill(t(S.forkReach), { a: a.tip, na: a.nodes.length, b: b.tip, nb: b.nodes.length });
      break;
    }
    case 'busy':
      // "Nothing new" would be untrue just before the news of a reorg.
      live = sentences(lang, t(S.busy), !reorgNews && t(S.busyNothing));
      break;
    case 'cut-off':
      live = t(S.cutOff);
      detail = fill(t(S.cutOffNodes), { nodes: list(now.behind) });
      break;
  }
  live = sentences(
    lang,
    net.renewed && fill(t(S.renewed), { blocks: formatCount(MAX_BLOCKS) }),
    live,
    reorgNews,
    // What the nodes that are online agree on says nothing about the ones that are away.
    now.kind !== 'dark' &&
      now.offline.length > 0 &&
      fill(plural(now.offline.length, t(S.offline)), { nodes: list(now.offline) }),
  );

  return (
    <div ref={scene} className="net-scene fig-stack">
      <NetGraph
        snap={snap}
        view={view}
        selected={selected}
        onSelect={(node) => onSelect(node === selected ? null : node)}
        still={still}
        switched={freshReorg?.nodes ?? []}
      />
      <NetLegend />

      <div className="net-status fig-status">
        <p className="net-status-live" role="status">
          {live}
        </p>
        {detail ? (
          <p className="net-status-detail" aria-hidden="true">
            {detail}
          </p>
        ) : null}
      </div>

      <div className={cx('fig-row', actionAsked && 'fig-pointed')}>
        <button type="button" className="btn" disabled={!anyOnline} onClick={() => net.sendTx(selected)}>
          {t(COPY.send)}
        </button>
        <button type="button" className="btn" disabled={!anyOnline} onClick={net.findBlock}>
          {t(COPY.findBlock)}
        </button>
        {/* Pressing it makes a fork impossible for a while: aria-disabled, so the focus stays on it. */}
        <button
          type="button"
          className="btn btn-line"
          aria-disabled={!canFork || undefined}
          title={canFork ? undefined : t(COPY.forkWait)}
          onClick={canFork ? net.makeFork : undefined}
        >
          {t(COPY.makeFork)}
        </button>
        <button type="button" className="btn btn-sm btn-line net-reset" onClick={net.reset}>
          {t(COPY.reset)}
        </button>
      </div>

      <div className="fig-row net-transport">
        {still ? null : (
          <button type="button" className="btn btn-sm btn-line" onClick={() => net.setPlaying(!net.playing)}>
            {net.playing ? t(COPY.pause) : t(COPY.play)}
          </button>
        )}
        {/* A step may deliver the last message: aria-disabled, so the focus stays on the button. */}
        <button
          type="button"
          className={cx('btn btn-sm', still ? 'btn-dark' : 'btn-line')}
          aria-disabled={!canStep || undefined}
          onClick={canStep ? net.hop : undefined}
        >
          {t(COPY.step)}
        </button>
        {still ? null : (
          <span className="net-speed">
            <span className="label" id={speedLabel}>
              {t(COPY.speed)}
            </span>
            <SegmentedControl
              aria-labelledby={speedLabel}
              selectedKeys={new Set([String(net.speed)])}
              onSelectionChange={(keys) => {
                const next = Number([...keys][0]);
                if (next > 0) net.setSpeed(next);
              }}
            >
              {SPEEDS.map((value) => (
                <SegmentedControlItem key={value} id={String(value)}>
                  {value}×
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          </span>
        )}
        <Switch size="sm" shape="rectangle" isSelected={net.mining} onChange={net.setMining}>
          {t(COPY.mining)}
        </Switch>
      </div>
      {still ? <p className="fig-note">{t(COPY.reducedNote)}</p> : null}

      {selected !== null && snap.nodes[selected] ? (
        <NodePanel snap={snap} node={selected} onToggle={net.setOnline} onClose={closePanel} pointed={panelAsked} />
      ) : (
        <p className="fig-note net-panel-hint">{t(COPY.panelHint)}</p>
      )}

      <p className="fig-note">
        <Rich text={t(COPY.honest)} />
      </p>
    </div>
  );
}
