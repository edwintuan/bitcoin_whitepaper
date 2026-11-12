import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Slider } from '@/components/base/slider/slider';
import { useFigure } from '@/components/site/FigureFrame';
import { HashText } from '@/components/viz/HashText';
import { useSettings, useT } from '@/i18n/settings';
import { cx } from '@/utils/cx';
import { leadingZeroBits, targetToHex } from '@/lib/header';
import { useMiner } from '@/state/useMiner';
import { fill, formatCount } from '@/text/format';
import { BLOCK_1, HEADER_FIELDS, expectedTries, toyTarget } from './blocks';
import type { HeaderField } from './blocks';
import { COPY } from './copy';
import type { Point } from './steps';
import { waitFor } from './wait';
import { hexPrefix } from './zeros';

const hex32 = (value: number) => `0x${value.toString(16).padStart(8, '0')}`;
const utc = (seconds: number) => `${new Date(seconds * 1000).toISOString().replace('T', ' ').slice(0, 19)} UTC`;

/** One real block header, a difficulty the reader chooses, and a miner that runs in the page. */
export function MineScene({ point }: { point: Point | null }) {
  const t = useT();
  const { lang } = useSettings();
  const { active, reducedMotion } = useFigure();

  const [zeroBits, setZeroBits] = useState(12);
  // Each new run moves the block's time forward a second, giving a fresh header to search.
  const [runs, setRuns] = useState(0);
  const [focus, setFocus] = useState<HeaderField | null>(null);
  // The last speed this machine was timed at: enough to say how long a harder block would take.
  const [speed, setSpeed] = useState(0);

  const { bits, target } = useMemo(() => toyTarget(zeroBits), [zeroBits]);
  const { view, start, stop, reset } = useMiner({ active, calm: reducedMotion });

  const time = BLOCK_1.time + runs;
  const expected = expectedTries(zeroBits);
  const zeros = view.hash ? leadingZeroBits(view.hash) : 0;
  const prefix = hexPrefix(zeroBits);
  const wait = waitFor(expected, view.rate > 0 ? view.rate : speed);

  const mine = () => {
    const nextRuns = view.status === 'found' ? runs + 1 : runs;
    setRuns(nextRuns);
    start({ ...BLOCK_1, bits, time: BLOCK_1.time + nextRuns, nonce: 0 }, target, (found) => {
      if (found.rate > 0) setSpeed(found.rate);
    });
  };

  const values: Record<HeaderField, ReactNode> = {
    version: BLOCK_1.version,
    prevHash: <HashText hash={BLOCK_1.prevHash} lead={12} tail={6} />,
    merkleRoot: <HashText hash={BLOCK_1.merkleRoot} lead={12} tail={6} zeros={false} />,
    time: (
      <>
        {utc(time)} <span className="pow-dim">{time}</span>
      </>
    ),
    bits: hex32(bits),
    nonce: formatCount(view.nonce),
  };

  // Chinese sentences end in a full-width stop and take no space after it.
  const sentences = (parts: string[]) => parts.join(lang === 'en' ? ' ' : '');

  return (
    <div className="pow-mine fig-stack t-reveal">
      <div className={cx(point === 'header' && 'fig-pointed')}>
        <p className="label pow-cap">
          <span>{t(COPY.headerCaption)}</span>
          <span aria-hidden="true">{t(COPY.bytes)}</span>
        </p>
        <ul className="pow-fields">
          {HEADER_FIELDS.map(({ key, bytes }) => (
            <li
              key={key}
              className={cx('pow-field', key === 'nonce' && 'on-ink')}
              data-key={key}
              data-focus={focus === key}
              tabIndex={0}
              onMouseEnter={() => setFocus(key)}
              onMouseLeave={() => setFocus(null)}
              onFocus={() => setFocus(key)}
              onBlur={() => setFocus(null)}
            >
              <span className="pow-field-name">{t(COPY.fields[key].name)}</span>{' '}
              <span className="pow-field-value mono">{values[key]}</span>{' '}
              <span className="pow-field-bytes mono">
                {bytes}
                <span className="visually-hidden"> {t(COPY.bytes)}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="fig-note pow-field-note" aria-live="polite">
          {focus ? (
            <>
              <b>{t(COPY.fields[focus].name)}</b> · {HEADER_FIELDS.find((field) => field.key === focus)?.bytes}{' '}
              {t(COPY.bytes)} · {t(COPY.fields[focus].note)}
            </>
          ) : (
            t(COPY.realBlock)
          )}
        </p>
      </div>

      <div className="pow-arrow label" aria-hidden="true">
        <span />
        {t(COPY.doubleSha)}
        <span />
      </div>

      <div className="fig-band pow-result" data-status={view.status}>
        <p className="label pow-cap">
          <span>{t(COPY.blockHash)}</span>
          {view.hash ? (
            <span
              key={view.status === 'found' ? `found-${runs}` : 'live'}
              className={view.status === 'found' ? 'tag tag-orange t-pop' : 'tag tag-line'}
            >
              {fill(t(COPY.zeroTag), { zeros, needed: zeroBits })}
            </span>
          ) : null}
        </p>
        <p className="pow-hash mono">
          {view.hash ? <HashText hash={view.hash} full /> : <span className="pow-dim">{t(COPY.noHashYet)}</span>}
        </p>
      </div>

      <div className={cx(point === 'difficulty' && 'fig-pointed')}>
        <dl className="pow-facts">
          <div>
            <dt className="label">{t(COPY.zeroBits)}</dt>
            <dd className="stat-value">{zeroBits}</dd>
          </div>
          <div>
            <dt className="label">{t(COPY.expected)}</dt>
            <dd className="stat-value">{formatCount(expected)}</dd>
          </div>
          <div className="pow-target">
            <dt className="label">{t(COPY.target)}</dt>
            <dd className="mono">
              <HashText hash={targetToHex(target)} lead={18} tail={0} />
            </dd>
          </div>
        </dl>
        <Slider
          thumbLabel={t(COPY.zeroBits)}
          minValue={4}
          maxValue={24}
          step={1}
          value={zeroBits}
          onChange={(value) => {
            if (view.rate > 0) setSpeed(view.rate);
            reset();
            setZeroBits(value);
          }}
        />
        <p className="fig-note">
          {prefix.max === null
            ? fill(t(COPY.hexNote), { bits: zeroBits, zeros: prefix.zeros })
            : fill(t(COPY.hexNoteMore), { bits: zeroBits, zeros: prefix.zeros, max: prefix.max })}
        </p>
      </div>

      <div className={cx('pow-run', point === 'mine' && 'fig-pointed')}>
        <div className="fig-row">
          {view.status === 'mining' ? (
            <button
              type="button"
              className="btn btn-dark"
              onClick={() => {
                if (view.rate > 0) setSpeed(view.rate);
                stop();
              }}
            >
              {t(COPY.stop)}
            </button>
          ) : (
            <button type="button" className="btn" onClick={mine}>
              {view.status === 'found' ? t(COPY.mineAgain) : t(COPY.mine)}
            </button>
          )}
          <dl className="pow-live mono">
            <div>
              <dt>{t(COPY.tries)}</dt>
              <dd>{formatCount(view.tried)}</dd>
            </div>
            <div>
              <dt>{t(COPY.rate)}</dt>
              {/* An easy block is found before there is anything to time. */}
              <dd>{view.rate > 0 ? formatCount(Math.round(view.rate)) : '—'}</dd>
            </div>
            {wait ? (
              <div>
                <dt>{t(COPY.wait)}</dt>
                <dd>
                  {wait.under
                    ? fill(t(COPY.under), { wait: `${wait.value} ${t(COPY[wait.unit])}` })
                    : `${wait.value} ${t(COPY[wait.unit])}`}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <p className="fig-status" role="status">
          {view.status === 'idle' ? t(COPY.idle) : null}
          {view.status === 'mining' ? (
            <span className="t-shimmer pow-shimmer" data-text={t(COPY.mining)}>
              {t(COPY.mining)}
            </span>
          ) : null}
          {view.status === 'found' ? (
            <>
              <b>{t(COPY.found)}</b>
              {lang === 'en' ? ' ' : ''}
              {sentences([
                fill(t(COPY.foundTries), { tried: formatCount(view.tried), expected: formatCount(expected) }),
                view.tried <= expected ? t(COPY.lucky) : t(COPY.unlucky),
                t(COPY.foundCheck),
              ])}
              {lang === 'en' ? ' ' : ''}
              <span className="pow-dim">{t(COPY.againNote)}</span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
