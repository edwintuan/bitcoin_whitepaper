import { Fragment, Suspense, lazy, useCallback, useEffect, useLayoutEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { I18nProvider } from 'react-aria-components';
import { EngineeringMap } from '@/components/site/EngineeringMap';
import { GlossaryIndex } from '@/components/site/GlossaryIndex';
import { Hero } from '@/components/site/Hero';
import { Journey } from '@/components/site/Journey';
import { PartDivider } from '@/components/site/PartDivider';
import { Footer, References } from '@/components/site/References';
import { SectionShell } from '@/components/site/SectionShell';
import { TopBar } from '@/components/site/TopBar';
import { PARTS } from '@/content/parts';
import { sectionByNumber } from '@/content/sections';
import { UI } from '@/content/ui';
import type { Lang } from '@/content/types';
import { SettingsProvider, useSettings, useT } from '@/i18n/settings';
import { ProgressProvider } from '@/state/progress';
import { restoreAnchor } from '@/state/scrollAnchor';

// The search palette is a chunk of its own: fetched when the page has gone
// quiet, so that it opens at once when asked for, and at the latest when asked.
const loadSearch = () => import('@/components/site/CommandSearch');
const CommandSearch = lazy(() => loadSearch().then((module) => ({ default: module.CommandSearch })));

/**
 * The controls built on React Aria carry a few words of their own ("Dismiss",
 * "Clear search"). Left alone they follow the browser's language, not the
 * page's: English in the Chinese page, Simplified Chinese in the English one.
 */
/** The locale React Aria's own words are shown in, per language of the page. */
const LOCALE: Record<Lang, string> = { en: 'en-GB', zh: 'zh-TW', cn: 'zh-CN' };

function ControlsLocale({ children }: { children: ReactNode }) {
  const { lang } = useSettings();
  return <I18nProvider locale={LOCALE[lang]}>{children}</I18nProvider>;
}

/** Side effects that follow the reader's settings. Renders nothing. */
function SettingsEffects() {
  const t = useT();
  const { lang, depthEpoch } = useSettings();

  useEffect(() => {
    document.title = t(UI.siteTitle);
  }, [t]);

  // Language and depth changes re-flow the page; put the reader back where they were.
  useLayoutEffect(() => {
    restoreAnchor();
  }, [lang, depthEpoch]);

  return null;
}

function Page() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchWanted, setSearchWanted] = useState(false);
  const openSearch = useCallback(() => {
    setSearchWanted(true);
    setSearchOpen(true);
  }, []);

  useEffect(() => {
    const fetchIt = () => void loadSearch().catch(() => {});
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(fetchIt, { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }
    const timer = window.setTimeout(fetchIt, 2500);
    return () => window.clearTimeout(timer);
  }, []);

  // Until the palette is on the page, its shortcut is listened for here. Once mounted it handles ⌘K / Ctrl K itself.
  useEffect(() => {
    if (searchWanted) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return;
      event.preventDefault();
      openSearch();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchWanted, openSearch]);

  return (
    <>
      <TopBar onSearch={openSearch} />
      <main id="top">
        <Hero />
        <Journey />
        {PARTS.map((part) => {
          const sections = part.sections.map(sectionByNumber).filter((section) => section !== undefined);
          if (sections.length === 0) return null;
          return (
            <Fragment key={part.number}>
              <PartDivider part={part} />
              {sections.map((section) => (
                <SectionShell key={section.id} section={section} />
              ))}
            </Fragment>
          );
        })}
        <EngineeringMap />
        <GlossaryIndex />
        <References />
      </main>
      <Footer />
      {searchWanted ? (
        <Suspense fallback={null}>
          <CommandSearch isOpen={searchOpen} onOpenChange={setSearchOpen} />
        </Suspense>
      ) : null}
    </>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <SettingsEffects />
      <ControlsLocale>
        <ProgressProvider>
          <Page />
        </ProgressProvider>
      </ControlsLocale>
    </SettingsProvider>
  );
}
