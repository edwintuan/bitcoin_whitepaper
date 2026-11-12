import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { captureAnchor, restoreAnchor } from './scrollAnchor';

/** jsdom lays nothing out: the test places each element and says what is under a point. */
const tops = new Map<Element, number>();
const at = (element: Element, top: number) => {
  tops.set(element, top);
  element.getBoundingClientRect = () => ({ top: tops.get(element) ?? 0, bottom: (tops.get(element) ?? 0) + 40 }) as DOMRect;
};

let under: Element[] = [];
const scrollBy = vi.fn();

function page(html: string) {
  const main = document.createElement('main');
  main.innerHTML = html;
  document.body.append(main);
  return main;
}

beforeEach(() => {
  scrollBy.mockClear();
  under = [];
  window.scrollBy = scrollBy as unknown as typeof window.scrollBy;
  document.elementsFromPoint = () => under;
  Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
  tops.clear();
});

describe('keeping the reader’s place', () => {
  it('puts the paragraph they were reading back where it was', () => {
    const main = page('<section><p id="a">one</p><p id="b">two</p></section>');
    const reading = main.querySelector('#b')!;
    at(reading, 240);
    under = [reading, reading.parentElement!, main];

    captureAnchor();
    // The language changed: everything above is shorter now.
    at(reading, 90);
    restoreAnchor();

    expect(scrollBy).toHaveBeenCalledWith({ top: -150, behavior: 'instant' });
  });

  it('takes the block of text, not the word inside it', () => {
    const main = page('<section><p id="a">one <span id="word">word</span></p></section>');
    const word = main.querySelector('#word')!;
    const paragraph = main.querySelector('#a')!;
    at(paragraph, 300);
    at(word, 310);
    under = [word, paragraph, main];

    captureAnchor();
    at(paragraph, 500);
    at(word, 999); // the word may be anywhere in the new text
    restoreAnchor();

    expect(scrollBy).toHaveBeenCalledWith({ top: 200, behavior: 'instant' });
  });

  it('looks through a menu or card lying over the page', () => {
    const main = page('<section><p id="a">one</p></section>');
    const sheet = document.createElement('div');
    sheet.innerHTML = '<ul><li id="item">Developer</li></ul>';
    document.body.append(sheet);
    const paragraph = main.querySelector('#a')!;
    at(paragraph, 200);
    at(sheet.querySelector('#item')!, 200);
    // The depth control on a phone sits in a sheet over the text.
    under = [sheet.querySelector('#item')!, sheet, paragraph, main];

    captureAnchor();
    at(paragraph, 20);
    restoreAnchor();

    expect(scrollBy).toHaveBeenCalledWith({ top: -180, behavior: 'instant' });
  });

  it('falls back to what holds the block when the block itself was replaced', () => {
    const main = page('<section id="s"><p id="a">one</p></section>');
    const section = main.querySelector('#s')!;
    const paragraph = main.querySelector('#a')!;
    at(section, 100);
    at(paragraph, 260);
    under = [paragraph, section, main];

    captureAnchor();
    paragraph.remove(); // a block keyed by language is a new element afterwards
    at(section, -50);
    restoreAnchor();

    expect(scrollBy).toHaveBeenCalledWith({ top: -150, behavior: 'instant' });
  });

  it('does nothing when the place did not move', () => {
    const main = page('<section><p id="a">one</p></section>');
    const paragraph = main.querySelector('#a')!;
    at(paragraph, 240);
    under = [paragraph, main];
    captureAnchor();
    restoreAnchor();
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('does nothing when there was nothing of the page under the reading line', () => {
    page('<section><p id="a">one</p></section>');
    under = [];
    captureAnchor();
    restoreAnchor();
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('restores once: a second call without a capture is idle', () => {
    const main = page('<section><p id="a">one</p></section>');
    const paragraph = main.querySelector('#a')!;
    at(paragraph, 240);
    under = [paragraph, main];
    captureAnchor();
    at(paragraph, 100);
    restoreAnchor();
    restoreAnchor();
    expect(scrollBy).toHaveBeenCalledTimes(1);
  });
});
