import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SettingsProvider } from '@/i18n/settings';
import { CalculatorScene } from './CalculatorScene';
import { zRange } from './chart';
import { CodeScene } from './CodeScene';
import { COPY } from './copy';
import { RaceScene } from './RaceScene';

const inPage = (node: React.ReactNode) => render(<SettingsProvider initialLang="en" initialDepth="curious">{node}</SettingsProvider>);

const button = (name: string) => screen.getByRole('button', { name });

describe('the calculator scene', () => {
  const show = (percent: number, z: number) => inPage(<CalculatorScene percent={percent} z={z} zMax={zRange(percent / 100)} />).container;
  const status = (container: HTMLElement) => container.querySelector('.fig-status')?.textContent ?? '';
  const odds = (container: HTMLElement) => container.querySelector('.atk-odds')?.textContent ?? '';
  const exact = (container: HTMLElement) => container.querySelector('.atk-exact')?.textContent ?? '';

  it('says "1 block", not "1 blocks"', () => {
    expect(status(show(10, 1))).toContain('against 1 block on top (2 confirmations)');
    expect(status(show(10, 5))).toContain('against 5 blocks on top (6 confirmations)');
  });

  it('gives a likely outcome as so many in a hundred, never as "1 in 1.0"', () => {
    const likely = show(49, 5);
    expect(odds(likely)).toBe('about 96 in 100');
    expect(status(likely)).toContain('succeeds about 96 times in 100');
    expect(likely.textContent).not.toContain('1 in 1.0');

    const fifth = show(10, 1);
    expect(odds(fifth)).toBe('about 20 in 100');
  });

  it('gives a rare outcome as one in so many', () => {
    const rare = show(10, 5);
    expect(odds(rare)).toBe('1 in 1,094');
    expect(status(rare)).toContain('succeeds about once in 1,094 attempts');
  });

  it('writes a very small value as a power of ten, the way the axis is labelled', () => {
    expect(exact(show(10, 5))).toBe('P = 0.0009137');
    expect(exact(show(10, 12))).toMatch(/^P = \d\.\d{3} × 10−8$/);
    expect(exact(show(10, 20))).toBe('P < 10−9');
    expect(show(10, 12).querySelector('.atk-exact sup')?.textContent).toBe('−8');
  });

  it('explains what z = 0 means for the formula, not for one confirmation', () => {
    expect(status(show(10, 0))).toBe(COPY.statusZero.en);
    expect(COPY.statusZero.en).toContain('not the risk of one confirmation');
  });
});

describe('the code scene', () => {
  it('keeps the focus on a pass button that has just reached the end of its range', async () => {
    const user = userEvent.setup();
    inPage(<CodeScene percent={10} z={2} />);
    const previous = button(COPY.prevPass.en);
    const following = button(COPY.nextPass.en);
    // The scene opens on the last pass: there is no next one.
    expect(following).toHaveAttribute('aria-disabled', 'true');
    expect(following).not.toBeDisabled();

    previous.focus();
    await user.keyboard('{Enter}{Enter}');
    expect(screen.getByText('Pass 1 of 3: k = 0')).toBeInTheDocument();
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    expect(previous).toHaveFocus();
    // Pressing it again does nothing.
    await user.keyboard('{Enter}');
    expect(screen.getByText('Pass 1 of 3: k = 0')).toBeInTheDocument();

    following.focus();
    await user.keyboard('{Enter}{Enter}');
    expect(screen.getByText('Pass 3 of 3: k = 2')).toBeInTheDocument();
    expect(following).toHaveFocus();
  });
});

describe('the race scene', () => {
  it('says "1 block" where the attacker starts one behind', () => {
    const { container } = inPage(<RaceScene percent={30} z={1} />);
    expect(container.querySelector('.fig-status')?.textContent).toContain('starts 1 block behind');
  });

  it('keeps the focus on "Next block" when the block it adds ends the race', async () => {
    const user = userEvent.setup();
    inPage(<RaceScene percent={30} z={3} />);
    const step = button(COPY.next.en);
    step.focus();
    for (let presses = 0; presses < 400 && step.getAttribute('aria-disabled') !== 'true'; presses++) {
      await user.keyboard('{Enter}');
    }
    expect(step).toHaveAttribute('aria-disabled', 'true');
    expect(step).not.toBeDisabled();
    expect(step).toHaveFocus();
  });

  it('keeps the focus on "Run 1,000 races" while they run, and announces the tally once they are done', async () => {
    const user = userEvent.setup();
    const { container } = inPage(<RaceScene percent={30} z={3} />);
    // The region is there from the start, as a live region must be, and says nothing until a batch is done.
    const tally = () => container.querySelector('.atk-tally [role="status"]');
    expect(tally()).not.toBeNull();
    expect(tally()?.textContent).toBe('');

    const run = button(COPY.thousand.en);
    run.focus();
    await user.keyboard('{Enter}');
    expect(run).not.toBeDisabled();
    expect(run).toHaveFocus();

    await waitFor(() => expect(tally()?.textContent).not.toBe(''), { timeout: 5000 });
    expect(tally()?.textContent).toMatch(/^Races in which he caught up: \d+(\.\d+)?%, \d+ of 1,000\.$/);
    expect(run).toHaveFocus();
    expect(run).toHaveAttribute('aria-disabled', 'false');
  });
});
