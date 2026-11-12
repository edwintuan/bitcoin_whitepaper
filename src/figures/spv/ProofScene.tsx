import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { SegmentedControl, SegmentedControlItem } from '@/components/base/segmented-control/segmented-control';
import { useFigure } from '@/components/site/FigureFrame';
import { BlockTile } from '@/components/viz/BlockTile';
import { HashText } from '@/components/viz/HashText';
import { treeLayout } from '@/components/viz/merkle/layout';
import type { Slot } from '@/components/viz/merkle/layout';
import { Tree } from '@/components/viz/merkle/Tree';
import type { LinkTone } from '@/components/viz/merkle/Tree';
import { useSettings, useT } from '@/i18n/settings';
import { foldProof, merkleProof, verifyProof } from '@/lib/merkle';
import { fill, formatBtc } from '@/text/format';
import { cx } from '@/utils/cx';
import { COPY } from './copy';
import { BLOCK_TX_COUNT, PAYMENT_BLOCK, blockPayments, corrupt, forge, headerChain, nodeRoles } from './model';
import { gap, proofStatus } from './sentences';
import { afterProofAction } from './walkthrough';
import type { ProofAction, ProofHighlight } from './walkthrough';

type Tamper = 'none' | 'tx' | 'sibling';

const PAYMENTS = blockPayments();
const IDS = PAYMENTS.map((payment) => payment.id);
const LAYOUT = treeLayout(BLOCK_TX_COUNT);
const TOP = LAYOUT.rows.length - 1;

/** Milliseconds between two hashes when the walkthrough folds the branch by itself. */
const FOLD_PAUSE = 1100;

/**
 * A light wallet's check, with nothing simulated: three mined headers, the
 * Merkle branch a full node would send, and the fold up to the root one
 * double SHA-256 at a time.
 */
export function ProofScene({ visible, highlight }: { visible: boolean; highlight: ProofHighlight | null }) {
  const t = useT();
  const { lang } = useSettings();
  const { step, goTo, active, reducedMotion } = useFigure();

  const [picked, setPicked] = useState(2);
  const [asked, setAsked] = useState(false);
  // Siblings folded in so far.
  const [folded, setFolded] = useState(0);
  const [tamper, setTamper] = useState<Tamper>('none');
  // True while the walkthrough is folding without being asked.
  const [auto, setAuto] = useState(false);
  const byHand = useRef(false);
  const tamperLabel = useId();

  const chain = useMemo(() => headerChain(), []);
  const header = chain[PAYMENT_BLOCK].header;
  const roles = useMemo(() => nodeRoles(BLOCK_TX_COUNT, picked), [picked]);

  // What the wallet works with: its transaction, and the branch as it arrived.
  const payment = tamper === 'tx' ? forge(PAYMENTS[picked]) : PAYMENTS[picked];
  const proof = useMemo(() => {
    const honest = merkleProof(IDS, picked);
    return tamper === 'sibling' ? honest.map((entry, i) => (i === 0 ? { ...entry, hash: corrupt(entry.hash) } : entry)) : honest;
  }, [picked, tamper]);
  const folds = useMemo(() => foldProof(payment.id, proof), [payment.id, proof]);

  const done = asked && folded >= proof.length;
  const result = folds[folds.length - 1].out;
  // The engine's own verdict, and the comparison the reader watches, must agree.
  const equal = done && result === header.merkleRoot && verifyProof(payment.id, proof, header.merkleRoot);

  /* ------------------------------------------------- the guided steps */
  useEffect(() => {
    if (byHand.current) {
      byHand.current = false;
      return;
    }
    if (step === 0 || step === 1) {
      setAsked(false);
      setFolded(0);
      setTamper('none');
      setAuto(false);
    } else if (step === 2) {
      setAsked(true);
      setFolded(0);
      setTamper('none');
      setAuto(true);
    } else if (step === 3) {
      setAsked(true);
      setFolded(proof.length);
      setTamper('none');
      setAuto(false);
    }
    // Only a change of step re-stages the scene.
  }, [step]);

  // In the walkthrough the branch folds by itself, one hash at a time, while the figure is on screen.
  useEffect(() => {
    if (!auto || reducedMotion || !active || !visible) return;
    if (folded >= proof.length) {
      setAuto(false);
      return;
    }
    const timer = window.setTimeout(() => setFolded((count) => count + 1), FOLD_PAUSE);
    return () => window.clearTimeout(timer);
  }, [auto, folded, proof.length, reducedMotion, active, visible]);

  /* ------------------------------------------------------ what the reader does */
  // Sends the walkthrough where walkthrough.ts says, without letting the new step re-stage what the reader just did.
  const follow = (action: ProofAction) => {
    const target = afterProofAction(step, action);
    if (target === undefined || step === null || target === step) return;
    byHand.current = true;
    goTo(target);
  };

  const pick = (index: number) => {
    // The transaction being checked is already the pressed one.
    if (index === picked) return;
    setPicked(index);
    setAsked(false);
    setFolded(0);
    setAuto(false);
    follow('pick');
  };

  // The three buttons stay focusable when they have nothing to do (aria-disabled), so each handler checks for itself.
  const canStartAgain = asked || tamper !== 'none';

  const ask = () => {
    if (asked) return;
    setAsked(true);
    setFolded(0);
    follow('ask');
  };

  const next = () => {
    if (!asked || done) return;
    setAuto(false);
    setFolded((count) => Math.min(proof.length, count + 1));
    follow('next');
  };

  const tamperWith = (kind: Tamper) => {
    setTamper(kind);
    // Tampering is shown by its outcome: the whole check, done again.
    setAsked(true);
    setFolded(proof.length);
    setAuto(false);
    follow('tamper');
  };

  const startAgain = () => {
    if (!canStartAgain) return;
    setAsked(false);
    setFolded(0);
    setTamper('none');
    setAuto(false);
    follow('startAgain');
  };

  /* ------------------------------------------------------------- drawing */
  const name = (index: number) => `Tx${index}`;

  const renderNode = (slot: Slot) => {
    const role = roles[slot.level][slot.index];

    // A transaction is always a button, the one being checked the pressed one: picking it must
    // not replace the element that holds the focus. Only a leaf the node has sent is not for picking.
    if (slot.level === 0 && !(role === 'sibling' && asked)) {
      const mine = role === 'path';
      return (
        <button
          type="button"
          className="spv-node"
          data-role={mine ? 'mine' : 'unknown'}
          data-altered={mine && tamper === 'tx'}
          aria-pressed={mine}
          aria-label={fill(t(mine ? COPY.picked : COPY.pick), { name: name(slot.index) })}
          onClick={() => pick(slot.index)}
        >
          <span className="spv-name">{name(slot.index)}</span>
          {mine ? (
            <span key={payment.id} className="t-swap-soft">
              <HashText hash={payment.id} lead={12} tail={0} zeros={false} />
            </span>
          ) : null}
        </button>
      );
    }

    if (role === 'path') {
      // The hashes the wallet computes itself: one per sibling folded in.
      const computed = asked && folded >= slot.level;
      const hash = folds[slot.level - 1].out;
      const top = slot.level === TOP;
      return (
        <div
          className="spv-node"
          data-role={computed ? 'computed' : 'pending'}
          data-ok={top && done ? equal : undefined}
          role="img"
          aria-label={t(computed ? COPY.pathDone : COPY.pathPending)}
        >
          {top ? <span className="spv-name">{t(COPY.computedRoot)}</span> : null}
          {computed ? (
            <span key={hash} className="t-pop">
              <HashText hash={hash} lead={top ? 20 : 14} tail={0} zeros={false} />
            </span>
          ) : (
            <span aria-hidden="true">…</span>
          )}
        </div>
      );
    }

    if (role === 'sibling' && asked) {
      const hash = proof[slot.level].hash;
      return (
        <div
          className="spv-node t-rise"
          style={{ ['--i' as string]: slot.level * 3 }}
          data-role="given"
          data-altered={tamper === 'sibling' && slot.level === 0}
          role="img"
          aria-label={t(COPY.givenNode)}
        >
          {slot.level === 0 ? <span className="spv-name">{name(slot.index)}</span> : null}
          <span key={hash} className="t-swap-soft">
            <HashText hash={hash} lead={14} tail={0} zeros={false} />
          </span>
        </div>
      );
    }

    return <div className="spv-node" data-role="unknown" role="img" aria-label={t(COPY.unknownNode)} />;
  };

  const linkTone = (parent: Slot, child: Slot): LinkTone => {
    const onBranch = roles[parent.level][parent.index] === 'path' && roles[child.level][child.index] !== 'none';
    if (!onBranch || !asked) return 'faint';
    if (folded >= parent.level) return 'solid';
    return folded === parent.level - 1 ? 'live' : 'faint';
  };

  /* -------------------------------------------------------------- status */
  const status = proofStatus(lang, {
    asked,
    folded,
    steps: proof.length,
    ours: folded > 0 ? folds[Math.min(folded, folds.length) - 1].ours : null,
    equal,
    tamper,
  });

  /* --------------------------------------------------- the wallet's working */
  // One side of a step. The wallet's own side is the transaction id at first and, after that, the
  // result of the step before: until that step is done there is nothing to show but a gap.
  const operand = (index: number, side: 'left' | 'right') => {
    const ours = folds[index].ours === side;
    if (ours && index > 0 && folded < index) return <span className="spv-chip">…</span>;
    return (
      <span
        className="spv-chip"
        data-side={ours ? 'ours' : 'theirs'}
        // What the reader tampered with enters the working in its first step.
        data-altered={index === 0 && tamper === (ours ? 'tx' : 'sibling')}
      >
        <HashText hash={folds[index][side]} lead={8} tail={0} zeros={false} />
      </span>
    );
  };

  return (
    <div className="fig-stack" hidden={!visible}>
      <p className="fig-note">{t(COPY.walletHolds)}</p>

      {/* The shared chain row, written out with its class: ChainRow cannot carry the name the row needs. */}
      <div className="chain-row spv-chain" role="group" aria-label={t(COPY.chainLabel)}>
        {chain.map((block, index) => {
          const mine = index === PAYMENT_BLOCK;
          return (
            <BlockTile
              key={block.height}
              title={`${t(COPY.block)} ${block.height}`}
              rows={[
                { label: 'prev', value: <HashText hash={block.header.prevHash} lead={10} tail={0} /> },
                {
                  label: 'root',
                  // The root the payment is checked against is the one thing picked out in the chain.
                  value: (
                    <span className={mine ? 'spv-root' : undefined}>
                      <HashText hash={block.header.merkleRoot} lead={mine ? 12 : 10} tail={0} zeros={false} />
                    </span>
                  ),
                },
              ]}
            />
          );
        })}
      </div>

      {/* The link from that root down to the wallet's own result, and the verdict once there is one. */}
      <div className="spv-compare" data-ok={done ? equal : undefined}>
        {done ? (
          <span key={`${equal}-${result}`} className={`tag ${equal ? 'tag-valid t-pop' : 'tag-invalid t-shake'}`}>
            {equal ? `= ${t(COPY.equal)}` : `≠ ${t(COPY.notEqual)}`}
          </span>
        ) : null}
      </div>

      <Tree
        className={cx('spv-tree', highlight === 'pick' && 'fig-pointed')}
        layout={LAYOUT}
        label={t(COPY.treeLabel)}
        renderNode={renderNode}
        linkTone={linkTone}
        leafHeight={40}
        nodeHeight={30}
        rootHeight={40}
        gap={18}
      />
      <p className="label spv-tree-cap">{t(COPY.treeCaption)}</p>
      <ul className="spv-legend label" aria-label={t(COPY.legend)}>
        <li>
          <i className="spv-swatch" data-role="mine" aria-hidden="true" />
          {t(COPY.legendMine)}
        </li>
        <li>
          <i className="spv-swatch" data-role="given" aria-hidden="true" />
          {t(COPY.legendGiven)}
        </li>
        <li>
          <i className="spv-swatch" data-role="unknown" aria-hidden="true" />
          {t(COPY.legendUnknown)}
        </li>
      </ul>

      <p className="spv-pay mono">
        <span className="label">{t(COPY.checking)}</span>
        <b>{name(picked)}</b>
        <span>{fill(t(COPY.pays), { amount: formatBtc(payment.amount) })}</span>
        <span>
          {t(COPY.txid)} <HashText hash={payment.id} lead={8} tail={4} zeros={false} />
        </span>
        {tamper === 'tx' ? <span className="tag tag-line">{t(COPY.altered)}</span> : null}
      </p>

      <div className={cx('fig-row', (highlight === 'ask' || highlight === 'next') && 'fig-pointed')}>
        {/* aria-disabled, not disabled: each of these changes state when pressed and would lose the focus. */}
        <button type="button" className="btn" aria-disabled={asked} onClick={ask}>
          {t(COPY.ask)}
        </button>
        <button type="button" className="btn btn-dark" aria-disabled={!asked || done} onClick={next}>
          {t(COPY.next)}
        </button>
        <button type="button" className="btn btn-line btn-sm" aria-disabled={!canStartAgain} onClick={startAgain}>
          {t(COPY.again)}
        </button>
      </div>

      <div className={cx('spv-tamper', highlight === 'tamper' && 'fig-pointed')}>
        <span className="label" id={tamperLabel}>
          {t(COPY.tamper)}
        </span>
        <SegmentedControl
          className="spv-tamper-choices"
          aria-labelledby={tamperLabel}
          selectedKeys={new Set([tamper])}
          onSelectionChange={(keys) => {
            const kind = [...keys][0] as Tamper | undefined;
            if (kind) tamperWith(kind);
          }}
        >
          <SegmentedControlItem id="none">{t(COPY.tamperNone)}</SegmentedControlItem>
          <SegmentedControlItem id="tx">{t(COPY.tamperTx)}</SegmentedControlItem>
          <SegmentedControlItem id="sibling">{t(COPY.tamperSibling)}</SegmentedControlItem>
        </SegmentedControl>
      </div>

      {asked ? (
        <ol className="spv-folds mono" aria-label={t(COPY.foldsLabel)}>
          <li className="spv-folds-head label" aria-hidden="true">
            <span>{t(COPY.foldsHead)}</span>
            <span>
              <span className="spv-chip" data-side="ours">
                {t(COPY.ours)}
              </span>{' '}
              <span className="spv-chip" data-side="theirs">
                {t(COPY.theirs)}
              </span>
            </span>
          </li>
          {folds.map((fold, index) => (
            <li className="spv-fold" key={index}>
              <span className="spv-fold-no">{index + 1}</span>
              <span className="spv-fold-sum">
                {operand(index, 'left')}
                <span aria-hidden="true">‖</span>
                {operand(index, 'right')}
                <span aria-hidden="true">→</span>
                {folded > index ? (
                  <span key={fold.out} className="spv-chip t-pop" data-side="ours">
                    <HashText hash={fold.out} lead={8} tail={0} zeros={false} />
                  </span>
                ) : (
                  <span className="spv-chip">…</span>
                )}
              </span>
            </li>
          ))}
          {done ? (
            <li className="spv-verdict">
              <span className="label">{t(COPY.headerRoot)}</span>
              <HashText hash={header.merkleRoot} lead={8} tail={0} zeros={false} />
              <span className={`tag ${equal ? 'tag-valid' : 'tag-invalid'}`}>
                {equal ? `= ${t(COPY.equal)}` : `≠ ${t(COPY.notEqual)}`}
              </span>
            </li>
          ) : null}
        </ol>
      ) : null}

      <p className="fig-status" role="status">
        {status.lead ? (
          <>
            <b>{status.lead}</b>
            {gap(lang)}
          </>
        ) : null}
        {status.text}
      </p>
    </div>
  );
}
