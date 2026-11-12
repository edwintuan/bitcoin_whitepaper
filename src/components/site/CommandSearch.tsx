import { CommandPalette, CommandPaletteItem, CommandPaletteSection } from '@/components/base/command-palette/command-palette';
import { SECTIONS } from '@/content/sections';
import { UI } from '@/content/ui';
import { TERMS, TERM_IDS } from '@/glossary';
import { toHans } from '@/i18n/hans';
import { useT } from '@/i18n/settings';
import { afterOverlay, followLink } from '@/state/navigate';
import { requestTerm } from '@/state/termRequest';
import { searchable } from '@/text/format';
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
    // The palette closes and hands the focus back to the search button first;
    // only then does the focus move on with the reader.
    afterOverlay(() => {
      if (kind === 'section') followLink(id);
      else requestTerm(id);
    });
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
            textValue={`${section.number} ${section.title.en} ${section.title.zh} ${toHans(section.title.zh)}`}
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
              textValue={searchable(
                `${term.name.en} ${term.name.zh} ${toHans(term.name.zh)} ${term.aka?.en ?? ''} ${term.aka?.zh ?? ''} ${toHans(term.aka?.zh ?? '')}`,
              )}
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
