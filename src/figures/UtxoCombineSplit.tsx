import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useFigure } from '@/components/site/FigureFrame';
import { useSettings, useT } from '@/i18n/settings';
import { txid } from '@/lib/tx';
import type { Utxo } from '@/lib/tx';
import { fill, formatBtc } from '@/text/format';
import { cx } from '@/utils/cx';
import { COPY } from './utxo/copy';
import { coinCount, walletStatus } from './utxo/sentences';
import { TxPanel } from './utxo/TxPanel';
import { STEPS, afterWalletAction } from './utxo/walkthrough';
import type { WalletAction } from './utxo/walkthrough';
import {
  BASE_FEE,
  FEE_PER_INPUT,
  PAYEE,
  coinKey,
  coinSide,
  edgeAmounts,
  mine,
  planPayment,
  readAmount,
  send,
  startingCoins,
} from './utxo/wallet';
import './utxo/utxo.css';

/** What the last payment did, for the line that reports it. */
interface Sent {
  spent: number;
  amount: bigint;
  change: bigint;
  /** The change coin, to mark it in the wallet. */
  changeKey: string | null;
}

const sum = (coins: Utxo[]) => coins.reduce((total, coin) => total + coin.value, 0n);

/**
 * Fig. 9.1. A wallet of real unspent outputs. The reader names an amount; the
 * wallet selects coins, builds the payment and its change, and the fee shows
 * up as what the outputs leave unclaimed. Sending replaces the coins spent
 * with the ones created.
 */
export default function UtxoCombineSplit() {
  const t = useT();
  const { lang } = useSettings();
  const { step, goTo } = useFigure();
  const amountId = useId();
  const errorId = useId();

  // Every unspent output the figure knows, Bob's included.
  const [coins, setCoins] = useState<Utxo[]>(startingCoins);
  const [text, setText] = useState('');
  // The coins picked by hand; null while the wallet chooses.
  const [manual, setManual] = useState<ReadonlySet<string> | null>(null);
  const [sent, setSent] = useState<Sent | null>(null);
  const byHand = useRef(false);
  // The line that says who chooses the coins: it takes the focus when the button beside it goes away.
  const chooser = useRef<HTMLSpanElement>(null);
  const focusChooser = useRef(false);

  const wallet = useMemo(() => mine(coins), [coins]);
  const theirs = useMemo(() => coins.filter((coin) => coin.owner === PAYEE), [coins]);
  const typed = readAmount(text);
  const amount = typed.kind === 'amount' ? typed.sats : null;
  const plan = useMemo(() => planPayment(wallet, amount, manual), [wallet, amount, manual]);
  const edges = useMemo(() => edgeAmounts(wallet), [wallet]);
  // Zero so far ("0", "0.") is an amount still being typed, not a mistake.
  const badAmount = typed.kind === 'bad';

  const chosen = manual ?? new Set(plan.kind === 'ready' ? plan.selection.inputs.map(coinKey) : []);
  const chosenCoins = wallet.filter((coin) => chosen.has(coinKey(coin)));

  /* ------------------------------------------------- the guided steps */
  useEffect(() => {
    if (byHand.current) {
      byHand.current = false;
      return;
    }
    if (step === null || !STEPS[step]) return;
    // The last step carries on from whatever is on the table, if it can be sent.
    if (step === 4 && plan.kind === 'ready') return;
    setCoins(startingCoins());
    setText(STEPS[step].amount);
    setManual(null);
    setSent(null);
    // Only a change of step re-stages the figure.
  }, [step]);

  // Sends the walkthrough where walkthrough.ts says, without letting the new step re-stage what the reader just did.
  const follow = (action: WalletAction) => {
    const target = afterWalletAction(step, action);
    if (target === undefined || step === null || target === step) return;
    byHand.current = true;
    goTo(target);
  };

  // "Let the wallet choose" removes itself when pressed. The focus goes to the line that now says who chooses.
  useEffect(() => {
    if (focusChooser.current) chooser.current?.focus();
    focusChooser.current = false;
  }, [manual]);

  /* ------------------------------------------------------ what the reader does */
  const giveAmount = (value: string) => {
    setText(value);
    setSent(null);
    const read = readAmount(value);
    follow({ kind: 'amount', sats: read.kind === 'amount' ? read.sats : null });
  };

  const offer = (value: bigint, special: boolean) => {
    setText(formatBtc(value));
    setManual(null);
    setSent(null);
    follow(special ? { kind: 'special' } : { kind: 'amount', sats: value });
  };

  const toggle = (coin: Utxo) => {
    const next = new Set(chosen);
    const key = coinKey(coin);
    if (!next.delete(key)) next.add(key);
    setManual(next);
    setSent(null);
    follow({ kind: 'coin' });
  };

  const handBack = () => {
    focusChooser.current = true;
    setManual(null);
  };

  const pay = () => {
    // Send stays focusable when there is nothing to send (aria-disabled), so the handler checks for itself.
    if (plan.kind !== 'ready') return;
    setCoins(send(coins, plan));
    setSent({
      spent: plan.selection.inputs.length,
      amount: plan.tx.outputs[0].value,
      change: plan.change,
      changeKey: plan.change > 0n ? coinKey({ txid: txid(plan.tx), vout: 1 }) : null,
    });
    setText('');
    setManual(null);
    follow({ kind: 'send' });
  };

  const reset = () => {
    setCoins(startingCoins());
    setText('');
    setManual(null);
    setSent(null);
    follow({ kind: 'reset' });
  };

  /* -------------------------------------------------------------- status */
  const status = walletStatus(lang, {
    badAmount,
    plan,
    amount,
    picked: manual ? { coins: chosenCoins.length, total: sum(chosenCoins) } : null,
    sent,
    walletEmpty: wallet.length === 0,
  });

  const highlight = step !== null ? STEPS[step]?.highlight : undefined;

  return (
    <div className="utxo fig-stack">
      {/* The wallet: its coins, and who is choosing among them. */}
      <div className={cx(highlight === 'wallet' && 'fig-pointed')}>
        <p className="label utxo-cap">
          <span>
            {t(COPY.wallet)} · {coinCount(lang, wallet.length)}
          </span>
          <span>
            {t(COPY.balance)} <b className="mono">{formatBtc(sum(wallet))} BTC</b>
          </span>
        </p>

        {wallet.length > 0 ? (
          <ul className="utxo-coins" aria-label={t(COPY.walletLabel)}>
            {wallet.map((coin) => {
              const key = coinKey(coin);
              const side = coinSide(coin.value);
              const isNew = sent?.changeKey === key;
              return (
                <li key={key}>
                  <button
                    type="button"
                    className={cx('utxo-coin', isNew && 't-slam')}
                    style={{ width: side, height: side }}
                    aria-pressed={chosen.has(key)}
                    aria-label={fill(t(isNew ? COPY.coinNew : COPY.coin), { value: formatBtc(coin.value) })}
                    onClick={() => toggle(coin)}
                  />
                  <span className="utxo-coin-value mono">{formatBtc(coin.value)}</span>
                  {isNew ? <span className="utxo-coin-tag mono">{t(COPY.newCoin)}</span> : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="fig-note utxo-coins">{t(COPY.empty)}</p>
        )}

        <p className="utxo-wallet-foot mono">
          <span ref={chooser} tabIndex={-1}>
            <span className="label">{t(COPY.chooser)}</span> {t(manual ? COPY.chooserYou : COPY.chooserWallet)}{' '}
            {manual ? (
              <button type="button" className="btn btn-line btn-sm" onClick={handBack}>
                {t(COPY.letWallet)}
              </button>
            ) : null}
          </span>
          {theirs.length > 0 ? (
            <span>
              <span className="label">{t(COPY.theirs)}</span> {theirs.map((coin) => formatBtc(coin.value)).join(' · ')}
            </span>
          ) : null}
        </p>
      </div>

      <div className="utxo-pay">
        <label className="label" htmlFor={amountId}>
          {t(COPY.amount)}
        </label>
        <div className="utxo-amount" data-bad={badAmount}>
          <input
            id={amountId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            placeholder="0.15"
            value={text}
            aria-invalid={badAmount}
            aria-describedby={badAmount ? errorId : undefined}
            onChange={(event) => giveAmount(event.target.value)}
          />
          <span className="label">{t(COPY.unit)}</span>
        </div>
        <div className="utxo-quick">
          <span className="label">{t(COPY.quick)}</span>
          {[15_000_000n, 60_000_000n].map((value) => (
            <button key={String(value)} type="button" className="btn btn-line btn-sm" onClick={() => offer(value, false)}>
              {formatBtc(value)}
            </button>
          ))}
          <span className="label">{t(COPY.special)}</span>
          <button type="button" className="btn btn-line btn-sm" disabled={!edges} onClick={() => edges && offer(edges.exact, true)}>
            {t(COPY.exact)}
          </button>
          <button type="button" className="btn btn-line btn-sm" disabled={!edges} onClick={() => edges && offer(edges.dust, true)}>
            {t(COPY.dust)}
          </button>
          <button type="button" className="btn btn-line btn-sm" disabled={!edges} onClick={() => edges && offer(edges.tooMuch, true)}>
            {t(COPY.tooMuch)}
          </button>
        </div>
      </div>

      <TxPanel plan={plan} pointed={highlight === 'tx' || highlight === 'fee' ? highlight : null} />

      <div className={cx('fig-row', highlight === 'send' && 'fig-pointed')}>
        {/* aria-disabled, not disabled: Send changes state when pressed and would lose the focus. */}
        <button type="button" className="btn" aria-disabled={plan.kind !== 'ready'} onClick={pay}>
          {t(COPY.send)}
        </button>
        <button type="button" className="btn btn-line btn-sm" onClick={reset}>
          {t(COPY.reset)}
        </button>
      </div>

      <p className="fig-status" role="status" id={errorId}>
        {status}
      </p>
      <p className="fig-note">{fill(t(COPY.feeRule), { base: formatBtc(BASE_FEE), each: formatBtc(FEE_PER_INPUT) })}</p>
    </div>
  );
}
