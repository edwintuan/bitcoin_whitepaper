import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFigure } from '@/components/site/FigureFrame';
import { BlockTile, ChainRow } from '@/components/viz/BlockTile';
import type { BlockState } from '@/components/viz/BlockTile';
import { HashText } from '@/components/viz/HashText';
import { pick, useSettings, useT } from '@/i18n/settings';
import { GENESIS_HASH } from '@/lib/header';
import { useMiner } from '@/state/useMiner';
import { fill, formatCount } from '@/text/format';
import { cx } from '@/utils/cx';
import { COPY } from './copy';
import type { Point } from './steps';
import { TOY_TARGET, TOY_ZERO_BITS, buildChain, chainProblems, describeDamage, editBlock, headerOf } from './toyChain';
import type { ToyBlock } from './toyChain';

/** Slow the repair down so its cost can be watched. */
const REPAIR_RATE = 700;

/** Edit an old block and see what it costs to make the chain whole again. */
export function TamperScene({ point }: { point: Point | null }) {
  const t = useT();
  const { lang } = useSettings();
  const { active, reducedMotion } = useFigure();

  // Until the reader edits something, the chain is the sample text in their language.
  const samples = pick(COPY.samples, lang);
  const pristine = useMemo(() => buildChain(samples), [samples]);
  const [edited, setEdited] = useState<ToyBlock[] | null>(null);
  const chain = edited ?? pristine;

  const [repairing, setRepairing] = useState<number | null>(null);
  const [cost, setCost] = useState(0);
  const [redone, setRedone] = useState(0);

  const { view, start, reset } = useMiner({ active, maxRate: REPAIR_RATE, calm: reducedMotion });
  // The repair runs block after block from a callback, which needs the chain as it is by then.
  const latest = useRef(chain);
  useEffect(() => {
    latest.current = chain;
  }, [chain]);

  const issues = useMemo(() => chainProblems(chain), [chain]);
  const damage = describeDamage(issues);
  const firstBroken = issues.findIndex(Boolean);

  const edit = (index: number, text: string) => {
    if (damage.kind === 'whole') {
      setCost(0);
      setRedone(0);
    }
    setEdited(editBlock(chain, index, text));
  };

  const repairFrom = useCallback(
    (index: number) => {
      const blocks = latest.current;
      if (index >= blocks.length) {
        setRepairing(null);
        return;
      }
      const prev = index === 0 ? GENESIS_HASH : blocks[index - 1].hash;
      setRepairing(index);
      start(headerOf({ data: blocks[index].data, prev, nonce: 0 }, index), TOY_TARGET, (found) => {
        const next = latest.current.map((block, i) =>
          i === index ? { ...block, prev, nonce: found.nonce, hash: found.hash } : block,
        );
        latest.current = next;
        setEdited(next);
        setCost((total) => total + found.tried);
        setRedone((n) => n + 1);
        repairFrom(index + 1);
      });
    },
    [start],
  );

  const startOver = () => {
    reset();
    setRepairing(null);
    setEdited(null);
    setCost(0);
    setRedone(0);
  };

  const canRepair = damage.kind !== 'whole' && repairing === null;
  const canStartOver = edited !== null || repairing !== null;

  const message =
    damage.kind === 'broken'
      ? fill(t(COPY.tamperBroken), { count: damage.count })
      : damage.kind === 'alone'
        ? t(COPY.tamperAlone)
        : damage.kind === 'lucky'
          ? fill(t(COPY.tamperLucky), { odds: formatCount(2 ** TOY_ZERO_BITS) })
          : redone > 0
            ? t(COPY.tamperRepaired)
            : t(COPY.tamperUntouched);

  return (
    <div className="pow-tamper fig-stack t-reveal">
      <p className="fig-note">{t(COPY.tamperIntro)}</p>

      <ChainRow className={cx('pow-chain', point === 'chain' && 'fig-pointed')}>
        {chain.map((block, index) => {
          const mining = repairing === index;
          const issue = issues[index];
          const state: BlockState = mining ? 'candidate' : issue ? 'invalid' : 'confirmed';
          const status = mining
            ? t(COPY.remining)
            : issue === 'hash'
              ? t(COPY.badHash)
              : issue === 'link'
                ? t(COPY.badLink)
                : t(COPY.valid);
          const shownHash = mining && view.hash ? view.hash : block.hash;
          const shownNonce = mining ? view.nonce : block.nonce;
          const prev = mining ? (index === 0 ? GENESIS_HASH : chain[index - 1].hash) : block.prev;
          return (
            // The key never changes: a tile holds the input being typed in, and
            // remounting it would drop the focus. Gaining the class is what
            // starts the cascade, so it replays whenever a whole chain breaks.
            <BlockTile
              key={index}
              className={issue && !mining ? 't-cascade' : undefined}
              style={{ ['--i' as string]: Math.max(0, index - firstBroken) }}
              title={`${t(COPY.blockN)} ${index + 1}`}
              status={status}
              state={state}
              rows={[
                { label: 'prev', value: <HashText hash={prev} lead={8} tail={0} /> },
                { label: 'nonce', value: formatCount(shownNonce) },
                { label: 'hash', value: <HashText hash={shownHash} lead={8} tail={0} /> },
              ]}
            >
              <label className="pow-data">
                {/* Named like the rows above it; the full name is for readers who cannot see where it sits. */}
                <span className="tile-label" aria-hidden="true">
                  data
                </span>
                <span className="visually-hidden">
                  {t(COPY.dataLabel)} {index + 1}
                </span>
                <input
                  type="text"
                  value={block.data}
                  maxLength={40}
                  spellCheck={false}
                  disabled={repairing !== null}
                  onChange={(event) => edit(index, event.target.value)}
                />
              </label>
            </BlockTile>
          );
        })}
      </ChainRow>

      <div className="fig-row">
        {/* aria-disabled, not disabled: both buttons change state when pressed and would lose the focus. */}
        <button
          type="button"
          className="btn"
          aria-disabled={!canRepair}
          onClick={() => {
            if (canRepair) repairFrom(firstBroken);
          }}
        >
          {t(COPY.repair)}
        </button>
        <button
          type="button"
          className="btn btn-line btn-sm"
          aria-disabled={!canStartOver}
          onClick={() => {
            if (canStartOver) startOver();
          }}
        >
          {t(COPY.startOver)}
        </button>
        <dl className="pow-live mono">
          <div>
            <dt>{t(COPY.blocksRedone)}</dt>
            <dd>{redone}</dd>
          </div>
          <div>
            <dt>{t(COPY.repairCost)}</dt>
            <dd>{formatCount(cost + (repairing !== null ? view.tried : 0))}</dd>
          </div>
        </dl>
      </div>

      <p className="fig-status" role="status">
        {repairing !== null ? (
          <span className="t-shimmer pow-shimmer" data-text={`${t(COPY.blockN)} ${repairing + 1}: ${t(COPY.remining)}`}>
            {t(COPY.blockN)} {repairing + 1}: {t(COPY.remining)}
          </span>
        ) : (
          message
        )}
      </p>
    </div>
  );
}
