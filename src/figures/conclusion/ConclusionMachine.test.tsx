import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FigureFrame } from '@/components/site/FigureFrame';
import section from '@/content/sections/12-conclusion';
import { UI } from '@/content/ui';
import { SettingsProvider } from '@/i18n/settings';
import { COPY } from './copy';

const steps = section.figure?.steps.en ?? [];
const name = (id: keyof typeof COPY.parts) => COPY.parts[id].name.en;

/** The figure inside its real frame, so that Next, Back and the figure's own `goTo` are all in play. */
async function setup() {
  render(
    <SettingsProvider initialLang="en" initialDepth="curious">
      <FigureFrame section={section} />
    </SettingsProvider>,
  );
  // The figure is loaded on demand.
  await screen.findByRole('button', { name: name('wallet') });
  return userEvent.setup();
}

const part = (id: keyof typeof COPY.parts) => screen.getByRole('button', { name: new RegExp(`^${name(id)}`) });
const selected = () => screen.getAllByRole('button', { pressed: true }).map((button) => button.textContent);
const ghosts = () => [...document.querySelectorAll('.mch-part[data-state="ghost"]')].length;
const next = () => screen.getByRole('button', { name: UI.stepNext.en });
const onStep = (index: number) => expect(screen.getByText(steps[index].title)).toBeInTheDocument();

describe('the conclusion machine in its walkthrough', () => {
  it('opens on the first step with the wallet selected and seven parts still to come', async () => {
    await setup();
    onStep(0);
    expect(part('wallet')).toHaveAttribute('aria-pressed', 'true');
    expect(ghosts()).toBe(7);
  });

  it('selects the part that was pressed, not the first part of the step it belongs to', async () => {
    const user = await setup();
    await user.click(part('mempool'));
    onStep(2);
    expect(part('mempool')).toHaveAttribute('aria-pressed', 'true');
    expect(selected()).toHaveLength(1);

    await user.click(part('light'));
    onStep(4);
    expect(part('light')).toHaveAttribute('aria-pressed', 'true');
    expect(selected()).toHaveLength(1);
  });

  it('stays on the step when a part already in place is pressed, and takes nothing apart', async () => {
    const user = await setup();
    await user.click(next());
    await user.click(next());
    onStep(2);
    expect(ghosts()).toBe(3);

    await user.click(part('wallet'));
    onStep(2);
    expect(part('wallet')).toHaveAttribute('aria-pressed', 'true');
    expect(ghosts()).toBe(3);
  });

  it('selects the first part of a step reached with Next', async () => {
    const user = await setup();
    await user.click(part('transaction'));
    await user.click(next());
    onStep(1);
    expect(part('chain')).toHaveAttribute('aria-pressed', 'true');
    expect(selected()).toHaveLength(1);
  });

  it('works from the keyboard as it does with the pointer', async () => {
    const user = await setup();
    part('incentive').focus();
    await user.keyboard('{Enter}');
    onStep(3);
    expect(part('incentive')).toHaveAttribute('aria-pressed', 'true');
    expect(part('incentive')).toHaveFocus();
  });
});
