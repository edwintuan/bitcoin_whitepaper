/**
 * Keeps the reader's place when the page above them changes height: switching
 * language or reading depth opens, closes and re-flows blocks all the way up.
 *
 * Call `captureAnchor()` just before the change and `restoreAnchor()` in a
 * layout effect right after it. What is kept in place is the block of text
 * under the reader's eyes, wherever on the page that is: a paragraph, a list
 * item, a row of a table, a stop of the journey.
 */

/** What counts as a block a reader can be in the middle of. */
const BLOCKS = 'p, li, tr, dt, dd, pre, h1, h2, h3, figure, .station';

/** How far down the window, below the top bar, the reader is taken to be reading. */
const READING_LINE = 0.3;

/** Across the window: the text column first, then the middle, then the figures. */
const ACROSS = [0.25, 0.5, 0.75];

/** If nothing lies under the reading line (a gap between blocks), look this much further down. */
const FURTHER = [0, 28, 64, 120];

/** The block and what holds it, innermost first, each with where its top was. */
let saved: { element: Element; top: number }[] | null = null;

function blockAt(x: number, y: number): Element | null {
  const main = document.querySelector('main');
  if (!main) return null;
  // A menu or a card may lie over the page: take what is under it.
  for (const element of document.elementsFromPoint(x, y)) {
    if (element === main || !main.contains(element)) continue;
    return element.closest(BLOCKS) ?? null;
  }
  return null;
}

export function captureAnchor(): void {
  saved = null;
  const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) || 0;
  const line = bar + (window.innerHeight - bar) * READING_LINE;
  for (const down of FURTHER) {
    for (const across of ACROSS) {
      const block = blockAt(window.innerWidth * across, line + down);
      if (!block) continue;
      // The block may be a new element after the change (some are keyed by
      // language), so what holds it is remembered too.
      const chain: { element: Element; top: number }[] = [];
      for (let element: Element | null = block; element && element.tagName !== 'MAIN'; element = element.parentElement) {
        chain.push({ element, top: element.getBoundingClientRect().top });
      }
      saved = chain;
      // The browser's own scroll anchoring would move the page as well, at a
      // moment of its choosing. One hand on the wheel.
      document.documentElement.style.overflowAnchor = 'none';
      return;
    }
  }
}

export function restoreAnchor(): void {
  if (!saved) return;
  const chain = saved;
  saved = null;
  const root = document.documentElement;
  const kept = chain.find(({ element }) => element.isConnected);
  if (kept) {
    // Measure the settled layout, not a frame of an accordion in mid-travel.
    root.classList.add('layout-instant');
    const delta = kept.element.getBoundingClientRect().top - kept.top;
    if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: 'instant' });
  }
  requestAnimationFrame(() => {
    root.classList.remove('layout-instant');
    root.style.overflowAnchor = '';
  });
}
