import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UI } from '@/content/ui';
import { TERMS, TERM_IDS } from '@/glossary';
import { SettingsProvider } from '@/i18n/settings';
import { requestTerm } from '@/state/termRequest';
import { GlossaryIndex } from './GlossaryIndex';

function setup() {
  render(
    <SettingsProvider initialLang="en" initialDepth="curious">
      <GlossaryIndex />
    </SettingsProvider>,
  );
  return userEvent.setup();
}

beforeEach(() => {
  // jsdom has no layout: nothing to scroll.
  Element.prototype.scrollIntoView = vi.fn();
});

const entry = (id: string) => document.getElementById(`term-${id}`);

describe('GlossaryIndex', () => {
  it('lists every term', () => {
    setup();
    expect(document.querySelectorAll('.glossary-item')).toHaveLength(TERM_IDS.length);
  });

  it('groups the full list under its nine categories', () => {
    setup();
    const groups = [...document.querySelectorAll('.glossary-group')];
    expect(groups).toHaveLength(9);
    for (const group of groups) {
      expect(group.querySelector('h3')).not.toBeNull();
      expect(group.querySelectorAll('.glossary-item').length).toBeGreaterThan(0);
    }
  });

  it('narrows to one category', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: UI.appendix.categories.privacy.en }));
    const shown = [...document.querySelectorAll('.glossary-item')].map((item) => item.id.replace('term-', ''));
    expect(shown.length).toBeGreaterThan(0);
    for (const id of shown) expect(TERMS[id].category).toBe('privacy');
  });

  it('opens the card of a requested term, with the focus inside it', async () => {
    setup();
    act(() => requestTerm('nonce'));
    const card = await screen.findByRole('dialog');
    expect(card).toHaveTextContent(TERMS.nonce.name.en);
    await waitFor(() => expect(card.contains(document.activeElement)).toBe(true));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('finds a requested term even when the list is narrowed to another category', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: UI.appendix.categories.privacy.en }));
    expect(entry('nonce')).toBeNull();

    act(() => requestTerm('nonce'));
    await screen.findByRole('dialog');
    expect(entry('nonce')).not.toBeNull();
    expect(screen.getByRole('button', { name: UI.appendix.all.en })).toHaveAttribute('aria-pressed', 'true');
  });

  it('hands the focus back to the entry when the card is closed', async () => {
    const user = setup();
    act(() => requestTerm('nonce'));
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(entry('nonce')?.querySelector('.kw')));
  });
});
