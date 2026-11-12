import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { beforeAll, describe, expect, it } from 'vitest';
import { SettingsProvider } from '@/i18n/settings';
import { SAMPLES, makeTx } from './blockPay';
import type { BlockTx, Claim } from './blockPay';
import { BlockScene } from './BlockScene';
import type { BlockHighlight } from './BlockScene';

// The segmented control measures itself; jsdom has no ResizeObserver.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

function Harness({ startHeight = 840_000, highlight = null }: { startHeight?: number; highlight?: BlockHighlight }) {
  const [height, setHeight] = useState(startHeight);
  const [txs, setTxs] = useState<BlockTx[]>(() => SAMPLES.slice(0, 3).map(makeTx));
  const [claim, setClaim] = useState<Claim>('exact');
  return (
    <SettingsProvider initialLang="en" initialDepth="developer">
      <BlockScene
        height={height}
        onHeight={setHeight}
        txs={txs}
        onTxs={setTxs}
        claim={claim}
        onClaim={setClaim}
        highlight={highlight}
      />
    </SettingsProvider>
  );
}

const sumRow = (container: HTMLElement, index: number) =>
  container.querySelectorAll('.inc-sum > div')[index]?.querySelector('dd')?.textContent ?? '';

describe('what a block pays', () => {
  it('adds the subsidy at the chosen height to the fees of the transactions', () => {
    const { container } = render(<Harness />);
    expect(sumRow(container, 0)).toBe('3.125 BTC');
    expect(sumRow(container, 1)).toBe('+ 0.00015 BTC'); // 4,000 + 2,000 + 9,000 satoshis
    expect(sumRow(container, 2)).toBe('= 3.12515 BTC');
    expect(sumRow(container, 3)).toContain('3.12515 BTC');
    expect(container.querySelector('.tile')?.getAttribute('data-state')).toBe('candidate');
    expect(screen.getByRole('status').textContent).toMatch(/^Valid\./);
  });

  it('shows the coinbase bringing nothing in and paying out what it claims', () => {
    const { container } = render(<Harness />);
    // A coinbase does have an input, one that points at no coin: what comes in is nothing.
    expect(container.querySelector('.inc-coinbase .inc-tx-sum')?.textContent).toBe('in nothing→out 3.12515 BTC');
  });

  it('writes fees in the reader’s unit: sat in English, 聰 in Chinese', () => {
    const fee = (lang: 'en' | 'zh') => {
      const { container, unmount } = render(
        <SettingsProvider initialLang={lang} initialDepth="developer">
          <BlockScene
            height={840_000}
            onHeight={() => {}}
            txs={SAMPLES.slice(0, 1).map(makeTx)}
            onTxs={() => {}}
            claim="exact"
            onClaim={() => {}}
            highlight={null}
          />
        </SettingsProvider>,
      );
      const text = container.querySelector('.inc-tx:not(.inc-coinbase) .inc-tx-sum > span:last-child')?.textContent;
      unmount();
      return text;
    };
    expect(fee('en')).toBe('fee 4,000 sat');
    expect(fee('zh')).toBe('手續費 4,000 聰');
  });

  it('follows a fee the reader changes', () => {
    const { container } = render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Raise the fee of the payment from Alice' }));
    expect(sumRow(container, 1)).toBe('+ 0.00016 BTC');
    expect(sumRow(container, 2)).toBe('= 3.12516 BTC');
    fireEvent.click(screen.getByRole('button', { name: 'Lower the fee of the payment from Alice' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lower the fee of the payment from Alice' }));
    expect(sumRow(container, 1)).toBe('+ 0.00014 BTC');
  });

  it('announces a change of fee: the verdict names the amount the coinbase now claims', () => {
    render(<Harness />);
    const verdict = () => screen.getByRole('status').textContent;
    expect(verdict()).toBe(
      'Valid. The coinbase claims 3.12515 BTC: exactly the subsidy plus the fees. Every node that checks the block does the same sum and gets the same answer.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Raise the fee of the payment from Alice' }));
    expect(verdict()).toContain('The coinbase claims 3.12516 BTC:');
  });

  it('follows transactions added and removed', () => {
    const { container } = render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Take the payment from Carol out of the block' }));
    expect(sumRow(container, 1)).toBe('+ 0.00006 BTC');
    fireEvent.click(screen.getByRole('button', { name: 'Add a transaction' }));
    expect(container.querySelectorAll('.inc-tx')).toHaveLength(4); // the coinbase and three payments
    expect(sumRow(container, 1)).toBe('+ 0.00015 BTC');
  });

  it('rejects the block when the coinbase claims one satoshi too much, in Bitcoin Core’s words', () => {
    const { container } = render(<Harness />);
    fireEvent.click(screen.getByRole('radio', { name: '1 satoshi more' }));
    expect(sumRow(container, 3)).toContain('3.12515001 BTC');
    expect(container.querySelector('.tile')?.getAttribute('data-state')).toBe('invalid');
    // Reason and message joined by a comma, as `ValidationState::ToString` prints them.
    expect(container.querySelector('.inc-core')?.textContent).toBe(
      'bad-cb-amount, coinbase pays too much (actual=312515001 vs limit=312515000)',
    );
  });

  it('accepts a coinbase that claims one satoshi less', () => {
    const { container } = render(<Harness />);
    fireEvent.click(screen.getByRole('radio', { name: '1 satoshi less' }));
    expect(sumRow(container, 3)).toContain('3.12514999 BTC');
    expect(container.querySelector('.tile')?.getAttribute('data-state')).toBe('candidate');
    expect(screen.getByRole('status').textContent).toMatch(/^Still valid\./);
  });

  it('pays in fees alone once the subsidy has run out', () => {
    const { container } = render(<Harness startHeight={6_930_000} />);
    expect(sumRow(container, 0)).toBe('0 BTC');
    expect(sumRow(container, 2)).toBe('= 0.00015 BTC');
    expect(screen.getByRole('status').textContent).toContain('fees are all a block pays');
  });

  it('points at the block or at the claim when the walkthrough asks', () => {
    const block = render(<Harness highlight="txs" />);
    expect(block.container.querySelectorAll('.fig-pointed')).toHaveLength(1);
    expect(block.container.querySelector('.tile')?.classList.contains('fig-pointed')).toBe(true);
    block.unmount();

    const claim = render(<Harness highlight="claim" />);
    expect(claim.container.querySelectorAll('.fig-pointed')).toHaveLength(1);
    expect(claim.container.querySelector('.inc-claim')?.classList.contains('fig-pointed')).toBe(true);
    claim.unmount();

    const none = render(<Harness />);
    expect(none.container.querySelector('.fig-pointed')).toBeNull();
    expect(none.container.querySelector('[data-hl]')).toBeNull();
  });

  it('keeps a fee button in reach of the keyboard once the fee cannot go lower', () => {
    const { container } = render(<Harness />);
    const lower = screen.getByRole('button', { name: 'Lower the fee of the payment from Bob' });
    lower.focus();
    fireEvent.click(lower); // 2,000 → 1,000 satoshis
    fireEvent.click(lower); // → 0
    expect(sumRow(container, 1)).toBe('+ 0.00013 BTC');
    expect(lower).toHaveAttribute('aria-disabled', 'true');
    expect(lower).not.toBeDisabled();
    expect(document.activeElement).toBe(lower);
    fireEvent.click(lower);
    expect(sumRow(container, 1)).toBe('+ 0.00013 BTC');
  });

  it('keeps Add a transaction in reach of the keyboard once the block is full', () => {
    const { container } = render(<Harness />);
    const add = screen.getByRole('button', { name: 'Add a transaction' });
    add.focus();
    fireEvent.click(add);
    fireEvent.click(add);
    expect(container.querySelectorAll('.inc-tx')).toHaveLength(6); // the coinbase and five payments
    expect(add).toHaveAttribute('aria-disabled', 'true');
    expect(add).not.toBeDisabled();
    expect(document.activeElement).toBe(add);
    fireEvent.click(add);
    expect(container.querySelectorAll('.inc-tx')).toHaveLength(6);
  });

  it('moves the focus to what takes a payment’s place when it is taken out of the block', () => {
    render(<Harness />);
    const remove = (from: string) =>
      screen.getByRole('button', { name: `Take the payment from ${from} out of the block` });

    // The payment below moves up: its button takes the focus.
    remove('Alice').focus();
    fireEvent.click(remove('Alice'));
    expect(document.activeElement).toBe(remove('Bob'));

    // Nothing below the last payment: the one above it takes the focus.
    remove('Carol').focus();
    fireEvent.click(remove('Carol'));
    expect(document.activeElement).toBe(remove('Bob'));

    // No payment left: the button that adds one takes the focus.
    fireEvent.click(remove('Bob'));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Add a transaction' }));
  });

  it('keeps the bar’s arrows in reach of the keyboard at the first block', () => {
    const { container } = render(<Harness startHeight={0} />);
    const previous = screen.getByRole('button', { name: 'Previous halving' });
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    expect(previous).not.toBeDisabled();
    fireEvent.click(previous);
    expect(container.querySelector('.inc-at-height')?.textContent).toBe('0');
  });

  it('moves to the next halving from the bar at the top', () => {
    const { container } = render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Next halving' }));
    expect(sumRow(container, 0)).toBe('1.5625 BTC');
    expect(container.querySelector('.inc-at-height')?.textContent).toBe('1,050,000');
  });
});
