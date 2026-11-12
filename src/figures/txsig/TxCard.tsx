import type { CSSProperties, ReactNode } from 'react';
import { HashText } from '@/components/viz/HashText';
import { cx } from '@/utils/cx';

/** The four things a transaction of section 2 holds, in the order the card lists them. */
export type FieldName = 'to' | 'prev' | 'hash' | 'sig';

export interface TxField {
  name: FieldName;
  label: string;
  /** Hex, shown shortened; the full value stays available on hover and to assistive technology. */
  value: string;
  /** A few words under the value. */
  note?: string;
  /** The reader has just swapped this value. */
  fresh?: boolean;
}

export interface TxCardProps {
  title: string;
  /** The outcome of checking this transaction, shown under its signature. */
  tag?: ReactNode;
  tone?: 'plain' | 'invalid';
  fields: TxField[];
  /** Fields the check on show is reading from this card. */
  used?: readonly FieldName[];
  /** The link back to the card before: drawn solid, dashed when it no longer holds, or not at all. */
  link?: 'ok' | 'broken' | 'none';
  className?: string;
  style?: CSSProperties;
}

/**
 * One transaction: a solid shape holding a public key, a hash and a signature,
 * each a line of text with a hairline above it. Nothing inside it is boxed.
 */
export function TxCard({ title, tag, tone = 'plain', fields, used = [], link = 'none', className, style }: TxCardProps) {
  return (
    <article className={cx('txs-card', className)} data-tone={tone} data-link={link} style={style} aria-label={title}>
      <p className="txs-card-title poster">{title}</p>
      <dl className="txs-fields">
        {fields.map((field) => (
          <div
            key={field.name}
            className="txs-field"
            data-field={field.name}
            data-used={used.includes(field.name)}
            data-fresh={field.fresh === true}
          >
            <dt>{field.label}</dt>
            <dd>
              <HashText key={field.value} className="txs-value t-swap-soft" hash={field.value} lead={10} tail={4} zeros={false} />
              {field.note ? <span className="txs-field-note">{field.note}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
      {tag ? <p className="txs-status">{tag}</p> : null}
    </article>
  );
}
