import { useEffect, useState } from 'react';
import { SegmentedControl, SegmentedControlItem } from '@/components/base/segmented-control/segmented-control';
import { useFigure } from '@/components/site/FigureFrame';
import { useT } from '@/i18n/settings';
import { SAMPLES, makeTx } from './incentive/blockPay';
import type { BlockTx, Claim } from './incentive/blockPay';
import { BlockScene } from './incentive/BlockScene';
import { COPY } from './incentive/copy';
import { HonestScene } from './incentive/HonestScene';
import { SupplyScene } from './incentive/SupplyScene';
import './incentive/incentive.css';

type Scene = 'supply' | 'block' | 'honest';
type Highlight = 'height' | 'charts' | 'txs' | 'claim' | null;

/** The guided steps of section 6, mapped to a scene and the part of it to point at. */
const STEPS: { scene: Scene; highlight: Highlight }[] = [
  { scene: 'supply', highlight: 'height' },
  { scene: 'supply', highlight: 'charts' },
  { scene: 'block', highlight: 'txs' },
  { scene: 'block', highlight: 'claim' },
  { scene: 'honest', highlight: null },
];

/** Where the figure opens: the fourth halving, where the subsidy drops to 3.125 BTC. */
const START_HEIGHT = 840_000;
/** A share above one half, the case the paper argues about. */
const START_SHARE = 51;

/**
 * Fig. 6.1. Where coins come from and what a block pays, computed with the
 * same integer arithmetic as Bitcoin Core, and the paper's argument for why
 * a miner keeps to the rules.
 */
export default function IncentiveSupply() {
  const t = useT();
  const { step, goTo } = useFigure();
  const [scene, setScene] = useState<Scene>('supply');
  // One block height for all three scenes, chosen in the first.
  const [height, setHeight] = useState(START_HEIGHT);
  const [txs, setTxs] = useState<BlockTx[]>(() => SAMPLES.slice(0, 3).map(makeTx));
  const [claim, setClaim] = useState<Claim>('exact');
  const [share, setShare] = useState(START_SHARE);

  useEffect(() => {
    if (step === null || !STEPS[step]) return;
    setScene(STEPS[step].scene);
    // Adding up a block's pay starts from a coinbase that claims exactly what it may.
    if (STEPS[step].highlight === 'txs') setClaim('exact');
  }, [step]);

  const highlight = step !== null && STEPS[step]?.scene === scene ? STEPS[step].highlight : null;

  return (
    <div className="inc">
      <div className="fig-tabs">
        <SegmentedControl
          aria-label={t(COPY.scenes)}
          selectedKeys={new Set([scene])}
          onSelectionChange={(keys) => {
            const next = [...keys][0] as Scene | undefined;
            if (!next) return;
            setScene(next);
            // Keep the walkthrough in step with a scene chosen by hand.
            if (step !== null && STEPS[step]?.scene !== next) {
              const first = STEPS.findIndex((entry) => entry.scene === next);
              goTo(first === -1 ? null : first);
            }
          }}
        >
          <SegmentedControlItem id="supply">{t(COPY.sceneSupply)}</SegmentedControlItem>
          <SegmentedControlItem id="block">{t(COPY.sceneBlock)}</SegmentedControlItem>
          <SegmentedControlItem id="honest">{t(COPY.sceneHonest)}</SegmentedControlItem>
        </SegmentedControl>
      </div>

      <div key={scene} className="t-reveal">
        {scene === 'supply' ? (
          <SupplyScene
            height={height}
            onHeight={setHeight}
            highlight={highlight === 'height' || highlight === 'charts' ? highlight : null}
          />
        ) : null}
        {scene === 'block' ? (
          <BlockScene
            height={height}
            onHeight={setHeight}
            txs={txs}
            onTxs={setTxs}
            claim={claim}
            onClaim={setClaim}
            highlight={highlight === 'txs' || highlight === 'claim' ? highlight : null}
          />
        ) : null}
        {scene === 'honest' ? (
          <HonestScene height={height} onHeight={setHeight} share={share} onShare={setShare} />
        ) : null}
      </div>
    </div>
  );
}
