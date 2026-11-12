import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { JOURNEY } from '@/content/journey';
import { SettingsProvider } from '@/i18n/settings';
import { Journey } from './Journey';

function setup(lang: 'en' | 'zh' = 'en') {
  render(
    <SettingsProvider initialLang={lang} initialDepth="curious">
      <Journey />
    </SettingsProvider>,
  );
  return userEvent.setup();
}

const stations = () => screen.getAllByRole('button').filter((button) => button.classList.contains('station'));

describe('Journey', () => {
  it('offers to send before anything is sent, even after a stop was picked by hand', async () => {
    const user = setup();
    expect(screen.getByRole('button', { name: JOURNEY.send.en })).toBeInTheDocument();
    await user.click(stations()[2]);
    // Picking a stop is not sending: "Send again" would claim a payment that was never made.
    expect(screen.getByRole('button', { name: JOURNEY.send.en })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: JOURNEY.again.en })).toBeNull();
  });

  it('says "Send again" once the payment has been sent', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: JOURNEY.send.en }));
    expect(screen.getByRole('button', { name: JOURNEY.again.en })).toBeInTheDocument();
  });

  it('keeps "Next stop" on the page at the last stop, switched off, so the focus has somewhere to stay', async () => {
    const user = setup();
    const all = stations();
    await user.click(all[all.length - 2]);
    const next = screen.getByRole('button', { name: JOURNEY.next.en });
    expect(next).not.toHaveAttribute('aria-disabled', 'true');

    next.focus();
    await user.keyboard('{Enter}');

    // Now at the last stop: the same button is still there and still has the focus.
    expect(all[all.length - 1]).toHaveAttribute('aria-current', 'step');
    expect(next).toBeInTheDocument();
    expect(next).toHaveAttribute('aria-disabled', 'true');
    expect(next).toHaveFocus();

    // And pressing it again does nothing.
    await user.keyboard('{Enter}');
    expect(all[all.length - 1]).toHaveAttribute('aria-current', 'step');
  });

  it('counts the stops in the reader’s language', async () => {
    const user = setup('zh');
    await user.click(stations()[0]);
    expect(screen.getByText(/第 1 站（共 7 站）/)).toBeInTheDocument();
  });

  it('names the miner’s zero bits in the reader’s language', async () => {
    const user = setup('zh');
    const miner = JOURNEY.list.findIndex((station) => station.id === 'miner');
    await user.click(stations()[miner]);
    expect(document.querySelector('.journey-artifact')).toHaveTextContent('個零位元');
    expect(document.querySelector('.journey-artifact')).not.toHaveTextContent('zero bits');
  });
});
