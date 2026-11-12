import { Component, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, LazyExoticComponent, ReactNode } from 'react';
import type { SectionContent } from '@/content/types';
import { UI } from '@/content/ui';
import { useSettings, useT } from '@/i18n/settings';
import { fill } from '@/text/format';
import { useInView } from '@/state/useInView';
import { usePageVisible, useReducedMotion } from '@/state/useMediaQuery';
import { FigureContext } from './figureContext';
import { scrollToShow } from './followPointer';
import type { FigureApi } from './figureContext';
import { Rich } from './Rich';

/* ------------------------------------------------------------------ context */

/**
 * Every figure calls `useFigure`. React to `step` by putting the figure into
 * that step's state; stop timers and animation frames while `active` is
 * false; replace travel with instant changes when `reducedMotion` is true.
 * The context itself is in figureContext.ts; see there for why.
 */
export { useFigure } from './figureContext';
export type { FigureApi } from './figureContext';

/* ------------------------------------------------------------- lazy loading */

// One chunk per figure: src/figures/<Name>.tsx with a default export.
const loaders = import.meta.glob<{ default: ComponentType }>(['../../figures/*.tsx', '!**/*.test.tsx']);
const loaded = new Map<string, LazyExoticComponent<ComponentType>>();

function figureFor(name: string): LazyExoticComponent<ComponentType> | null {
  const loader = loaders[`../../figures/${name}.tsx`];
  if (!loader) return null;
  let component = loaded.get(name);
  if (!component) {
    component = lazy(loader);
    loaded.set(name, component);
  }
  return component;
}

/* ----------------------------------------------------------- error boundary */

class FigureBoundary extends Component<
  { fallback: ReactNode; onFail(): void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFail();
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/* -------------------------------------------------------------------- frame */

export function FigureFrame({ section }: { section: SectionContent }) {
  const t = useT();
  const { lang } = useSettings();
  const figure = section.figure;

  const ref = useRef<HTMLElement>(null);
  const near = useInView(ref, { rootMargin: '900px 0px', once: true });
  const onScreen = useInView(ref, { rootMargin: '120px 0px' });
  const pageVisible = usePageVisible();
  const reducedMotion = useReducedMotion();

  // A figure that could not start has no walkthrough either: its steps would be instructions for nothing.
  const [failed, setFailed] = useState(false);
  const steps = figure && !failed ? figure.steps[lang] : [];
  const [step, setStep] = useState<number | null>(steps.length > 0 ? 0 : null);
  const goTo = useCallback(
    (next: number | null) => setStep(next === null ? null : Math.max(0, Math.min(steps.length - 1, next))),
    [steps.length],
  );

  // Leaving the walkthrough, or replaying it, replaces the button the reader
  // has just pressed. This says where the keyboard focus goes instead.
  const replayButton = useRef<HTMLButtonElement>(null);
  const forwardButton = useRef<HTMLButtonElement>(null);
  const focusAfter = useRef<'replay' | 'forward' | null>(null);
  useEffect(() => {
    if (focusAfter.current === 'replay') replayButton.current?.focus();
    if (focusAfter.current === 'forward') forwardButton.current?.focus();
    focusAfter.current = null;
  }, [step]);

  // A step the reader asked for may point at a part that is off screen: a
  // tall figure on a phone has its Mine button below the fold. The page then
  // moves just far enough to show it. Only a press of Back, Next or replay
  // does this; a step the figure itself moves to follows the reader's own
  // hand, which is already where the action is.
  const stepsBox = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const follow = useRef(false);
  const stepTo = (next: number | null) => {
    follow.current = true;
    goTo(next);
  };
  useEffect(() => {
    if (!follow.current) return;
    follow.current = false;
    // Two frames: a figure may open another scene in an effect of its own before the pointer exists.
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        const pointed = stage.current?.querySelector('.fig-pointed');
        if (!pointed) return;
        const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) || 0;
        const part = pointed.getBoundingClientRect();
        const by = scrollToShow(
          { top: part.top, bottom: part.bottom },
          // The steps stay under the top bar while the figure is on screen, so the room starts below them.
          { top: bar + (stepsBox.current?.offsetHeight ?? 0) + 12, bottom: window.innerHeight - 12 },
        );
        if (by !== 0) window.scrollBy({ top: by, behavior: reducedMotion ? 'instant' : 'smooth' });
      });
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [step, reducedMotion]);

  // The steps stick to the top while the reader walks through a tall figure.
  // A control reached with Tab must not end up hidden behind them.
  const uncover = (target: HTMLElement) => {
    const steps = stepsBox.current;
    if (!steps || step === null || !target.matches(':focus-visible')) return;
    const covered = steps.getBoundingClientRect().bottom + 8 - target.getBoundingClientRect().top;
    if (covered > 0) window.scrollBy({ top: -covered, behavior: 'instant' });
  };

  const api = useMemo<FigureApi>(
    () => ({ step, total: steps.length, goTo, active: onScreen && pageVisible, reducedMotion }),
    [step, steps.length, goTo, onScreen, pageVisible, reducedMotion],
  );

  if (!figure) return null;
  const Figure = figureFor(figure.component);
  const failure = <p className="figure-failed ui">{t(UI.figureFailed)}</p>;
  const current = step === null ? null : steps[step];

  return (
    <figure ref={ref} className="figure panel" aria-labelledby={`${section.id}-fig`}>
      <figcaption id={`${section.id}-fig`} className="figure-cap label">
        <span>
          {t(UI.figure)} {section.number}.1
        </span>
        <span className="figure-cap-title">{t(figure.title)}</span>
      </figcaption>

      {steps.length > 0 ? (
        <div ref={stepsBox} className="figure-steps" data-free={step === null}>
          {current && step !== null ? (
            <>
              {/* Keyed by language: a change of language replaces the region, which says nothing; a step changes its text, which is announced. */}
              <div key={lang} className="figure-step-text" aria-live="polite">
                <p className="figure-step-title">
                  <span className="figure-step-count mono">{fill(t(UI.stepCount), { n: step + 1, total: steps.length })}</span>
                  <span key={`${lang}-${step}`} className="t-swap-soft">
                    {current.title}
                  </span>
                </p>
                <p key={`${lang}-${step}-text`} className="figure-step-body ui t-swap-soft">
                  <Rich text={current.text} />
                </p>
              </div>
              <div className="figure-step-nav">
                {/* aria-disabled, not disabled: a button that disables itself when pressed loses the focus. */}
                <button
                  type="button"
                  className="btn btn-sm btn-line"
                  aria-disabled={step === 0}
                  onClick={() => {
                    if (step > 0) stepTo(step - 1);
                  }}
                >
                  {t(UI.stepPrev)}
                </button>
                {step < steps.length - 1 ? (
                  <button ref={forwardButton} type="button" className="btn btn-sm btn-dark" onClick={() => stepTo(step + 1)}>
                    {t(UI.stepNext)}
                  </button>
                ) : (
                  <button
                    ref={forwardButton}
                    type="button"
                    className="btn btn-sm btn-dark"
                    onClick={() => {
                      focusAfter.current = 'replay';
                      goTo(null);
                    }}
                  >
                    {t(UI.stepSkip)}
                  </button>
                )}
              </div>
            </>
          ) : (
            <button
              ref={replayButton}
              type="button"
              className="figure-replay label"
              onClick={() => {
                focusAfter.current = 'forward';
                stepTo(0);
              }}
            >
              {t(UI.stepRestart)}
            </button>
          )}
        </div>
      ) : null}

      <div ref={stage} className="figure-stage" onFocus={(event) => uncover(event.target)}>
        <FigureContext.Provider value={api}>
          {Figure && near ? (
            <FigureBoundary fallback={failure} onFail={() => setFailed(true)}>
              <Suspense fallback={<FigureSkeleton label={t(UI.figureLoading)} />}>
                <div className="t-reveal">
                  <Figure />
                </div>
              </Suspense>
            </FigureBoundary>
          ) : Figure ? (
            <FigureSkeleton label={t(UI.figureLoading)} />
          ) : (
            failure
          )}
        </FigureContext.Provider>
      </div>
    </figure>
  );
}

function FigureSkeleton({ label }: { label: string }) {
  return (
    <div className="figure-skeleton" role="status">
      <span className="visually-hidden">{label}</span>
    </div>
  );
}
