import { Counter } from '@/components/viz/Counter';
import { useT } from '@/i18n/settings';
import { fill } from '@/text/format';
import { cx } from '@/utils/cx';
import { COPY } from './copy';
import { BANK_FEE, PRICE, balances, ledger } from './trust';
import type { Payment, PaymentAction, Route } from './trust';

interface LaneProps {
  payment: Payment;
  /** The walkthrough is pointing at this route's buttons. */
  pointed: boolean;
  onAction(action: PaymentAction): void;
}

/** One route for the payment: the customer at one end of a wire, the merchant at the other, and whoever stands between. */
function Lane({ payment, pointed, onAction }: LaneProps) {
  const t = useT();
  const viaBank = payment.route === 'bank';
  const held = balances(payment);
  const entries = ledger(payment);
  const title = t(viaBank ? COPY.routeBank : COPY.routeDirect);
  // Nothing left for these buttons to do. They stay focusable (aria-disabled), so a press never drops the focus.
  const paid = payment.status !== 'idle';
  const nothingToDispute = payment.status !== 'paid';

  const status = viaBank
    ? fill(t(COPY.bankStatus[payment.status]), { fee: BANK_FEE })
    : t(payment.status === 'idle' ? COPY.directStatus.idle : payment.refusals > 0 ? COPY.directStatus.refused : COPY.directStatus.paid);

  return (
    <section className="itr-lane fig-group" aria-label={title}>
      <p className="itr-lane-title poster">{title}</p>

      {/* Remounted on a dispute that goes nowhere, so the refusal can be felt. */}
      <div key={payment.refusals} className={cx('itr-track', payment.refusals > 0 && 't-shake')}>
        <div className="itr-party">
          <span className="label">{t(COPY.customer)}</span>
          <Counter value={held.customer} mode="event" className="itr-num" />
        </div>
        {viaBank ? (
          <div className="itr-party itr-bank">
            <span className="label">
              {t(COPY.bank)} · {t(COPY.bankFee)}
            </span>
            <Counter value={held.bank} mode="event" className="itr-num" />
          </div>
        ) : null}
        <div className="itr-party">
          <span className="label">{t(COPY.merchant)}</span>
          <Counter value={held.merchant} mode="event" className="itr-num" />
        </div>
        <i className="itr-token" style={{ ['--at' as string]: payment.status === 'paid' ? 1 : 0 }} aria-hidden="true" />
      </div>

      <p className="itr-goods">
        <span key={String(held.goodsSent)} className={cx('tag', held.goodsSent ? 't-pop' : 'tag-line')}>
          {t(held.goodsSent ? COPY.goodsSent : COPY.goodsKept)}
        </span>
      </p>

      <div className={cx('fig-row', pointed && 'fig-pointed')}>
        <button
          type="button"
          className="btn"
          aria-disabled={paid}
          onClick={() => {
            if (!paid) onAction('pay');
          }}
        >
          {fill(t(COPY.pay), { amount: PRICE })}
        </button>
        <button
          type="button"
          className="btn btn-line"
          aria-disabled={nothingToDispute}
          onClick={() => {
            if (!nothingToDispute) onAction('dispute');
          }}
        >
          {t(COPY.dispute)}
        </button>
      </div>

      <div className="itr-book">
        <p className={cx('label itr-book-title', viaBank && 'itr-book-kept')}>{t(viaBank ? COPY.ledger : COPY.noLedger)}</p>
        {!viaBank ? (
          <p className="fig-note">{t(COPY.noLedgerNote)}</p>
        ) : entries.length === 0 ? (
          <p className="fig-note">{t(COPY.ledgerEmpty)}</p>
        ) : (
          <ol className="itr-entries">
            {entries.map((entry, index) => (
              <li key={entry.kind} className="t-rise" data-kind={entry.kind} data-undone={entry.undone}>
                <span>{index + 1}</span>
                <span>{t(COPY.entry[entry.kind])}</span>
                <span>{entry.amount}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <p className="fig-status itr-status" role="status">
        {status}
      </p>
    </section>
  );
}

export interface BankSceneProps {
  bank: Payment;
  direct: Payment;
  /** The route whose buttons the walkthrough is pointing at. */
  pointed: Route | null;
  onBank(action: PaymentAction): void;
  onDirect(action: PaymentAction): void;
  /** Puts both payments back to the start. */
  onReset(): void;
}

/** The same purchase paid for twice: through a bank's ledger, and hand to hand. */
export function BankScene({ bank, direct, pointed, onBank, onDirect, onReset }: BankSceneProps) {
  const t = useT();
  const untouched = bank.status === 'idle' && direct.status === 'idle';

  return (
    <div className="fig-stack">
      <p className="fig-note">{t(COPY.bankIntro)}</p>

      <Lane payment={bank} pointed={pointed === 'bank'} onAction={onBank} />
      <Lane payment={direct} pointed={pointed === 'direct'} onAction={onDirect} />

      <div className="fig-row">
        <button
          type="button"
          className="btn btn-line btn-sm"
          aria-disabled={untouched}
          onClick={() => {
            if (!untouched) onReset();
          }}
        >
          {t(COPY.startOver)}
        </button>
      </div>

      <p className="fig-note">{t(COPY.bankOutro)}</p>
    </div>
  );
}
