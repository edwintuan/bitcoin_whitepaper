import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Lang } from '@/content/types';
import { SettingsProvider } from '@/i18n/settings';
import { Support } from './Support';

function setup(lang: Lang) {
  return render(
    <SettingsProvider initialLang={lang} initialDepth="curious">
      <Support />
    </SettingsProvider>,
  );
}

// Exactly as the owner gave them. A wrong character here sends money nowhere.
const ADDRESSES = [
  'bc1qfl9phz8p4capyd2ewz0w4u3s0wgu05kwv2cya6',
  '0x7E9620a4bAB85aED025b8c8d6277834084b0D261',
  'TYR5uQCUpk2MztNWQgBP9E9BKNUVgdLvFr',
];

describe('Support', () => {
  it('shows the three addresses, character for character', () => {
    setup('en');
    const shown = screen.getAllByRole('listitem').map((item) => item.querySelector('code')?.textContent);
    expect(shown).toEqual(ADDRESSES);
  });

  it.each([
    ['en', 'Support this project'],
    ['zh', '支持這個項目'],
    ['cn', '支持这个项目'],
  ] as const)('is titled in the reader’s language (%s)', (lang, title) => {
    setup(lang);
    expect(screen.getByRole('heading', { name: title })).toBeTruthy();
  });

  it('copies an address when its button is pressed, and says so', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    setup('en');
    await user.click(screen.getByRole('button', { name: 'Copy the Bitcoin address' }));
    expect(writeText).toHaveBeenCalledWith(ADDRESSES[0]);
    expect(await screen.findByText('Copied')).toBeTruthy();
  });
});
