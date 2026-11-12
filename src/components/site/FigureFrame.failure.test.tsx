import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SectionContent } from '@/content/types';
import { UI } from '@/content/ui';
import { SettingsProvider } from '@/i18n/settings';
import { FigureFrame } from './FigureFrame';

// A figure that cannot start in this browser.
vi.mock('@/figures/PowMiner', () => ({
  default: () => {
    throw new Error('no WebCrypto here');
  },
}));

const step = (n: number) => ({ title: `Step ${n}`, text: `Do thing ${n}.` });

const section: SectionContent = {
  id: 'proof-of-work',
  number: 4,
  part: 3,
  title: { en: 'Proof-of-Work', zh: '工作量證明' },
  tldr: { en: 'x', zh: 'x' },
  analogy: { en: 'x', zh: 'x' },
  body: { en: [], zh: [] },
  figure: {
    component: 'PowMiner',
    title: { en: 'A figure', zh: '一個圖' },
    steps: { en: [step(1), step(2)], zh: [step(1), step(2)] },
  },
  whoRuns: [],
  paperVsToday: { en: [], zh: [] },
};

describe('FigureFrame, when its figure fails', () => {
  it('says so, and takes away the walkthrough of a figure that is not there', async () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <SettingsProvider initialLang="en" initialDepth="curious">
        <FigureFrame section={section} />
      </SettingsProvider>,
    );
    expect(await screen.findByText(UI.figureFailed.en)).toBeInTheDocument();
    // "1 / 2 Step 1 … Back, Next" over a figure that failed would be instructions for nothing.
    expect(screen.queryByRole('button', { name: UI.stepNext.en })).toBeNull();
    expect(screen.queryByText('Step 1')).toBeNull();
    // The caption stays: it names what should have been here.
    expect(screen.getByText('A figure')).toBeInTheDocument();
    quiet.mockRestore();
  });
});
