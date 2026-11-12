import { HashText } from '@/components/viz/HashText';
import { useT } from '@/i18n/settings';
import { fill } from '@/text/format';
import { cx } from '@/utils/cx';
import { transferHash } from './coin';
import type { Transfer, TransferProblem } from './coin';
import { COPY } from './copy';
import type { Inspection } from './inspection';
import { TxCard } from './TxCard';
import type { FieldName, TxField } from './TxCard';

/** The part of this scene a guided step can point at. */
export type ChainSpot = 'keys' | 'transfer' | 'verify' | 'rewrite';

export interface ChainSceneProps {
  /** The coin as it stands now, rewritten transfer included. */
  coin: Transfer[];
  /** What has been rewritten, and the outcome of every check that has been run. */
  inspection: Inspection;
  /** Owner 0's public key: the signer of the first transfer shown. */
  firstSigner: string;
  /** The public keys of the owners shown, in order: Owner 1, Owner 2, Owner 3. */
  ownerKeys: string[];
  /** True just after new keys were made. */
  fresh: boolean;
  pointed: ChainSpot | null;
  onVerify(index: number): void;
  onForge(index: number | null): void;
  onNewKeys(): void;
}

type TagKind = 'unchecked' | 'valid' | 'signature' | 'link';

/** The paper's diagram with live values: three transfers of one coin, each signed by the owner before. */
export function ChainScene({ coin, inspection, firstSigner, ownerKeys, fresh, pointed, onVerify, onForge, onNewKeys }: ChainSceneProps) {
  const t = useT();
  const { forged, checks, selected, restored } = inspection;
  const hashes = coin.map(transferHash);

  // A transfer says nothing about itself until a check has been run on it.
  const kindOf = (index: number): TagKind => (checks.has(index) ? (checks.get(index) ?? 'valid') : 'unchecked');
  const staleLink = (index: number) => index > 0 && coin[index].prev !== hashes[index - 1];

  return (
    <div className="fig-stack">
      <p className="fig-note">{t(COPY.chainIntro)}</p>

      <div className={cx(pointed === 'keys' && 'fig-pointed')}>
        <ul className="txs-owners">
          {ownerKeys.map((key, index) => (
            <li className="txs-owner" key={index}>
              <span className="txs-owner-name poster">{fill(t(COPY.owner), { n: index + 1 })}</span>
              <span className="txs-owner-key">
                <span className="txs-dim">{t(COPY.publicKey)}</span>
                <HashText key={key} className="t-swap-soft" hash={key} lead={8} tail={4} zeros={false} />
              </span>
              <span className="txs-owner-key">
                <span className="txs-dim">{t(COPY.privateKey)}</span>
                <span>
                  <span aria-hidden="true">••••••</span> {t(COPY.secret)}
                </span>
              </span>
              {index < coin.length - 1 ? (
                <span className="txs-owner-note">{fill(t(COPY.signed), { n: index + 2 })}</span>
              ) : forged === null ? (
                <span className="tag tag-orange txs-holds">{t(COPY.holds)}</span>
              ) : null}
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn-line btn-sm" onClick={onNewKeys}>
          {t(COPY.newKeys)}
        </button>
      </div>

      <ol className={cx('txs-cols', pointed === 'transfer' && 'fig-pointed')}>
        {coin.map((transfer, index) => {
          const kind = kindOf(index);
          const number = index + 1;
          const rewritten = forged === index;
          const fields: TxField[] = [
            {
              name: 'to',
              label: rewritten ? t(COPY.attackerKey) : fill(t(COPY.ownerKey), { n: number }),
              value: transfer.to,
              fresh: rewritten,
            },
            {
              name: 'prev',
              label: t(COPY.fieldPrev),
              value: transfer.prev,
              note:
                index === 0
                  ? t(COPY.prevEarlier)
                  : fill(t(kind === 'link' && staleLink(index) ? COPY.prevStale : COPY.prevOf), { n: index }),
            },
            { name: 'hash', label: t(COPY.fieldHash), value: hashes[index], fresh: rewritten },
            { name: 'sig', label: fill(t(COPY.ownerSignature), { n: index }), value: transfer.sig },
          ];
          // The check on show reads the signature and hash of its own card, and the key named in the card before.
          const used: FieldName[] = selected === index ? ['hash', 'sig'] : selected === index + 1 ? ['to'] : [];

          return (
            <li className="txs-col" key={index}>
              <TxCard
                title={fill(t(COPY.transaction), { n: number })}
                tone={kind === 'signature' || kind === 'link' ? 'invalid' : 'plain'}
                link={index === 0 ? 'none' : kind === 'link' && staleLink(index) ? 'broken' : 'ok'}
                className={cx(kind === 'signature' && 't-shake', kind === 'link' && 't-cascade')}
                style={{ ['--i' as string]: forged === null ? 0 : Math.max(0, index - forged) }}
                fields={fields}
                used={used}
                tag={
                  <span
                    key={kind}
                    className={cx(
                      'tag',
                      kind === 'unchecked' && 'tag-line',
                      kind === 'valid' && 'tag-valid t-pop',
                      (kind === 'signature' || kind === 'link') && 'tag-invalid',
                    )}
                  >
                    {kind === 'valid' ? '✓ ' : kind === 'unchecked' ? '' : '× '}
                    {t(COPY.tag[kind])}
                  </span>
                }
              />
              {/* The buttons stand under the transaction they act on, not inside it. */}
              <div className={cx('txs-actions', (pointed === 'verify' || (pointed === 'rewrite' && index === 1)) && 'fig-pointed')}>
                <button
                  type="button"
                  className="btn btn-sm"
                  aria-label={fill(t(COPY.verifyLabel), { n: number })}
                  onClick={() => onVerify(index)}
                >
                  {t(COPY.verify)}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-line"
                  aria-label={fill(t(rewritten ? COPY.restoreLabel : COPY.rewriteLabel), { n: number })}
                  onClick={() => onForge(rewritten ? null : index)}
                >
                  {t(rewritten ? COPY.restore : COPY.rewrite)}
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      {selected !== null ? <Check coin={coin} hashes={hashes} index={selected} forged={forged} firstSigner={firstSigner} /> : null}

      <p className="fig-status" role="status">
        {selected === null ? (
          t(fresh ? COPY.fresh : COPY.idle)
        ) : (
          <Verdict coin={coin} hashes={hashes} problem={checks.get(selected) ?? null} index={selected} />
        )}
        {restored !== null ? ` ${fill(t(COPY.restoredNote), { n: restored + 1 })}` : null}
      </p>
    </div>
  );
}

/** The three things a signature check takes, with where each comes from. */
function Check({
  coin,
  hashes,
  index,
  forged,
  firstSigner,
}: {
  coin: Transfer[];
  hashes: string[];
  index: number;
  forged: number | null;
  firstSigner: string;
}) {
  const t = useT();
  const number = index + 1;
  const keyNote =
    index === 0
      ? t(COPY.checkKeyFirst)
      : forged === index - 1
        ? fill(t(COPY.checkKeyAttacker), { before: index })
        : fill(t(COPY.checkKeyNote), { signer: index, before: index });
  const rows = [
    { label: t(COPY.checkSignature), value: coin[index].sig, note: fill(t(COPY.checkSignatureNote), { n: number }) },
    { label: t(COPY.checkHash), value: hashes[index], note: fill(t(COPY.checkHashNote), { n: number }) },
    { label: t(COPY.checkKey), value: index === 0 ? firstSigner : coin[index - 1].to, note: keyNote },
  ];

  return (
    <div className="fig-band t-reveal" key={`${index}-${forged}`}>
      <p className="label txs-check-title">{fill(t(COPY.checking), { n: number })}</p>
      <dl className="txs-check-rows">
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd className="mono">
              <HashText hash={row.value} lead={10} tail={4} zeros={false} />
            </dd>
            <dd className="txs-check-note">{row.note}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** The outcome of the check on show, as a mark and a sentence. */
function Verdict({ coin, hashes, problem, index }: { coin: Transfer[]; hashes: string[]; problem: TransferProblem; index: number }) {
  const t = useT();
  const values = { n: index + 1, signer: index, before: index };
  const sentence =
    problem === null
      ? fill(t(COPY.valid), values)
      : problem === 'signature'
        ? fill(t(COPY.badSignature), values)
        : fill(t(coin[index].prev !== hashes[index - 1] ? COPY.badLink : COPY.badParent), values);

  return (
    <>
      <span key={`${index}-${problem}`} className={cx('tag txs-verdict', problem === null ? 'tag-valid t-pop' : 'tag-invalid')}>
        {problem === null ? '✓ ' : '× '}
        {t(COPY.tag[problem ?? 'valid'])}
      </span>{' '}
      {sentence}
    </>
  );
}
