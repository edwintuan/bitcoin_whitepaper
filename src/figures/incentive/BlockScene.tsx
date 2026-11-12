import { useEffect, useRef } from 'react';
import { SegmentedControl, SegmentedControlItem } from '@/components/base/segmented-control/segmented-control';
import { BlockTile } from '@/components/viz/BlockTile';
import { useSettings, useT } from '@/i18n/settings';
import { blockSubsidy } from '@/lib/subsidy';
import { fill, formatBtc, formatCount } from '@/text/format';
import { cx } from '@/utils/cx';
import {
  MAX_TXS,
  addSample,
  checkCoinbase,
  claimFor,
  coinbaseLimit,
  feeOf,
  inputTotal,
  outputTotal,
  rejectLine,
  stepFee,
  totalFees,
} from './blockPay';
import type { BlockTx, Claim } from './blockPay';
import { COPY } from './copy';
import { HeightBar } from './HeightBar';
import { sentences } from './sentences';
import { satsText } from './supply';

export type BlockHighlight = 'txs' | 'claim' | null;

export interface BlockSceneProps {
  height: number;
  onHeight(height: number): void;
  txs: BlockTx[];
  onTxs(txs: BlockTx[]): void;
  claim: Claim;
  onClaim(claim: Claim): void;
  highlight: BlockHighlight;
}

type Name = keyof typeof COPY.names;

/** A block's transactions, their fees, and the coinbase that claims subsidy plus fees. */
export function BlockScene({ height, onHeight, txs, onTxs, claim, onClaim, highlight }: BlockSceneProps) {
  const t = useT();
  const { lang } = useSettings();
  const subsidy = blockSubsidy(height);
  const fees = totalFees(txs);
  const limit = coinbaseLimit(height, txs);
  const claimed = claimFor(limit, claim);
  const verdict = checkCoinbase(claimed, limit);
  const name = (who: string) => t(COPY.names[who as Name]);
  const replace = (index: number, entry: BlockTx) => onTxs(txs.map((other, i) => (i === index ? entry : other)));
  const feesLabel = t(COPY.sumFees)[Math.min(txs.length, 2)];
  const full = txs.length >= MAX_TXS;

  // Taking a payment out removes the button that did it. The focus goes to what takes its
  // place: the same button of the payment that moved up, or the one that adds a payment.
  const list = useRef<HTMLOListElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const takenOut = useRef<number | null>(null);
  useEffect(() => {
    if (takenOut.current === null) return;
    const removers = list.current?.querySelectorAll<HTMLButtonElement>('.inc-tx-tools > button:last-child') ?? [];
    (removers[Math.min(takenOut.current, removers.length - 1)] ?? addButton.current)?.focus();
    takenOut.current = null;
  }, [txs]);

  return (
    <div className="inc-pay fig-stack">
      <HeightBar height={height} onHeight={onHeight} />
      <p className="fig-note">{t(COPY.blockIntro)}</p>

      <BlockTile
        key={verdict.ok ? 'ok' : 'bad'}
        className={cx('inc-block', !verdict.ok && 't-shake', highlight === 'txs' && 'fig-pointed')}
        title={`${t(COPY.block)} ${formatCount(height)}`}
        status={verdict.ok ? `${t(COPY.valid)} ✓` : `${t(COPY.rejected)} ×`}
        state={verdict.ok ? 'candidate' : 'invalid'}
      >
        <ol className="inc-txs" ref={list}>
          <li className="inc-tx inc-coinbase">
            <span className="inc-tx-name">{t(COPY.coinbase)}</span>
            <span className="inc-tx-sum">
              <span>
                <small>{t(COPY.txIn)}</small> {t(COPY.nothingIn)}
              </span>
              <span>→</span>
              <span>
                <small>{t(COPY.txOut)}</small> <b>{formatBtc(claimed)}</b> BTC
              </span>
            </span>
            <span className="inc-dim">{t(COPY.toMaker)}</span>
          </li>
          {txs.map((entry, index) => {
            const paid = feeOf(entry);
            const from = name(entry.sample.from);
            // A fee button that has reached its limit is switched off with aria-disabled, so the focus stays on it.
            const atFloor = paid === 0n;
            const atCeiling = feeOf(stepFee(entry, 1)) === paid;
            return (
              <li className="inc-tx" key={entry.id}>
                <span className="inc-tx-name">{fill(t(COPY.pays), { from, to: name(entry.sample.to) })}</span>
                <span className="inc-tx-sum">
                  <span>
                    <small>{t(COPY.txIn)}</small> {formatBtc(inputTotal(entry))}
                  </span>
                  <span>−</span>
                  <span>
                    <small>{t(COPY.txOut)}</small> {formatBtc(outputTotal(entry))}
                  </span>
                  <span>=</span>
                  <span>
                    <small>{t(COPY.txFee)}</small> <b>{satsText(paid)}</b> {t(COPY.satShort)}
                  </span>
                </span>
                <span className="inc-tx-tools">
                  <button
                    type="button"
                    className="inc-mini"
                    aria-label={fill(t(COPY.feeLess), { from })}
                    aria-disabled={atFloor || undefined}
                    onClick={atFloor ? undefined : () => replace(index, stepFee(entry, -1))}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    className="inc-mini"
                    aria-label={fill(t(COPY.feeMore), { from })}
                    aria-disabled={atCeiling || undefined}
                    onClick={atCeiling ? undefined : () => replace(index, stepFee(entry, 1))}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="inc-mini"
                    aria-label={fill(t(COPY.remove), { from })}
                    onClick={() => {
                      takenOut.current = index;
                      onTxs(txs.filter((_, i) => i !== index));
                    }}
                  >
                    ×
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
      </BlockTile>

      {/* Filling the block switches this off: aria-disabled, so the focus stays on it. */}
      <button
        ref={addButton}
        type="button"
        className="btn btn-sm btn-line"
        aria-disabled={full || undefined}
        onClick={full ? undefined : () => onTxs(addSample(txs))}
      >
        {t(COPY.add)}
      </button>

      <dl className="inc-sum mono">
        <div>
          <dt>{fill(t(COPY.sumSubsidy), { height: formatCount(height) })}</dt>
          <dd>{formatBtc(subsidy)} BTC</dd>
        </div>
        <div>
          <dt>{fill(feesLabel, { count: txs.length })}</dt>
          <dd>+ {formatBtc(fees)} BTC</dd>
        </div>
        <div className="inc-sum-total">
          <dt>{t(COPY.sumLimit)}</dt>
          <dd>= {formatBtc(limit)} BTC</dd>
        </div>
        <div className="inc-sum-claim">
          <dt>{t(COPY.sumClaim)}</dt>
          <dd>
            {formatBtc(claimed)} BTC
            <span className={`tag ${verdict.ok ? 'tag-valid' : 'tag-invalid'}`}>
              {claimed > limit ? '>' : claimed < limit ? '<' : '='}
            </span>
          </dd>
        </div>
      </dl>

      <div className={cx('inc-claim', highlight === 'claim' && 'fig-pointed')}>
        <span className="label">{t(COPY.claimLabel)}</span>
        <SegmentedControl
          aria-label={t(COPY.claimLabel)}
          selectedKeys={new Set([claim])}
          onSelectionChange={(keys) => {
            const next = [...keys][0] as Claim | undefined;
            if (next) onClaim(next);
          }}
        >
          <SegmentedControlItem id="under" isDisabled={limit === 0n}>
            {t(COPY.claimUnder)}
          </SegmentedControlItem>
          <SegmentedControlItem id="exact">{t(COPY.claimExact)}</SegmentedControlItem>
          <SegmentedControlItem id="over">{t(COPY.claimOver)}</SegmentedControlItem>
        </SegmentedControl>
      </div>

      <p className="fig-status" role="status">
        {verdict.ok ? (
          sentences(
            lang,
            fill(t(claimed < limit ? COPY.verdictUnder : COPY.verdictExact), { claimed: formatBtc(claimed) }),
            subsidy === 0n && t(COPY.noSubsidy),
          )
        ) : (
          <>
            {t(COPY.verdictOver)}
            <span className="inc-core">{rejectLine(verdict)}</span>
          </>
        )}
      </p>
    </div>
  );
}
