import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useFigure } from '@/components/site/FigureFrame';
import { useT } from '@/i18n/settings';
import { attackerSuccessProbability, catchUpProbability, giveUpGap, simulateRace } from '@/lib/attack';
import { mulberry32 } from '@/lib/rng';
import { useWidth } from '@/state/useWidth';
import { fill, formatCount } from '@/text/format';
import { cx } from '@/utils/cx';
import { countNoun, formatChance } from './chart';
import { COPY } from './copy';
import { raceFrame, raceSeed, raceWindow, runRaces } from './race';
import type { Tally } from './race';
import { withVars } from './vars';
import { WalkPlot } from './WalkPlot';

/** Races per animation frame while a thousand are being run. */
const PER_FRAME = 50;
/** Batches of a thousand draw from seeds well away from those of the single races. */
const BATCH_SEEDS = 1_000_000;
/** Room kept at the left of both rows for the words that count the blocks out of view. */
const EARLIER_WIDTH = 104;

interface RaceSceneProps {
  percent: number;
  z: number;
  /** True while the walkthrough is talking about the thousand races. */
  pointed?: boolean;
}

/**
 * The paper's random walk, played out: one race drawn block by block, then a
 * thousand counted. The parent remounts the scene whenever q or z changes, so
 * everything here starts from the starting line.
 */
export function RaceScene({ percent, z, pointed = false }: RaceSceneProps) {
  const t = useT();
  const { active, reducedMotion } = useFigure();
  const q = percent / 100;
  const [ref, width] = useWidth<HTMLDivElement>(520);

  const [raceNo, setRaceNo] = useState(0);
  const race = useMemo(() => simulateRace(q, z, mulberry32(raceSeed(raceNo))), [q, z, raceNo]);
  const quitAt = useMemo(() => giveUpGap(q, z), [q, z]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const [tally, setTally] = useState<Tally>({ races: 0, caughtUp: 0 });
  const [pending, setPending] = useState(0);
  const batchRng = useRef<() => number>(() => 0);
  const batches = useRef(0);

  // One race, a few blocks per tick so that even a long one is over in seconds.
  useEffect(() => {
    if (!playing || !active) return;
    const stride = Math.max(1, Math.ceil(race.steps / 240));
    const interval = Math.max(30, Math.min(260, Math.round(5200 / Math.max(1, race.steps))));
    const timer = window.setInterval(() => setStep((at) => Math.min(race.steps, at + stride)), interval);
    return () => window.clearInterval(timer);
  }, [playing, active, race]);

  useEffect(() => {
    if (playing && step >= race.steps) setPlaying(false);
  }, [playing, step, race.steps]);

  // A thousand races, a slice per frame; all at once when motion is reduced.
  useEffect(() => {
    if (pending <= 0 || !active) return;
    const run = (count: number) => {
      const part = runRaces(q, z, count, batchRng.current);
      setTally((sofar) => ({ races: sofar.races + part.races, caughtUp: sofar.caughtUp + part.caughtUp }));
      setPending((left) => left - count);
    };
    if (reducedMotion) {
      run(pending);
      return;
    }
    const frame = requestAnimationFrame(() => run(Math.min(PER_FRAME, pending)));
    return () => cancelAnimationFrame(frame);
  }, [pending, active, reducedMotion, q, z]);

  const frame = raceFrame(race.path, step);
  const finished = step >= race.steps;
  const started = step > 0;

  const begin = (number: number) => {
    setRaceNo(number);
    if (reducedMotion) {
      // No travel: show how this race ends.
      setStep(simulateRace(q, z, mulberry32(raceSeed(number))).steps);
    } else {
      setStep(0);
      setPlaying(true);
    }
  };
  const onMain = () => {
    if (z === 0) return;
    if (playing) setPlaying(false);
    else if (finished) begin(raceNo + 1);
    else if (reducedMotion) setStep(race.steps);
    else setPlaying(true);
  };
  const mainLabel = playing ? t(COPY.pause) : finished && z > 0 ? t(COPY.again) : started ? t(COPY.resume) : t(COPY.run);

  const canStep = !finished && !playing;
  const runThousand = () => {
    if (pending > 0) return;
    batchRng.current = mulberry32(raceSeed(BATCH_SEEDS + batches.current));
    batches.current += 1;
    setPending(1000);
  };

  // Tiles: as many as fit, with room kept at the left for the count of blocks out of view.
  const pitch = width < 400 ? 8 : 10;
  const capacity = Math.max(8, Math.floor((width - EARLIER_WIDTH) / pitch));
  const view = raceWindow(frame.honest, frame.attacker, capacity);
  const lastWentToAttacker = step > 0 && race.path[step] < race.path[step - 1];

  const blocksOf = (count: number) => countNoun(count, t(COPY.blocksOne), t(COPY.blocksMany));
  const status =
    z === 0
      ? t(COPY.raceLevel)
      : !started
        ? fill(t(COPY.raceReady), { blocks: blocksOf(z) })
        : finished && race.caughtUp
          ? fill(t(COPY.raceCaught), { blocks: blocksOf(step) })
          : finished
            ? fill(t(COPY.raceGaveUp), { blocks: blocksOf(step), gap: frame.gap })
            : fill(t(lastWentToAttacker ? COPY.raceAttacker : COPY.raceHonest), { n: formatCount(step), gap: frame.gap });

  const odds = catchUpProbability(q, z);
  const expected = Math.round(odds * 1000);
  const paperP = attackerSuccessProbability(q, z);
  const tallyCount = fill(t(COPY.tallyOf), { wins: formatCount(tally.caughtUp), races: formatCount(tally.races) });
  // Said once, when a batch has finished: not for every slice of it.
  const tallyDone =
    pending === 0 && tally.races > 0
      ? fill(t(COPY.tallyDone), { label: t(COPY.tallyCaught), share: formatChance(tally.caughtUp / tally.races), count: tallyCount })
      : '';

  const tiles = (count: number, newest: boolean) =>
    Array.from({ length: count }, (_, index) => (
      <i key={view.hidden + index} className={newest && index === count - 1 && started && !reducedMotion ? 't-pop' : undefined} />
    ));

  return (
    <div className="atk-race fig-stack" ref={ref}>
      <p className="fig-note">{t(COPY.raceIntro)}</p>

      <div className="atk-lanes" style={{ ['--pitch' as string]: `${pitch}px` } as CSSProperties}>
        {(['honest', 'attacker'] as const).map((who) => (
          <div className="atk-lane" key={who} data-who={who}>
            <p className="label atk-lane-name">
              <span>{t(COPY[who])}</span>
              <span className="mono">{formatCount(frame[who])}</span>
            </p>
            <div className="atk-tiles" aria-hidden="true">
              {view.hidden > 0 ? <span className="atk-earlier mono">{fill(t(COPY.earlier), { count: formatCount(view.hidden) })}</span> : null}
              {tiles(view[who], who === 'attacker' ? lastWentToAttacker : !lastWentToAttacker)}
            </div>
          </div>
        ))}
      </div>

      <dl className="atk-race-facts">
        <div>
          <dt className="label">{t(COPY.gap)}</dt>
          <dd className="stat-value">{frame.gap}</dd>
        </div>
        <div>
          <dt className="label">{t(COPY.found)}</dt>
          <dd className="mono">{formatCount(step)}</dd>
        </div>
        <div>
          <dt className="label">{t(COPY.seed)}</dt>
          <dd className="mono">{raceSeed(raceNo)}</dd>
        </div>
      </dl>

      {z > 0 && Number.isFinite(quitAt) ? (
        <div className="atk-walk">
          <WalkPlot
            path={race.path}
            upTo={step}
            limit={quitAt}
            width={width}
            height={104}
            level={t(COPY.walkLevel)}
            quit={t(COPY.walkQuit)}
            label={fill(t(COPY.walkAlt), { z, gap: frame.gap, blocks: blocksOf(step) })}
            minSpan={40}
          />
        </div>
      ) : null}

      {/* aria-disabled, not disabled: each of these can switch itself off when pressed and would lose the focus. */}
      <div className="fig-row">
        <button type="button" className={cx('btn', playing && 'btn-dark')} onClick={onMain} aria-disabled={z === 0}>
          {mainLabel}
        </button>
        <button
          type="button"
          className="btn btn-line btn-sm"
          aria-disabled={!canStep}
          onClick={() => {
            if (canStep) setStep(step + 1);
          }}
        >
          {t(COPY.next)}
        </button>
      </div>

      {/* Announced when a race is stepped or has ended, not for every block of one that is playing. */}
      <p className="fig-status" role={playing ? undefined : 'status'}>
        {status}
      </p>

      <div className={cx('atk-tally', pointed && 'fig-pointed')}>
        <div className="fig-row">
          <button type="button" className="btn btn-dark" onClick={runThousand} aria-disabled={pending > 0}>
            {tally.races > 0 ? t(COPY.thousandMore) : t(COPY.thousand)}
          </button>
          {pending > 0 ? (
            <span className="t-shimmer atk-shimmer mono" data-text={t(COPY.running)}>
              {t(COPY.running)}
            </span>
          ) : null}
        </div>

        <dl className="atk-compare">
          <div>
            <dt className="label">{t(COPY.tallyCaught)}</dt>
            <dd>
              <span className="stat-value">{tally.races > 0 ? formatChance(tally.caughtUp / tally.races) : '–'}</span>
              <span className="mono atk-sub">{tally.races > 0 ? tallyCount : t(COPY.tallyNone)}</span>
            </dd>
          </div>
          <div>
            <dt className="label">{withVars(t(COPY.tallyTheory))}</dt>
            <dd>
              <span className="stat-value">{formatChance(odds)}</span>
              <span className="mono atk-sub">{expected >= 1 ? fill(t(COPY.tallyExpected), { n: formatCount(expected) }) : t(COPY.tallyExpectedNone)}</span>
            </dd>
          </div>
          <div className="atk-compare-paper">
            <dt className="label">{withVars(t(COPY.tallyPaper))}</dt>
            <dd>
              <span className="stat-value">{formatChance(paperP)}</span>
            </dd>
          </div>
        </dl>
        <p className="visually-hidden" role="status">
          {tallyDone}
        </p>
        {/* With nothing to catch up, both numbers are 1 and there is no difference to explain. */}
        {z > 0 ? <p className="fig-note">{t(COPY.difference)}</p> : null}
      </div>
    </div>
  );
}
