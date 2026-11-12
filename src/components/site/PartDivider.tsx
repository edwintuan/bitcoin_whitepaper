import { sectionByNumber } from '@/content/sections';
import type { PartDef } from '@/content/parts';
import { UI } from '@/content/ui';
import { useSettings, useT } from '@/i18n/settings';

/** The full-width orange band that opens each of the six parts. */
export function PartDivider({ part }: { part: PartDef }) {
  const t = useT();
  const { lang } = useSettings();
  const label = lang === 'en' ? `${t(UI.part)} ${part.roman}` : `${t(UI.part)} ${part.roman} ${t(UI.partSuffix)}`;

  return (
    <div className="part" role="group" aria-label={`${label}: ${t(part.title)}`}>
      <div className="wrap part-in">
        <p className="part-no label">{label}</p>
        <p className="part-title poster">
          <span className="poster-scale">{t(part.title)}</span>
        </p>
        <p className="part-blurb">{t(part.blurb)}</p>
        <ul className="part-chips">
          {part.sections.map((number) => {
            const section = sectionByNumber(number);
            if (!section) return null;
            return (
              <li key={number}>
                <a className="part-chip" href={`#${section.id}`}>
                  <span className="mono">{number === 0 ? '#0' : `§${number}`}</span>
                  {t(section.title)}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
