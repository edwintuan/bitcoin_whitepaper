import { useEffect, useState } from 'react';
import { SegmentedControl, SegmentedControlItem } from '@/components/base/segmented-control/segmented-control';
import { useFigure } from '@/components/site/FigureFrame';
import { useT } from '@/i18n/settings';
import { COPY } from './pow/copy';
import { GenesisScene } from './pow/GenesisScene';
import { MineScene } from './pow/MineScene';
import { RetargetScene } from './pow/RetargetScene';
import { STEPS } from './pow/steps';
import type { Scene } from './pow/steps';
import { TamperScene } from './pow/TamperScene';
import './pow/pow.css';

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

  // The pointer shows only while the scene on screen is the one the step is about.
  const point = step !== null && STEPS[step]?.scene === scene ? STEPS[step].point : null;

  return (
    <>
      <SegmentedControl
        className="fig-tabs"
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

      {scene === 'mine' ? <MineScene point={point} /> : null}
      {scene === 'tamper' ? <TamperScene point={point} /> : null}
      {scene === 'genesis' ? <GenesisScene point={point} /> : null}
      {scene === 'retarget' ? <RetargetScene point={point} /> : null}
    </>
  );
}
