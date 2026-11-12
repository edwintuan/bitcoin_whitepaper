import { describe, expect, it } from 'vitest';
import { scrollToShow } from './followPointer';

/** The part of the window not covered by the top bar and the walkthrough's own text. */
const band = { top: 200, bottom: 800 };

describe('scrollToShow', () => {
  it('leaves the page alone when the part is in view', () => {
    expect(scrollToShow({ top: 300, bottom: 400 }, band)).toBe(0);
    expect(scrollToShow({ top: 200, bottom: 800 }, band)).toBe(0);
  });

  it('scrolls down just far enough for a part below the fold', () => {
    expect(scrollToShow({ top: 880, bottom: 930 }, band)).toBe(130);
  });

  it('scrolls up to a part hidden above', () => {
    expect(scrollToShow({ top: 50, bottom: 120 }, band)).toBe(-150);
  });

  it('shows the start of a part taller than the room there is', () => {
    // 900 px of content for a 600 px band: bring its top to the top, not its end to the end.
    expect(scrollToShow({ top: 500, bottom: 1400 }, band)).toBe(300);
  });

  it('does not move for less than a pixel', () => {
    expect(scrollToShow({ top: 199.6, bottom: 400 }, band)).toBe(0);
  });
});
