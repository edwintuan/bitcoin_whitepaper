import { Suspense, useState } from 'react';
import { SECTION_IDS } from '@/content/types';
import { UI } from '@/content/ui';
import { TERMS, visualFor } from '@/glossary';
import { useSettings, useT } from '@/i18n/settings';
import { CardNavigation, Rich } from './Rich';

export interface TermCardProps {
  id: string;
  /** Show another term in this same card. */
  onNavigate(termId: string): void;
  onClose(): void;
}

/** The floating card behind every keyword: name, plain definition, a small live figure, and where to go next. */
export function TermCard({ id, onNavigate, onClose }: TermCardProps) {
  const t = useT();
  const { lang, depth } = useSettings();
  const [showPrecise, setShowPrecise] = useState(false);

  const def = TERMS[id];
  if (!def) return null;

  const otherName = lang === 'en' ? def.name.zh : def.name.en;
  const Visual = visualFor(id);
  const preciseOpen = depth === 'developer' || showPrecise;

  return (
    <CardNavigation.Provider value={onNavigate}>
      <div className="term-card on-ink" key={id}>
        <header className="term-head">
          <h3 className="term-name poster">{t(def.name)}</h3>
          <p className="term-alt label">
            <span lang={lang === 'en' ? 'zh-Hant-HK' : 'en'}>{otherName}</span>
            {def.aka ? <span> · {t(def.aka)}</span> : null}
          </p>
          <button type="button" className="term-close" aria-label={t(UI.close)} onClick={onClose}>
            <svg viewBox="0 0 14 14" width="14" height="14" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
          </button>
        </header>

        <p className="term-short ui t-swap-soft">
          <Rich text={t(def.short)} />
        </p>

        {def.precise ? (
          preciseOpen ? (
            <p className="term-precise ui">
              <span className="label">{t(UI.term.precise)}</span>
              <Rich text={t(def.precise)} />
            </p>
          ) : (
            <button type="button" className="term-more label" onClick={() => setShowPrecise(true)}>
              {t(UI.term.precise)} +
            </button>
          )
        ) : null}

        {Visual ? (
          <div className="term-visual">
            <Suspense fallback={<div className="term-visual-wait" />}>
              <Visual />
            </Suspense>
          </div>
        ) : null}

        <footer className="term-foot label">
          <p>
            <span className="term-foot-key">{t(UI.term.appearsIn)}</span>
            {def.sections.map((number) => (
              <a key={number} href={`#${SECTION_IDS[number]}`} onClick={onClose}>
                {number === 0 ? t(UI.abstract) : `§${number}`}
              </a>
            ))}
          </p>
          {def.related.length > 0 ? (
            <p>
              <span className="term-foot-key">{t(UI.term.seeAlso)}</span>
              {def.related.map((related) =>
                TERMS[related] ? (
                  <button key={related} type="button" className="term-rel" onClick={() => onNavigate(related)}>
                    {t(TERMS[related].name)}
                  </button>
                ) : null,
              )}
            </p>
          ) : null}
        </footer>
      </div>
    </CardNavigation.Provider>
  );
}
