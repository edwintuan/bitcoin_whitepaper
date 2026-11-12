import { useId, useMemo, useState } from 'react';
import { Rich } from '@/components/site/Rich';
import { HashText } from '@/components/viz/HashText';
import { HexView } from '@/components/viz/HexView';
import { useSettings, useT } from '@/i18n/settings';
import { annotateMessage } from '@/lib/p2p/messages';
import type { Segment } from '@/lib/p2p/messages';
import { fill } from '@/text/format';
import { COPY } from './copy';
import type { FieldKey } from './copy';
import { sentences } from './sentences';
import {
  EXAMPLE,
  HEADER_SIZE,
  PAYMENT_TXID,
  conversation,
  damage,
  fieldOf,
  payloadHash,
  showValue,
  spaced,
  verifyChecksum,
} from './wire';

/** Longest user agent the box accepts: well inside the 256 bytes a peer allows, whatever the script. */
const MAX_AGENT = 40;

/** Which input or output a field of the transaction belongs to, counting from 1; `null` for the rest. */
function ownerOf(segmentName: string): { kind: 'input' | 'output'; n: number } | null {
  const match = /^tx_(in|out)(\d+)_/.exec(segmentName);
  return match ? { kind: match[1] === 'in' ? 'input' : 'output', n: Number(match[2]) + 1 } : null;
}

/**
 * Seven real messages between two nodes: the handshake, then a transaction
 * announced, requested and delivered. The reader steps through them and reads
 * any of them byte by byte.
 */
export function WireScene() {
  const t = useT();
  const { lang } = useSettings();
  const agentId = useId();
  const [userAgent, setUserAgent] = useState(EXAMPLE.userAgent);
  const [current, setCurrent] = useState(0);
  const [damaged, setDamaged] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  /** "byte" for one, "bytes" for any other count; Chinese has one word for both. */
  const bytesWord = (count: number): string => t(COPY.bytes)[count === 1 ? 0 : 1];

  const messages = useMemo(() => conversation({ userAgent }), [userAgent]);
  const message = messages[current];
  const bytes = useMemo(() => (damaged ? damage(message.bytes) : message.bytes), [damaged, message]);
  const segments = useMemo<Segment[]>(
    () => (damaged ? annotateMessage(bytes) : message.segments),
    [damaged, bytes, message],
  );
  const check = useMemo(() => verifyChecksum(bytes), [bytes]);

  const payloadLength = bytes.length - HEADER_SIZE;
  const isTx = message.command === 'tx';
  const txHash = isTx ? payloadHash(bytes) : '';
  const focused = segments.find((segment) => segment.name === active);

  const select = (index: number) => {
    setCurrent(Math.max(0, Math.min(messages.length - 1, index)));
    setDamaged(false);
    setActive(null);
  };

  const describe = (segment: Segment) => {
    // Every field the scene can show has copy: wire.test.ts checks each message, intact and damaged.
    const field = COPY.fields[fieldOf(segment.name) as FieldKey];
    const owner = ownerOf(segment.name);
    return {
      name: owner
        ? `${fill(t(owner.kind === 'input' ? COPY.input : COPY.output), { n: owner.n })} · ${t(field.name)}`
        : t(field.name),
      note: t(field.note),
    };
  };
  // Each field is announced by the name the note below gives it.
  const named = segments.map((segment) => ({ ...segment, label: describe(segment).name }));
  const atFirst = current === 0;
  const atLast = current === messages.length - 1;

  return (
    <div className="net-wire fig-stack">
      <p className="fig-note">{t(COPY.wireIntro)}</p>

      <div role="group" aria-label={t(COPY.sequenceLabel)}>
        <div className="net-seq-ends" aria-hidden="true">
          <span className="net-seq-end">
            <b className="poster">{t(COPY.nodeA)}</b>
            <span className="label">{t(COPY.nodeARole)}</span>
          </span>
          <span className="net-seq-end" data-side="b">
            <b className="poster">{t(COPY.nodeB)}</b>
            <span className="label">{t(COPY.nodeBRole)}</span>
          </span>
        </div>
        <ol className="net-seq-list">
          {messages.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                className="net-seq-msg"
                data-dir={item.from === 'a' ? 'right' : 'left'}
                data-state={index < current ? 'sent' : index === current ? 'current' : 'pending'}
                aria-current={index === current ? 'step' : undefined}
                aria-label={`${index + 1}. ${item.command}, ${item.from === 'a' ? t(COPY.toRight) : t(COPY.toLeft)}, ${item.bytes.length} ${bytesWord(item.bytes.length)}`}
                onClick={() => select(index)}
              >
                <span className="net-seq-arrow" aria-hidden="true" />
                <span className="net-seq-lane" aria-hidden="true">
                  <i />
                </span>
                <span className="net-seq-name mono" aria-hidden="true">
                  {item.command}
                </span>
                <span className="net-seq-size mono" aria-hidden="true">
                  {item.bytes.length} {bytesWord(item.bytes.length)}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* Stepping to either end switches a button off: aria-disabled, so the focus stays on it. */}
      <div className="fig-row">
        <button
          type="button"
          className="btn btn-sm btn-line"
          aria-disabled={atFirst || undefined}
          onClick={atFirst ? undefined : () => select(current - 1)}
        >
          {t(COPY.prevMessage)}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-dark"
          aria-disabled={atLast || undefined}
          onClick={atLast ? undefined : () => select(current + 1)}
        >
          {t(COPY.nextMessage)}
        </button>
        <span className="label net-dim">{fill(t(COPY.messageOf), { n: current + 1, total: messages.length })}</span>
      </div>
      <p className="fig-note net-seq-says" aria-live="polite">
        <b>{message.command}</b>
        {t(COPY.says[message.id])}
      </p>

      {message.id === 'version-a' ? (
        <div className="net-agent">
          <label className="label" htmlFor={agentId}>
            {t(COPY.userAgentLabel)}
          </label>
          <input
            id={agentId}
            type="text"
            value={userAgent}
            maxLength={MAX_AGENT}
            spellCheck={false}
            autoComplete="off"
            aria-describedby={`${agentId}-hint`}
            onChange={(event) => setUserAgent(event.target.value)}
          />
          <p className="fig-note" id={`${agentId}-hint`}>
            {t(COPY.userAgentHint)}
          </p>
        </div>
      ) : null}

      <div>
        <p className="label net-cap">
          <span>{t(COPY.bytesTitle)}</span>
          <span className="net-bytes-parts">
            <span>
              {t(COPY.headerPart)} {HEADER_SIZE}
            </span>
            <span>{payloadLength > 0 ? `${t(COPY.payloadPart)} ${payloadLength}` : t(COPY.noPayload)}</span>
          </span>
        </p>
        <HexView bytes={bytes} segments={named} unit={bytesWord} active={active} onActive={setActive} />
        <p className="fig-note net-field-note" aria-live="polite">
          {focused ? (
            <>
              <b>{describe(focused).name}</b> · {focused.end - focused.start} {bytesWord(focused.end - focused.start)} ·{' '}
              <span className="mono net-field-value">{showValue(focused)}</span>
              <br />
              {describe(focused).note}
            </>
          ) : (
            t(COPY.fieldHint)
          )}
        </p>
      </div>

      <dl className="net-check">
        <div>
          <dt className="label">
            {payloadLength > 0 ? fill(t(COPY.checkDigest), { n: payloadLength }) : t(COPY.checkDigestEmpty)}
          </dt>
          <dd className="mono">
            <span className="net-digest-head">{spaced(check.computed)}</span>{' '}
            <span className="net-digest-rest">{spaced(check.digest.slice(8))}</span>
          </dd>
        </div>
        <div>
          <dt className="label">
            {t(COPY.checkDeclared)}
            <span className={`tag ${check.ok ? 'tag-valid' : 'tag-invalid'}`}>{check.ok ? '=' : '≠'}</span>
          </dt>
          <dd className="mono">
            <span
              key={`${message.id}-${check.computed}`}
              className={check.ok ? undefined : 't-shake'}
              style={{ display: 'inline-block' }}
            >
              {spaced(check.declared)}
            </span>
          </dd>
        </div>
        {isTx ? (
          <>
            <div>
              <dt className="label">{t(COPY.checkTxid)}</dt>
              <dd className="mono">
                <HashText hash={txHash} full zeros={false} />
              </dd>
            </div>
            <div>
              <dt className="label">
                {t(COPY.checkAsked)}
                <span className={`tag ${txHash === PAYMENT_TXID ? 'tag-valid' : 'tag-invalid'}`}>
                  {txHash === PAYMENT_TXID ? '=' : '≠'}
                </span>
              </dt>
              <dd className="mono">
                <HashText hash={PAYMENT_TXID} full zeros={false} />
              </dd>
            </div>
          </>
        ) : null}
      </dl>

      <button
        type="button"
        className="btn btn-sm btn-line"
        disabled={payloadLength === 0}
        onClick={() => {
          // Point at the field the flipped bit is in.
          setActive(damaged ? null : (message.segments[message.segments.length - 1]?.name ?? null));
          setDamaged(!damaged);
        }}
      >
        {damaged ? t(COPY.restore) : t(COPY.damage)}
      </button>

      <p className="fig-status" role="status">
        {sentences(lang, check.ok ? t(COPY.checkOk) : t(COPY.checkBad), check.ok && isTx && t(COPY.checkTxOk))}
      </p>

      <p className="fig-note">{t(COPY.wireReal)}</p>
      <p className="fig-note">
        <Rich text={t(COPY.wireLeftOut)} />
      </p>
    </div>
  );
}
