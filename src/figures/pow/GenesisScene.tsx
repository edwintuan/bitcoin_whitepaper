import { useMemo, useState } from 'react';
import { HashText } from '@/components/viz/HashText';
import { HexView } from '@/components/viz/HexView';
import { useT } from '@/i18n/settings';
import { GENESIS_HASH, GENESIS_HEADER, headerHash, leadingZeroBits, serializeHeader } from '@/lib/header';
import { fill, formatCount } from '@/text/format';
import { cx } from '@/utils/cx';
import { HEADER_SEGMENTS } from './blocks';
import { COPY } from './copy';
import type { Point } from './steps';

/** The real genesis header, hashed in the reader's browser and compared with the hash every node knows. */
export function GenesisScene({ point }: { point: Point | null }) {
  const t = useT();
  const [bumped, setBumped] = useState(false);
  // How many times "Hash it" was pressed: each press replays the comparison.
  const [hashed, setHashed] = useState(0);
  const [active, setActive] = useState<string | null>(null);

  const header = useMemo(
    () => (bumped ? { ...GENESIS_HEADER, nonce: GENESIS_HEADER.nonce + 1 } : GENESIS_HEADER),
    [bumped],
  );
  const bytes = useMemo(() => serializeHeader(header), [header]);
  const hash = useMemo(() => headerHash(header), [header]);
  const matches = hash === GENESIS_HASH;
  const focused = HEADER_SEGMENTS.find((segment) => segment.name === active);
  const segments = useMemo(
    () => HEADER_SEGMENTS.map((segment) => ({ ...segment, label: t(COPY.fields[segment.name].name) })),
    [t],
  );

  return (
    <div className="pow-genesis fig-stack t-reveal">
      <p className="fig-note">{t(COPY.genesisIntro)}</p>

      <p className="label pow-cap">{t(COPY.serialized)}</p>
      <HexView bytes={bytes} segments={segments} unit={t(COPY.bytes)} active={active} onActive={setActive} />
      <p className="fig-note pow-field-note" aria-live="polite">
        {focused ? (
          <>
            <b>{t(COPY.fields[focused.name].name)}</b> · {focused.end - focused.start} {t(COPY.bytes)} ·{' '}
            {t(COPY.fields[focused.name].note)}
          </>
        ) : (
          t(COPY.fieldHint)
        )}
      </p>

      <div className={cx('fig-row', point === 'hash' && 'fig-pointed')}>
        <button type="button" className="btn" onClick={() => setHashed((times) => times + 1)}>
          {hashed > 0 ? t(COPY.hashAgain) : t(COPY.hashIt)}
        </button>
        <button type="button" className="btn btn-line btn-sm" onClick={() => setBumped((value) => !value)}>
          {bumped ? t(COPY.restore) : t(COPY.bumpNonce)}
        </button>
        <dl className="pow-live mono">
          <div>
            <dt>{t(COPY.nonceNow)}</dt>
            <dd>{formatCount(header.nonce)}</dd>
          </div>
        </dl>
      </div>

      <dl className="pow-compare">
        <div>
          <dt className="label">{t(COPY.known)}</dt>
          <dd className="mono">
            <HashText hash={GENESIS_HASH} full />
          </dd>
        </div>
        <div>
          <dt className="label">
            {t(COPY.computed)}
            {hashed > 0 ? (
              <span className={`tag ${matches ? 'tag-valid' : 'tag-invalid'}`}>{matches ? '=' : '≠'}</span>
            ) : null}
          </dt>
          <dd className="mono">
            {hashed > 0 ? (
              <span key={`${hash}-${hashed}`} className={cx('pow-computed', matches ? 't-pop' : 't-shake')}>
                <HashText hash={hash} full />
              </span>
            ) : (
              <span className="pow-dim">…</span>
            )}
          </dd>
        </div>
      </dl>

      <p className="fig-status" role="status">
        {hashed === 0
          ? t(COPY.genesisPending)
          : matches
            ? fill(t(COPY.genesisMatch), { zeros: leadingZeroBits(hash) })
            : t(COPY.genesisBroken)}
      </p>
    </div>
  );
}
