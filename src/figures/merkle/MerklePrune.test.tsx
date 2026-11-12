import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FigureFrame } from '@/components/site/FigureFrame';
import { SECTIONS } from '@/content/sections';
import type { Lang } from '@/content/types';
import { SettingsProvider } from '@/i18n/settings';

const section = SECTIONS.find((entry) => entry.id === 'reclaiming-disk-space')!;

/** The figure in its real frame, walkthrough included, once it has loaded. */
async function setup(lang: Lang = 'en') {
  const user = userEvent.setup();
  render(
    <SettingsProvider initialLang={lang} initialDepth="developer">
      <FigureFrame section={section} />
    </SettingsProvider>,
  );
  // The figure is a chunk of its own, loaded on demand.
  await screen.findByRole('button', { name: lang === 'en' ? 'Prune' : '修剪' }, { timeout: 10_000 });
  return user;
}

const button = (name: string | RegExp) => screen.getByRole('button', { name });
const next = () => button('Next');
/** The part the walkthrough is pointing at. There is never more than one. */
const pointed = () => {
  const parts = [...document.querySelectorAll('.fig-pointed')];
  expect(parts).toHaveLength(1);
  return parts[0];
};

describe('the Merkle tree figure', () => {
  it('points at the part each step talks about', async () => {
    const user = await setup();

    // Steps 1 and 2: the row that replays the build.
    expect(pointed()).toContainElement(button('Play'));
    await user.click(next());
    expect(pointed()).toContainElement(button('Play'));

    // Step 3: the tree, where transactions are marked.
    await user.click(next());
    expect(pointed()).toContainElement(button(/^Tx0, unspent/));
    expect(pointed()).not.toContainElement(button('Prune'));

    // Step 4: the row with Prune.
    await user.click(next());
    expect(pointed()).toContainElement(button('Prune'));
    expect(pointed()).not.toContainElement(button('Play'));

    // Step 5: the block interval, in the other scene.
    await user.click(next());
    expect(pointed()).toContainElement(screen.getByRole('slider'));
  });

  it('moves on to the step about marking when a transaction is pressed in the build of four', async () => {
    const user = await setup();

    await user.click(button(/^Tx0, unspent/));

    expect(screen.getByText('Mark what is spent')).toBeInTheDocument();
    expect(button(/^Tx0, marked as spent/)).toBeInTheDocument();
  });

  it('lets the walkthrough go when a transaction is pressed while five are on screen', async () => {
    const user = await setup();
    await user.click(next());

    await user.click(button(/^Tx4, unspent/));

    // The next step begins "Back to four", which would be untrue with five on screen.
    expect(screen.queryByText(/^Back to four/)).not.toBeInTheDocument();
    expect(button('Replay the walkthrough')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Tx\d, / })).toHaveLength(5);
    expect(button(/^Tx4, marked as spent/)).toBeInTheDocument();
  });

  it('lets the walkthrough go when the number of transactions is changed in a step that names it', async () => {
    const user = await setup();

    await user.click(button('Add a transaction'));

    expect(screen.queryByText(/^Four transactions sit at the bottom/)).not.toBeInTheDocument();
    expect(button('Replay the walkthrough')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Tx\d, / })).toHaveLength(5);
  });

  it('goes back to marking when Start over leaves nothing to prune', async () => {
    const user = await setup();
    for (let press = 0; press < 3; press++) await user.click(next());
    expect(screen.getByText('Prune', { selector: '.figure-step-title *' })).toBeInTheDocument();

    await user.click(button('Start over'));

    expect(screen.getByText('Mark what is spent')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Tx\d, unspent/ })).toHaveLength(4);
  });

  it('reads well with a block every minute', async () => {
    const user = await setup();
    for (let press = 0; press < 4; press++) await user.click(next());

    // Named once, by what it sets.
    fireEvent.change(screen.getByRole('slider', { name: 'Minutes between blocks' }), { target: { value: '1' } });

    expect(screen.getByRole('status')).toHaveTextContent(
      'With a block every 1 min: 42.0 MB of headers a year, about 10.5 times the largest block the rules allow.',
    );
  });

  it('keeps the keyboard focus on Prune once there is nothing left to prune', async () => {
    const user = await setup();
    await user.click(next());
    await user.click(next());
    await user.click(button(/^Tx0, unspent/));

    const prune = button('Prune');
    await user.click(prune);

    expect(prune).toHaveFocus();
    expect(prune).not.toHaveAttribute('disabled');
    expect(prune).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('img', { name: 'Tx0: pruned. Only its hash is kept.' })).toBeInTheDocument();
  });

  it('does nothing when Prune is pressed with no transaction marked', async () => {
    const user = await setup();
    await user.click(next());
    await user.click(next());

    await user.click(button('Prune'));

    expect(button(/^Tx0, unspent/)).toBeInTheDocument();
    expect(screen.queryByText('Root in the block header')).not.toBeInTheDocument();
  });

  it('keeps the focus on Start over after it has cleared the marks', async () => {
    const user = await setup();
    await user.click(next());
    await user.click(next());
    await user.click(button(/^Tx1, unspent/));

    const startOver = button('Start over');
    await user.click(startOver);

    expect(startOver).toHaveFocus();
    expect(startOver).not.toHaveAttribute('disabled');
    expect(startOver).toHaveAttribute('aria-disabled', 'true');
    expect(button(/^Tx1, unspent/)).toBeInTheDocument();
  });

  it('stops at two transactions without taking the stepper out of reach', async () => {
    const user = await setup();
    await user.click(next());
    await user.click(next());

    const remove = button('Remove the last transaction');
    await user.click(remove);
    await user.click(remove);
    expect(screen.getAllByRole('button', { name: /^Tx\d, unspent/ })).toHaveLength(2);

    expect(remove).toHaveFocus();
    expect(remove).not.toHaveAttribute('disabled');
    expect(remove).toHaveAttribute('aria-disabled', 'true');

    // Pressed again at the limit, it leaves the block alone.
    await user.click(remove);
    expect(screen.getAllByRole('button', { name: /^Tx\d, unspent/ })).toHaveLength(2);
  });

  it('stops at eight transactions the same way', async () => {
    const user = await setup();
    await user.click(next());
    await user.click(next());

    const add = button('Add a transaction');
    for (let count = 4; count < 8; count++) await user.click(add);
    expect(screen.getAllByRole('button', { name: /^Tx\d, unspent/ })).toHaveLength(8);

    expect(add).not.toHaveAttribute('disabled');
    expect(add).toHaveAttribute('aria-disabled', 'true');
    await user.click(add);
    expect(screen.getAllByRole('button', { name: /^Tx\d, unspent/ })).toHaveLength(8);
  });

  it('locks the stepper of a pruned block, still within reach of the keyboard', async () => {
    const user = await setup();
    await user.click(next());
    await user.click(next());
    await user.click(button(/^Tx0, unspent/));
    await user.click(button('Prune'));

    for (const name of ['Add a transaction', 'Remove the last transaction']) {
      expect(button(name)).not.toHaveAttribute('disabled');
      expect(button(name)).toHaveAttribute('aria-disabled', 'true');
    }
    // A pruned block cannot take new transactions.
    await user.click(button('Add a transaction'));
    expect(screen.getAllByRole('button', { name: /^Tx\d, / })).toHaveLength(3);
  });

  it('names the fields of the header in the reader’s language', async () => {
    await setup('zh');
    // The header storage scene is mounted but not shown until its tab is chosen.
    expect(screen.getByRole('listitem', { name: '默克爾根: 32 位元組', hidden: true })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: '隨機數: 4 位元組', hidden: true })).toBeInTheDocument();
  });
});
