import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FigureFrame } from '@/components/site/FigureFrame';
import section from '@/content/sections/11-calculations';
import { UI } from '@/content/ui';
import { SettingsProvider } from '@/i18n/settings';
import { COPY } from './copy';
import { plainVars } from './vars';

const steps = section.figure?.steps.en ?? [];

/** The figure inside its real frame, so that Next, Back and the figure's own `goTo` are all in play. */
async function setup() {
  render(
    <SettingsProvider initialLang="en" initialDepth="curious">
      <FigureFrame section={section} />
    </SettingsProvider>,
  );
  // The figure is loaded on demand.
  await screen.findByRole('slider', { name: plainVars(COPY.share.en) });
  return userEvent.setup();
}

const share = () => screen.getByRole('slider', { name: plainVars(COPY.share.en) });
const blocks = () => screen.getByRole('slider', { name: plainVars(COPY.blocks.en) });
const set = (slider: HTMLElement, value: number) => fireEvent.change(slider, { target: { value: String(value) } });
/** The two inputs as the figure prints them beside the sliders. */
const shown = () => [...document.querySelectorAll('.atk-input .stat-value')].map((value) => value.textContent);
const scene = (name: string) => screen.getByRole('radio', { name });
const next = () => screen.getByRole('button', { name: UI.stepNext.en });
const onStep = (index: number) => expect(screen.getByText(steps[index].title)).toBeInTheDocument();

describe('the attack calculator in its walkthrough', () => {
  it('opens on the calculator at 10% and five blocks', async () => {
    await setup();
    onStep(0);
    expect(shown()).toEqual(['10%', '5']);
    expect(scene(COPY.sceneCalculator.en)).toHaveAttribute('aria-checked', 'true');
  });

  it('keeps the reader’s inputs when a scene is opened by hand', async () => {
    const user = await setup();
    set(share(), 45);
    set(blocks(), 10);
    expect(shown()).toEqual(['45%', '10']);

    await user.click(scene(COPY.sceneCode.en));
    expect(shown()).toEqual(['45%', '10']);
    // The step about the loop quotes no numbers, so the walkthrough follows.
    onStep(3);

    await user.click(scene(COPY.sceneRace.en));
    expect(shown()).toEqual(['45%', '10']);
  });

  it('steps aside when the only step for a scene quotes other numbers than the reader’s', async () => {
    const user = await setup();
    set(share(), 45);
    set(blocks(), 10);
    await user.click(scene(COPY.sceneRace.en));
    // Step 6 says "30% of the hash power, three blocks behind": not what is on screen.
    expect(screen.queryByText(steps[5].title)).toBeNull();
    expect(screen.getByRole('button', { name: UI.stepRestart.en })).toBeInTheDocument();
  });

  it('follows to the race step when the reader already has its numbers', async () => {
    const user = await setup();
    set(share(), 30);
    set(blocks(), 3);
    await user.click(scene(COPY.sceneRace.en));
    onStep(5);
    expect(shown()).toEqual(['30%', '3']);
  });

  it('sets the inputs a step quotes when that step is reached with Next', async () => {
    const user = await setup();
    set(share(), 45);
    set(blocks(), 10);
    await user.click(next());
    expect(shown()).toEqual(['45%', '10']);
    await user.click(next());
    onStep(2);
    expect(shown()).toEqual(['10%', '5']);
    await user.click(next());
    await user.click(next());
    await user.click(next());
    onStep(5);
    expect(shown()).toEqual(['30%', '3']);
    expect(scene(COPY.sceneRace.en)).toHaveAttribute('aria-checked', 'true');
  });

  it('sets a step’s inputs again when the reader comes back to it with Back after opening a scene by hand', async () => {
    const user = await setup();
    await user.click(next());
    await user.click(next());
    set(share(), 45);
    await user.click(scene(COPY.sceneCode.en));
    onStep(3);
    expect(shown()[0]).toBe('45%');
    await user.click(screen.getByRole('button', { name: UI.stepPrev.en }));
    onStep(2);
    expect(shown()).toEqual(['10%', '5']);
  });

  it('announces the share as a percentage', async () => {
    await setup();
    expect(share()).toHaveAttribute('aria-valuetext', '10%');
  });
});
