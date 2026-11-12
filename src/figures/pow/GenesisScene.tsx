import { useMemo, useState } from 'react';
import { HashText } from '@/components/viz/HashText';
import { HexView } from '@/components/viz/HexView';
import type { HexSegment } from '@/components/viz/HexView';
import { useT } from '@/i18n/settings';
import { GENESIS_HASH, GENESIS_HEADER, headerHash, leadingZeroBits, serializeHeader } from '@/lib/header';
import { fill, formatCount } from '@/text/format';
import { COPY } from './copy';

type FieldKey = keyof typeof COPY.fields;

const SEGMENTS: (HexSegment & { name: FieldKey })[] = [
  { name: 'version', start: 0, end: 4 },
  { name: 'prevHash', start: 4, end: 36 },
  { name: 'merkleRoot', start: 36, end: 68 },
  { name: 'time', start: 68, end: 72 },
  { name: 'bits', start: 72, end: 76 },
  { name: 'nonce', start: 76, end: 80 },
];

/** The real genesis header, hashed in the reader's browser and compared with the hash every node knows. */
export function GenesisScene() {
  const t = useT();
  const [bumped, setBumped] = useState(false);
  const [hashed, setHashed] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  const header = useMemo(
    () => (bumped ? { ...GENESIS_HEADER, nonce: GENESIS_HEADER.nonce + 1 } : GENESIS_HEADER),
    [bumped],
  );
  const bytes = useMemo(() => serializeHeader(header), [header]);
  const hash = useMemo(() => headerHash(header), [header]);
  const matches = hash === GENESIS_HASH;
  const zeros = leadingZeroBits(hash);
  const focused = SEGMENTS.find((segment) => segment.name === active);
  const segments = useMemo(() => SEGMENTS.map((segment) => ({ ...segment, label: t(COPY.fields[segment.name].name) })), [t]);

  return (
    <div className="pow-genesis fig-stack">
      <p className="fig-note">{t(COPY.genesisIntro)}</p>

      <div>
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
      </div>

      <div className="fig-row">
        <button type="button" className="btn" onClick={() => setHashed(true)}>
          {t(COPY.hashIt)}
        </button>
        <button type="button" className="btn btn-line btn-sm" onClick={() => setBumped((value) => !value)}>
          {bumped ? t(COPY.restore) : t(COPY.bumpNonce)}
        </button>
        <span className="mono pow-dim">nonce = {formatCount(header.nonce)}</span>
      </div>

      <dl className="pow-compare">
        <div>
          <dt className="label">{t(COPY.known)}</dt>
          <dd className="mono">
            <HashText hash={GENESIS_HASH} full />
          </dd>
        </div>
        <div data-ok={hashed ? matches : undefined}>
          <dt className="label">
            {t(COPY.computed)}
            {hashed ? (
              <span className={`tag ${matches ? 'tag-valid' : 'tag-invalid'}`}>{matches ? '=' : '≠'}</span>
            ) : null}
          </dt>
          <dd className="mono">
            {hashed ? (
              <span key={hash} className={matches ? 't-pop' : 't-shake'} style={{ display: 'inline-block' }}>
                <HashText hash={hash} full />
              </span>
            ) : (
              <span className="pow-dim">…</span>
            )}
          </dd>
        </div>
      </dl>

      <p className="fig-status" role="status">
        {!hashed
          ? t(COPY.genesisPending)
          : matches
            ? fill(t(COPY.genesisMatch), { zeros })
            : fill(t(COPY.genesisBroken), { zeros })}
      </p>
    </div>
  );
}
