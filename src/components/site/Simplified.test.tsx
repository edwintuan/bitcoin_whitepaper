import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { SettingsProvider } from '@/i18n/settings';
import { Footer } from './References';
import { TopBar } from './TopBar';

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.lang = '';
});

describe('the Simplified edition', () => {
  it('is offered on the language switch beside English and Traditional', () => {
    render(
      <SettingsProvider initialLang="en">
        <TopBar />
      </SettingsProvider>,
    );
    const names = screen.getAllByRole('radio').map((radio) => radio.getAttribute('aria-label'));
    expect(names).toEqual(expect.arrayContaining(['English', '繁體中文', '简体中文']));
  });

  it('shows the page in Simplified once chosen, marks it so, and remembers the choice', async () => {
    render(
      <SettingsProvider initialLang="zh">
        <TopBar />
        <Footer />
      </SettingsProvider>,
    );
    expect(screen.getByText(/返回頁首/)).toBeTruthy();
    await userEvent.click(screen.getAllByRole('radio', { name: '简体中文' })[0]!);
    expect(screen.getByText(/返回页首/)).toBeTruthy();
    expect(screen.queryByText(/返回頁首/)).toBeNull();
    expect(document.documentElement.lang).toBe('zh-Hans-CN');
    expect(window.localStorage.getItem('bwe.lang')).toBe('cn');
  });
});
