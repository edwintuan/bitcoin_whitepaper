import type { SectionContent } from '../types';

// Each chapter is one file named NN-id.ts with a default export. Dropping a
// file in this folder is all it takes to add it to the page.
const modules = import.meta.glob<{ default: SectionContent }>('./[0-9][0-9]-*.ts', { eager: true });

export const SECTIONS: SectionContent[] = Object.values(modules)
  .map((module) => module.default)
  .sort((a, b) => a.number - b.number);

export function sectionByNumber(number: number): SectionContent | undefined {
  return SECTIONS.find((section) => section.number === number);
}
