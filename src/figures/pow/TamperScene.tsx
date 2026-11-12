import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFigure } from '@/components/site/FigureFrame';
import { BlockTile, ChainRow } from '@/components/viz/BlockTile';
import type { BlockState } from '@/components/viz/BlockTile';
import { HashText } from '@/components/viz/HashText';
import { useSettings, useT } from '@/i18n/settings';
import { GENESIS_HASH } from '@/lib/header';
import { COPY, fill } from './copy';
import { TOY_TARGET, buildChain, chainProblems, editBlock, headerOf } from './toyChain';
import type { ToyBlock } from './toyChain';
import { useMiner } from './useMiner';

/** Slow the repair down so its cost can be watched. */
const REPAIR_RATE = 700;

const count = new Intl.NumberFormat('en-US');

/** Edit an old block and see what it costs to make the chain whole again. */
export function TamperScene() {
  const t = useT();
  const { lang } = useSettings();
  const { active, reducedMotion } = useFigure();

  const samples = COPY.samples[lang];
  const [chain, setChain] = useState<ToyBlock[]>(() => buildChain(samples));
  const [touched, setTouched] = useState(false);
  const [repairing, setRepairing] = useState<number | null>(null);
  const [cost, setCost] = useState(0);
  const [redone, setRedone] = useState(0);
  // Bumped when an edit first breaks the chain, to replay the cascade.
  const [breakTick, setBreakTick] = useState(0);

  const { view, start, reset } = useMiner({ active, maxRate: REPAIR_RATE, calm: reducedMotion });
  const chainRef = useRef(chain);
  chainRef.current = chain;

  // Until the reader edits something, the sample text follows the language.
  useEffect(() => {
    if (!touched) setChain(buildChain(samples));
  }, [samples, touched]);

  const issues = useMemo(() => chainProblems(chain), [chain]);
  const broken = issues.filter(Boolean).length;
  const firstBroken = issues.findIndex(Boolean);

  const edit = (index: number, text: string) => {
    const wasWhole = broken === 0;
    setTouched(true);
    setChain((blocks) => editBlock(blocks, index, text));
    if (wasWhole) {
      setCost(0);
      setRedone(0);
      setBreakTick((tick) => tick + 1);
    }
  };

  const repairFrom = useCallback(
    (index: number) => {
      const blocks = chainRef.current;
      if (index >= blocks.length) {
        setRepairing(null);
        return;
      }
      const prev = index === 0 ? GENESIS_HASH : blocks[index - 1].hash;
      setRepairing(index);
      start(headerOf({ data: blocks[index].data, prev, nonce: 0 }, index), TOY_TARGET, (found) => {
        const next = chainRef.current.map((block, i) =>
          i === index ? { ...block, prev, nonce: found.nonce, hash: found.hash } : block,
        );
        chainRef.current = next;
        setChain(next);
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
    setTouched(false);
    setCost(0);
    setRedone(0);
    setChain(buildChain(samples));
  };

  const message =
    repairing !== null
      ? null
      : broken > 0
        ? fill(t(COPY.tamperBroken), { count: broken })
        : redone > 0
          ? t(COPY.tamperRepaired)
          : t(COPY.tamperUntouched);

  return (
    <div className="pow-tamper fig-stack">
      <p className="fig-note">{t(COPY.tamperIntro)}</p>

      <ChainRow className="pow-chain">
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
            <BlockTile
              key={`${index}-${issue ? breakTick : 'ok'}`}
              className={issue && !mining ? 't-cascade' : undefined}
              style={{ ['--i' as string]: Math.max(0, index - firstBroken) }}
              title={`${t(COPY.blockN)} ${index + 1}`}
              status={status}
              state={state}
              rows={[
                { label: 'prev', value: <HashText hash={prev} lead={8} tail={0} /> },
                { label: 'nonce', value: count.format(shownNonce) },
                { label: 'hash', value: <HashText hash={shownHash} lead={8} tail={0} /> },
              ]}
            >
              <label className="pow-data">
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
        <button type="button" className="btn" onClick={() => repairFrom(firstBroken)} disabled={broken === 0 || repairing !== null}>
          {t(COPY.repair)}
        </button>
        <button type="button" className="btn btn-line btn-sm" onClick={startOver} disabled={!touched && repairing === null}>
          {t(COPY.startOver)}
        </button>
        <dl className="pow-live mono">
          <div>
            <dt>{t(COPY.blocksRedone)}</dt>
            <dd>{redone}</dd>
          </div>
          <div>
            <dt>{t(COPY.repairCost)}</dt>
            <dd>{count.format(cost + (repairing !== null ? view.tried : 0))}</dd>
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
