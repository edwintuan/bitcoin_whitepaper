import { CommandPalette, CommandPaletteItem, CommandPaletteSection } from '@/components/base/command-palette/command-palette';
import { SECTIONS } from '@/content/sections';
import { UI } from '@/content/ui';
import { TERMS, TERM_IDS } from '@/glossary';
import { useT } from '@/i18n/settings';
import { plainRich } from '@/text/richtext';

/**
 * Search across sections and terms, opened with ⌘K / Ctrl K or the top bar.
 * Choosing a section goes to it; choosing a term goes to its entry in the
 * glossary and opens its card.
 */
export function CommandSearch({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange(open: boolean): void }) {
  const t = useT();
  const nameOf = (id: string) => (TERMS[id] ? t(TERMS[id].name) : undefined);

  const go = (key: string) => {
    const [kind, id] = key.split(':');
    // Wait for the palette to close and hand focus back before moving on.
    window.setTimeout(() => {
      if (kind === 'section') {
        document.getElementById(id)?.scrollIntoView({ block: 'start' });
        return;
      }
      const entry = document.getElementById(`term-${id}`);
      if (!entry) return;
      // Jump rather than glide: a floating card closes when the page scrolls
      // under it, so the scrolling has to be over before the card opens.
      entry.scrollIntoView({ block: 'center', behavior: 'instant' });
      window.setTimeout(() => entry.querySelector('button')?.click(), 80);
    }, 260);
  };

  return (
    <CommandPalette
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      aria-label={t(UI.search)}
      placeholder={t(UI.searchPlaceholder)}
      emptyState={t(UI.searchEmpty)}
      footer={false}
      className="search-palette"
      onAction={(key) => go(String(key))}
    >
      <CommandPaletteSection title={t(UI.searchSections)}>
        {SECTIONS.map((section) => (
          <CommandPaletteItem
            key={section.id}
            id={`section:${section.id}`}
            textValue={`${section.number} ${section.title.en} ${section.title.zh}`}
          >
            <span className="mono search-no">{section.number === 0 ? '#0' : `§${section.number}`}</span> {t(section.title)}
          </CommandPaletteItem>
        ))}
      </CommandPaletteSection>
      <CommandPaletteSection title={t(UI.searchTerms)}>
        {TERM_IDS.map((id) => {
          const term = TERMS[id];
          return (
            <CommandPaletteItem
              key={id}
              id={`term:${id}`}
              textValue={`${term.name.en} ${term.name.zh} ${term.aka?.en ?? ''} ${term.aka?.zh ?? ''}`}
            >
              <span className="search-term">
                <span className="search-term-name">{t(term.name)}</span>
                <span className="search-term-short">{plainRich(t(term.short), nameOf)}</span>
              </span>
            </CommandPaletteItem>
          );
        })}
      </CommandPaletteSection>
    </CommandPalette>
  );
}
