import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

/**
 * True while the element is within `rootMargin` of the viewport. With `once`,
 * it stays true after the first time. Without IntersectionObserver it reports
 * true, so content is never withheld.
 */
export function useInView(
  ref: RefObject<Element | null>,
  { rootMargin = '0px', once = false }: { rootMargin?: string; once?: boolean } = {},
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin, once]);

  return inView;
}
