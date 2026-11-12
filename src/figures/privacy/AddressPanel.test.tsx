import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { UI } from '@/content/ui';
import { SettingsProvider } from '@/i18n/settings';
import { AddressPanel } from './AddressPanel';
import { COPY } from './copy';

const show = (pointed = false) =>
  render(
    <SettingsProvider initialLang="en" initialDepth="curious">
      <AddressPanel pointed={pointed} />
    </SettingsProvider>,
  ).container;

const shownRows = (container: HTMLElement) => container.querySelectorAll('.prv-steps li[data-shown="true"]').length;

describe('from public key to address', () => {
  it('starts with the public key and adds one stage for each press', async () => {
    const user = userEvent.setup();
    const container = show();
    expect(shownRows(container)).toBe(1);
    await user.click(screen.getByRole('button', { name: COPY.nextStep.en }));
    expect(shownRows(container)).toBe(2);
  });

  it('keeps the focus on "Next step" after the press that shows the last stage', async () => {
    const user = userEvent.setup();
    const container = show();
    const step = screen.getByRole('button', { name: COPY.nextStep.en });
    step.focus();
    await user.keyboard('{Enter}{Enter}{Enter}');
    expect(shownRows(container)).toBe(4);
    expect(step).toHaveAttribute('aria-disabled', 'true');
    // Not the `disabled` attribute: the browser would take the focus away.
    expect(step).not.toBeDisabled();
    expect(step).toHaveFocus();
    // Pressing it again changes nothing.
    await user.keyboard('{Enter}');
    expect(shownRows(container)).toBe(4);
  });

  it('shows every stage at once, and carries the pointer, when the walkthrough is about it', () => {
    const container = show(true);
    expect(shownRows(container)).toBe(4);
    expect(container.querySelector('.prv-address')).toHaveClass('fig-pointed');
    expect(show(false).querySelector('.prv-address')).not.toHaveClass('fig-pointed');
  });

  it('says that the keys are for demonstration', () => {
    expect(show().textContent).toContain(UI.demoKeysWarning.en);
  });
});
