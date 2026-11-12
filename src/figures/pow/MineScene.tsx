import { useMemo, useState } from 'react';
import { Slider } from '@/components/base/slider/slider';
import { useFigure } from '@/components/site/FigureFrame';
import { HashText } from '@/components/viz/HashText';
import { useT } from '@/i18n/settings';
import { leadingZeroBits, targetToHex } from '@/lib/header';
import { BLOCK_1, expectedTries, toyTarget } from './blocks';
import { fill, formatCount } from '@/text/format';
import { COPY } from './copy';
import { useMiner } from '@/state/useMiner';

type FieldKey = keyof typeof COPY.fields;

const FIELDS: { key: FieldKey; bytes: number }[] = [
  { key: 'version', bytes: 4 },
  { key: 'prevHash', bytes: 32 },
  { key: 'merkleRoot', bytes: 32 },
  { key: 'time', bytes: 4 },
  { key: 'bits', bytes: 4 },
  { key: 'nonce', bytes: 4 },
];

const hex32 = (value: number) => `0x${value.toString(16).padStart(8, '0')}`;
const utc = (seconds: number) => `${new Date(seconds * 1000).toISOString().replace('T', ' ').slice(0, 19)} UTC`;

export type MineHighlight = 'header' | 'difficulty' | 'mine' | null;

/** One real block header, a difficulty the reader chooses, and a miner that runs in the page. */
export function MineScene({ highlight }: { highlight: MineHighlight }) {
  const t = useT();
  const { active, reducedMotion } = useFigure();

  const [zeroBits, setZeroBits] = useState(12);
  // Each new run moves the block's time forward a second, giving a fresh header to search.
  const [runs, setRuns] = useState(0);
  const [focus, setFocus] = useState<FieldKey | null>(null);

  const { bits, target } = useMemo(() => toyTarget(zeroBits), [zeroBits]);
  const { view, start, stop, reset } = useMiner({ active, calm: reducedMotion });

  const time = BLOCK_1.time + runs;
  const expected = expectedTries(zeroBits);
  const zeros = view.hash ? leadingZeroBits(view.hash) : 0;

  const mine = () => {
    const nextRuns = view.status === 'found' ? runs + 1 : runs;
    setRuns(nextRuns);
    start({ ...BLOCK_1, bits, time: BLOCK_1.time + nextRuns, nonce: 0 }, target);
  };

  const values: Record<FieldKey, React.ReactNode> = {
    version: '1',
    prevHash: <HashText hash={BLOCK_1.prevHash} lead={12} tail={6} />,
    merkleRoot: <HashText hash={BLOCK_1.merkleRoot} lead={12} tail={6} zeros={false} />,
    time: (
      <>
        {time} <span className="pow-dim">{utc(time)}</span>
      </>
    ),
    bits: hex32(bits),
    nonce: formatCount(view.nonce),
  };

  return (
    <div className="pow-mine fig-stack" data-hl={highlight ?? undefined}>
      <div className="pow-header" data-region="header">
        <p className="label pow-cap">{t(COPY.headerCaption)}</p>
        <ul className="pow-fields">
          {FIELDS.map(({ key, bytes }) => (
            <li
              key={key}
              className="pow-field"
              data-key={key}
              data-live={key === 'nonce' && view.status === 'mining'}
              data-focus={focus === key}
              tabIndex={0}
              onMouseEnter={() => setFocus(key)}
              onMouseLeave={() => setFocus(null)}
              onFocus={() => setFocus(key)}
              onBlur={() => setFocus(null)}
            >
              <span className="pow-field-name">{t(COPY.fields[key].name)}</span>
              <span className="pow-field-value mono">{values[key]}</span>
              <span className="pow-field-bytes mono">{bytes}</span>
            </li>
          ))}
        </ul>
        <p className="fig-note pow-field-note" aria-live="polite">
          {focus ? t(COPY.fields[focus].note) : t(COPY.realBlock)}
        </p>
      </div>

      <div className="pow-arrow label" aria-hidden="true">
        <span />
        {t(COPY.doubleSha)}
        <span />
      </div>

      <div className="pow-result" data-status={view.status}>
        <p className="label pow-cap">
          <span>{t(COPY.blockHash)}</span>
          {view.hash ? (
            <span className={`tag ${view.status === 'found' ? 'tag-orange' : 'tag-line'}`}>
              {zeros} / {zeroBits} {t(COPY.zeroBitsShort)}
            </span>
          ) : null}
        </p>
        <p className={`pow-hash mono ${view.status === 'found' ? 't-slam' : ''}`} key={view.status === 'found' ? `found-${runs}` : 'live'}>
          {view.hash ? <HashText hash={view.hash} full /> : <span className="pow-dim">{t(COPY.noHashYet)}</span>}
        </p>
      </div>

      <div className="pow-controls" data-region="difficulty">
        <div className="pow-slider">
          <Slider
            label={t(COPY.zeroBits)}
            thumbLabel={t(COPY.zeroBits)}
            minValue={4}
            maxValue={24}
            step={1}
            value={zeroBits}
            onChange={(value) => {
              reset();
              setZeroBits(value);
            }}
          />
        </div>
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
      </div>

      <div className="fig-row" data-region="mine">
        {view.status === 'mining' ? (
          <button type="button" className="btn btn-dark" onClick={stop}>
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
            <dd>{view.rate > 0 ? formatCount(Math.round(view.rate)) : '0'}</dd>
          </div>
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
            <b>{t(COPY.found)}</b>{' '}
            {fill(t(COPY.foundDetail), { tried: formatCount(view.tried), expected: formatCount(expected) })}{' '}
            {view.tried <= expected ? t(COPY.lucky) : t(COPY.unlucky)} <span className="pow-dim">{t(COPY.againNote)}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}
