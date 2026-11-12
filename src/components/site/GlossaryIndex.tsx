import { useEffect, useState } from 'react';
import { TERM_CATEGORIES } from '@/content/types';
import type { TermCategory } from '@/content/types';
import { UI } from '@/content/ui';
import { TERMS, TERM_IDS } from '@/glossary';
import { useT } from '@/i18n/settings';
import { onTermRequested } from '@/state/termRequest';
import { plainRich } from '@/text/richtext';
import { Term } from './Term';

/** Appendix B: every term on the page, by category. Each entry opens the same card as in the text. */
export function GlossaryIndex() {
  const t = useT();
  const a = UI.appendix;
  const [category, setCategory] = useState<TermCategory | 'all'>('all');
  // A term asked for from elsewhere (the search palette): which one, and a count so the same one can be asked for again.
  const [request, setRequest] = useState<{ id: string; n: number } | null>(null);

  useEffect(
    () =>
      onTermRequested((id) => {
        if (!TERMS[id]) return;
        // The entry may be filtered out of sight: show the whole list again.
        setCategory('all');
        setRequest((previous) => ({ id, n: (previous?.n ?? 0) + 1 }));
      }),
    [],
  );

  // The request once its entry is in view: this is what opens the card.
  const [ready, setReady] = useState<{ id: string; n: number } | null>(null);

  // Bring the entry into view and put the focus on its keyword before the card
  // opens: the card then takes the focus, and hands it back here when closed.
  // The card opens a moment later, because a floating card closes when the
  // page scrolls under it, and the scroll is only over a frame or two from now.
  useEffect(() => {
    if (!request) return;
    const entry = document.getElementById(`term-${request.id}`);
    entry?.scrollIntoView({ block: 'center', behavior: 'instant' });
    entry?.querySelector<HTMLElement>('.kw')?.focus({ preventScroll: true });
    const timer = window.setTimeout(() => setReady(request), 90);
    return () => window.clearTimeout(timer);
  }, [request]);

  const nameOf = (id: string) => (TERMS[id] ? t(TERMS[id].name) : undefined);
  const shown = category === 'all' ? TERM_CATEGORIES : [category];

  return (
    <section id="glossary" className="appendix" aria-labelledby="glossary-title">
      <div className="wrap">
        <header className="appendix-head">
          <p className="label appendix-kicker">{t(a.bKicker)}</p>
          <h2 id="glossary-title" className="appendix-title poster">
            <span className="poster-scale">{t(a.bTitle)}</span>
          </h2>
          <p className="appendix-lede">{t(a.bLede).replace('{count}', String(TERM_IDS.length))}</p>
        </header>

        <div className="cat-chips" role="group" aria-label={t(a.filterLabel)}>
          {(['all', ...TERM_CATEGORIES] as const).map((value) => (
            <button
              key={value}
              type="button"
              className="cat-chip"
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
            >
              {value === 'all' ? t(a.all) : t(a.categories[value])}
            </button>
          ))}
        </div>

        {/* Keyed by the filter, so the list fades in afresh when it changes. */}
        <div className="glossary-groups" key={category}>
          {shown.map((group) => {
            const ids = TERM_IDS.filter((id) => TERMS[id].category === group);
            if (ids.length === 0) return null;
            return (
              <div className="glossary-group" key={group}>
                <h3 className="glossary-group-title label">
                  <span>{t(a.categories[group])}</span>
                  <span>{ids.length}</span>
                </h3>
                <ul className="glossary-list">
                  {ids.map((id) => (
                    <li key={id} id={`term-${id}`} className="glossary-item">
                      <span className="glossary-term">
                        <Term id={id} openRequest={ready?.id === id ? ready.n : undefined} />
                      </span>
                      <span className="glossary-short ui">{plainRich(t(TERMS[id].short), nameOf)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
