import { render } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { SettingsProvider } from '@/i18n/settings';
import { HonestScene } from './HonestScene';

// The slider measures itself; jsdom has no ResizeObserver.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const show = (share: number, height = 840_000) =>
  render(
    <SettingsProvider initialLang="en" initialDepth="developer">
      <HonestScene height={height} onHeight={() => {}} share={share} onShare={() => {}} />
    </SettingsProvider>,
  );

/** The last point of the attack card: how likely the attack is to work. */
const odds = (share: number) => show(share).container.querySelector('.inc-points li:last-child')?.textContent ?? '';

/** The sentence under what the rules pay. */
const verdict = (share: number, height?: number) =>
  show(share, height).container.querySelector('[role="status"]')?.textContent ?? '';

describe('why play by the rules', () => {
  it('shows what the rules pay the miner on an average day', () => {
    const { container } = show(51);
    const values = [...container.querySelectorAll('.inc-side .stat-value')].map((value) => value.textContent);
    expect(values).toEqual(['73.44', '229.5']);
  });

  it('says the rules favour the miner over everyone else combined only above half', () => {
    expect(verdict(51)).toMatch(/^With more than half the power/);
    expect(verdict(50)).toMatch(/^Whatever the share/);
    expect(verdict(49)).toMatch(/^Whatever the share/);
  });

  it('never calls exactly half “less than half” when it weighs the attack', () => {
    expect(odds(49)).toMatch(/^With less than half the power/);
    expect(odds(50)).toMatch(/^With half the power or more/);
    expect(odds(51)).toMatch(/^With half the power or more/);
  });

  it('says fees are all there is once the subsidy has ended', () => {
    expect(verdict(30, 6_930_000)).toMatch(/^At this height no new coins are created/);
  });
});
