import { useEffect, useState } from 'react';
import { SegmentedControl, SegmentedControlItem } from '@/components/base/segmented-control/segmented-control';
import { useFigure } from '@/components/site/FigureFrame';
import { useT } from '@/i18n/settings';
import { COPY } from './spv/copy';
import { ProofScene } from './spv/ProofScene';
import { SizeScene } from './spv/SizeScene';
import { STEPS, afterScene } from './spv/walkthrough';
import type { Scene } from './spv/walkthrough';
import './spv/spv.css';

/**
 * Fig. 8.1. A light wallet checks a payment against block headers alone: a
 * real Merkle branch, folded up hash by hash and compared with the root in a
 * mined header.
 */
export default function SpvProof() {
  const t = useT();
  const { step, goTo } = useFigure();
  const [scene, setScene] = useState<Scene>('proof');

  useEffect(() => {
    if (step !== null && STEPS[step]) setScene(STEPS[step].scene);
  }, [step]);

  const highlight = step !== null && STEPS[step]?.scene === scene ? STEPS[step].highlight : null;

  return (
    <div className="spv">
      <div className="fig-tabs">
        <SegmentedControl
          aria-label={t(COPY.scenes)}
          selectedKeys={new Set([scene])}
          onSelectionChange={(keys) => {
            const next = [...keys][0] as Scene | undefined;
            if (!next) return;
            setScene(next);
            // Keep the walkthrough in step with a scene chosen by hand.
            const target = afterScene(step, next);
            if (target !== undefined) goTo(target);
          }}
        >
          <SegmentedControlItem id="proof">{t(COPY.sceneProof)}</SegmentedControlItem>
          <SegmentedControlItem id="size">{t(COPY.sceneSize)}</SegmentedControlItem>
        </SegmentedControl>
      </div>

      {/* Both scenes stay mounted, so the check keeps its place while the reader looks at sizes. */}
      <ProofScene visible={scene === 'proof'} highlight={highlight === 'size' ? null : highlight} />
      <SizeScene visible={scene === 'size'} highlight={highlight === 'size' ? 'size' : null} />
    </div>
  );
}
