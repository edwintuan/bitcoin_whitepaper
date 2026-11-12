import { Switch } from '@/components/base/switch/switch';
import { useT } from '@/i18n/settings';
import { fill } from '@/text/format';
import { cx } from '@/utils/cx';
import { COIN_SERIAL, COPY } from './copy';
import { coinOutcome, mintRecord } from './trust';
import type { CoinState, Payee } from './trust';

const PAYEES: readonly Payee[] = ['first', 'second'];

/** The coin as the file it is: one solid shape, the same wherever a copy of it turns up. */
function CoinFile({ className }: { className?: string }) {
  const t = useT();
  return (
    <span className={cx('itr-file', className)}>
      <span className="itr-file-name">{t(COPY.coin)}</span>
      <span className="itr-file-serial mono">#{COIN_SERIAL}</span>
    </span>
  );
}

export interface CopySceneProps {
  coin: CoinState;
  /** The row of controls the walkthrough is pointing at. */
  pointed: 'give' | 'mint' | null;
  onGive(to: Payee): void;
  onMint(on: boolean): void;
  onReset(): void;
}

/** One digital coin sent to two payees: first with nobody checking, then with a mint that does. */
export function CopyScene({ coin, pointed, onGive, onMint, onReset }: CopySceneProps) {
  const t = useT();
  const outcome = coinOutcome(coin);
  const record = mintRecord(coin);
  const lastPaid = [...coin.attempts].reverse().find((attempt) => attempt.accepted);
  const name = (payee: Payee) => t(COPY.name[payee]);
  const nothingSent = coin.attempts.length === 0;

  const message =
    outcome === 'ready'
      ? t(coin.mint ? COPY.coinStatus.mintReady : COPY.coinStatus.ready)
      : outcome === 'refused'
        ? t(COPY.coinStatus.mintRefused)
        : outcome === 'spent-twice'
          ? t(COPY.coinStatus.twice)
          : fill(t(coin.mint ? COPY.coinStatus.mintOnce : COPY.coinStatus.once), {
              name: lastPaid ? name(lastPaid.to) : '',
            });

  return (
    <div className="fig-stack">
      <p className="fig-note">{t(COPY.copyIntro)}</p>

      <div className="itr-flow">
        <div className="itr-holder">
          <span className="label">{t(COPY.payer)}</span>
          <CoinFile />
          <p className="fig-note itr-keeps">{t(COPY.keeps)}</p>
        </div>

        <i className="itr-fork" aria-hidden="true" />

        {coin.mint ? (
          <div className="itr-mint t-rise">
            <p className="itr-mint-head">
              <span className="poster">{t(COPY.mint)}</span>
              <span className="label">{t(COPY.mintTask)}</span>
            </p>
            <p className="itr-mint-record mono">
              {record ? fill(t(COPY.mintSpent), { serial: COIN_SERIAL, name: name(record) }) : t(COPY.mintEmpty)}
            </p>
            <p className="itr-mint-count mono">{fill(t(COPY.mintAsked), { count: coin.attempts.length })}</p>
          </div>
        ) : null}

        <div className="itr-payees">
          {PAYEES.map((payee) => {
            const attempt = coin.attempts.find((made) => made.to === payee);
            const result = !attempt ? 'none' : attempt.accepted ? 'accepted' : 'refused';
            return (
              <div
                // Remounted when its fate changes, so an arrival pops and a refusal shakes once.
                key={`${payee}-${result}`}
                className={cx('itr-holder itr-payee', result === 'refused' && 't-shake')}
                data-result={result}
              >
                <span className="label">{t(COPY.payee[payee])}</span>
                {result === 'accepted' ? (
                  <CoinFile className="t-pop" />
                ) : (
                  // The place where a coin would be. Nothing to read out: the words below say it.
                  <i className="itr-file itr-file-none" aria-hidden="true" />
                )}
                <span className={cx('tag', result === 'none' && 'tag-line', result === 'accepted' && 'tag-valid', result === 'refused' && 'tag-invalid')}>
                  {result === 'accepted' ? '✓ ' : result === 'refused' ? '× ' : ''}
                  {t(COPY.result[result])}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={cx('fig-row', pointed === 'give' && 'fig-pointed')}>
        {PAYEES.map((payee) => {
          const sent = coin.attempts.some((attempt) => attempt.to === payee);
          return (
            // aria-disabled, not disabled: the button that was just pressed keeps the focus.
            <button
              key={payee}
              type="button"
              className="btn"
              aria-disabled={sent}
              onClick={() => {
                if (!sent) onGive(payee);
              }}
            >
              {fill(t(COPY.sendTo), { name: name(payee) })}
            </button>
          );
        })}
      </div>

      <div className={cx('fig-row', pointed === 'mint' && 'fig-pointed')}>
        <Switch isSelected={coin.mint} onChange={onMint} shape="rectangle">
          {t(COPY.mintSwitch)}
        </Switch>
        <button
          type="button"
          className="btn btn-line btn-sm"
          aria-disabled={nothingSent}
          onClick={() => {
            if (!nothingSent) onReset();
          }}
        >
          {t(COPY.startOver)}
        </button>
      </div>

      <p className="fig-status" role="status">
        {message}
      </p>

      <p className="fig-note">{t(COPY.copyOutro)}</p>
    </div>
  );
}
