import { useEffect, useRef, useState } from 'react';
import { useFigure } from '@/components/site/FigureFrame';
import { BlockTile, ChainRow } from '@/components/viz/BlockTile';
import type { BlockState } from '@/components/viz/BlockTile';
import { HashText } from '@/components/viz/HashText';
import { useSettings, useT } from '@/i18n/settings';
import { fill } from '@/text/format';
import { cx } from '@/utils/cx';
import { buildChain, chainStatus, editItem, repairCost, repairPlan, republish } from './timestamp/chain';
import type { StampBlock } from './timestamp/chain';
import { COPY } from './timestamp/copy';
import './timestamp/timestamp.css';

/** The part of the figure each guided step of section 3 points at, in order. */
const STEPS = ['chain', 'link', 'edit', 'repair'] as const;
type Spot = (typeof STEPS)[number];

/** Pause between blocks while the chain is published again, so the repair can be seen to travel. */
const STEP_MS = 280;

/**
 * Fig. 3.1. The paper's timestamp server with real SHA-256: four blocks of
 * items, each hashed together with the hash of the block before. Editing an
 * old block shows; publishing everything again hides it, for the price of a
 * few hashes. That missing price is what section 4 adds.
 */
export default function TimestampChain() {
  const t = useT();
  const { lang } = useSettings();
  const { step, goTo, active, reducedMotion } = useFigure();

  const samples = COPY.samples[lang];
  const [chain, setChain] = useState<StampBlock[]>(() => buildChain(samples));
  const [touched, setTouched] = useState(false);
  const [repairing, setRepairing] = useState(false);
  // Hashes computed by the last repair; null until there has been one.
  const [spent, setSpent] = useState<number | null>(null);
  // Bumped each time a whole chain breaks, to replay the cascade.
  const [breakTick, setBreakTick] = useState(0);

  const chainRef = useRef(chain);
  chainRef.current = chain;
  // Set when the reader's own action moves the walkthrough: that step then keeps the state the reader made.
  const byHand = useRef(false);

  const status = chainStatus(chain);
  const plan = repairPlan(chain);
  const cutOff = status.filter((state) => state === 'broken').length;
  const firstCutOff = status.indexOf('broken');
  const publishing = repairing ? plan[0] : undefined;
  const nothingToPublish = plan.length === 0 || repairing;
  const nothingToReset = !touched && !repairing;
  const spot = step === null ? null : STEPS[step];

  // Until the reader edits something, the sample items follow the language.
  useEffect(() => {
    if (!touched) setChain(buildChain(samples));
  }, [samples, touched]);

  /** Moves the walkthrough to the step that is about what the reader has just done. */
  const follow = (to: Spot) => {
    const target = STEPS.indexOf(to);
    if (step === null || step === target) return;
    byHand.current = true;
    goTo(target);
  };

  const restore = () => {
    setRepairing(false);
    setTouched(false);
    setSpent(null);
    setChain(buildChain(samples));
  };

  // Put the chain in the state each guided step talks about.
  useEffect(() => {
    if (step === null) return;
    if (byHand.current) {
      byHand.current = false;
      return;
    }
    const reached = STEPS[step];
    const current = chainRef.current;
    const whole = repairPlan(current).length === 0;
    if ((reached === 'chain' || reached === 'link') && !whole) restore();
    if (reached === 'repair' && whole) {
      // Nothing to repair yet: make the edit the previous step asked for.
      setTouched(true);
      setSpent(null);
      setBreakTick((tick) => tick + 1);
      setChain(editItem(current, 1, 0, `${current[1].items[0]}0`));
    }
    // Deliberately keyed on the step alone: only a change of step should move the figure.
  }, [step]);

  // Publish the blocks again one after another, pausing while the figure is out of sight.
  useEffect(() => {
    if (!repairing || !active) return;
    const [next] = repairPlan(chain);
    if (next === undefined) {
      setRepairing(false);
      return;
    }
    const timer = window.setTimeout(() => {
      // One block published again, one hash spent.
      setSpent((count) => (count ?? 0) + 1);
      setChain(republish(chain, next));
    }, STEP_MS);
    return () => window.clearTimeout(timer);
  }, [repairing, active, chain]);

  const edit = (block: number, item: number, text: string) => {
    if (plan.length === 0) setBreakTick((tick) => tick + 1);
    setTouched(true);
    setSpent(null);
    setChain((blocks) => editItem(blocks, block, item, text));
    if (step !== null && step < STEPS.indexOf('edit')) follow('edit');
  };

  const repair = () => {
    if (nothingToPublish) return;
    follow('repair');
    if (reducedMotion) {
      // No travel: the whole repair lands at once.
      setSpent(repairCost(chain));
      setChain(plan.reduce(republish, chain));
      return;
    }
    if (status[plan[0]] === 'changed') {
      // The edited block goes out first, with the hash it already shows: the first hash of the repair.
      setSpent(1);
      setChain(republish(chain, plan[0]));
    } else {
      setSpent(0);
    }
    setRepairing(true);
  };

  const startOver = () => {
    if (nothingToReset) return;
    restore();
    // With the chain whole there is nothing to publish again: back to the step that edits it.
    if (spot === 'repair') follow('edit');
  };

  const message =
    plan.length > 0
      ? fill(t(cutOff > 0 ? COPY.broken : COPY.changedOnly), { block: plan[0] + 1 })
      : spent !== null
        ? fill(t(COPY.repaired), { count: spent })
        : t(COPY.untouched);

  return (
    <div className="tsc fig-stack">
      <p className="fig-note">{t(COPY.intro)}</p>

      <ChainRow className={cx('tsc-chain', spot === 'chain' && 'fig-pointed')}>
        {chain.map((block, index) => {
          const state = status[index];
          const isPublishing = publishing === index;
          const tileState: BlockState = isPublishing ? 'candidate' : state === 'broken' ? 'invalid' : 'confirmed';
          // Only the first block that is cut off carries a hash that is plainly not the one above it.
          const stale = index > 0 && block.prev !== chain[index - 1].hash;
          return (
            <BlockTile
              // A block being typed in keeps its place in the tree; only blocks that fall out of line are remounted to shake.
              key={state === 'broken' ? `${index}-${breakTick}` : index}
              className={cx(state === 'changed' && 'tsc-changed', state === 'broken' && !isPublishing && 't-cascade')}
              style={{ ['--i' as string]: Math.max(0, index - firstCutOff) }}
              title={`${t(COPY.blockN)} ${index + 1}`}
              status={isPublishing ? t(COPY.status.publishing) : t(COPY.status[state])}
              state={tileState}
            >
              {/* One link of the chain: the hash block 2 carries, and the hash of block 1 it repeats. */}
              <div className={cx('tile-row', spot === 'link' && index === 1 && 'fig-pointed')}>
                <span className="tile-label">prev</span>
                <span className="tile-value">
                  {index === 0 ? (
                    <span className="tsc-dim">{t(COPY.first)}</span>
                  ) : (
                    <HashText hash={block.prev} lead={16} tail={0} zeros={false} />
                  )}
                </span>
                {stale ? <span className="tsc-stale">≠ {t(COPY.stale)}</span> : null}
              </div>

              {/* On a dark tile the shared focus ring turns orange, so a focused item can be seen. */}
              <div className={cx('tsc-items', tileState === 'confirmed' && 'on-ink', spot === 'edit' && index === 1 && 'fig-pointed')}>
                {block.items.map((item, itemIndex) => (
                  <label key={itemIndex}>
                    <span className="visually-hidden">
                      {fill(t(COPY.itemLabel), { block: index + 1, item: itemIndex + 1 })}
                    </span>
                    <input
                      type="text"
                      value={item}
                      maxLength={28}
                      spellCheck={false}
                      disabled={repairing}
                      onChange={(event) => edit(index, itemIndex, event.target.value)}
                    />
                  </label>
                ))}
              </div>

              <div className={cx('tile-row', spot === 'link' && index === 0 && 'fig-pointed')}>
                <span className="tile-label">hash</span>
                <span className="tile-value">
                  <HashText
                    key={block.hash}
                    className={cx('t-swap-soft', state === 'changed' && 'tsc-fresh')}
                    hash={block.hash}
                    lead={16}
                    tail={0}
                    zeros={false}
                  />
                </span>
              </div>
            </BlockTile>
          );
        })}
      </ChainRow>

      <div className={cx('fig-row', spot === 'repair' && 'fig-pointed')}>
        {/* aria-disabled, not disabled: a button that has just been pressed must keep the focus. */}
        <button type="button" className="btn" aria-disabled={nothingToPublish} onClick={repair}>
          {t(COPY.republish)}
        </button>
        <button type="button" className="btn btn-line btn-sm" aria-disabled={nothingToReset} onClick={startOver}>
          {t(COPY.startOver)}
        </button>
        <dl className="tsc-live mono">
          <div>
            <dt>{t(COPY.cutOff)}</dt>
            <dd>{cutOff}</dd>
          </div>
          <div>
            <dt>{t(COPY.repairCost)}</dt>
            <dd>{spent ?? 0}</dd>
          </div>
        </dl>
      </div>

      <p className="fig-status" role="status">
        {publishing !== undefined ? (
          <span className="t-shimmer tsc-shimmer" data-text={fill(t(COPY.publishing), { block: publishing + 1 })}>
            {fill(t(COPY.publishing), { block: publishing + 1 })}
          </span>
        ) : (
          message
        )}
      </p>
    </div>
  );
}
