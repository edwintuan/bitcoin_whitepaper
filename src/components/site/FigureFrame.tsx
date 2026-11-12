import { Component, Suspense, createContext, lazy, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ComponentType, LazyExoticComponent, ReactNode } from 'react';
import type { SectionContent } from '@/content/types';
import { UI } from '@/content/ui';
import { useSettings, useT } from '@/i18n/settings';
import { useInView } from '@/state/useInView';
import { usePageVisible, useReducedMotion } from '@/state/useMediaQuery';
import { Rich } from './Rich';

/* ------------------------------------------------------------------ context */

export interface FigureApi {
  /** Index of the guided step being shown, or null once the reader explores freely. */
  step: number | null;
  /** Number of guided steps. */
  total: number;
  goTo(step: number | null): void;
  /** False while the figure is off screen or the tab is hidden: pause all work. */
  active: boolean;
  reducedMotion: boolean;
}

const FigureContext = createContext<FigureApi>({
  step: null,
  total: 0,
  goTo: () => {},
  active: true,
  reducedMotion: false,
});

/**
 * Every figure calls this. React to `step` by putting the figure into that
 * step's state; stop timers and animation frames while `active` is false;
 * replace travel with instant changes when `reducedMotion` is true.
 */
export const useFigure = () => useContext(FigureContext);

/* ------------------------------------------------------------- lazy loading */

// One chunk per figure: src/figures/<Name>.tsx with a default export.
const loaders = import.meta.glob<{ default: ComponentType }>('../../figures/*.tsx');
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

class FigureBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
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

  const steps = figure ? figure.steps[lang] : [];
  const [step, setStep] = useState<number | null>(steps.length > 0 ? 0 : null);
  const goTo = useCallback(
    (next: number | null) => setStep(next === null ? null : Math.max(0, Math.min(steps.length - 1, next))),
    [steps.length],
  );

  const api = useMemo<FigureApi>(
    () => ({ step, total: steps.length, goTo, active: onScreen && pageVisible, reducedMotion }),
    [step, steps.length, goTo, onScreen, pageVisible, reducedMotion],
  );

  if (!figure) return null;
  const Figure = figureFor(figure.component);
  const failed = <p className="figure-failed ui">{t(UI.figureFailed)}</p>;
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
        <div className="figure-steps" data-free={step === null}>
          {current && step !== null ? (
            <>
              <div className="figure-step-text" aria-live="polite">
                <p className="figure-step-title">
                  <span className="figure-step-count mono">
                    {step + 1}
                    {lang === 'en' ? ' / ' : '／'}
                    {steps.length}
                  </span>
                  <span key={`${lang}-${step}`} className="t-swap-soft">
                    {current.title}
                  </span>
                </p>
                <p key={`${lang}-${step}-text`} className="figure-step-body ui t-swap-soft">
                  <Rich text={current.text} />
                </p>
              </div>
              <div className="figure-step-nav">
                <button type="button" className="btn btn-sm btn-line" onClick={() => goTo(step - 1)} disabled={step === 0}>
                  {t(UI.stepPrev)}
                </button>
                {step < steps.length - 1 ? (
                  <button type="button" className="btn btn-sm btn-dark" onClick={() => goTo(step + 1)}>
                    {t(UI.stepNext)}
                  </button>
                ) : (
                  <button type="button" className="btn btn-sm btn-dark" onClick={() => goTo(null)}>
                    {t(UI.stepSkip)}
                  </button>
                )}
              </div>
            </>
          ) : (
            <button type="button" className="figure-replay label" onClick={() => goTo(0)}>
              {t(UI.stepRestart)}
            </button>
          )}
        </div>
      ) : null}

      <div className="figure-stage">
        <FigureContext.Provider value={api}>
          {Figure && near ? (
            <FigureBoundary fallback={failed}>
              <Suspense fallback={<FigureSkeleton label={t(UI.figureLoading)} />}>
                <div className="t-reveal">
                  <Figure />
                </div>
              </Suspense>
            </FigureBoundary>
          ) : Figure ? (
            <FigureSkeleton label={t(UI.figureLoading)} />
          ) : (
            failed
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
