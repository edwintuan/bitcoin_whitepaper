import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
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
