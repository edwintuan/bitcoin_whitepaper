import { useEffect, useMemo, useRef, useState } from 'react';
import { SegmentedControl, SegmentedControlItem } from '@/components/base/segmented-control/segmented-control';
import { Slider } from '@/components/base/slider/slider';
import { useFigure } from '@/components/site/FigureFrame';
import { useT } from '@/i18n/settings';
import { fill } from '@/text/format';
import { cx } from '@/utils/cx';
import { CalculatorScene } from './attack/CalculatorScene';
import { zRange } from './attack/chart';
import { CodeScene } from './attack/CodeScene';
import { COPY } from './attack/copy';
import { RaceScene } from './attack/RaceScene';
import { STEPS, onArrival, stepForScene } from './attack/steps';
import type { Scene } from './attack/steps';
import { plainVars, withVars } from './attack/vars';
import './attack/attack.css';

/**
 * Fig. 11.1. The paper's own function, `AttackerSuccessProbability`, with its
 * two inputs on sliders: as a number and a curve, as code with its loop laid
 * open, and beside a simulated race that measures something subtly different.
 *
 * z is the paper's z everywhere: blocks on top of the block that holds the
 * payment, one fewer than the number of confirmations.
 */
export default function AttackCalculator() {
  const t = useT();
  const { step, goTo } = useFigure();
  const [scene, setScene] = useState<Scene>('calculator');
  const [percent, setPercent] = useState(10);
  const [blocks, setBlocks] = useState(5);
  // The step this figure asked for itself, to follow a scene the reader opened by hand.
  const followed = useRef<number | null | undefined>(undefined);

  // A step reached with Next or Back sets the inputs its text relies on. One the
  // walkthrough only followed the reader to leaves the reader's inputs alone.
  useEffect(() => {
    const arrival = onArrival(step, followed.current === step);
    followed.current = undefined;
    if (arrival.scene) setScene(arrival.scene);
    if (arrival.percent !== undefined) setPercent(arrival.percent);
    if (arrival.z !== undefined) setBlocks(arrival.z);
  }, [step]);

  const q = percent / 100;
  const zMax = useMemo(() => zRange(q), [q]);
  // A smaller share shortens the axis; the chosen z never lies beyond it.
  const z = Math.min(blocks, zMax);

  // The engine refuses a share outside 0 … 1 and a z that is not a whole number of blocks.
  const choosePercent = (value: number) => setPercent(Math.min(49, Math.max(1, Math.round(value))));
  const chooseBlocks = (value: number) => setBlocks(Math.max(0, Math.round(value)));

  const chooseScene = (next: Scene) => {
    if (next === scene) return;
    setScene(next);
    // Keep the walkthrough in step with a scene opened by hand: on the step that
    // describes what is now on screen, or aside if no step does.
    if (step !== null && STEPS[step]?.scene !== next) {
      const target = stepForScene(next, { percent, z });
      followed.current = target;
      goTo(target);
    }
  };

  const highlight = step !== null && STEPS[step]?.scene === scene ? STEPS[step].highlight : null;

  return (
    <div className="atk">
      <div className="fig-tabs">
        <SegmentedControl
          aria-label={t(COPY.scenes)}
          selectedKeys={new Set([scene])}
          onSelectionChange={(keys) => {
            const next = [...keys][0] as Scene | undefined;
            if (next) chooseScene(next);
          }}
        >
          <SegmentedControlItem id="calculator">{t(COPY.sceneCalculator)}</SegmentedControlItem>
          <SegmentedControlItem id="code">{t(COPY.sceneCode)}</SegmentedControlItem>
          <SegmentedControlItem id="race">{t(COPY.sceneRace)}</SegmentedControlItem>
        </SegmentedControl>
      </div>

      <div className="fig-group">
        {/* The words above a slider are its visible label; the thumb carries the same words as its name. */}
        <div className={cx('atk-input', highlight === 'q' && 'fig-pointed')}>
          <p className="label">{withVars(t(COPY.share))}</p>
          <p className="stat-value">{percent}%</p>
          <Slider
            className="atk-slider"
            thumbLabel={plainVars(t(COPY.share))}
            minValue={1}
            maxValue={49}
            step={1}
            value={percent}
            onChange={choosePercent}
            formatOptions={{ style: 'unit', unit: 'percent' }}
          />
          <p className="mono atk-sub">{fill(t(COPY.honestShare), { p: (1 - q).toFixed(2) })}</p>
        </div>
        <div className={cx('atk-input', highlight === 'z' && 'fig-pointed')}>
          <p className="label">{withVars(t(COPY.blocks))}</p>
          <p className="stat-value">{z}</p>
          <Slider className="atk-slider" thumbLabel={plainVars(t(COPY.blocks))} minValue={0} maxValue={zMax} step={1} value={z} onChange={chooseBlocks} />
          <p className="mono atk-sub">{z === 0 ? t(COPY.confirmationOne) : fill(t(COPY.confirmationMany), { count: z + 1 })}</p>
        </div>
        <p className="fig-note atk-znote">{t(COPY.zNote)}</p>
      </div>

      <div key={scene} className="fig-group t-reveal">
        {scene === 'calculator' ? <CalculatorScene percent={percent} z={z} zMax={zMax} pointed={highlight === 'wait'} /> : null}
        {scene === 'code' ? (
          <CodeScene key={`${percent}/${z}`} percent={percent} z={z} pointed={highlight === 'watch' ? 'watch' : highlight === 'tables' ? 'tables' : null} />
        ) : null}
        {scene === 'race' ? <RaceScene key={`${percent}/${z}`} percent={percent} z={z} pointed={highlight === 'tally'} /> : null}
      </div>
    </div>
  );
}
