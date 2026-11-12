import { useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/**
 * The width of an element in whole pixels, kept up to date as the layout
 * changes. Drawings that set type (a chart, a diagram) use it to draw at the
 * size they are shown, so their text is never scaled along with the picture.
 * Until the element has been measured, or where ResizeObserver is missing, it
 * reports `fallback`.
 */
export function useWidth<T extends HTMLElement>(fallback: number): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const next = Math.round(element.getBoundingClientRect().width);
      if (next > 0) setWidth(next);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
