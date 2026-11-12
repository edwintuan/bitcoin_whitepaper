import { Fragment, useEffect, useLayoutEffect } from 'react';
import { Hero } from '@/components/site/Hero';
import { PartDivider } from '@/components/site/PartDivider';
import { SectionShell } from '@/components/site/SectionShell';
import { TopBar } from '@/components/site/TopBar';
import { PARTS } from '@/content/parts';
import { sectionByNumber } from '@/content/sections';
import { UI } from '@/content/ui';
import { SettingsProvider, useSettings, useT } from '@/i18n/settings';
import { ProgressProvider } from '@/state/progress';
import { restoreAnchor } from '@/state/scrollAnchor';

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
  return (
    <>
      <TopBar />
      <main id="top">
        <Hero />
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
      </main>
    </>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <SettingsEffects />
      <ProgressProvider>
        <Page />
      </ProgressProvider>
    </SettingsProvider>
  );
}
