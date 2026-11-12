import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SettingsProvider,
  pick,
  resolveInitialDepth,
  resolveInitialLang,
  useSettings,
  useT,
} from './settings';

describe('resolveInitialLang', () => {
  const base = { search: '', stored: null, languages: ['en-GB'] as string[] };

  it('prefers the URL, then the stored choice, then the browser', () => {
    expect(resolveInitialLang({ search: '?lang=zh', stored: 'en', languages: ['en-US'] })).toBe('zh');
    expect(resolveInitialLang({ ...base, stored: 'zh' })).toBe('zh');
    expect(resolveInitialLang({ ...base, languages: ['zh-HK', 'en'] })).toBe('zh');
    expect(resolveInitialLang(base)).toBe('en');
  });

  it('reads Chinese locales that write Traditional as Traditional, and a bare zh too', () => {
    for (const tag of ['zh', 'zh-TW', 'zh-HK', 'zh-MO', 'zh-Hant-HK']) {
      expect(resolveInitialLang({ ...base, languages: [tag] })).toBe('zh');
    }
    expect(resolveInitialLang({ ...base, search: '?lang=zh-Hant' })).toBe('zh');
    // Links shared before the Simplified edition existed.
    expect(resolveInitialLang({ ...base, search: '?lang=zh', languages: ['zh-CN'] })).toBe('zh');
  });

  it('reads Chinese locales that write Simplified as Simplified', () => {
    for (const tag of ['zh-CN', 'zh-SG', 'zh-Hans', 'zh-Hans-CN', 'zh-hans-sg']) {
      expect(resolveInitialLang({ ...base, languages: [tag] })).toBe('cn');
    }
    expect(resolveInitialLang({ ...base, search: '?lang=zh-CN' })).toBe('cn');
    expect(resolveInitialLang({ ...base, search: '?lang=cn' })).toBe('cn');
    expect(resolveInitialLang({ ...base, stored: 'cn' })).toBe('cn');
  });

  it('gives Simplified readers the Chinese copy converted, and the others theirs untouched', () => {
    const copy = { en: 'A block header', zh: '區塊頭' };
    expect(pick(copy, 'en')).toBe('A block header');
    expect(pick(copy, 'zh')).toBe('區塊頭');
    expect(pick(copy, 'cn')).toBe('区块头');
  });

  it('takes the first language it supports and falls back to English', () => {
    expect(resolveInitialLang({ ...base, languages: ['fr-FR', 'zh-HK', 'en'] })).toBe('zh');
    expect(resolveInitialLang({ ...base, languages: ['fr-FR', 'de'] })).toBe('en');
    expect(resolveInitialLang({ ...base, search: '?lang=klingon', stored: 'nonsense' })).toBe('en');
  });
});

describe('resolveInitialDepth', () => {
  it('defaults to curious and accepts only known depths', () => {
    expect(resolveInitialDepth({ search: '', stored: null })).toBe('curious');
    expect(resolveInitialDepth({ search: '?depth=developer', stored: 'starter' })).toBe('developer');
    expect(resolveInitialDepth({ search: '', stored: 'starter' })).toBe('starter');
    expect(resolveInitialDepth({ search: '?depth=expert', stored: 'guru' })).toBe('curious');
  });
});

function Probe() {
  const { lang, depth, depthEpoch, setLang, setDepth } = useSettings();
  const t = useT();
  return (
    <div>
      <p data-testid="state">{`${lang}/${depth}/${depthEpoch}`}</p>
      <p data-testid="text">{t({ en: 'Block', zh: '區塊' })}</p>
      <button onClick={() => setLang('zh')}>zh</button>
      <button onClick={() => setDepth('developer')}>dev</button>
    </div>
  );
}

describe('SettingsProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = '';
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('switches language, updates <html lang> and remembers the choice', async () => {
    render(<SettingsProvider initialLang="en"><Probe /></SettingsProvider>);
    expect(screen.getByTestId('text')).toHaveTextContent('Block');
    expect(document.documentElement.lang).toBe('en');

    await userEvent.click(screen.getByText('zh'));

    expect(screen.getByTestId('text')).toHaveTextContent('區塊');
    expect(document.documentElement.lang).toBe('zh-Hant-HK');
    expect(window.localStorage.getItem('bwe.lang')).toBe('zh');
  });

  it('bumps depthEpoch every time the depth is set, even to the same value', async () => {
    render(<SettingsProvider initialLang="en" initialDepth="curious"><Probe /></SettingsProvider>);
    expect(screen.getByTestId('state')).toHaveTextContent('en/curious/0');
    await userEvent.click(screen.getByText('dev'));
    expect(screen.getByTestId('state')).toHaveTextContent('en/developer/1');
    await userEvent.click(screen.getByText('dev'));
    expect(screen.getByTestId('state')).toHaveTextContent('en/developer/2');
    expect(window.localStorage.getItem('bwe.depth')).toBe('developer');
  });

  it('keeps working when storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    render(<SettingsProvider><Probe /></SettingsProvider>);
    await act(async () => {
      await userEvent.click(screen.getByText('zh'));
    });
    expect(screen.getByTestId('text')).toHaveTextContent('區塊');
  });

  it('sets <html lang> before the page is drawn in the new language', async () => {
    // The Chinese text is set in its own size and leading: what is measured
    // right after the switch has to be measured in them.
    const seen: string[] = [];
    function Watch() {
      const { lang } = useSettings();
      seen.push(`${lang}:${document.documentElement.lang}`);
      return null;
    }
    render(
      <SettingsProvider initialLang="en">
        <Probe />
        <Watch />
      </SettingsProvider>,
    );
    await userEvent.click(screen.getByText('zh'));
    expect(seen[seen.length - 1]).toBe('zh:zh-Hant-HK');
    expect(seen).not.toContain('zh:en');
  });

  describe('with a choice in the address', () => {
    afterEach(() => {
      window.history.replaceState(null, '', '/');
    });

    it('opens as the address asks', () => {
      window.history.replaceState(null, '', '/?lang=zh&depth=developer#spv');
      render(<SettingsProvider><Probe /></SettingsProvider>);
      expect(screen.getByTestId('state')).toHaveTextContent('zh/developer/0');
    });

    it('does not store what only the address asked for', () => {
      window.history.replaceState(null, '', '/?lang=zh&depth=developer');
      render(<SettingsProvider><Probe /></SettingsProvider>);
      expect(window.localStorage.getItem('bwe.lang')).toBeNull();
      expect(window.localStorage.getItem('bwe.depth')).toBeNull();
    });

    it('lets a choice made on the page outlive the address it arrived with', async () => {
      window.localStorage.setItem('bwe.lang', 'en');
      window.history.replaceState(null, '', '/?lang=en&ref=x&depth=starter#spv');
      const view = render(<SettingsProvider><Probe /></SettingsProvider>);
      expect(screen.getByTestId('state')).toHaveTextContent('en/starter/0');

      await userEvent.click(screen.getByText('zh'));
      await userEvent.click(screen.getByText('dev'));

      // The parameters that would overrule the reader are gone; everything else in the address stays.
      expect(window.location.search).toBe('?ref=x');
      expect(window.location.hash).toBe('#spv');

      // A reload now opens as the reader left it.
      view.unmount();
      render(<SettingsProvider><Probe /></SettingsProvider>);
      expect(screen.getByTestId('state')).toHaveTextContent('zh/developer/0');
    });
  });

  it('refuses to be used outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/SettingsProvider/);
    spy.mockRestore();
  });
});

describe('pick', () => {
  it('returns the value for the language', () => {
    expect(pick({ en: 1, zh: 2 }, 'zh')).toBe(2);
  });
});
