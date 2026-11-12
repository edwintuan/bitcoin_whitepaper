import { SegmentedControl, SegmentedControlItem } from '@/components/base/segmented-control/segmented-control';
import { useT } from '@/i18n/settings';
import { fill, formatBtc, shortHex } from '@/text/format';
import { cx } from '@/utils/cx';
import { COPY } from './copy';
import { examplePayment } from './scenario';

export type Model = 'traditional' | 'modern';

/** When the example payment was made. The two sides of the wall quote the same moment. */
const TIME = '14:02';

/** A connector between two boxes: a plain line where the paper draws a line, an arrow where it draws an arrow. */
function Link({ arrow = false }: { arrow?: boolean }) {
  return <span className="prv-link" data-arrow={arrow} aria-hidden="true" />;
}

interface ModelsSceneProps {
  model: Model;
  onModel(model: Model): void;
  /** True while the walkthrough is talking about where the wall stands. */
  pointed?: boolean;
}

/**
 * The paper's diagram, switchable: the same payment under the bank's model and
 * under the new one, with the wall where the paper draws it and what each
 * side of the wall can read.
 */
export function ModelsScene({ model, onModel, pointed = false }: ModelsSceneProps) {
  const t = useT();
  const traditional = model === 'traditional';

  // A real payment from the figure's own ledger: Alice's first coin, spent at the shop.
  const payment = examplePayment();
  const hers = shortHex(payment.from, 8, 4);
  const theirs = shortHex(payment.to, 8, 4);
  const amount = formatBtc(payment.amount);
  // The sentence that says whose the address is, with the address kept in one piece.
  const [beforeAddress, afterAddress] = t(COPY.ownerRecord).split('{address}');

  const wall = (
    <span className="prv-wall" aria-hidden="true">
      <b className="label">{t(COPY.wall)}</b>
    </span>
  );

  return (
    <div className="prv-models fig-stack">
      <SegmentedControl
        aria-label={t(COPY.modelLabel)}
        selectedKeys={new Set([model])}
        onSelectionChange={(keys) => {
          const next = [...keys][0] as Model | undefined;
          if (next) onModel(next);
        }}
      >
        <SegmentedControlItem id="traditional">{t(COPY.traditional)}</SegmentedControlItem>
        <SegmentedControlItem id="modern">{t(COPY.modern)}</SegmentedControlItem>
      </SegmentedControl>

      <div
        key={model}
        className={cx('prv-flow t-swap-soft', pointed && 'fig-pointed')}
        role="img"
        aria-label={t(traditional ? COPY.flowTraditional : COPY.flowModern)}
      >
        <span className="prv-box">{t(COPY.boxes.identities)}</span>
        {traditional ? (
          <>
            <Link />
            <span className="prv-box">{t(COPY.boxes.transactions)}</span>
            <Link arrow />
            <span className="prv-box">{t(COPY.boxes.thirdParty)}</span>
            <Link arrow />
            <span className="prv-box">{t(COPY.boxes.counterparty)}</span>
            {wall}
            <span className="prv-box" data-open="true">
              {t(COPY.boxes.public)}
            </span>
          </>
        ) : (
          <>
            {wall}
            <span className="prv-box" data-open="true">
              {t(COPY.boxes.transactions)}
            </span>
            <Link arrow />
            <span className="prv-box" data-open="true">
              {t(COPY.boxes.public)}
            </span>
          </>
        )}
      </div>

      <p className="label prv-cap">{t(COPY.onePayment)}</p>
      <dl key={`${model}-sides`} className="prv-sides t-swap-soft">
        <div>
          <dt className="label">{t(COPY.behind)}</dt>
          <dd className="mono prv-record">
            {traditional ? (
              fill(t(COPY.bankRecord), { amount, time: TIME })
            ) : (
              <>
                {beforeAddress}
                <span className="prv-token">{hers}</span>
                {afterAddress}
              </>
            )}
          </dd>
          <dd className="fig-note">{t(traditional ? COPY.bankNote : COPY.ownerNote)}</dd>
        </div>
        <div data-open="true">
          <dt className="label">{t(COPY.inPublic)}</dt>
          <dd className="mono prv-record">
            {traditional ? (
              t(COPY.publicNothing)
            ) : (
              // Each part stays whole: the line may break between them, never inside an address.
              <>
                <span className="prv-token">{TIME}</span> <span className="prv-token">{hers} →</span> <span className="prv-token">{theirs}</span>{' '}
                <span className="prv-token">{amount} BTC</span>
              </>
            )}
          </dd>
          <dd className="fig-note">{t(traditional ? COPY.publicNothingNote : COPY.tapeNote)}</dd>
        </div>
      </dl>

      <p className="fig-status" role="status">
        {t(traditional ? COPY.statusTraditional : COPY.statusModern)}
      </p>
    </div>
  );
}
