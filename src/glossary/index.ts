import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';

export { TERMS, TERMS_WITH_VISUALS, TERM_IDS } from './terms';

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
