import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { describe, expect, it } from 'vitest';
import ChangeVisual from '@/glossary/visuals/change';
import FeeVisual from '@/glossary/visuals/fee';
import MerkleBranchVisual from '@/glossary/visuals/merkle-branch';
import SpvVisual from '@/glossary/visuals/spv';
import UtxoVisual from '@/glossary/visuals/utxo';
import { SettingsProvider } from '@/i18n/settings';

/**
 * The term visuals that go with sections 7 to 9. They live in
 * src/glossary/visuals, where every file is taken for a visual, so their
 * tests are kept here, beside the small tree three of them share.
 */
function show(Visual: ComponentType) {
  const user = userEvent.setup();
  const { container } = render(
    <SettingsProvider initialLang="en" initialDepth="developer">
      <Visual />
    </SettingsProvider>,
  );
  return { user, container };
}

const button = (name: string) => screen.getByRole('button', { name });

describe('the fee visual', () => {
  it('stops at no change at all without taking the stepper out of reach', async () => {
    const { user } = show(FeeVisual);
    const less = button('Smaller change output');

    // 28,000 satoshis of change, taken away 7,000 at a time.
    for (let press = 0; press < 4; press++) await user.click(less);

    expect(screen.getByText('30,000')).toBeInTheDocument();
    expect(less).toHaveFocus();
    expect(less).not.toHaveAttribute('disabled');
    expect(less).toHaveAttribute('aria-disabled', 'true');

    // Pressed again at the limit, the fee stays where it is.
    await user.click(less);
    expect(screen.getByText('30,000')).toBeInTheDocument();
  });

  it('opens with the largest change, where a larger one is not on offer', async () => {
    const { user } = show(FeeVisual);
    const more = button('Larger change output');
    expect(more).not.toHaveAttribute('disabled');
    expect(more).toHaveAttribute('aria-disabled', 'true');

    await user.click(more);

    expect(screen.getByText('2,000')).toBeInTheDocument();
  });
});

describe('the change visual', () => {
  it('stops at the largest payment without taking the stepper out of reach', async () => {
    const { user } = show(ChangeVisual);
    const more = button('Pay more');

    // From 0.15 to 0.45 BTC, 0.05 at a time.
    for (let press = 0; press < 6; press++) await user.click(more);

    expect(screen.getByText('payment 0.45')).toBeInTheDocument();
    expect(more).toHaveFocus();
    expect(more).not.toHaveAttribute('disabled');
    expect(more).toHaveAttribute('aria-disabled', 'true');

    await user.click(more);
    expect(screen.getByText('payment 0.45')).toBeInTheDocument();
  });
});

describe('the unspent output visual', () => {
  it('charges the fee the change visual charges: a spent coin never comes back whole', async () => {
    const { user } = show(UtxoVisual);

    await user.click(button('Spend the 0.5'));

    // 0.5 in, 0.3 paid away, a flat fee of 1,000 satoshis: 0.19999 comes back.
    expect(screen.getByText('0.19999')).toBeInTheDocument();
    expect(screen.getByText('0.3')).toBeInTheDocument();
    expect(screen.queryByText('0.5')).not.toBeInTheDocument();
  });

  it('agrees with the arithmetic the change visual shows', () => {
    show(ChangeVisual);
    expect(screen.getByText('0.5 − 0.15 − 0.00001 = 0.34999')).toBeInTheDocument();
  });
});

describe('the payment verification visual', () => {
  it('sets its words as text of the page, not inside a drawing that scales', () => {
    const { container } = show(SpvVisual);
    expect(container.querySelectorAll('svg text')).toHaveLength(0);
    expect(screen.getByText('Tx3')).toBeInTheDocument();
    expect(screen.getAllByText('header')).toHaveLength(3);
  });

  it('describes the drawing to readers who cannot see it, and offers nothing to press', () => {
    show(SpvVisual);
    expect(screen.getByRole('img', { name: /^Three block headers in a chain/ })).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});

describe('the Merkle branch visual', () => {
  it('keeps every transaction a button, with the picked one pressed', async () => {
    const { user } = show(MerkleBranchVisual);
    const leaves = screen.getAllByRole('button');
    expect(leaves).toHaveLength(4);

    await user.click(leaves[0]);

    expect(leaves[0]).toHaveFocus();
    expect(leaves[0]).toHaveAttribute('aria-pressed', 'true');
    expect(leaves[2]).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Tx0 + 2 hashes → root')).toBeInTheDocument();
  });
});
