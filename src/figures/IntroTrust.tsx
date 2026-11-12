import { useEffect, useRef, useState } from 'react';
import { SegmentedControl, SegmentedControlItem } from '@/components/base/segmented-control/segmented-control';
import { useFigure } from '@/components/site/FigureFrame';
import { useT } from '@/i18n/settings';
import { BankScene } from './intro/BankScene';
import { COPY } from './intro/copy';
import { CopyScene } from './intro/CopyScene';
import { give, newCoin, newPayment, resetCoin, setMint, stepPayment } from './intro/trust';
import type { PaymentAction } from './intro/trust';
import './intro/intro.css';

type Scene = 'bank' | 'copy';
/** What a guided step asks the reader to do. */
type Spot = 'bank-pay' | 'bank-dispute' | 'direct' | 'give' | 'mint';

/** The guided steps of section 1, in order: the scene each one plays in and what it asks for. */
const STEPS: readonly { scene: Scene; spot: Spot }[] = [
  { scene: 'bank', spot: 'bank-pay' },
  { scene: 'bank', spot: 'bank-dispute' },
  { scene: 'bank', spot: 'direct' },
  { scene: 'copy', spot: 'give' },
  { scene: 'copy', spot: 'mint' },
];

/**
 * Fig. 1.1. The introduction's argument as two small machines: a payment that
 * a bank can undo, and a digital coin that can be spent twice until a mint is
 * put in charge. No cryptography yet; that starts in section 2.
 */
export default function IntroTrust() {
  const t = useT();
  const { step, goTo } = useFigure();
  const [scene, setScene] = useState<Scene>('bank');
  const [bank, setBank] = useState(() => newPayment('bank'));
  const [direct, setDirect] = useState(() => newPayment('direct'));
  const [coin, setCoin] = useState(newCoin);
  // Set when the reader's own action moves the walkthrough: that step then keeps the state the reader made.
  const byHand = useRef(false);

  const entry = step === null ? undefined : STEPS[step];
  const spot = entry?.scene === scene ? entry.spot : null;

  /** Moves the walkthrough to the step that asks for what the reader has just done. */
  const follow = (to: Spot) => {
    const target = STEPS.findIndex((candidate) => candidate.spot === to);
    if (step === null || step === target) return;
    byHand.current = true;
    goTo(target);
  };

  // Each guided step starts from the state its instructions assume.
  useEffect(() => {
    const current = step === null ? undefined : STEPS[step];
    if (!current) return;
    setScene(current.scene);
    if (byHand.current) {
      byHand.current = false;
      return;
    }
    if (current.spot === 'bank-pay') setBank(newPayment('bank'));
    // "Dispute the payment" needs a payment to dispute.
    if (current.spot === 'bank-dispute') setBank(stepPayment(newPayment('bank'), 'pay'));
    if (current.spot === 'direct') setDirect(newPayment('direct'));
    if (current.spot === 'give') setCoin(newCoin());
    // The reader is about to switch the mint on.
    if (current.spot === 'mint') setCoin((held) => setMint(held, false));
  }, [step]);

  const onBank = (action: PaymentAction) => {
    setBank((payment) => stepPayment(payment, action));
    follow(action === 'dispute' ? 'bank-dispute' : 'bank-pay');
  };

  const onDirect = (action: PaymentAction) => {
    setDirect((payment) => stepPayment(payment, action));
    follow('direct');
  };

  const resetPayments = () => {
    setBank((payment) => stepPayment(payment, 'reset'));
    setDirect((payment) => stepPayment(payment, 'reset'));
    // With nothing paid there is nothing to dispute.
    if (spot === 'bank-dispute') follow('bank-pay');
  };

  return (
    <div className="itr">
      <div className="fig-tabs">
        <SegmentedControl
          aria-label={t(COPY.scenes)}
          selectedKeys={new Set([scene])}
          onSelectionChange={(keys) => {
            const next = [...keys][0] as Scene | undefined;
            if (!next) return;
            setScene(next);
            // Keep the walkthrough in step with a scene chosen by hand.
            if (entry && entry.scene !== next) {
              goTo(STEPS.findIndex((candidate) => candidate.scene === next));
            }
          }}
        >
          <SegmentedControlItem id="bank">{t(COPY.sceneBank)}</SegmentedControlItem>
          <SegmentedControlItem id="copy">{t(COPY.sceneCopy)}</SegmentedControlItem>
        </SegmentedControl>
      </div>

      <div key={scene} className="t-reveal">
        {scene === 'bank' ? (
          <BankScene
            bank={bank}
            direct={direct}
            pointed={spot === 'direct' ? 'direct' : spot === 'bank-pay' || spot === 'bank-dispute' ? 'bank' : null}
            onBank={onBank}
            onDirect={onDirect}
            onReset={resetPayments}
          />
        ) : (
          <CopyScene
            coin={coin}
            pointed={spot === 'give' || spot === 'mint' ? spot : null}
            onGive={(to) => setCoin((held) => give(held, to))}
            onMint={(on) => {
              setCoin((held) => setMint(held, on));
              // The mint is what the last step is about; without it the coin is back in the step before.
              follow(on ? 'mint' : 'give');
            }}
            onReset={() => setCoin(resetCoin)}
          />
        )}
      </div>
    </div>
  );
}
