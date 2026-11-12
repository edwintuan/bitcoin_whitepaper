import { useMemo, useState } from 'react';
import { Slider } from '@/components/base/slider/slider';
import { useT } from '@/i18n/settings';
import { TARGET_TIMESPAN, nextTarget } from '@/lib/difficulty';
import { bitsToTarget } from '@/lib/header';
import { COPY } from './copy';

/** The easiest target the network allows, and an arbitrary starting point well below it. */
const LIMIT = bitsToTarget(0x1d00ffff);
const START = bitsToTarget(0x1b0404cb);
const PERIODS = 4;

const ratio = (a: bigint, b: bigint) => Number((a * 1_000_000n) / b) / 1_000_000;
const fixed = (value: number, digits: number) => value.toFixed(digits).replace(/\.?0+$/, '');

/** Where a block time sits on a scale of three doublings either side of ten minutes. */
const position = (minutes: number) => 50 + Math.max(-3, Math.min(3, Math.log2(minutes / 10))) * (50 / 3);

/**
 * Hash power jumps or drops; the next retargets pull block times back to ten
 * minutes. Uses the real rule, including its limit of a factor of four.
 */
export function RetargetScene() {
  const t = useT();
  // The slider moves in half-doublings: -6 … 6 → ×0.125 … ×8.
  const [notch, setNotch] = useState(2);
  const power = 2 ** (notch / 2);

  const periods = useMemo(() => {
    const rows: { number: number; minutes: number; days: number; factor: number }[] = [];
    let target = START;
    for (let k = 0; k < PERIODS; k++) {
      const difficulty = ratio(START, target);
      const actual = Math.round((TARGET_TIMESPAN * difficulty) / power);
      const next = nextTarget(target, actual, LIMIT);
      rows.push({
        number: k + 1,
        minutes: (10 * difficulty) / power,
        days: (14 * difficulty) / power,
        factor: ratio(target, next),
      });
      target = next;
    }
    return rows;
  }, [power]);

  const first = periods[0];
  const wasClamped = Math.abs(first.factor - power) > 0.01;

  return (
    <div className="pow-retarget fig-stack">
      <p className="fig-note">{t(COPY.retargetIntro)}</p>

      <div className="pow-power">
        <Slider
          label={t(COPY.power)}
          thumbLabel={t(COPY.power)}
          minValue={-6}
          maxValue={6}
          step={1}
          value={notch}
          onChange={setNotch}
        />
        <span className="stat-value">×{fixed(power, 2)}</span>
      </div>

      <ol className="pow-periods">
        {periods.map((row) => {
          const at = position(row.minutes);
          return (
            <li key={row.number}>
              <span className="label">
                {t(COPY.period)} {row.number}
              </span>
              <span className="pow-scale" aria-hidden="true">
                <i className="pow-scale-goal" />
                <i
                  className="pow-scale-bar"
                  style={{ left: `${Math.min(at, 50)}%`, width: `${Math.abs(at - 50)}%` }}
                  data-side={at < 50 ? 'fast' : 'slow'}
                />
                <i className="pow-scale-dot" style={{ left: `${at}%` }} />
              </span>
              <span className="mono pow-period-value">
                {fixed(row.minutes, 1)} {t(COPY.minutes)}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="pow-scale-legend label" aria-hidden="true">
        <span>← {t(COPY.tooFast)}</span>
        <span>{t(COPY.goal)}</span>
        <span>{t(COPY.tooSlow)} →</span>
      </p>

      <dl className="pow-live mono">
        <div>
          <dt>{t(COPY.took)}</dt>
          <dd>
            {fixed(first.days, 1)} {t(COPY.days)}
          </dd>
        </div>
        <div>
          <dt>{t(COPY.change)}</dt>
          <dd>×{fixed(first.factor, 2)}</dd>
        </div>
      </dl>

      <p className="fig-status" role="status">
        {notch === 0 ? t(COPY.steady) : wasClamped ? t(COPY.clamped) : t(COPY.settled)}
      </p>
    </div>
  );
}
