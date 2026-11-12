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

  it('treats every Chinese locale as Traditional Chinese', () => {
    for (const tag of ['zh', 'zh-TW', 'zh-CN', 'zh-Hant-HK']) {
      expect(resolveInitialLang({ ...base, languages: [tag] })).toBe('zh');
    }
    expect(resolveInitialLang({ ...base, search: '?lang=zh-Hant' })).toBe('zh');
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
