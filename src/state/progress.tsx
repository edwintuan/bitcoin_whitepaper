import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { SECTION_IDS } from '@/content/types';
import { followLink, goToAnchor, releaseAnchor } from './navigate';
import { placeAt } from './places';

export interface Progress {
  /**
   * Section number the reader is in: -1 above the first section, and the
   * number of sections once they are past the last one, in the appendices.
   */
  current: number;
  /** Sections the reader has stayed in at least once. */
  visited: ReadonlySet<number>;
  goTo(sectionNumber: number): void;
}

const ProgressContext = createContext<Progress>({ current: -1, visited: new Set(), goTo: () => {} });

export const useProgress = () => useContext(ProgressContext);

/** The places the address can name, in the order they come on the page: the chapters, then the appendices. */
export const PLACE_IDS: readonly string[] = [...SECTION_IDS, 'engineering-map', 'glossary', 'references'];

/** How far down the window the reader is taken to be reading. */
const READING_LINE = 0.43;

/** A section counts as read once the reader has stayed in it this long. Flying past does not count. */
const DWELL_MS = 800;

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** True when this page view began with the reader following a link or typing an address, not with a reload or Back. */
function arrivedFresh(): boolean {
  const [entry] = performance.getEntriesByType?.('navigation') ?? [];
  return !entry || (entry as PerformanceNavigationTiming).type === 'navigate';
}

/**
 * Follows the reader down the page: the place under their reading line, the
 * sections they have stayed in, and the address that goes with both. In-page
 * links, J and K, and a link opened from outside all arrive through here.
 */
export function ProgressProvider({ children }: { children: ReactNode }) {
  /** Index into PLACE_IDS, or -1 above the first place. */
  const [place, setPlace] = useState(-1);
  const [visited, setVisited] = useState<ReadonlySet<number>>(() => new Set());
  const placeRef = useRef(place);
  useEffect(() => {
    placeRef.current = place;
  }, [place]);
  // Where J and K last sent the reader: the next press counts from there, not from a page still on its way.
  const heading = useRef<number | null>(null);

  // Where the reader is, from the geometry of the page as it stands.
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const line = window.innerHeight * READING_LINE;
      const tops = PLACE_IDS.map((id) => document.getElementById(id)?.getBoundingClientRect().top ?? Infinity);
      const next = placeAt(tops, line);
      if (next === heading.current) heading.current = null;
      setPlace(next);
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    // A link to a place opens at that place. A reload or a step back is left
    // to the browser, which puts the reader exactly where they were.
    const wanted = decodeURIComponent(window.location.hash.slice(1));
    if (wanted && arrivedFresh()) goToAnchor(wanted, { focus: false });
    measure();

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // Blocks open, close and load without a scroll: the page's own height says so.
    const grown = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    grown?.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      grown?.disconnect();
    };
  }, []);

  // The address names the place. replaceState keeps the Back button for leaving, not for scrolling.
  const first = useRef(true);
  useEffect(() => {
    // On arrival the address is the reader's own: leave it until they have moved.
    if (first.current) {
      first.current = false;
      if (place === -1) return;
    }
    const { pathname, search, hash } = window.location;
    const wanted = place === -1 ? '' : `#${PLACE_IDS[place]}`;
    if (hash !== wanted) window.history.replaceState(window.history.state, '', `${pathname}${search}${wanted}`);
  }, [place]);

  // A section is read once the reader has stayed in it.
  useEffect(() => {
    if (place < 0 || place >= SECTION_IDS.length) return;
    const timer = window.setTimeout(() => {
      setVisited((seen) => (seen.has(place) ? seen : new Set(seen).add(place)));
    }, DWELL_MS);
    return () => window.clearTimeout(timer);
  }, [place]);

  const goTo = useCallback((sectionNumber: number) => {
    const id = SECTION_IDS[sectionNumber];
    if (id) goToAnchor(id);
  }, []);

  // In-page links jump and hold instead of gliding; see navigate.ts for why.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
      if (!link) return;
      const id = decodeURIComponent((link.getAttribute('href') ?? '').slice(1));
      if (followLink(id)) event.preventDefault();
    };
    // Back and Forward are the browser's to place; nothing of ours may hold the page against them.
    const onPop = () => releaseAnchor();
    document.addEventListener('click', onClick);
    window.addEventListener('popstate', onPop);
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('popstate', onPop);
    };
  }, []);

  // J and K step to the next and previous section.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      const key = event.key.toLowerCase();
      if (key !== 'j' && key !== 'k') return;
      const from = heading.current ?? Math.min(placeRef.current, SECTION_IDS.length);
      const next = key === 'j' ? from + 1 : from - 1;
      if (next < 0 || next >= SECTION_IDS.length) return;
      event.preventDefault();
      heading.current = next;
      goTo(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo]);

  const current = Math.min(place, SECTION_IDS.length);
  const value = useMemo(() => ({ current, visited, goTo }), [current, visited, goTo]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}
