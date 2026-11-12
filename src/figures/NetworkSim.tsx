import { useEffect, useState } from 'react';
import { SegmentedControl, SegmentedControlItem } from '@/components/base/segmented-control/segmented-control';
import { useFigure } from '@/components/site/FigureFrame';
import { useT } from '@/i18n/settings';
import { COPY } from './network/copy';
import { NetworkScene } from './network/NetworkScene';
import { useNetwork } from './network/useNetwork';
import { NETWORK_STEPS, focusNode, hintFor } from './network/walkthrough';
import { WireScene } from './network/WireScene';
import './network/network.css';

type Scene = 'network' | 'wire';

/** The guided steps of section 5: five in the network scene, then the bytes. */
const sceneOf = (step: number): Scene => (step < NETWORK_STEPS ? 'network' : 'wire');
const WIRE_STEP = NETWORK_STEPS;

/**
 * Fig. 5.1. The paper's six steps on a ten-node network that gossips for
 * real (a seeded simulation), and the same conversation as bytes on the wire.
 */
export default function NetworkSim() {
  const t = useT();
  const { step, goTo, active, reducedMotion } = useFigure();
  const [scene, setScene] = useState<Scene>('network');
  const [selected, setSelected] = useState<number | null>(null);
  const net = useNetwork({ active: active && scene === 'network', still: reducedMotion });
  const { enter } = net;

  // Each guided step starts from a known state of the network.
  useEffect(() => {
    if (step === null) return;
    setScene(sceneOf(step));
    if (sceneOf(step) !== 'network') return;
    const snap = enter(step);
    setSelected((current) => focusNode(step, snap, current));
  }, [step, enter]);

  const hint =
    step !== null && scene === 'network' && sceneOf(step) === 'network' ? hintFor(step, net.snap, selected) : null;

  return (
    <div className="net">
      <div className="fig-tabs">
        <SegmentedControl
          aria-label={t(COPY.scenes)}
          selectedKeys={new Set([scene])}
          onSelectionChange={(keys) => {
            const next = [...keys][0] as Scene | undefined;
            if (!next) return;
            setScene(next);
            // Keep the walkthrough in step with a scene chosen by hand. Going back to the
            // network leaves the guided path, so the reader's network is not reset.
            if (step !== null && sceneOf(step) !== next) goTo(next === 'wire' ? WIRE_STEP : null);
          }}
        >
          <SegmentedControlItem id="network">{t(COPY.sceneNetwork)}</SegmentedControlItem>
          <SegmentedControlItem id="wire">{t(COPY.sceneWire)}</SegmentedControlItem>
        </SegmentedControl>
      </div>

      <div key={scene} className="t-reveal">
        {scene === 'network' ? (
          <NetworkScene net={net} hint={hint} selected={selected} onSelect={setSelected} still={reducedMotion} />
        ) : (
          <WireScene />
        )}
      </div>
    </div>
  );
}
