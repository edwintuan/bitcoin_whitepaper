import { useEffect, useState } from 'react';
import { SegmentedControl, SegmentedControlItem } from '@/components/base/segmented-control/segmented-control';
import { useFigure } from '@/components/site/FigureFrame';
import { useT } from '@/i18n/settings';
import { COPY } from './merkle/copy';
import { StorageScene } from './merkle/StorageScene';
import { TreeScene } from './merkle/TreeScene';
import { STEPS, afterScene } from './merkle/walkthrough';
import type { Scene } from './merkle/walkthrough';
import './merkle/merkle.css';

/**
 * Fig. 7.1. A block's transactions hashed into a Merkle root with real double
 * SHA-256, pruned the way the paper describes, and the 80 bytes that are left
 * when everything else is gone.
 */
export default function MerklePrune() {
  const t = useT();
  const { step, goTo } = useFigure();
  const [scene, setScene] = useState<Scene>('tree');

  useEffect(() => {
    if (step !== null && STEPS[step]) setScene(STEPS[step].scene);
  }, [step]);

  const highlight = step !== null && STEPS[step]?.scene === scene ? STEPS[step].highlight : null;

  return (
    <div className="mkl">
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
          <SegmentedControlItem id="tree">{t(COPY.sceneTree)}</SegmentedControlItem>
          <SegmentedControlItem id="storage">{t(COPY.sceneStorage)}</SegmentedControlItem>
        </SegmentedControl>
      </div>

      {/* Both scenes stay mounted, so the tree keeps what the reader did to it. */}
      <TreeScene visible={scene === 'tree'} highlight={highlight === 'interval' ? null : highlight} />
      <StorageScene visible={scene === 'storage'} highlight={highlight === 'interval' ? 'interval' : null} />
    </div>
  );
}
