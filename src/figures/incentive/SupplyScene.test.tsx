import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { SettingsProvider } from '@/i18n/settings';
import { MAX_HEIGHT } from './supply';
import { SupplyScene } from './SupplyScene';
import type { SupplyHighlight } from './SupplyScene';

// The slider measures itself; jsdom has no ResizeObserver.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const show = (height: number, highlight: SupplyHighlight = null, onHeight = vi.fn()) => ({
  onHeight,
  ...render(
    <SettingsProvider initialLang="en" initialDepth="developer">
      <SupplyScene height={height} onHeight={onHeight} highlight={highlight} />
    </SettingsProvider>,
  ),
});

describe('the supply scene', () => {
  it('reads the schedule off at the chosen height', () => {
    const { container } = show(840_000);
    const values = [...container.querySelectorAll('.inc-stats .stat-value')].map((value) => value.textContent);
    expect(values).toEqual(['3.125', '4', '19,687,503.125', '93.75%']);
  });

  it('calls one satoshi a satoshi', () => {
    const sub = (height: number) => {
      const { container, unmount } = show(height);
      const text = container.querySelector('.inc-sub')?.textContent ?? '';
      unmount();
      return text;
    };
    expect(sub(840_000)).toBe('312,500,000 satoshis');
    expect(sub(6_720_000)).toBe('1 satoshi'); // the last era that pays anything
    expect(sub(6_930_000)).toBe('0 satoshis');
  });

  it('points at the height controls or at the charts when the walkthrough asks', () => {
    const height = show(840_000, 'height');
    const pointed = height.container.querySelectorAll('.fig-pointed');
    expect(pointed).toHaveLength(1);
    expect(pointed[0].contains(screen.getByRole('button', { name: /Next halving/ }))).toBe(true);
    height.unmount();

    const charts = show(840_000, 'charts');
    expect(charts.container.querySelectorAll('.fig-pointed')).toHaveLength(1);
    expect(charts.container.querySelector('.inc-charts')?.classList.contains('fig-pointed')).toBe(true);
    charts.unmount();

    const none = show(840_000);
    expect(none.container.querySelector('.fig-pointed')).toBeNull();
    expect(none.container.querySelector('[data-hl]')).toBeNull();
  });

  it('keeps the buttons that step back in reach of the keyboard at the first block', () => {
    const { onHeight } = show(0);
    for (const name of [/Previous halving/, 'One block back']) {
      const button = screen.getByRole('button', { name });
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).not.toBeDisabled();
      fireEvent.click(button);
    }
    expect(onHeight).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'One block on' }));
    expect(onHeight).toHaveBeenCalledWith(1);
  });

  it('keeps the buttons that step on in reach of the keyboard at the end of the range', () => {
    const { onHeight } = show(MAX_HEIGHT);
    for (const name of [/Next halving/, 'One block on']) {
      const button = screen.getByRole('button', { name });
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).not.toBeDisabled();
      fireEvent.click(button);
    }
    expect(onHeight).not.toHaveBeenCalled();
  });
});
