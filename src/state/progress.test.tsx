import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SECTION_IDS } from '@/content/types';
import { releaseAnchor } from './navigate';
import { PLACE_IDS, ProgressProvider, useProgress } from './progress';

/**
 * jsdom lays nothing out, so the test says where everything is: each place is
 * 1,000 px tall, the first one starting 600 px down the page, and the window
 * (768 px high) is scrolled to `scrolled`. The reading line sits 43 % of the
 * way down the window, at 330 px.
 */
let scrolled = 0;
const topOf = (id: string) => 600 + PLACE_IDS.indexOf(id) * 1000 - scrolled;
const jumps: string[] = [];

function Probe() {
  const { current, visited } = useProgress();
  return (
    <p data-testid="probe">
      {current}|{[...visited].sort((a, b) => a - b).join(',')}
    </p>
  );
}

const probe = () => screen.getByTestId('probe').textContent;

function scrollTo(y: number) {
  scrolled = y;
  act(() => {
    window.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(20);
  });
}

/** Scrolls so that the reading line is 100 px into the place with this index. */
const read = (index: number) => scrollTo(600 + index * 1000 + 100 - 330);

function mount(hash = '') {
  window.history.replaceState(null, '', `/${hash}`);
  const view = render(
    <ProgressProvider>
      <Probe />
      <a href="#spv">to SPV</a>
      <a href="#top">to the top</a>
      <a href="https://example.org/#spv">elsewhere</a>
    </ProgressProvider>,
  );
  act(() => {
    vi.advanceTimersByTime(20);
  });
  return view;
}

beforeEach(() => {
  scrolled = 0;
  jumps.length = 0;
  vi.useFakeTimers();
  for (const id of PLACE_IDS) {
    const place = document.createElement('section');
    place.id = id;
    place.innerHTML = `<h2>${id}</h2>`;
    place.getBoundingClientRect = () => ({ top: topOf(id), bottom: topOf(id) + 1000 }) as DOMRect;
    place.scrollIntoView = () => {
      jumps.push(id);
      // An instant jump: the place is at the top of the window straight away.
      scrolled = 600 + PLACE_IDS.indexOf(id) * 1000;
      window.dispatchEvent(new Event('scroll'));
    };
    document.body.append(place);
  }
  window.scrollTo = vi.fn(() => {
    scrolled = 0;
    window.dispatchEvent(new Event('scroll'));
  }) as unknown as typeof window.scrollTo;
});

afterEach(() => {
  releaseAnchor();
  vi.useRealTimers();
  PLACE_IDS.forEach((id) => document.getElementById(id)?.remove());
  window.history.replaceState(null, '', '/');
});

describe('where the reader is', () => {
  it('is above the first section at the top of the page', () => {
    mount();
    expect(probe()).toBe('-1|');
    expect(window.location.hash).toBe('');
  });

  it('is the section under the reading line', () => {
    mount();
    read(3);
    expect(probe()?.split('|')[0]).toBe('3');
    expect(window.location.hash).toBe(`#${SECTION_IDS[3]}`);
  });

  it('is recomputed on the way back up, and the address goes back to bare at the top', () => {
    mount();
    read(11);
    read(4);
    expect(probe()?.split('|')[0]).toBe('4');
    expect(window.location.hash).toBe(`#${SECTION_IDS[4]}`);
    scrollTo(0);
    expect(probe()?.split('|')[0]).toBe('-1');
    expect(window.location.hash).toBe('');
  });

  it('is past the last section in an appendix, which the address names', () => {
    mount();
    read(PLACE_IDS.indexOf('glossary'));
    expect(probe()?.split('|')[0]).toBe(String(SECTION_IDS.length));
    expect(window.location.hash).toBe('#glossary');
  });

  it('follows a change of layout without a scroll', () => {
    mount();
    read(2);
    // Blocks above close (a depth change): everything moves up by a section.
    scrolled += 1000;
    act(() => {
      window.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(20);
    });
    expect(probe()?.split('|')[0]).toBe('3');
  });
});

describe('what the reader has read', () => {
  it('counts a section once they have stayed in it', () => {
    mount();
    read(2);
    expect(probe()).toBe('2|');
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(probe()).toBe('2|2');
  });

  it('does not count sections that only flew past', () => {
    mount();
    read(2);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    read(3);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    read(7);
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(probe()).toBe('7|7');
  });
});

describe('arriving and moving about', () => {
  it('opens a link to a place at that place', () => {
    mount('#spv');
    expect(jumps).toEqual(['spv']);
    expect(probe()?.split('|')[0]).toBe(String(SECTION_IDS.indexOf('spv')));
    expect(window.location.hash).toBe('#spv');
  });

  it('opens a link to an appendix at that appendix', () => {
    mount('#glossary');
    expect(jumps).toEqual(['glossary']);
  });

  it('ignores a hash that names nothing', () => {
    mount('#nothing-here');
    expect(jumps).toEqual([]);
    expect(probe()?.split('|')[0]).toBe('-1');
  });

  it('jumps on an in-page link instead of gliding, and keeps the step in the history', () => {
    mount();
    const before = window.history.length;
    act(() => {
      screen.getByText('to SPV').click();
      vi.advanceTimersByTime(20);
    });
    expect(jumps).toEqual(['spv']);
    expect(window.location.hash).toBe('#spv');
    expect(window.history.length).toBe(before + 1);
    // Focus goes with the reader, so Tab carries on from there.
    expect(document.activeElement).toBe(document.querySelector('#spv h2'));
  });

  it('takes a link to the top to the very top', () => {
    mount();
    read(5);
    act(() => {
      screen.getByText('to the top').click();
      vi.advanceTimersByTime(20);
    });
    expect(window.scrollTo).toHaveBeenCalled();
    expect(probe()?.split('|')[0]).toBe('-1');
    expect(window.location.hash).toBe('');
  });

  it('leaves links to other pages alone', () => {
    mount();
    const link = screen.getByText('elsewhere');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.addEventListener('click', (click) => click.preventDefault()); // keep jsdom from navigating
    act(() => {
      link.dispatchEvent(event);
    });
    expect(jumps).toEqual([]);
  });

  it('steps a section at a time with J and K, however fast they are pressed', () => {
    mount();
    read(2);
    const press = (key: string) => window.dispatchEvent(new KeyboardEvent('keydown', { key }));
    act(() => {
      // Three presses before the page has had a frame to measure itself again.
      press('j');
      press('j');
      press('j');
      vi.advanceTimersByTime(20);
    });
    expect(jumps).toEqual([SECTION_IDS[3], SECTION_IDS[4], SECTION_IDS[5]]);
    act(() => {
      press('k');
      vi.advanceTimersByTime(20);
    });
    expect(jumps[jumps.length - 1]).toBe(SECTION_IDS[4]);
  });

  it('does not take J and K from someone typing', () => {
    mount();
    const input = document.createElement('input');
    document.body.append(input);
    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', bubbles: true }));
    });
    expect(jumps).toEqual([]);
    input.remove();
  });
});
