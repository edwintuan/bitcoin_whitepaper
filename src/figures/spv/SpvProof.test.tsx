import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FigureFrame } from '@/components/site/FigureFrame';
import { SECTIONS } from '@/content/sections';
import { SettingsProvider } from '@/i18n/settings';
import { foldProof, merkleProof } from '@/lib/merkle';
import { blockPayments, corrupt } from './model';

const section = SECTIONS.find((entry) => entry.id === 'spv')!;
/** The ids of the block's eight transactions, as the figure computes them. */
const ids = blockPayments().map((payment) => payment.id);

/** The figure in its real frame, walkthrough included, once it has loaded. */
async function setup() {
  const user = userEvent.setup();
  render(
    <SettingsProvider initialLang="en" initialDepth="developer">
      <FigureFrame section={section} />
    </SettingsProvider>,
  );
  // The figure is a chunk of its own, loaded on demand.
  await screen.findByRole('button', { name: 'Ask a full node for proof' }, { timeout: 10_000 });
  return user;
}

const button = (name: string | RegExp) => screen.getByRole('button', { name });
const next = () => button('Next');
const leaves = () => screen.getAllByRole('button', { name: /^Tx\d: / });
/** The part the walkthrough is pointing at. There is never more than one. */
const pointed = () => {
  const parts = [...document.querySelectorAll('.fig-pointed')];
  expect(parts).toHaveLength(1);
  return parts[0];
};

describe('the payment verification figure', () => {
  it('points at the part each step talks about', async () => {
    const user = await setup();

    // Step 1: the tree, where the payment is picked.
    expect(pointed()).toContainElement(button(/^Tx5: press/));
    expect(pointed()).not.toContainElement(button('Ask a full node for proof'));

    // Steps 2 and 3: the row that asks for the branch and folds it.
    await user.click(next());
    expect(pointed()).toContainElement(button('Ask a full node for proof'));
    await user.click(next());
    expect(pointed()).toContainElement(button('Next hash'));

    // Step 4: the tamper control.
    await user.click(next());
    expect(pointed()).toContainElement(screen.getByRole('radio', { name: 'The transaction' }));
    expect(pointed()).not.toContainElement(button('Next hash'));

    // Step 5: the size of the block, in the other scene.
    await user.click(next());
    expect(pointed()).toContainElement(screen.getByRole('slider'));
  });

  it('draws every transaction as a button and marks the one being checked', async () => {
    await setup();
    expect(leaves()).toHaveLength(8);
    expect(screen.getByRole('button', { name: /^Tx2: /, pressed: true })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Tx\d: /, pressed: false })).toHaveLength(7);
  });

  it('keeps the keyboard focus on a transaction once it has been picked', async () => {
    const user = await setup();
    const tx5 = button(/^Tx5: /);

    await user.click(tx5);

    // The same button is still there, now the pressed one.
    expect(tx5).toBeInTheDocument();
    expect(tx5).toHaveFocus();
    expect(tx5).toHaveAttribute('aria-pressed', 'true');
    expect(button(/^Tx2: /)).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('pays 0.025 BTC')).toBeInTheDocument();
  });

  it('keeps the focus on Ask once the branch has arrived', async () => {
    const user = await setup();
    const ask = button('Ask a full node for proof');

    await user.click(ask);

    expect(ask).toHaveFocus();
    expect(ask).not.toHaveAttribute('disabled');
    expect(ask).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('The node sent 3 hashes');
  });

  it('keeps the focus on Next hash after the last hash, and reaches the verdict', async () => {
    const user = await setup();
    await user.click(button('Ask a full node for proof'));
    const nextHash = button('Next hash');

    await user.click(nextHash);
    await user.click(nextHash);
    await user.click(nextHash);

    expect(nextHash).toHaveFocus();
    expect(nextHash).not.toHaveAttribute('disabled');
    expect(nextHash).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('status')).toHaveTextContent(/^Equal/);

    // Pressed again, it changes nothing.
    await user.click(nextHash);
    expect(screen.getByRole('status')).toHaveTextContent(/^Equal/);
  });

  it('does not fold before a branch has been asked for', async () => {
    const user = await setup();
    const nextHash = button('Next hash');
    expect(nextHash).not.toHaveAttribute('disabled');
    expect(nextHash).toHaveAttribute('aria-disabled', 'true');

    await user.click(nextHash);

    expect(screen.getByRole('status')).toHaveTextContent('Press a transaction to pick the payment');
  });

  it('shows in the working only what the wallet has computed so far', async () => {
    const user = await setup();
    // Tx2 is the payment checked by default.
    const folds = foldProof(ids[2], merkleProof(ids, 2));
    await user.click(button('Ask a full node for proof'));
    const working = screen.getByRole('list', { name: 'The wallet’s working, one hash at a time' });

    // Nothing has been hashed yet: the result of step 1 is not known, so step 2 cannot show it as its operand.
    expect(working).toHaveTextContent(ids[2]);
    expect(working).not.toHaveTextContent(folds[0].out);
    expect(working).not.toHaveTextContent(folds[1].out);

    await user.click(button('Next hash'));
    expect(working).toHaveTextContent(folds[0].out);
    expect(working).not.toHaveTextContent(folds[1].out);
  });

  it('opens the verdict with a sentence of its own', async () => {
    const user = await setup();
    await user.click(button('Ask a full node for proof'));
    for (let press = 0; press < 3; press++) await user.click(button('Next hash'));
    expect(screen.getByRole('status')).toHaveTextContent(/^Equal\. What you computed is the Merkle root in the header/);
  });

  it('shows an altered proof as altered, in the tree and in the working', async () => {
    const user = await setup();
    const sibling = merkleProof(ids, 2)[0].hash;

    await user.click(screen.getByRole('radio', { name: 'The proof' }));

    // The lie is in the first digit, which a shortened hash shows.
    const altered = corrupt(sibling);
    expect(altered.slice(0, 8)).not.toBe(sibling.slice(0, 8));
    const tree = screen.getByRole('group', { name: /^The Merkle tree of block 2/ });
    const working = screen.getByRole('list', { name: 'The wallet’s working, one hash at a time' });
    for (const part of [tree, working]) {
      const marked = part.querySelector('[data-altered="true"]');
      expect(marked).not.toBeNull();
      expect(marked).toHaveTextContent(altered);
    }
    expect(screen.getByRole('status')).toHaveTextContent(/^Not equal\. One altered hash changes every hash above it/);
  });

  it('names the size slider for what it really steps through', async () => {
    const user = await setup();
    for (let press = 0; press < 4; press++) await user.click(next());
    expect(screen.getByRole('slider', { name: 'Block size, as a power of two' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/every transaction is at least 60 bytes\.$/);
  });

  it('keeps the focus on Start again after it has cleared the check', async () => {
    const user = await setup();
    await user.click(button('Ask a full node for proof'));
    const again = button('Start again');

    await user.click(again);

    expect(again).toHaveFocus();
    expect(again).not.toHaveAttribute('disabled');
    expect(again).toHaveAttribute('aria-disabled', 'true');
    expect(button('Ask a full node for proof')).toHaveAttribute('aria-disabled', 'false');
  });
});
