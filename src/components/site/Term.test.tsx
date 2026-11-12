import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TERMS } from '@/glossary';
import { SettingsProvider } from '@/i18n/settings';
import { plainRich } from '@/text/richtext';
import { Term } from './Term';

function setup(label?: string) {
  render(
    <SettingsProvider initialLang="en" initialDepth="curious">
      <p>
        the <Term id="nonce" label={label} />, and try again
      </p>
    </SettingsProvider>,
  );
  return screen.getByRole('button', { name: label ?? TERMS.nonce.name.en });
}

const shortOf = (id: string) => plainRich(TERMS[id].short.en, (termId) => TERMS[termId]?.name.en);

describe('Term', () => {
  it('is an inline element, so it wraps like text and keeps the punctuation that follows it', () => {
    // A <button> is laid out as one unbreakable box: a line may break between it and a comma.
    const trigger = setup();
    expect(trigger.tagName).toBe('SPAN');
    expect(trigger).toHaveClass('kw');
    expect(trigger.parentElement?.textContent).toBe('the nonce, and try again');
  });

  it('shows the glossary name unless the sentence supplies its own words', () => {
    expect(setup().textContent).toBe(TERMS.nonce.name.en);
  });

  it('uses the words the sentence supplies', () => {
    expect(setup('spare number').textContent).toBe('spare number');
  });

  it('can be reached and operated from the keyboard', async () => {
    const user = userEvent.setup();
    const trigger = setup();
    expect(trigger).toHaveAttribute('tabindex', '0');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByRole('dialog')).toHaveTextContent(shortOf('nonce'));
  });

  it('opens its card when pressed and closes it on Escape', async () => {
    const user = userEvent.setup();
    const trigger = setup();
    await user.click(trigger);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('takes the focus into its card and hands it back to the word on Escape', async () => {
    const user = userEvent.setup();
    const trigger = setup();
    await user.tab();
    await user.keyboard('{Enter}');
    const card = await screen.findByRole('dialog');
    await waitFor(() => expect(card.contains(document.activeElement)).toBe(true));

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('falls back to plain text for an id the glossary does not have', () => {
    render(
      <SettingsProvider initialLang="en" initialDepth="curious">
        <p>
          a <Term id="no-such-term" label="mystery" />
        </p>
      </SettingsProvider>,
    );
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText(/mystery/)).toBeInTheDocument();
  });
});
