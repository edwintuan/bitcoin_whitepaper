import type { CSSProperties } from 'react';
import { HashText } from '@/components/viz/HashText';
import { useT } from '@/i18n/settings';
import { txid } from '@/lib/tx';
import { formatBtc } from '@/text/format';
import { cx } from '@/utils/cx';
import { COPY } from './copy';
import type { Plan } from './wallet';

const delay = (i: number) => ({ '--i': i }) as CSSProperties;

/**
 * The transaction the wallet would send for the amount typed. The transaction
 * itself is one solid shape: its inputs and outputs are lines of text inside
 * it. Under it the same value is drawn to scale as both, and the fee is what
 * is left between them.
 *
 * @param pointed the part the walkthrough is pointing at: the transaction, or the fee
 */
export function TxPanel({ plan, pointed }: { plan: Plan; pointed: 'tx' | 'fee' | null }) {
  const t = useT();

  if (plan.kind === 'idle') {
    return <p className={cx('fig-note utxo-tx-empty', pointed && 'fig-pointed')}>{t(COPY.placeholder)}</p>;
  }

  if (plan.kind === 'short') {
    return (
      <div className={cx(pointed && 'fig-pointed')}>
        <p className="utxo-short-title label">
          <span className="tag tag-invalid">✕</span>
          {t(COPY.shortTitle)}
        </p>
        <dl className="utxo-short-sums">
          <div>
            <dt className="label">{t(COPY.have)}</dt>
            <dd className="mono">{formatBtc(plan.total)} BTC</dd>
          </div>
          <div>
            <dt className="label">{t(COPY.need)}</dt>
            <dd className="mono">{formatBtc(plan.total + plan.missing)} BTC</dd>
          </div>
          <div data-missing="true">
            <dt className="label">{t(COPY.missing)}</dt>
            <dd className="mono">{formatBtc(plan.missing)} BTC</dd>
          </div>
        </dl>
      </div>
    );
  }

  const { selection, tx } = plan;
  const id = txid(tx);
  const [payment, change] = tx.outputs;
  const outTotal = selection.total - plan.fee;

  return (
    <>
      <div className={cx('utxo-tx', pointed === 'tx' && 'fig-pointed')} role="group" aria-label={t(COPY.txLabel)}>
        <p className="utxo-tx-head">
          <span className="poster">{t(COPY.tx)}</span>
          <span className="mono">
            {t(COPY.txId)} <HashText hash={id} lead={8} tail={4} zeros={false} />
          </span>
        </p>

        {/* Keyed by the transaction, so a new one arrives afresh. */}
        <div className="utxo-sides" key={id}>
          <div className="utxo-side">
            <p className="label utxo-side-head">{t(COPY.inputs)}</p>
            <ul className="utxo-rows mono">
              {selection.inputs.map((coin, i) => (
                <li className="utxo-row" key={`${coin.txid}:${coin.vout}`} style={delay(i)}>
                  <b>{formatBtc(coin.value)}</b>
                  <small>{t(COPY.fromCoin)}</small>
                </li>
              ))}
            </ul>
            <p className="utxo-total mono">
              <span className="label">{t(COPY.totalIn)}</span>
              <b>{formatBtc(selection.total)}</b>
            </p>
          </div>
          <div className="utxo-side">
            <p className="label utxo-side-head">{t(COPY.outputs)}</p>
            <ul className="utxo-rows mono">
              <li className="utxo-row" style={delay(selection.inputs.length + 1)}>
                <b>{formatBtc(payment.value)}</b>
                <small>{t(COPY.toBob)}</small>
              </li>
              {change ? (
                <li className="utxo-row" style={delay(selection.inputs.length + 2)}>
                  <b>{formatBtc(change.value)}</b>
                  <small>{t(COPY.toYou)}</small>
                </li>
              ) : (
                <li className="utxo-row" data-kind="none" style={delay(selection.inputs.length + 2)}>
                  {t(COPY.noChange)}
                </li>
              )}
            </ul>
            <p className="utxo-total mono">
              <span className="label">{t(COPY.totalOut)}</span>
              <b>{formatBtc(outTotal)}</b>
            </p>
          </div>
        </div>
      </div>

      <div className="utxo-bars" key={`bars-${id}`} role="img" aria-label={t(COPY.barsLabel)}>
        <p className="label utxo-bar-cap">{t(COPY.barIn)}</p>
        <div className="utxo-bar" style={delay(0)}>
          {selection.inputs.map((coin) => (
            <span className="utxo-seg" key={`${coin.txid}:${coin.vout}`} style={{ flex: `${Number(coin.value)} 1 0` }}>
              <span>{formatBtc(coin.value)}</span>
            </span>
          ))}
        </div>
        <p className="label utxo-bar-cap">{t(COPY.barOut)}</p>
        <div className="utxo-bar" style={delay(1)}>
          {/* Each word of a label is its own piece: one that does not fit its segment is left out whole. */}
          <span className="utxo-seg" data-kind="payment" style={{ flex: `${Number(payment.value)} 1 0` }}>
            <span>{t(COPY.payment)}</span>
            <span>{formatBtc(payment.value)}</span>
          </span>
          {change ? (
            <span className="utxo-seg" data-kind="change" style={{ flex: `${Number(change.value)} 1 0` }}>
              <span>{t(COPY.change)}</span>
              <span>{formatBtc(change.value)}</span>
            </span>
          ) : null}
          <span className="utxo-seg" data-kind="fee" />
        </div>
      </div>

      {/* The result the figure is about: what the outputs leave unclaimed. */}
      <p className={cx('utxo-fee fig-band mono', pointed === 'fee' && 'fig-pointed')}>
        <span>
          <span className="label">{t(COPY.totalIn)}</span> {formatBtc(selection.total)}
        </span>
        <span aria-hidden="true">−</span>
        <span>
          <span className="label">{t(COPY.totalOut)}</span> {formatBtc(outTotal)}
        </span>
        <span aria-hidden="true">=</span>
        <span>
          <span className="label">{t(COPY.fee)}</span> <b>{formatBtc(plan.fee)} BTC</b>
        </span>
        <span className="label">{t(COPY.feeTo)}</span>
      </p>
    </>
  );
}
