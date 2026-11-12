import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useFigure } from '@/components/site/FigureFrame';
import { BlockTile } from '@/components/viz/BlockTile';
import { HashText } from '@/components/viz/HashText';
import { treeLayout } from '@/components/viz/merkle/layout';
import type { Slot } from '@/components/viz/merkle/layout';
import { Tree } from '@/components/viz/merkle/Tree';
import type { LinkTone } from '@/components/viz/merkle/Tree';
import { useSettings, useT } from '@/i18n/settings';
import { merkleLevels, rootFromStore } from '@/lib/merkle';
import { fill, formatCount } from '@/text/format';
import { cx } from '@/utils/cx';
import { COPY } from './copy';
import { MAX_TXS, MIN_TXS, blockHeader, blockTxids, nodeStates, prunedStore, storageCount } from './model';
import { gap, treeStatus } from './sentences';
import { afterTreeAction } from './walkthrough';
import type { Move, TreeHighlight } from './walkthrough';

interface Block {
  count: number;
  /** The reader's marks, one per transaction. */
  spent: boolean[];
  /** The marks as they stood when the block was last pruned; null until then. */
  pruned: boolean[] | null;
}

const fresh = (count: number): Block => ({ count, spent: Array.from({ length: count }, () => false), pruned: null });

/** The paper's own example: four transactions, the first three spent. */
const PAPER: Block = { count: 4, spent: [true, true, true, false], pruned: null };

/** Milliseconds each level stays the newest while the tree builds itself. */
const LEVEL_PAUSE = 950;

/**
 * A block's transactions hashed into a Merkle root, level by level, and then
 * pruned: every fully spent branch collapses into the one hash at its top,
 * and the root is recomputed from what is left.
 */
export function TreeScene({ visible, highlight }: { visible: boolean; highlight: TreeHighlight | null }) {
  const t = useT();
  const { lang } = useSettings();
  const { step, goTo, active, reducedMotion } = useFigure();

  const [block, setBlock] = useState<Block>(() => fresh(4));
  // How many levels of the tree have been hashed so far while it builds; 'all' at rest.
  const [revealed, setRevealed] = useState<number | 'all'>('all');
  // Set when the reader's own action moved the walkthrough, so the step does not reset what they did.
  const byHand = useRef(false);

  const txids = useMemo(() => blockTxids(block.count), [block.count]);
  const levels = useMemo(() => merkleLevels(txids), [txids]);
  const layout = useMemo(() => treeLayout(block.count), [block.count]);
  const mined = useMemo(() => blockHeader(txids), [txids]);
  const prunedFlags = useMemo(() => block.pruned ?? fresh(block.count).spent, [block.pruned, block.count]);
  const states = useMemo(() => nodeStates(levels, block.spent, prunedFlags), [levels, block.spent, prunedFlags]);
  const counts = useMemo(() => storageCount(levels, prunedFlags), [levels, prunedFlags]);
  // Recomputed for real from what pruning left behind, never read from the full tree.
  const recomputed = useMemo(
    () => (block.pruned ? rootFromStore(prunedStore(levels, block.pruned)) : null),
    [levels, block.pruned],
  );

  const top = levels.length - 1;
  const root = levels[top][0];
  const building = revealed !== 'all';
  const isShown = (level: number) => revealed === 'all' || level < revealed;
  const newest = building ? revealed - 1 : -1;

  /* ------------------------------------------------- the guided steps */
  useEffect(() => {
    if (byHand.current) {
      byHand.current = false;
      return;
    }
    if (step === 0 || step === 1) {
      setBlock(fresh(step === 0 ? 4 : 5));
      // Without motion the tree appears whole; the Play button then steps through it.
      setRevealed(reducedMotion ? 'all' : 1);
    } else if (step === 2) {
      setBlock(fresh(4));
      setRevealed('all');
    } else if (step === 3) {
      setBlock((now) => (now.count === 4 && now.pruned === null && now.spent.some(Boolean) ? now : PAPER));
      setRevealed('all');
    }
    // Only a change of step re-stages the scene; a change of motion preference does not.
  }, [step]);

  // The build plays by itself, one level at a time, while the figure is on screen.
  useEffect(() => {
    if (revealed === 'all' || reducedMotion || !active || !visible) return;
    const done = revealed >= levels.length;
    const timer = window.setTimeout(() => setRevealed(done ? 'all' : revealed + 1), done ? LEVEL_PAUSE * 1.5 : LEVEL_PAUSE);
    return () => window.clearTimeout(timer);
  }, [revealed, reducedMotion, active, visible, levels.length]);

  const spentCount = block.spent.filter(Boolean).length;
  const waiting = block.spent.filter((flag, i) => flag && !prunedFlags[i]).length;
  const isPruned = block.pruned !== null;
  const canStartOver = spentCount > 0 || isPruned;

  /* ------------------------------------------------------ what the reader does */
  // Sends the walkthrough where walkthrough.ts says, without letting the new step re-stage what the reader just did.
  const move = (target: Move) => {
    if (target === undefined || step === null || target === step) return;
    byHand.current = true;
    goTo(target);
  };

  const play = () => {
    // Without motion the same button steps through the levels; the last press completes the tree.
    if (building && reducedMotion) setRevealed(revealed + 1 >= levels.length ? 'all' : revealed + 1);
    else setRevealed(1);
  };

  // The buttons below stay focusable when they have nothing to do (aria-disabled), so each handler checks for itself.
  const resize = (count: number) => {
    if (isPruned || count < MIN_TXS || count > MAX_TXS) return;
    const spent = Array.from({ length: count }, (_, i) => block.spent[i] ?? false);
    setBlock({ count, spent, pruned: null });
    setRevealed('all');
    move(afterTreeAction(step, 'resize', { count, waiting: spent.filter(Boolean).length, pruned: false }));
  };

  const toggle = (index: number) => {
    const spent = block.spent.map((flag, i) => (i === index ? !flag : flag));
    setBlock({ ...block, spent });
    setRevealed('all');
    const stillWaiting = spent.filter((flag, i) => flag && !prunedFlags[i]).length;
    move(afterTreeAction(step, 'mark', { count: block.count, waiting: stillWaiting, pruned: isPruned }));
  };

  const prune = () => {
    if (waiting === 0) return;
    setBlock({ ...block, pruned: [...block.spent] });
    setRevealed('all');
    move(afterTreeAction(step, 'prune', { count: block.count, waiting: 0, pruned: true }));
  };

  const startOver = () => {
    if (!canStartOver) return;
    setBlock(fresh(block.count));
    setRevealed('all');
    move(afterTreeAction(step, 'startOver', { count: block.count, waiting: 0, pruned: false }));
  };

  /* ------------------------------------------------------------- drawing */
  const name = (index: number) => `Tx${index}`;

  const renderNode = (slot: Slot) => {
    // The root's place in the header is there from the start; its value arrives last.
    if (!isShown(slot.level) && slot.level !== top) return null;
    const rise = building && slot.level === newest && slot.level > 0 ? 't-rise' : undefined;
    const delay = { '--i': 8 } as CSSProperties;

    if (slot.ghost) {
      // A copy only exists while the hash it repeats does.
      if (states[slot.level][slot.index - 1] === 'gone') return null;
      return (
        <div className={`mkl-node ${rise ?? ''}`} style={delay} data-state="copy" role="img" aria-label={t(COPY.nodeCopy)}>
          {t(COPY.copy)}
        </div>
      );
    }

    const state = states[slot.level][slot.index];
    const hash = levels[slot.level][slot.index];

    if (slot.level === top) {
      const showRoot = revealed === 'all' || revealed > top;
      return (
        <div className="mkl-root" data-fresh={building && newest === top}>
          <span className="label">{t(COPY.root)}</span>
          {showRoot ? (
            <span key={hash} className={building ? 't-pop' : 't-swap-soft'}>
              <HashText hash={hash} lead={28} tail={0} zeros={false} />
            </span>
          ) : (
            <span className="mkl-dim">{t(COPY.pending)}</span>
          )}
        </div>
      );
    }

    if (slot.level > 0) {
      return (
        <div
          className={`mkl-node ${rise ?? ''} ${state === 'stub' && !building ? 't-slam' : ''}`}
          style={delay}
          data-state={state}
          role={state === 'hash' ? undefined : 'img'}
          aria-label={state === 'stub' ? t(COPY.nodeStub) : state === 'gone' ? t(COPY.nodeGone) : undefined}
        >
          {state === 'gone' ? null : <HashText hash={hash} lead={16} tail={0} zeros={false} />}
        </div>
      );
    }

    if (state === 'stub' || state === 'gone') {
      return (
        <div
          className={`mkl-leaf ${state === 'stub' ? 't-slam' : ''}`}
          data-state={state}
          role="img"
          aria-label={fill(t(state === 'stub' ? COPY.leafStub : COPY.leafGone), { name: name(slot.index) })}
        >
          {state === 'stub' ? (
            <>
              <span className="mkl-leaf-name">{name(slot.index)}</span>
              <HashText hash={hash} lead={12} tail={0} zeros={false} />
            </>
          ) : null}
        </div>
      );
    }

    return (
      <button
        type="button"
        className="mkl-leaf"
        data-state={state}
        aria-pressed={state === 'spent'}
        aria-label={fill(t(state === 'spent' ? COPY.leafSpent : COPY.leafUnspent), { name: name(slot.index) })}
        onClick={() => toggle(slot.index)}
      >
        <span className="mkl-leaf-name">{name(slot.index)}</span>
        <HashText hash={hash} lead={12} tail={0} zeros={false} />
        <span className="mkl-leaf-state">{state === 'spent' ? t(COPY.spent) : ''}</span>
      </button>
    );
  };

  const linkTone = (parent: Slot, child: Slot): LinkTone => {
    if (!isShown(parent.level)) return 'none';
    const parentState = states[parent.level][parent.index];
    // A copy shares the fate of the hash it repeats.
    const childState = states[child.level][child.ghost ? child.index - 1 : child.index];
    if (child.ghost && childState === 'gone') return 'none';
    if (parentState === 'gone' || parentState === 'stub' || childState === 'gone') return 'faint';
    return building && parent.level === newest ? 'live' : 'solid';
  };

  /* -------------------------------------------------------------- status */
  const status = treeStatus(lang, {
    building: building
      ? { level: revealed, levels: levels.length, oddBelow: revealed >= 2 && levels[revealed - 2].length % 2 === 1 }
      : null,
    count: block.count,
    spent: spentCount,
    waiting,
    pruned: isPruned,
    counts,
  });

  const headerReady = revealed === 'all' || revealed > top;

  return (
    <div className="fig-stack" hidden={!visible}>
      <div className={cx('fig-row mkl-top', highlight === 'play' && 'fig-pointed')}>
        <button type="button" className="btn btn-sm btn-dark" onClick={play} disabled={isPruned}>
          {building && reducedMotion ? t(COPY.nextLevel) : t(COPY.play)}
        </button>
        <div className="mkl-count" role="group" aria-label={t(COPY.txCount)}>
          <span className="label">{t(COPY.txCount)}</span>
          {/* aria-disabled, not disabled: at its limit a stepper would otherwise drop the focus. */}
          <button
            type="button"
            className="mkl-step"
            aria-label={t(COPY.removeTx)}
            aria-disabled={isPruned || block.count <= MIN_TXS}
            onClick={() => resize(block.count - 1)}
          >
            −
          </button>
          <span className="mkl-count-value" aria-live="polite">
            {block.count}
          </span>
          <button
            type="button"
            className="mkl-step"
            aria-label={t(COPY.addTx)}
            aria-disabled={isPruned || block.count >= MAX_TXS}
            onClick={() => resize(block.count + 1)}
          >
            +
          </button>
        </div>
      </div>

      {/* The block: its header, and the tree hanging from the root inside it. */}
      <BlockTile
        className="mkl-head"
        title={t(COPY.header)}
        status={t(COPY.headerBytes)}
        rows={[
          { label: 'prev', value: <HashText hash={mined.header.prevHash} lead={20} tail={0} /> },
          { label: 'nonce', value: headerReady ? formatCount(mined.header.nonce) : '…' },
          { label: 'hash', value: headerReady ? <HashText hash={mined.hash} lead={20} tail={0} /> : '…' },
        ]}
      />
      <Tree
        className={cx('mkl-tree', highlight === 'leaves' && 'fig-pointed')}
        layout={layout}
        label={t(COPY.treeLabel)}
        renderNode={renderNode}
        linkTone={linkTone}
        leafHeight={50}
        nodeHeight={28}
        gap={20}
        flowInto={building && !reducedMotion && newest > 0 ? newest : null}
      />

      <ul className="mkl-legend label" aria-label={t(COPY.legend)}>
        <li>
          <i className="mkl-swatch" data-state="tx" aria-hidden="true" />
          {t(COPY.legendTx)}
        </li>
        <li>
          <i className="mkl-swatch" data-state="hash" aria-hidden="true" />
          {t(COPY.legendHash)}
        </li>
        <li>
          <i className="mkl-swatch" data-state="stub" aria-hidden="true" />
          {t(COPY.legendStub)}
        </li>
        <li>
          <i className="mkl-swatch" data-state="gone" aria-hidden="true" />
          {t(COPY.legendGone)}
        </li>
      </ul>

      <div className={cx('fig-row', highlight === 'prune' && 'fig-pointed')}>
        {/* aria-disabled, not disabled: both buttons change state when pressed and would lose the focus. */}
        <button type="button" className="btn" aria-disabled={waiting === 0} onClick={prune}>
          {t(COPY.prune)}
        </button>
        <button type="button" className="btn btn-line btn-sm" aria-disabled={!canStartOver} onClick={startOver}>
          {t(COPY.startOver)}
        </button>
        <dl className="mkl-stats mono">
          <div>
            <dt>{t(COPY.statKept)}</dt>
            <dd>
              {counts.txKept} / {counts.txTotal}
            </dd>
          </div>
          <div>
            <dt>{t(COPY.statStubs)}</dt>
            <dd>{counts.stubHashes}</dd>
          </div>
          <div>
            <dt>{t(COPY.statGone)}</dt>
            <dd>{counts.hashesGone}</dd>
          </div>
        </dl>
      </div>

      {recomputed ? (
        <dl className="mkl-compare">
          <div>
            <dt className="label">{t(COPY.rootInHeader)}</dt>
            <dd className="mono">
              <HashText hash={root} full zeros={false} />
            </dd>
          </div>
          <div>
            <dt className="label">
              {t(COPY.rootAgain)}
              <span className={`tag ${recomputed === root ? 'tag-valid' : 'tag-invalid'}`}>
                {recomputed === root ? `= ${t(COPY.identical)}` : '≠'}
              </span>
            </dt>
            <dd className="mono">
              <span key={`${recomputed}-${counts.stubHashes}-${counts.txKept}`} className="t-pop">
                <HashText hash={recomputed} full zeros={false} />
              </span>
            </dd>
          </div>
        </dl>
      ) : null}

      <p className="fig-status" role="status">
        {status.text}
        {status.aside ? (
          <span className="mkl-dim">
            {gap(lang)}
            {status.aside}
          </span>
        ) : null}
      </p>
    </div>
  );
}
