import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SectionContent } from '@/content/types';
import { UI } from '@/content/ui';
import { SettingsProvider } from '@/i18n/settings';
import { FigureFrame } from './FigureFrame';

const step = (n: number) => ({ title: `Step ${n}`, text: `Do thing ${n}.` });

// A chapter whose figure file does not exist: the frame and its walkthrough are what is under test.
const section: SectionContent = {
  id: 'proof-of-work',
  number: 4,
  part: 3,
  title: { en: 'Proof-of-Work', zh: '工作量證明' },
  tldr: { en: 'x', zh: 'x' },
  analogy: { en: 'x', zh: 'x' },
  body: { en: [], zh: [] },
  figure: {
    component: 'NoSuchFigure',
    title: { en: 'A figure', zh: '一個圖' },
    steps: { en: [step(1), step(2), step(3)], zh: [step(1), step(2), step(3)] },
  },
  whoRuns: [],
  paperVsToday: { en: [], zh: [] },
};

function setup() {
  render(
    <SettingsProvider initialLang="en" initialDepth="curious">
      <FigureFrame section={section} />
    </SettingsProvider>,
  );
  return userEvent.setup();
}

const back = () => screen.getByRole('button', { name: UI.stepPrev.en });
const next = () => screen.getByRole('button', { name: UI.stepNext.en });

describe('FigureFrame walkthrough', () => {
  it('starts on the first step, where going back is not possible', () => {
    setup();
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(back()).toHaveAttribute('aria-disabled', 'true');
    // Not the `disabled` attribute: a browser takes the focus away from a button that disables itself.
    expect(back()).not.toBeDisabled();
  });

  it('walks forward and back through the steps', async () => {
    const user = setup();
    await user.click(next());
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    await user.click(back());
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('does nothing when Back is pressed on the first step', async () => {
    const user = setup();
    await user.click(back());
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('keeps the keyboard focus on Back when stepping back to the first step', async () => {
    const user = setup();
    await user.click(next());
    back().focus();
    await user.keyboard('{Enter}');
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    // A button that became `disabled` would have dropped the focus to the page.
    expect(back()).toHaveFocus();
  });

  it('hands the focus to the replay button on leaving the walkthrough, and back to Next on replaying', async () => {
    const user = setup();
    await user.click(next());
    await user.click(next());
    const leave = screen.getByRole('button', { name: UI.stepSkip.en });
    leave.focus();
    await user.keyboard('{Enter}');

    const replay = screen.getByRole('button', { name: UI.stepRestart.en });
    expect(replay).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(next()).toHaveFocus();
  });
});

describe('FigureFrame, following the pointer', () => {
  const scrollBy = vi.fn();

  /** Puts a pointed part into the stage at a place of the test's choosing: jsdom lays nothing out. */
  function pointAt(top: number, bottom: number) {
    const part = document.createElement('div');
    part.className = 'fig-pointed';
    part.getBoundingClientRect = () => ({ top, bottom, left: 0, right: 100, width: 100, height: bottom - top, x: 0, y: top, toJSON: () => ({}) });
    document.querySelector('.figure-stage')!.append(part);
  }

  function setupWindow() {
    scrollBy.mockClear();
    window.scrollBy = scrollBy as unknown as typeof window.scrollBy;
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    return setup();
  }

  const settle = () => new Promise((resolve) => setTimeout(resolve, 80));

  afterEach(() => {
    document.querySelectorAll('.fig-pointed').forEach((part) => part.remove());
  });

  it('brings a part below the fold into view when the reader steps to it', async () => {
    const user = setupWindow();
    pointAt(900, 960);
    await user.click(next());
    await waitFor(() => expect(scrollBy).toHaveBeenCalledTimes(1));
    // Just far enough for the part to end 12 px above the bottom of an 800 px window.
    expect(scrollBy.mock.calls[0][0]).toMatchObject({ top: 172 });
  });

  it('brings a part back into view when stepping back to one that is above', async () => {
    const user = setupWindow();
    await user.click(next());
    await settle();
    scrollBy.mockClear();
    pointAt(-300, -240);
    await user.click(back());
    await waitFor(() => expect(scrollBy).toHaveBeenCalledTimes(1));
    expect(scrollBy.mock.calls[0][0].top).toBeLessThan(0);
  });

  it('leaves the page alone when the part is already in view', async () => {
    const user = setupWindow();
    pointAt(300, 360);
    await user.click(next());
    await settle();
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('never scrolls a page the reader has only just opened', async () => {
    setupWindow();
    pointAt(900, 960);
    await settle();
    expect(scrollBy).not.toHaveBeenCalled();
  });
});
