import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { afterOverlay, followLink, goToAnchor, releaseAnchor } from './navigate';

/** jsdom lays nothing out and has no scrollIntoView: each target records the calls instead. */
function place(id: string, inner = '') {
  const section = document.createElement('section');
  section.id = id;
  section.innerHTML = inner;
  section.scrollIntoView = vi.fn();
  document.body.append(section);
  return section;
}

let observers: { callback: ResizeObserverCallback; disconnected: boolean }[] = [];

beforeEach(() => {
  observers = [];
  vi.stubGlobal(
    'ResizeObserver',
    class {
      entry: { callback: ResizeObserverCallback; disconnected: boolean };
      constructor(callback: ResizeObserverCallback) {
        this.entry = { callback, disconnected: false };
        observers.push(this.entry);
      }
      observe() {}
      unobserve() {}
      disconnect() {
        this.entry.disconnected = true;
      }
    },
  );
  vi.useFakeTimers();
});

afterEach(() => {
  releaseAnchor();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

/** The page above the target changed height: a figure arrived. */
const grow = () => observers.filter((entry) => !entry.disconnected).forEach((entry) => entry.callback([], {} as ResizeObserver));

describe('goToAnchor', () => {
  it('says so when there is no such place', () => {
    expect(goToAnchor('nowhere')).toBe(false);
  });

  it('jumps at once, without gliding past everything on the way', () => {
    const target = place('spv');
    expect(goToAnchor('spv')).toBe(true);
    expect(target.scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' });
  });

  it('puts the target back in place when the page above it grows', () => {
    const target = place('spv');
    goToAnchor('spv');
    const before = vi.mocked(target.scrollIntoView).mock.calls.length;
    grow();
    grow();
    expect(vi.mocked(target.scrollIntoView).mock.calls.length).toBe(before + 2);
  });

  it('lets go once the page has had time to settle', () => {
    const target = place('spv');
    goToAnchor('spv');
    vi.advanceTimersByTime(2500);
    const before = vi.mocked(target.scrollIntoView).mock.calls.length;
    grow();
    expect(vi.mocked(target.scrollIntoView).mock.calls.length).toBe(before);
  });

  it('is not let go by the very key press that asked for the jump', () => {
    const target = place('spv');
    goToAnchor('spv');
    // Still inside the same event: the key press reaches the window after the jump was made.
    window.dispatchEvent(new Event('keydown'));
    const before = vi.mocked(target.scrollIntoView).mock.calls.length;
    grow();
    expect(vi.mocked(target.scrollIntoView).mock.calls.length).toBe(before + 1);
  });

  it('lets go the moment the reader scrolls by hand', () => {
    const target = place('spv');
    goToAnchor('spv');
    vi.advanceTimersByTime(1);
    window.dispatchEvent(new Event('wheel'));
    const before = vi.mocked(target.scrollIntoView).mock.calls.length;
    grow();
    expect(vi.mocked(target.scrollIntoView).mock.calls.length).toBe(before);
  });

  it('holds only the newest target when the reader jumps twice', () => {
    const first = place('spv');
    const second = place('privacy');
    goToAnchor('spv');
    goToAnchor('privacy');
    const before = vi.mocked(first.scrollIntoView).mock.calls.length;
    grow();
    expect(vi.mocked(first.scrollIntoView).mock.calls.length).toBe(before);
    expect(vi.mocked(second.scrollIntoView).mock.calls.length).toBeGreaterThan(1);
  });

  it('moves the keyboard focus to the heading of the place, without a second scroll', () => {
    const target = place('spv', '<h2 id="spv-title">Simplified Payment Verification</h2><p><a href="#x">a link</a></p>');
    const heading = target.querySelector('h2')!;
    const focus = vi.spyOn(heading, 'focus');
    goToAnchor('spv');
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement).toBe(heading);
    // A heading takes the focus from a script only: it is not a stop on the Tab round.
    expect(heading.getAttribute('tabindex')).toBe('-1');
  });

  it('leaves the focus alone when asked to', () => {
    const target = place('spv', '<h2>Simplified Payment Verification</h2>');
    const focus = vi.spyOn(target.querySelector('h2')!, 'focus');
    goToAnchor('spv', { focus: false });
    expect(focus).not.toHaveBeenCalled();
  });

  it('focuses the place itself when it has no heading', () => {
    const target = place('term-nonce');
    goToAnchor('term-nonce');
    expect(document.activeElement).toBe(target);
  });
});

describe('followLink', () => {
  it('is a step in the history and a jump', () => {
    const target = place('spv', '<h2>SPV</h2>');
    const before = window.history.length;
    expect(followLink('spv')).toBe(true);
    expect(window.location.hash).toBe('#spv');
    expect(window.history.length).toBe(before + 1);
    expect(target.scrollIntoView).toHaveBeenCalled();
    window.history.replaceState(null, '', '/');
  });

  it('goes to the very top for the link to the top, and leaves the address bare', () => {
    window.history.replaceState(null, '', '/#spv');
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    expect(followLink('top')).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
    expect(window.location.hash).toBe('');
  });

  it('does nothing for a link to nowhere', () => {
    const before = window.history.length;
    expect(followLink('nowhere')).toBe(false);
    expect(window.history.length).toBe(before);
  });
});

describe('afterOverlay', () => {
  it('waits for the open card or sheet to close and hand the focus back', () => {
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    document.body.append(dialog);
    const then = vi.fn();

    afterOverlay(then);
    vi.advanceTimersByTime(100);
    expect(then).not.toHaveBeenCalled();

    dialog.remove();
    vi.advanceTimersByTime(100);
    expect(then).toHaveBeenCalledTimes(1);
  });

  it('runs straight away when nothing is open', () => {
    const then = vi.fn();
    afterOverlay(then);
    vi.advanceTimersByTime(60);
    expect(then).toHaveBeenCalledTimes(1);
  });

  it('does not wait for ever on an overlay that stays', () => {
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    document.body.append(dialog);
    const then = vi.fn();
    afterOverlay(then);
    vi.advanceTimersByTime(1500);
    expect(then).toHaveBeenCalledTimes(1);
  });
});
