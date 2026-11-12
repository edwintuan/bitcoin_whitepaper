import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Depth } from '@/content/types';
import { SettingsProvider, useSettings } from '@/i18n/settings';
import { Collapsible } from './Collapsible';

function DepthButtons() {
  const { setDepth } = useSettings();
  return (
    <>
      <button onClick={() => setDepth('starter')}>to starter</button>
      <button onClick={() => setDepth('developer')}>to developer</button>
    </>
  );
}

function setup(initialDepth: Depth) {
  render(
    <SettingsProvider initialLang="en" initialDepth={initialDepth}>
      <DepthButtons />
      <Collapsible title="How it works" minDepth="curious">
        <p>Body copy</p>
      </Collapsible>
    </SettingsProvider>,
  );
  return screen.getByRole('button', { name: /How it works/ });
}

describe('Collapsible', () => {
  it('starts closed below its depth and open at or above it', () => {
    expect(setup('starter')).toHaveAttribute('aria-expanded', 'false');
  });

  it('starts open at its own depth', () => {
    expect(setup('curious')).toHaveAttribute('aria-expanded', 'true');
  });

  it('starts open above its depth', () => {
    expect(setup('developer')).toHaveAttribute('aria-expanded', 'true');
  });

  it('never removes its content: closed content stays in the document, inert', () => {
    setup('starter');
    const body = screen.getByText('Body copy');
    expect(body).toBeInTheDocument();
    expect(body.closest('[inert]')).not.toBeNull();
  });

  it('toggles by hand', async () => {
    const head = setup('starter');
    await userEvent.click(head);
    expect(head).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Body copy').closest('[inert]')).toBeNull();
    await userEvent.click(head);
    expect(head).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps a manual choice until the depth is changed, then takes the new default', async () => {
    const head = setup('curious');
    await userEvent.click(head); // reader closes it
    expect(head).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(screen.getByText('to developer'));
    expect(head).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(screen.getByText('to starter'));
    expect(head).toHaveAttribute('aria-expanded', 'false');
  });

  it('labels the panel with its heading', () => {
    setup('curious');
    expect(screen.getByRole('region', { name: /How it works/ })).toBeInTheDocument();
  });
});
