import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Slider } from '@/components/base/slider/slider';
import { useT } from '@/i18n/settings';
import { fill } from '@/text/format';
import { cx } from '@/utils/cx';
import { COPY } from './copy';
import { POWERS, retargetRun, scalePosition, trim } from './retarget';
import type { Point } from './steps';

/**
 * Hash power jumps or drops; the next retargets pull block times back to ten
 * minutes. Uses the real rule, including its limit of a factor of four.
 */
export function RetargetScene({ point }: { point: Point | null }) {
  const t = useT();
  // The slider picks one of the whole doublings in POWERS; it starts on ×2.
  const [notch, setNotch] = useState(POWERS.indexOf(2));
  const power = POWERS[notch];
  const times = trim(power, 3);

  const periods = useMemo(() => retargetRun(power), [power]);
  const first = periods[0];
  const wasClamped = Math.abs(first.factor - power) > 0.01;

  return (
    <div className="pow-retarget fig-stack t-reveal">
      <p className="fig-note">{t(COPY.retargetIntro)}</p>

      <div className={cx('pow-power', point === 'power' && 'fig-pointed')}>
        <p className="label">{t(COPY.power)}</p>
        <Slider thumbLabel={t(COPY.power)} minValue={0} maxValue={POWERS.length - 1} step={1} value={notch} onChange={setNotch} />
        <span className="stat-value">×{times}</span>
      </div>

      <p className="label pow-cap">
        <span>{t(COPY.period)}</span>
        <span>{t(COPY.interval)}</span>
      </p>
      <ol className="pow-periods">
        {periods.map((row) => (
          <li key={row.number}>
            <span className="label">{row.number}</span>
            <span className="pow-scale" aria-hidden="true" style={{ '--at': scalePosition(row.minutes) } as CSSProperties}>
              <i className="pow-scale-bar" />
              <i className="pow-scale-goal" />
              <i className="pow-scale-dot" />
            </span>
            <span className="mono pow-period-value">
              {trim(row.minutes, 2)} {t(COPY.minutes)}
            </span>
          </li>
        ))}
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
            {trim(first.days, 2)} {t(COPY.days)}
          </dd>
        </div>
        <div>
          <dt>{t(COPY.change)}</dt>
          <dd>×{trim(first.factor, 2)}</dd>
        </div>
      </dl>

      <p className="fig-status" role="status">
        {power === 1 ? t(COPY.steady) : fill(wasClamped ? t(COPY.clamped) : t(COPY.settled), { times })}
      </p>
    </div>
  );
}
