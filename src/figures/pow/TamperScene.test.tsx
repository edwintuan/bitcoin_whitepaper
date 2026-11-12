import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SettingsProvider } from '@/i18n/settings';
import { TamperScene } from './TamperScene';

function setup() {
  render(
    <SettingsProvider initialLang="en" initialDepth="curious">
      <TamperScene />
    </SettingsProvider>,
  );
  return screen.getAllByRole('textbox') as HTMLInputElement[];
}

describe('TamperScene', () => {
  it('lets the reader keep typing after the keystroke that breaks the chain', async () => {
    const user = userEvent.setup();
    const [first] = setup();
    const before = first.value;

    await user.click(first);
    await user.keyboard('{End}xyz');

    // The same input element is still on the page and still has the focus.
    expect(first).toBeInTheDocument();
    expect(first).toHaveFocus();
    expect(first.value).toBe(`${before}xyz`);
  });

  it('keeps the focus when a second block is edited while the chain is already broken', async () => {
    const user = userEvent.setup();
    const [first, second] = setup();

    await user.click(second);
    await user.keyboard('{End}!');
    await user.click(first);
    await user.keyboard('{End}ab');

    expect(first).toBeInTheDocument();
    expect(first).toHaveFocus();
    expect(first.value.endsWith('ab')).toBe(true);
    expect(second).toBeInTheDocument();
    expect(second.value.endsWith('!')).toBe(true);
  });

  it('marks the edited block and every block after it as broken, and nothing before it', async () => {
    const user = userEvent.setup();
    const [, second] = setup();
    await user.click(second);
    await user.keyboard('{End}!');

    const tiles = [...document.querySelectorAll('.tile')];
    expect(tiles.map((tile) => tile.getAttribute('data-state'))).toEqual(['confirmed', 'invalid', 'invalid']);
  });
});
