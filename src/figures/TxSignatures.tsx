import { useEffect, useMemo, useRef, useState } from 'react';
import { SegmentedControl, SegmentedControlItem } from '@/components/base/segmented-control/segmented-control';
import { useFigure } from '@/components/site/FigureFrame';
import { UI } from '@/content/ui';
import { useT } from '@/i18n/settings';
import { bytesToHex } from '@/lib/bytes';
import { generateKeyPair } from '@/lib/keys';
import type { KeyPair } from '@/lib/keys';
import { ChainScene } from './txsig/ChainScene';
import type { ChainSpot } from './txsig/ChainScene';
import { buildCoin, signTransfer } from './txsig/coin';
import { COPY } from './txsig/copy';
import { GapScene } from './txsig/GapScene';
import { NOTHING_CHECKED, coinOf, rewrite, startStep, verifyOne } from './txsig/inspection';
import './txsig/txsig.css';

type Scene = 'chain' | 'gap';
/** The part of the figure a guided step points at. */
type Spot = ChainSpot | 'again';

/** The guided steps of section 2, in order: the scene each one plays in and the part it points at. */
const STEPS: readonly { scene: Scene; spot: Spot }[] = [
  { scene: 'chain', spot: 'keys' },
  { scene: 'chain', spot: 'transfer' },
  { scene: 'chain', spot: 'verify' },
  { scene: 'chain', spot: 'rewrite' },
  { scene: 'gap', spot: 'again' },
];
const stepOf = (spot: Spot) => STEPS.findIndex((entry) => entry.spot === spot);

/** Everyone who holds a key in the figure. Throwaway keys, made in the page. */
interface Cast {
  /** Owner 0 is off the left edge, as in the paper's diagram; owners 1 to 3 are shown. */
  owners: KeyPair[];
  attacker: KeyPair;
  /** The second person Owner 2 pays with the same coin. */
  someone: KeyPair;
}

const newCast = (): Cast => ({
  owners: Array.from({ length: 4 }, generateKeyPair),
  attacker: generateKeyPair(),
  someone: generateKeyPair(),
});

/**
 * Fig. 2.1. The paper's chain of signatures with real secp256k1 keys: every
 * hash is SHA-256 and every signature is ECDSA. In the first scene nothing is
 * verified until the reader presses Verify, which checks that transfer there
 * and then; a rewrite changes the coin, so it checks every transfer again.
 * The two transfers of the second scene are verified as they are drawn.
 */
export default function TxSignatures() {
  const t = useT();
  const { step, goTo } = useFigure();
  const [scene, setScene] = useState<Scene>('chain');
  const [cast, setCast] = useState(newCast);
  const [fresh, setFresh] = useState(false);
  const [inspection, setInspection] = useState(NOTHING_CHECKED);
  const [twice, setTwice] = useState(false);
  // Set when the reader's own action moves the walkthrough: that step then keeps the state the reader made.
  const byHand = useRef(false);

  const honest = useMemo(() => buildCoin(cast.owners), [cast]);
  const coin = useMemo(() => coinOf(honest, inspection.forged, cast.attacker.pub), [honest, inspection.forged, cast]);
  const firstSigner = useMemo(() => bytesToHex(cast.owners[0].pub), [cast]);
  const ownerKeys = useMemo(() => cast.owners.slice(1).map((owner) => bytesToHex(owner.pub)), [cast]);
  // Owner 2 spends transaction 2 a second time, paying someone else.
  const second = useMemo(
    () => (twice ? signTransfer(honest[2].prev, cast.someone.pub, cast.owners[2]) : null),
    [twice, honest, cast],
  );

  const entry = step === null ? undefined : STEPS[step];
  const spot = entry?.scene === scene ? entry.spot : null;

  /** Moves the walkthrough to the step that is about what the reader has just done. */
  const follow = (to: Spot) => {
    const target = stepOf(to);
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
    if (current.scene === 'chain') setInspection(startStep);
    else setTwice(false);
  }, [step]);

  return (
    <div className="txs">
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
          <SegmentedControlItem id="chain">{t(COPY.sceneChain)}</SegmentedControlItem>
          <SegmentedControlItem id="gap">{t(COPY.sceneGap)}</SegmentedControlItem>
        </SegmentedControl>
      </div>

      <div key={scene} className="t-reveal">
        {scene === 'chain' ? (
          <ChainScene
            coin={coin}
            inspection={inspection}
            firstSigner={firstSigner}
            ownerKeys={ownerKeys}
            fresh={fresh}
            pointed={spot !== null && spot !== 'again' ? spot : null}
            onVerify={(index) => {
              setFresh(false);
              // The ECDSA check runs here, on the press, not before.
              setInspection(verifyOne(inspection, coin, index, firstSigner));
              // A reader who verifies before the walkthrough gets there has reached that step.
              if (step !== null && step < stepOf('verify')) follow('verify');
            }}
            onForge={(index) => {
              setFresh(false);
              setInspection(rewrite(inspection, honest, index, cast.attacker.pub, firstSigner));
              if (index !== null) follow('rewrite');
            }}
            onNewKeys={() => {
              setCast(newCast());
              setFresh(true);
              setInspection(NOTHING_CHECKED);
              setTwice(false);
            }}
          />
        ) : (
          <GapScene coin={honest} second={second} pointed={spot === 'again'} onSign={() => setTwice(true)} onUndo={() => setTwice(false)} />
        )}
      </div>

      <p className="fig-note txs-warning">{t(UI.demoKeysWarning)}</p>
    </div>
  );
}
