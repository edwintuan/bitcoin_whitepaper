import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Lang, WhitepaperSection } from '@/content/types';
import { SettingsProvider } from '@/i18n/settings';
import { OriginalText } from './OriginalText';

const section: WhitepaperSection = {
  id: 'calculations',
  number: 11,
  heading: { en: 'Calculations', zh: '計算' },
  en: [
    { type: 'p', text: 'We can calculate the probability as follows [8]:' },
    {
      type: 'list',
      ordered: false,
      items: ['q = probability the attacker finds the next block', 'qz = probability the attacker will ever catch up from z blocks behind'],
    },
    { type: 'code', code: 'double q, int z' },
  ],
  zh: [
    { type: 'p', text: '計算方法如下 [8]：' },
    { type: 'list', ordered: false, items: ['q = 攻擊者找到下一個區塊的概率', 'qz = 攻擊者在落後 z 個區塊的情況下終能追上的概率'] },
    { type: 'code', code: 'double q, int z' },
  ],
};

function setup(lang: Lang) {
  return render(
    <SettingsProvider initialLang={lang} initialDepth="curious">
      <OriginalText section={section} />
    </SettingsProvider>,
  ).container;
}

describe('OriginalText', () => {
  it('shows the English alone when reading in English', () => {
    const container = setup('en');
    expect(container.querySelectorAll('p')).toHaveLength(1);
    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(container.textContent).not.toContain('攻擊者');
  });

  it('sets each Chinese paragraph beside the English it translates, and shows code once', () => {
    const container = setup('zh');
    const pairs = container.querySelectorAll('.original-pair');
    expect(pairs).toHaveLength(2);
    expect(pairs[0].querySelector('[lang="zh-Hant-HK"]')?.textContent).toBe('計算方法如下 [8]：');
    expect(pairs[0].querySelector('[lang="en"]')?.textContent).toBe('We can calculate the probability as follows [8]:');
    expect(container.querySelectorAll('pre')).toHaveLength(1);
  });

  it('prints the z of qz as a subscript, as the paper does, in both languages', () => {
    for (const lang of ['en', 'zh'] as const) {
      const container = setup(lang);
      const subscripts = [...container.querySelectorAll('li sub')];
      expect(subscripts.map((sub) => sub.textContent)).toEqual(lang === 'en' ? ['z'] : ['z', 'z']);
      for (const sub of subscripts) expect(sub.parentElement?.textContent?.startsWith('qz = ')).toBe(true);
    }
  });

  it('leaves every other q and z alone, code included', () => {
    const container = setup('en');
    expect(container.querySelectorAll('sub')).toHaveLength(1);
    expect(container.querySelector('pre')?.querySelector('sub')).toBeNull();
    expect(container.querySelector('li')?.querySelector('sub')).toBeNull();
  });
});
