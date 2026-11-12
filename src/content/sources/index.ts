import type { SectionId, SectionSources } from '../types';

const modules = import.meta.glob<{ default: SectionSources }>('./[0-9][0-9]-*.ts', { eager: true });

/** Source excerpts quoted in each section's "In the source" block. */
export const SOURCES: Partial<Record<SectionId, SectionSources>> = Object.fromEntries(
  Object.values(modules).map((module) => [module.default.id, module.default]),
);
