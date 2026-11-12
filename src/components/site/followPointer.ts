/** A stretch of the window, in viewport pixels from its top. */
export interface Span {
  top: number;
  bottom: number;
}

/**
 * How far the page must scroll for `part` to sit inside `band`, the stretch
 * of the window that is free. 0 when it already does.
 *
 * A part below the band comes up just far enough to be whole; one taller than
 * the band shows its start. Less than a pixel is not worth a scroll.
 */
export function scrollToShow(part: Span, band: Span): number {
  let by = 0;
  if (part.top < band.top) by = part.top - band.top;
  else if (part.bottom > band.bottom) by = Math.min(part.bottom - band.bottom, part.top - band.top);
  return Math.abs(by) < 1 ? 0 : by;
}
