import { useId } from 'react';
import { Slider } from '@/components/base/slider/slider';
import { Rich } from '@/components/site/Rich';
import { useT } from '@/i18n/settings';
import { blockSubsidy } from '@/lib/subsidy';
import { fill, formatBtc, formatCount } from '@/text/format';
import { COPY } from './copy';
import { HeightBar } from './HeightBar';
import { blocksPerDay, coinsPerDay, outearnsTheRest, surelyCatchesUp } from './honest';

export interface HonestSceneProps {
  height: number;
  onHeight(height: number): void;
  /** The miner's share of the hash power, in whole per cent. */
  share: number;
  onShare(share: number): void;
}

/** A number of blocks with at most two decimals and no trailing zeros: 73.44, 72, 1.5. */
const blocksText = (value: number): string => value.toFixed(2).replace(/\.?0+$/, '');

/**
 * The paper's argument for honesty, with the one sum the rules allow: what a
 * share of the hash power earns by mining. The attack is set beside it in
 * words only, as the paper has it.
 */
export function HonestScene({ height, onHeight, share, onShare }: HonestSceneProps) {
  const t = useT();
  const rulesId = useId();
  const attackId = useId();
  const subsidy = blockSubsidy(height);
  const mine = coinsPerDay(share, height);
  const others = coinsPerDay(100 - share, height);

  return (
    <div className="inc-honest fig-stack">
      <HeightBar height={height} onHeight={onHeight} />

      <div className="inc-share">
        <Slider
          label={t(COPY.shareLabel)}
          thumbLabel={t(COPY.shareLabel)}
          minValue={1}
          maxValue={99}
          step={1}
          value={share}
          onChange={onShare}
        />
        <span className="stat-value">{share}%</span>
      </div>

      <div className="inc-sides">
        <section className="inc-side" aria-labelledby={rulesId}>
          <h4 id={rulesId} className="poster">
            {t(COPY.rulesTitle)}
          </h4>
          <dl>
            <div>
              <dt className="label">{t(COPY.blocksPerDay)}</dt>
              <dd>
                <span className="stat-value">{blocksText(blocksPerDay(share))}</span>
                <span className="inc-side-note">{fill(t(COPY.blocksNote), { share })}</span>
              </dd>
            </div>
            <div>
              <dt className="label">{t(COPY.coinsPerDay)}</dt>
              <dd>
                <span className="stat-value">{formatBtc(mine)}</span>
                <span className="inc-unit">BTC</span>
                <span className="inc-side-note">
                  {fill(t(COPY.coinsNote), { subsidy: formatBtc(subsidy), height: formatCount(height) })}
                </span>
              </dd>
            </div>
          </dl>
          <div
            className="inc-split"
            role="img"
            aria-label={fill(t(COPY.splitLabel), { mine: formatBtc(mine), others: formatBtc(others) })}
          >
            <i style={{ width: `${share}%` }} />
          </div>
          <p className="inc-split-key mono" aria-hidden="true">
            <span>
              {t(COPY.splitMine)} {formatBtc(mine)}
            </span>
            <span>
              {t(COPY.splitOthers)} {formatBtc(others)}
            </span>
          </p>
          <p className="fig-note" role="status">
            {subsidy === 0n ? t(COPY.noCoins) : outearnsTheRest(share) ? t(COPY.majority) : t(COPY.minority)}
          </p>
        </section>

        <section className="inc-side" aria-labelledby={attackId}>
          <h4 id={attackId} className="poster">
            {t(COPY.attackTitle)}
          </h4>
          <ul className="inc-points">
            <li>
              <Rich text={t(COPY.attackCan)} />
            </li>
            <li>
              <Rich text={t(COPY.attackCannot)} />
            </li>
            <li>
              <Rich text={t(COPY.attackCost)} />
            </li>
            <li>{surelyCatchesUp(share) ? t(COPY.attackOddsMajor) : t(COPY.attackOddsMinor)}</li>
          </ul>
        </section>
      </div>

      <p className="fig-note">{t(COPY.noPrices)}</p>
    </div>
  );
}
