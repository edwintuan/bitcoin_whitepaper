import { useMemo, useState } from 'react';
import { TERM_CATEGORIES } from '@/content/types';
import type { TermCategory } from '@/content/types';
import { UI } from '@/content/ui';
import { TERMS, TERM_IDS } from '@/glossary';
import { useT } from '@/i18n/settings';
import { plainRich } from '@/text/richtext';
import { Term } from './Term';

/** Appendix B: every term on the page, by category. Each entry opens the same card as in the text. */
export function GlossaryIndex() {
  const t = useT();
  const a = UI.appendix;
  const [category, setCategory] = useState<TermCategory | 'all'>('all');

  const ids = useMemo(
    () => TERM_IDS.filter((id) => category === 'all' || TERMS[id].category === category),
    [category],
  );
  const nameOf = (id: string) => (TERMS[id] ? t(TERMS[id].name) : undefined);

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

        <ul className="glossary-list" key={category}>
          {ids.map((id) => (
            <li key={id} id={`term-${id}`} className="glossary-item">
              <span className="glossary-term">
                <Term id={id} />
              </span>
              <span className="glossary-short ui">{plainRich(t(TERMS[id].short), nameOf)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
