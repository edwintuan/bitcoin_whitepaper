import { useEffect, useState } from 'react';
import { SegmentedControl, SegmentedControlItem } from '@/components/base/segmented-control/segmented-control';
import { useFigure } from '@/components/site/FigureFrame';
import { useT } from '@/i18n/settings';
import { COPY } from './pow/copy';
import { GenesisScene } from './pow/GenesisScene';
import { MineScene } from './pow/MineScene';
import type { MineHighlight } from './pow/MineScene';
import { RetargetScene } from './pow/RetargetScene';
import { TamperScene } from './pow/TamperScene';
import './pow/pow.css';

type Scene = 'mine' | 'tamper' | 'genesis' | 'retarget';

/** The guided steps of section 4, mapped to a scene and the part of it to point at. */
const STEPS: { scene: Scene; highlight: MineHighlight }[] = [
  { scene: 'mine', highlight: 'header' },
  { scene: 'mine', highlight: 'difficulty' },
  { scene: 'mine', highlight: 'mine' },
  { scene: 'tamper', highlight: null },
  { scene: 'genesis', highlight: null },
];

/**
 * Fig. 4.1. Proof-of-work with nothing simulated: a real 80-byte header,
 * real double SHA-256, a difficulty the reader sets.
 */
export default function PowMiner() {
  const t = useT();
  const { step, goTo } = useFigure();
  const [scene, setScene] = useState<Scene>('mine');

  useEffect(() => {
    if (step !== null && STEPS[step]) setScene(STEPS[step].scene);
  }, [step]);

  const highlight = step !== null && STEPS[step]?.scene === scene ? STEPS[step].highlight : null;

  return (
    <div className="pow">
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
          <SegmentedControlItem id="mine">{t(COPY.sceneMine)}</SegmentedControlItem>
          <SegmentedControlItem id="tamper">{t(COPY.sceneTamper)}</SegmentedControlItem>
          <SegmentedControlItem id="genesis">{t(COPY.sceneGenesis)}</SegmentedControlItem>
          <SegmentedControlItem id="retarget">{t(COPY.sceneRetarget)}</SegmentedControlItem>
        </SegmentedControl>
      </div>

      <div key={scene} className="t-reveal">
        {scene === 'mine' ? <MineScene highlight={highlight} /> : null}
        {scene === 'tamper' ? <TamperScene /> : null}
        {scene === 'genesis' ? <GenesisScene /> : null}
        {scene === 'retarget' ? <RetargetScene /> : null}
      </div>
    </div>
  );
}
