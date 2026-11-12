import type { SectionId, WhitepaperSection } from '../types';

const modules = import.meta.glob<{ default: WhitepaperSection }>('./[0-9][0-9]-*.ts', { eager: true });

/** The paper's text, section by section: verbatim English and our translation. */
export const WHITEPAPER: Partial<Record<SectionId, WhitepaperSection>> = Object.fromEntries(
  Object.values(modules).map((module) => [module.default.id, module.default]),
);
