import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useFigure } from '@/components/site/FigureFrame';
import { SECTION_IDS } from '@/content/types';
import { useT } from '@/i18n/settings';
import { useWidth } from '@/state/useWidth';
import { cx } from '@/utils/cx';
import { COPY } from './conclusion/copy';
import { FLOWS, PARTS, TOUR, builtAt, layoutMachine, selectionOnArrival, stepForPress } from './conclusion/machine';
import type { PartId } from './conclusion/machine';
import { PartPanel } from './conclusion/PartPanel';
import { runOnce } from './conclusion/run';
import './conclusion/conclusion.css';

/** Below this width the channels between columns are too narrow for a word on the arrow. */
const LABELS_FROM = 500;

/**
 * Fig. 12.1. The whole system as one diagram, put together in the order the
 * paper introduces its parts. Each part is a button; the arrows are the
 * hand-offs between them, and what each part shows was really computed by
 * running one payment through the engine.
 */
export default function ConclusionMachine() {
  const t = useT();
  const { step, goTo } = useFigure();
  const head = useId();
  const [ref, width] = useWidth<HTMLDivElement>(520);
  const [selected, setSelected] = useState<PartId>('wallet');
  // The part the reader pressed to bring a step in. It, not the step's first part, is shown on arrival.
  const pressed = useRef<PartId | null>(null);

  const layout = useMemo(() => layoutMachine(width), [width]);
  const run = useMemo(() => runOnce(), []);

  // Each guided step adds the parts of a section or two; the last shows the whole machine.
  const stop = step === null ? undefined : TOUR[step];
  const built = useMemo(() => builtAt(step), [step]);
  useEffect(() => {
    const arrival = selectionOnArrival(step, pressed.current);
    pressed.current = null;
    if (arrival) setSelected(arrival);
  }, [step]);

  const press = (id: PartId) => {
    setSelected(id);
    // A part not yet in place is brought in by the step that introduces it. One already there is only shown.
    const target = stepForPress(step, id);
    if (target !== undefined) {
      pressed.current = id;
      goTo(target);
    }
  };

  const showLabels = width >= LABELS_FROM;

  return (
    <div className="mch">
      <div ref={ref} className="mch-diagram" style={{ height: layout.height }} role="group" aria-label={t(COPY.diagram)}>
        <svg className="mch-wires" width={width} height={layout.height} viewBox={`0 0 ${width} ${layout.height}`} aria-hidden="true">
          <defs>
            {(['plain', 'live', 'ghost'] as const).map((tone) => (
              <marker key={tone} id={`${head}-${tone}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto" markerUnits="userSpaceOnUse">
                <path className="mch-head" data-tone={tone} d="M0 0.5L7.5 4L0 7.5Z" />
              </marker>
            ))}
          </defs>
          {layout.flows.map((path) => {
            const flow = FLOWS.find((entry) => entry.id === path.id) ?? FLOWS[0];
            const tone = !built.has(flow.from) || !built.has(flow.to) ? 'ghost' : flow.from === selected || flow.to === selected ? 'live' : 'plain';
            return (
              <g key={path.id} data-tone={tone}>
                <polyline
                  className="mch-wire"
                  points={path.points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}
                  markerEnd={`url(#${head}-${tone})`}
                />
                {showLabels ? (
                  <text className="mch-wire-label" x={path.label.x} y={path.label.y} textAnchor={path.label.anchor}>
                    {t(COPY.flows[path.id].label)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>

        {PARTS.map((part) => {
          const box = layout.boxes[part.id];
          const state = selected === part.id ? 'selected' : built.has(part.id) ? 'built' : 'ghost';
          return (
            <button
              key={part.id}
              type="button"
              // The parts the current step of the walkthrough is about carry its pointer.
              className={cx('mch-part', stop?.includes(part.id) && 'fig-pointed')}
              data-state={state}
              aria-pressed={selected === part.id}
              style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
              onClick={() => press(part.id)}
            >
              <span className="mch-part-no mono" aria-hidden="true">
                §{part.section}
              </span>
              <span className="mch-part-name">{t(COPY.parts[part.id].name)}</span>
              {state === 'ghost' ? <span className="visually-hidden"> ({t(COPY.notYet)})</span> : null}
            </button>
          );
        })}
      </div>

      <PartPanel id={selected} run={run} />

      {step !== null && !stop ? (
        <p className="fig-status" role="status">
          {t(COPY.whole)}
        </p>
      ) : null}

      <p className="label mch-cap mch-know-cap">{t(COPY.knowTitle)}</p>
      <ol className="mch-know">
        {COPY.know.map((line, index) => (
          <li key={index}>
            <a className="link mono mch-know-no" href={`#${SECTION_IDS[index + 1]}`}>
              §{index + 1}
            </a>
            {t(line)}
          </li>
        ))}
      </ol>
    </div>
  );
}
