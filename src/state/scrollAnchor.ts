/**
 * Keeps the reader's place when the page above them changes height: switching
 * language or reading depth opens, closes and re-flows blocks all the way up.
 *
 * Call `captureAnchor()` just before the change and `restoreAnchor()` in a
 * layout effect right after it.
 */

const ANCHORS = '.section-head, .lead-block, .collapsible-head, .figure, .part, .hero';

let saved: { element: Element; top: number } | null = null;

export function captureAnchor(): void {
  const topbar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) || 0;
  for (const element of document.querySelectorAll(ANCHORS)) {
    const rect = element.getBoundingClientRect();
    // The first landmark whose top edge is on screen below the top bar.
    if (rect.top >= topbar - 4 && rect.top < window.innerHeight) {
      saved = { element, top: rect.top };
      return;
    }
  }
  saved = null;
}

export function restoreAnchor(): void {
  if (!saved) return;
  const { element, top } = saved;
  saved = null;
  if (!element.isConnected) return;
  const root = document.documentElement;
  // Measure the settled layout, not a frame of an accordion in mid-travel.
  root.classList.add('layout-instant');
  const delta = element.getBoundingClientRect().top - top;
  if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: 'instant' });
  requestAnimationFrame(() => root.classList.remove('layout-instant'));
}
