import { HashText } from '@/components/viz/HashText';
import { useT } from '@/i18n/settings';
import { fill } from '@/text/format';
import { cx } from '@/utils/cx';
import { signatureHolds, transferHash } from './coin';
import type { Transfer } from './coin';
import { COPY } from './copy';
import { TxCard } from './TxCard';
import type { TxField } from './TxCard';

export interface GapSceneProps {
  /** The untouched coin: three transfers. */
  coin: Transfer[];
  /** Owner 2's second transfer of the same coin, once it has been signed. */
  second: Transfer | null;
  /** The walkthrough is pointing at the buttons. */
  pointed: boolean;
  onSign(): void;
  onUndo(): void;
}

/** What signatures cannot rule out: the same owner signing the same coin over to two people. */
export function GapScene({ coin, second, pointed, onSign, onUndo }: GapSceneProps) {
  const t = useT();
  const parent = coin[1];
  const first = coin[2];
  // Both transfers have to be signed by the owner transaction 2 paid.
  const signer = parent.to;

  const card = (transfer: Transfer, title: string, toLabel: string, className?: string) => {
    // Verified as the card is drawn: the scene is about both signatures holding.
    const holds = signatureHolds(transfer, signer);
    const fields: TxField[] = [
      { name: 'to', label: toLabel, value: transfer.to },
      { name: 'prev', label: t(COPY.fieldPrev), value: transfer.prev, note: second ? t(COPY.same) : fill(t(COPY.prevOf), { n: 2 }) },
      { name: 'hash', label: t(COPY.fieldHash), value: transferHash(transfer) },
      { name: 'sig', label: fill(t(COPY.ownerSignature), { n: 2 }), value: transfer.sig },
    ];
    return (
      <TxCard
        title={title}
        className={className}
        tone={holds ? 'plain' : 'invalid'}
        fields={fields}
        used={second ? ['prev'] : []}
        tag={
          <span className={cx('tag', holds ? 'tag-valid' : 'tag-invalid')}>
            {holds ? '✓ ' : '× '}
            {t(holds ? COPY.tag.valid : COPY.tag.signature)}
          </span>
        }
      />
    );
  };

  return (
    <div className="fig-stack">
      <p className="fig-note">{t(COPY.gapIntro)}</p>

      <div className="txs-gap">
        <p className="txs-parent">
          <span className="txs-card-title poster">{fill(t(COPY.transaction), { n: 2 })}</span>
          <span>{t(COPY.parent)}</span>
          <span className="mono">
            {t(COPY.checkHash)} <HashText hash={transferHash(parent)} lead={10} tail={4} zeros={false} />
          </span>
        </p>
        <i className="txs-split" data-twice={second !== null} aria-hidden="true" />
        <div className="txs-rivals">
          {card(first, fill(t(COPY.paysOwner), { n: 3 }), fill(t(COPY.ownerKey), { n: 3 }))}
          {second ? card(second, t(COPY.paysSomeone), t(COPY.someoneKey), 't-rise') : <p className="fig-note txs-not-yet">{t(COPY.notYet)}</p>}
        </div>
      </div>

      {/* aria-disabled, not disabled: the button that was just pressed keeps the focus. */}
      <div className={cx('fig-row', pointed && 'fig-pointed')}>
        <button
          type="button"
          className="btn"
          aria-disabled={second !== null}
          onClick={() => {
            if (!second) onSign();
          }}
        >
          {t(COPY.signAgain)}
        </button>
        <button
          type="button"
          className="btn btn-line btn-sm"
          aria-disabled={second === null}
          onClick={() => {
            if (second) onUndo();
          }}
        >
          {t(COPY.undo)}
        </button>
      </div>

      <p className="fig-status" role="status">
        {t(second ? COPY.gapAfter : COPY.gapBefore)}
      </p>
    </div>
  );
}
