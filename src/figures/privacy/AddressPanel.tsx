import { useEffect, useMemo, useState } from 'react';
import { HashText } from '@/components/viz/HashText';
import { UI } from '@/content/ui';
import { useT } from '@/i18n/settings';
import { bytesToHex } from '@/lib/bytes';
import { addressSteps, generateKeyPair } from '@/lib/keys';
import { cx } from '@/utils/cx';
import { COPY } from './copy';

type RowKey = keyof typeof COPY.rows;
const ORDER: RowKey[] = ['pub', 'sha', 'ripemd', 'address'];

/**
 * One throwaway key followed to its address, a stage at a time: the key,
 * SHA-256 of it, RIPEMD-160 of that, and the encoding people copy. While the
 * walkthrough is on the step about this panel (`pointed`), every stage is
 * shown and the panel carries the walkthrough's pointer.
 */
export function AddressPanel({ pointed }: { pointed: boolean }) {
  const t = useT();
  const [pair, setPair] = useState(generateKeyPair);
  const [shown, setShown] = useState(1);

  useEffect(() => {
    if (pointed) setShown(ORDER.length);
  }, [pointed]);

  const steps = useMemo(() => addressSteps(pair.pub), [pair]);
  const values: Record<RowKey, string> = {
    pub: bytesToHex(pair.pub),
    sha: steps.sha256,
    ripemd: steps.hash160,
    address: steps.p2wpkh,
  };
  const done = shown >= ORDER.length;

  return (
    <section className={cx('prv-address fig-group', pointed && 'fig-pointed')} aria-label={t(COPY.panel)}>
      <p className="label prv-cap">
        <span>{t(COPY.panel)}</span>
        <span className="mono prv-progress">
          {shown} / {ORDER.length}
        </span>
      </p>

      <ol className="prv-steps">
        {ORDER.map((key, index) => {
          const visible = index < shown;
          return (
            <li key={key} data-shown={visible} data-last={key === 'address'}>
              <p className="prv-step-name">
                <b>{t(COPY.rows[key].name)}</b>
                <span>{t(COPY.rows[key].note)}</span>
              </p>
              <p className="mono prv-step-value">
                {visible ? (
                  <span key={values[key]} className="t-swap-soft">
                    {key === 'address' ? values[key] : <HashText hash={values[key]} full zeros={false} />}
                  </span>
                ) : (
                  <span className="prv-dim">{t(COPY.pending)}</span>
                )}
              </p>
            </li>
          );
        })}
      </ol>

      {done ? (
        <p className="prv-legacy">
          <span className="label">{t(COPY.legacy)}</span>
          <span key={steps.p2pkh} className="mono t-swap-soft">
            {steps.p2pkh}
          </span>
        </p>
      ) : null}

      <div className="fig-row">
        {/* aria-disabled, not disabled: the press that shows the last stage would otherwise take the focus away. */}
        <button type="button" className="btn btn-sm" aria-disabled={done} onClick={() => setShown((count) => Math.min(ORDER.length, count + 1))}>
          {t(COPY.nextStep)}
        </button>
        <button type="button" className="btn btn-sm btn-line" onClick={() => setPair(generateKeyPair())}>
          {t(COPY.newKey)}
        </button>
      </div>

      <p className="fig-status" role="status">
        {done ? t(COPY.panelDone) : null}
      </p>
      <p className="fig-note prv-warning">{t(UI.demoKeysWarning)}</p>
    </section>
  );
}
