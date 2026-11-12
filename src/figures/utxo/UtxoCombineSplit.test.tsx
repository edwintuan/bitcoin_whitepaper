import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FigureFrame } from '@/components/site/FigureFrame';
import { SECTIONS } from '@/content/sections';
import { SettingsProvider } from '@/i18n/settings';

const section = SECTIONS.find((entry) => entry.id === 'combining-splitting-value')!;

/** The figure in its real frame, walkthrough included, once it has loaded. */
async function setup() {
  const user = userEvent.setup();
  render(
    <SettingsProvider initialLang="en" initialDepth="developer">
      <FigureFrame section={section} />
    </SettingsProvider>,
  );
  // The figure is a chunk of its own, loaded on demand.
  await screen.findByRole('button', { name: 'Send' }, { timeout: 10_000 });
  return user;
}

const button = (name: string | RegExp) => screen.getByRole('button', { name });
const next = () => button('Next');
const coins = () => screen.getAllByRole('button', { name: /^A coin of / });
const amount = () => screen.getByRole('textbox', { name: 'Amount to pay Bob, in BTC' });
const transaction = () => screen.getByRole('group', { name: /^The transaction your wallet would build/ });
/** The part the walkthrough is pointing at. There is never more than one. */
const pointed = () => {
  const parts = [...document.querySelectorAll('.fig-pointed')];
  expect(parts).toHaveLength(1);
  return parts[0];
};

describe('the wallet figure', () => {
  it('points at the part each step talks about', async () => {
    const user = await setup();

    // Step 1: the wallet and its coins.
    expect(pointed()).toContainElement(button('A coin of 0.5 BTC'));
    expect(pointed()).not.toContainElement(button('Send'));

    // Steps 2 and 3: the transaction the wallet builds.
    await user.click(next());
    expect(pointed().contains(transaction())).toBe(true);
    expect(pointed()).not.toContainElement(button('A coin of 0.5 BTC'));
    await user.click(next());
    expect(pointed().contains(transaction())).toBe(true);

    // Step 4: the fee, and only the fee.
    await user.click(next());
    expect(pointed()).toHaveTextContent('left for the miner');
    expect(pointed().contains(transaction())).toBe(false);

    // Step 5: the row with Send.
    await user.click(next());
    expect(pointed()).toContainElement(button('Send'));
    expect(pointed()).not.toContainElement(amount());
  });

  it('lets the walkthrough go when a coin is pressed in the first step, and does not jump to "Press Send"', async () => {
    const user = await setup();

    await user.click(button('A coin of 0.5 BTC'));

    expect(screen.queryByText(/^Press Send/)).not.toBeInTheDocument();
    expect(button('Replay the walkthrough')).toBeInTheDocument();
    expect(button('A coin of 0.5 BTC')).toHaveAttribute('aria-pressed', 'true');
  });

  it('stays in the last step when a coin is pressed there, as that step invites', async () => {
    const user = await setup();
    for (let press = 0; press < 4; press++) await user.click(next());

    await user.click(button('A coin of 0.02 BTC'));

    expect(screen.getByText('Send, then pay again')).toBeInTheDocument();
  });

  it('follows an amount given by hand to the step that pays it', async () => {
    const user = await setup();

    await user.click(button('0.6'));
    expect(screen.getByText('Combine several coins')).toBeInTheDocument();

    await user.click(button('Reset the wallet'));
    expect(screen.getByText('Meet your coins')).toBeInTheDocument();
    await user.type(amount(), '0.15');
    expect(screen.getByText('Split one coin')).toBeInTheDocument();
  });

  it('shows no error while a valid amount is still being typed', async () => {
    const user = await setup();

    await user.type(amount(), '0');
    expect(amount()).toHaveAttribute('aria-invalid', 'false');
    await user.type(amount(), '.');
    expect(amount()).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByRole('status')).not.toHaveTextContent('Enter an amount in BTC');

    await user.type(amount(), '15');
    expect(amount()).toHaveValue('0.15');
    expect(transaction()).toBeInTheDocument();
  });

  it('says so when the text cannot become an amount', async () => {
    const user = await setup();

    await user.type(amount(), '1,5');

    expect(amount()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Enter an amount in BTC, such as 0.15');
  });

  it('keeps the keyboard focus on Send once the payment has gone', async () => {
    const user = await setup();
    await user.type(amount(), '0.15');

    const send = button('Send');
    await user.click(send);

    expect(send).toHaveFocus();
    expect(send).not.toHaveAttribute('disabled');
    expect(send).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('status')).toHaveTextContent(/^Sent\./);
    // The 0.2 coin is spent and its change has come back: five coins again.
    expect(coins()).toHaveLength(5);
    expect(button('A coin of 0.04998 BTC, just received as change')).toBeInTheDocument();
  });

  it('sends nothing while there is no transaction to send', async () => {
    const user = await setup();
    const send = button('Send');
    expect(send).not.toHaveAttribute('disabled');
    expect(send).toHaveAttribute('aria-disabled', 'true');

    await user.click(send);

    expect(coins()).toHaveLength(5);
    expect(screen.getByRole('status')).not.toHaveTextContent(/^Sent\./);
  });

  it('moves the focus to the line that says who chooses, when the wallet takes the choice back', async () => {
    const user = await setup();
    await user.click(button('A coin of 0.1 BTC'));
    const handBack = button('Let the wallet choose');

    await user.click(handBack);

    // The button is gone; the focus must not be left on nothing.
    expect(handBack).not.toBeInTheDocument();
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toHaveTextContent('Coins chosen by the wallet');
  });

  it('draws a transaction as one group holding its inputs and its outputs', async () => {
    const user = await setup();
    await user.type(amount(), '0.6');

    const lists = [...transaction().querySelectorAll('ul')];
    expect(lists.map((list) => list.children.length)).toEqual([2, 2]);
    expect(transaction()).toHaveTextContent('your coin');
    expect(transaction()).toHaveTextContent('to Bob');
    expect(transaction()).toHaveTextContent('back to you');
  });
});
