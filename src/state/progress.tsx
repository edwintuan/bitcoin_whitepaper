import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { SECTION_IDS } from '@/content/types';

export interface Progress {
  /** Section number the reader is in, or -1 above the first section. */
  current: number;
  /** Sections the reader has reached at least once. */
  visited: ReadonlySet<number>;
  goTo(sectionNumber: number): void;
}

const ProgressContext = createContext<Progress>({ current: -1, visited: new Set(), goTo: () => {} });

export const useProgress = () => useContext(ProgressContext);

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/**
 * Follows the reader down the page: which section is under the middle of the
 * viewport, which have been reached, and the URL hash that goes with it.
 * J and K step to the next and previous section.
 */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState(-1);
  const [visited, setVisited] = useState<ReadonlySet<number>>(() => new Set());
  const currentRef = useRef(current);
  currentRef.current = current;

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (element): element is HTMLElement => element !== null,
    );
    // A thin band a little above the middle of the viewport: the section
    // crossing it is the one being read.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const number = SECTION_IDS.indexOf(entry.target.id as (typeof SECTION_IDS)[number]);
          if (number === -1) continue;
          setCurrent(number);
          setVisited((seen) => (seen.has(number) ? seen : new Set(seen).add(number)));
          // replaceState keeps the Back button for leaving the page, not for scrolling.
          window.history.replaceState(null, '', `#${entry.target.id}`);
        }
      },
      { rootMargin: '-42% 0px -56% 0px' },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const goTo = useCallback((sectionNumber: number) => {
    const id = SECTION_IDS[sectionNumber];
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ block: 'start' });
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      const key = event.key.toLowerCase();
      if (key !== 'j' && key !== 'k') return;
      const next = key === 'j' ? currentRef.current + 1 : currentRef.current - 1;
      if (next < 0 || next >= SECTION_IDS.length) return;
      event.preventDefault();
      goTo(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo]);

  const value = useMemo(() => ({ current, visited, goTo }), [current, visited, goTo]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}
