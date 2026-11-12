import { useEffect, useState } from 'react';
import { SegmentedControl, SegmentedControlItem } from '@/components/base/segmented-control/segmented-control';
import { useFigure } from '@/components/site/FigureFrame';
import { useT } from '@/i18n/settings';
import { AddressPanel } from './privacy/AddressPanel';
import { COPY } from './privacy/copy';
import { LinkageScene } from './privacy/LinkageScene';
import { ModelsScene } from './privacy/ModelsScene';
import type { Model } from './privacy/ModelsScene';
import './privacy/privacy.css';

type Scene = 'models' | 'observer';
type Highlight = 'flow' | 'count' | 'reuse' | 'combine' | 'address';

/**
 * The guided steps of section 10. A step either belongs to a scene, and puts
 * that scene in a given state, or (the last) points at the panel beneath both.
 */
const STEPS: { scene: Scene | null; highlight: Highlight; model?: Model; reuse?: boolean; combine?: boolean }[] = [
  { scene: 'models', highlight: 'flow', model: 'traditional' },
  { scene: 'models', highlight: 'flow', model: 'modern' },
  { scene: 'observer', highlight: 'count', reuse: false, combine: false },
  { scene: 'observer', highlight: 'reuse', reuse: true, combine: false },
  { scene: 'observer', highlight: 'combine', reuse: false, combine: true },
  { scene: null, highlight: 'address' },
];

/**
 * Fig. 10.1. Where the wall stands in the paper's two privacy models, what an
 * observer of the public ledger can link when a wallet is careless, and how a
 * public key becomes an address. The ledger is built from real transactions
 * and the linking is computed, not drawn.
 */
export default function PrivacyLinkage() {
  const t = useT();
  const { step, goTo } = useFigure();
  const [scene, setScene] = useState<Scene>('models');
  const [model, setModel] = useState<Model>('traditional');
  const [reuse, setReuse] = useState(false);
  const [combine, setCombine] = useState(false);

  useEffect(() => {
    const entry = step === null ? undefined : STEPS[step];
    if (!entry) return;
    if (entry.scene) setScene(entry.scene);
    if (entry.model) setModel(entry.model);
    if (entry.reuse !== undefined) setReuse(entry.reuse);
    if (entry.combine !== undefined) setCombine(entry.combine);
  }, [step]);

  const entry = step === null ? undefined : STEPS[step];
  const highlight = entry && (entry.scene === null || entry.scene === scene) ? entry.highlight : null;

  // A state chosen by hand moves the walkthrough to the step that describes it, or out of it.
  const follow = (matches: (candidate: (typeof STEPS)[number]) => boolean) => {
    if (step === null) return;
    const index = STEPS.findIndex(matches);
    goTo(index === -1 ? null : index);
  };
  const chooseModel = (next: Model) => {
    setModel(next);
    follow((candidate) => candidate.model === next);
  };
  const chooseSwitches = (nextReuse: boolean, nextCombine: boolean) => {
    setReuse(nextReuse);
    setCombine(nextCombine);
    follow((candidate) => candidate.reuse === nextReuse && candidate.combine === nextCombine);
  };

  return (
    <div className="prv">
      <div className="fig-tabs">
        <SegmentedControl
          aria-label={t(COPY.scenes)}
          selectedKeys={new Set([scene])}
          onSelectionChange={(keys) => {
            const next = [...keys][0] as Scene | undefined;
            if (!next) return;
            setScene(next);
            // Keep the walkthrough in step with a scene chosen by hand.
            if (entry && entry.scene !== null && entry.scene !== next) {
              const first = STEPS.findIndex((candidate) => candidate.scene === next);
              goTo(first === -1 ? null : first);
            }
          }}
        >
          <SegmentedControlItem id="models">{t(COPY.sceneModels)}</SegmentedControlItem>
          <SegmentedControlItem id="observer">{t(COPY.sceneObserver)}</SegmentedControlItem>
        </SegmentedControl>
      </div>

      <div key={scene} className="fig-group t-reveal">
        {scene === 'models' ? <ModelsScene model={model} onModel={chooseModel} pointed={highlight === 'flow'} /> : null}
        {scene === 'observer' ? (
          <LinkageScene
            reuse={reuse}
            combine={combine}
            onReuse={(value) => chooseSwitches(value, combine)}
            onCombine={(value) => chooseSwitches(reuse, value)}
            pointed={highlight === 'count' || highlight === 'reuse' || highlight === 'combine' ? highlight : null}
          />
        ) : null}
      </div>

      <AddressPanel pointed={highlight === 'address'} />
    </div>
  );
}
