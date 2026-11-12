import { useMemo, useState } from 'react';
import { Slider } from '@/components/base/slider/slider';
import { HexView } from '@/components/viz/HexView';
import type { HexSegment } from '@/components/viz/HexView';
import { useSettings, useT } from '@/i18n/settings';
import { serializeHeader } from '@/lib/header';
import { formatCount } from '@/text/format';
import { cx } from '@/utils/cx';
import { COPY } from './copy';
import { HEADER_BYTES, blockHeader, blockTxids, megabytes, yearlyHeaderBytes } from './model';
import { storageStatus } from './sentences';

type FieldKey = keyof typeof COPY.fields;

const SEGMENTS: (HexSegment & { name: FieldKey })[] = [
  { name: 'version', start: 0, end: 4 },
  { name: 'prevHash', start: 4, end: 36 },
  { name: 'merkleRoot', start: 36, end: 68 },
  { name: 'time', start: 68, end: 72 },
  { name: 'bits', start: 72, end: 76 },
  { name: 'nonce', start: 76, end: 80 },
];

/** 6 → "6", 8.5714… → "8.57". */
const tidy = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(2));

/**
 * What can never be pruned: the 80 bytes of a block header, shown byte for
 * byte, and the paper's arithmetic for a year of them at any block interval.
 */
export function StorageScene({ visible, highlight }: { visible: boolean; highlight: 'interval' | null }) {
  const t = useT();
  const { lang } = useSettings();
  const [minutes, setMinutes] = useState(10);
  const [field, setField] = useState<string | null>(null);

  // The header of the four-transaction block the tree scene opens with.
  const bytes = useMemo(() => serializeHeader(blockHeader(blockTxids(4)).header), []);
  const focused = SEGMENTS.find((segment) => segment.name === field);
  // Each field is announced by its name in the reader's language.
  const segments = useMemo(() => SEGMENTS.map((segment) => ({ ...segment, label: t(COPY.fields[segment.name]) })), [t]);

  const perHour = 60 / minutes;
  const yearly = yearlyHeaderBytes(minutes);

  return (
    <div className="fig-stack" hidden={!visible}>
      <p className="fig-note">{t(COPY.storageIntro)}</p>

      <div>
        <p className="label mkl-cap">{t(COPY.oneHeader)}</p>
        <HexView bytes={bytes} segments={segments} unit={t(COPY.bytes)} active={field} onActive={setField} />
        <p className="fig-note mkl-field-note" aria-live="polite">
          {focused ? (
            <>
              <b>{t(COPY.fields[focused.name])}</b> · {focused.end - focused.start} {t(COPY.bytes)}
            </>
          ) : (
            t(COPY.fieldHint)
          )}
        </p>
      </div>

      <div className={cx('mkl-interval', highlight === 'interval' && 'fig-pointed')}>
        {/* The words above the slider are its name too: given once, so they are read out once. */}
        <p className="label mkl-interval-cap">{t(COPY.interval)}</p>
        <Slider
          thumbLabel={t(COPY.interval)}
          minValue={1}
          maxValue={30}
          step={1}
          value={minutes}
          onChange={setMinutes}
        />
        <span className="stat-value">
          {minutes} <span className="label">{t(COPY.minutes)}</span>
        </span>
      </div>

      {/* The sum under one heavy line; what follows from it after a hairline. */}
      <dl className="mkl-sum fig-group">
        <div className="mkl-term">
          <dt className="label">{t(COPY.factorBytes)}</dt>
          <dd>{HEADER_BYTES}</dd>
        </div>
        <div className="mkl-term" data-op="×">
          <dt className="label">{t(COPY.factorHour)}</dt>
          <dd>{tidy(perHour)}</dd>
        </div>
        <div className="mkl-term" data-op="×">
          <dt className="label">{t(COPY.factorDay)}</dt>
          <dd>24</dd>
        </div>
        <div className="mkl-term" data-op="×">
          <dt className="label">{t(COPY.factorYear)}</dt>
          <dd>365</dd>
        </div>
        <div className="mkl-term" data-op="=" data-result="true">
          <dt className="label">{t(COPY.perYear)}</dt>
          <dd>{megabytes(yearly)}</dd>
        </div>
      </dl>

      <dl className="mkl-stats mono fig-group">
        <div>
          <dt>{t(COPY.headersYear)}</dt>
          <dd>{formatCount(Math.round(perHour * 24 * 365))}</dd>
        </div>
        <div>
          <dt>{t(COPY.bytesYear)}</dt>
          <dd>{formatCount(Math.round(yearly))}</dd>
        </div>
        <div>
          <dt>{t(COPY.tenYears)}</dt>
          <dd>
            {megabytes(yearly * 10)} {t(COPY.megabytes)}
          </dd>
        </div>
      </dl>

      <p className="fig-status" role="status">
        {storageStatus(lang, minutes)}
      </p>
    </div>
  );
}
