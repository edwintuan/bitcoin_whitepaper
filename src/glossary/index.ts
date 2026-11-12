import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import type { TermDef } from '@/content/types';

// The term data. Loaded through a glob so the page still builds while the
// glossary file is being written; with the file in place this is a plain import.
const termModules = import.meta.glob<{ TERMS: Record<string, TermDef>; TERM_IDS: readonly string[] }>(
  './terms.ts',
  { eager: true },
);
const termModule = termModules['./terms.ts'];

export const TERMS: Record<string, TermDef> = termModule?.TERMS ?? {};
export const TERM_IDS: readonly string[] = termModule?.TERM_IDS ?? [];

// A term's visual is the file visuals/<term-id>.tsx with a default export.
// It is drawn on the black card: use cream and orange, no backgrounds.
const visualLoaders = import.meta.glob<{ default: ComponentType }>('./visuals/*.tsx');
const visuals = new Map<string, LazyExoticComponent<ComponentType>>();

export function hasVisual(termId: string): boolean {
  return `./visuals/${termId}.tsx` in visualLoaders;
}

export function visualFor(termId: string): LazyExoticComponent<ComponentType> | null {
  const loader = visualLoaders[`./visuals/${termId}.tsx`];
  if (!loader) return null;
  let visual = visuals.get(termId);
  if (!visual) {
    visual = lazy(loader);
    visuals.set(termId, visual);
  }
  return visual;
}
