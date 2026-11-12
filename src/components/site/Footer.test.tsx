import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Lang } from '@/content/types';
import { SettingsProvider } from '@/i18n/settings';
import { Footer } from './References';

function setup(lang: Lang) {
  return render(
    <SettingsProvider initialLang={lang} initialDepth="curious">
      <Footer />
    </SettingsProvider>,
  );
}

describe('Footer', () => {
  it.each([
    ['en', 'Source on GitHub'],
    ['zh', 'GitHub 原始碼'],
  ] as const)('links to the source repository (%s)', (lang, name) => {
    setup(lang);
    const link = screen.getByRole('link', { name });
    expect(link.getAttribute('href')).toBe('https://github.com/edwintuan/bitcoin_whitepaper');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });
});
