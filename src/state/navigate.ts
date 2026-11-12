/**
 * Going to a place on the page, and arriving.
 *
 * A jump here lands on a moving target. Figures between the reader and the
 * target are fetched as they come near and grow from a placeholder to their
 * real height, so a scroll that glides there stops short, and passes through
 * every section on the way. The jump is therefore instant, and for a moment
 * afterwards the target is put back in place each time the page changes
 * height. The reader taking over ends that at once.
 */

/** How long a target is held in place after a jump. */
const HOLD_MS = 2000;

/** Any of these means the reader has taken the page into their own hands. */
const TAKEOVER = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;

let release: (() => void) | null = null;

/** Stops holding the last target in place. */
export function releaseAnchor(): void {
  release?.();
}

/**
 * Scrolls to the element with this id and holds it there while the page
 * settles. Moves the keyboard focus to the place's heading, so that Tab goes
 * on from where the reader now is; pass `focus: false` on a page load.
 *
 * @returns false when there is no such element.
 */
export function goToAnchor(id: string, options: { focus?: boolean } = {}): boolean {
  const target = document.getElementById(id);
  if (!target) return false;
  releaseAnchor();

  const put = () => target.scrollIntoView({ block: 'start', behavior: 'instant' });
  put();

  const observer = new ResizeObserver(put);
  observer.observe(document.body);
  const timer = window.setTimeout(() => releaseAnchor(), HOLD_MS);
  const letGo = () => releaseAnchor();
  // Listened for only once the event that asked for this jump is over: the
  // key press behind it is still on its way up to the window.
  const listen = window.setTimeout(() => {
    TAKEOVER.forEach((type) => window.addEventListener(type, letGo, { passive: true }));
  }, 0);
  release = () => {
    release = null;
    observer.disconnect();
    window.clearTimeout(timer);
    window.clearTimeout(listen);
    TAKEOVER.forEach((type) => window.removeEventListener(type, letGo));
  };

  if (options.focus !== false) {
    const heading = target.matches('h1, h2, h3') ? target : (target.querySelector<HTMLElement>('h1, h2, h3') ?? target);
    // Reachable from a script only: a heading is not a stop on the Tab round.
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
  return true;
}

/**
 * What an in-page link does: a step in the history, as any link is, so that
 * Back returns the reader to where they were, and then the jump. The link to
 * the top goes to the very top and leaves the address bare.
 *
 * @returns false when the link leads nowhere on this page.
 */
export function followLink(id: string): boolean {
  const { pathname, search } = window.location;
  if (id === '' || id === 'top') {
    releaseAnchor();
    window.history.pushState(null, '', `${pathname}${search}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
    return true;
  }
  if (!document.getElementById(id)) return false;
  window.history.pushState(null, '', `${pathname}${search}#${id}`);
  return goToAnchor(id);
}

/** How long to wait for an overlay to close before going on regardless. */
const OVERLAY_WAIT_MS = 800;

/**
 * Runs `then` once the card, sheet or palette that is open has closed and
 * handed the keyboard focus back to what opened it. Moving the focus before
 * that is undone a moment later, when the overlay returns it.
 */
export function afterOverlay(then: () => void): void {
  const started = performance.now();
  const check = () => {
    const open = document.querySelector('[role="dialog"]');
    if (open && performance.now() - started < OVERLAY_WAIT_MS) window.setTimeout(check, 30);
    // The focus is handed back a frame after the overlay has gone.
    else window.setTimeout(then, 40);
  };
  check();
}
