import type { ReactNode } from 'react';
import { Rich } from '@/components/site/Rich';
import { HashText } from '@/components/viz/HashText';
import type { L } from '@/content/types';
import { UI } from '@/content/ui';
import { useT } from '@/i18n/settings';
import { fill, formatBtc, formatCount, shortHex } from '@/text/format';
import { COPY } from './copy';
import { PARTS, flowsOf } from './machine';
import type { PartId } from './machine';
import type { MachineRun } from './run';

/** What the selected part does, what it really produced for one payment, and what passes through it. */
export function PartPanel({ id, run }: { id: PartId; run: MachineRun }) {
  const t = useT();
  const part = PARTS.find((entry) => entry.id === id) ?? PARTS[0];
  const copy = COPY.parts[id];
  const { incoming, outgoing } = flowsOf(id);

  /** The outcome of a check the engine ran on this page: a mark and a word, never colour alone. */
  const outcome = (passed: boolean, yes: L<string>, no: L<string>) => (
    <span className={`tag ${passed ? 'tag-valid' : 'tag-invalid'}`}>
      {passed ? '✓' : '×'} {t(passed ? yes : no)}
    </span>
  );

  const specimen: Record<PartId, ReactNode> = {
    wallet: shortHex(run.address, 14, 6),
    transaction: <HashText hash={run.txid} lead={14} tail={6} zeros={false} />,
    nodes: outcome(run.signatureValid, COPY.valid, COPY.invalid),
    mempool: fill(t(COPY.waiting), { count: run.mempool.length }),
    block: <HashText hash={run.merkleRoot} lead={14} tail={6} zeros={false} />,
    pow: (
      <>
        {formatCount(run.header.nonce)} <span className="mch-dim">{fill(t(COPY.tries), { count: formatCount(run.tried) })}</span>
      </>
    ),
    chain: <HashText hash={run.hash} lead={14} tail={6} />,
    incentive: (
      <>
        {formatBtc(run.subsidy)} BTC + {formatBtc(run.fees)} BTC <span className="mch-dim">{t(COPY.feesSuffix)}</span>
      </>
    ),
    light: (
      <>
        {fill(t(COPY.hashes), { count: run.proof.length })} {outcome(run.proofValid, COPY.verified, COPY.unverified)}
      </>
    ),
  };

  return (
    <div className="mch-panel" aria-live="polite">
      <p className="mch-panel-head">
        <span className="mono mch-panel-no">§{part.section}</span>
        <span key={id} className="poster mch-panel-name t-swap-soft">
          {t(copy.name)}
        </span>
      </p>
      <p key={`${id}-text`} className="ui mch-panel-text t-swap-soft">
        <Rich text={t(copy.text)} />
      </p>

      <dl className="mch-specimen fig-band">
        <dt className="label">
          {t(COPY.specimenTitle)} · {fill(t(copy.specimen), { count: run.blockTxids.length })}
        </dt>
        <dd className="mono">{specimen[id]}</dd>
      </dl>
      {/* The one part that shows an address: its key is made from a fixed string, for everyone to see. */}
      {id === 'wallet' ? <p className="fig-note mch-warning">{t(UI.demoKeysWarning)}</p> : null}

      <ul className="mch-flows">
        {incoming.map((flow) => (
          <li key={flow.id} data-way="in">
            {t(COPY.flows[flow.id].taken)}
          </li>
        ))}
        {outgoing.map((flow) => (
          <li key={flow.id} data-way="out">
            {t(COPY.flows[flow.id].given)}
          </li>
        ))}
      </ul>
    </div>
  );
}
