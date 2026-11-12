import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SettingsProvider } from '@/i18n/settings';
import { PAYMENT_TXID } from './wire';
import { WireScene } from './WireScene';

const show = (lang: 'en' | 'zh' = 'en') =>
  render(
    <SettingsProvider initialLang={lang} initialDepth="developer">
      <WireScene />
    </SettingsProvider>,
  );

const hexOf = (container: HTMLElement) =>
  [...container.querySelectorAll('.hex-byte')].map((byte) => byte.textContent).join('');

describe('the wire scene', () => {
  it('opens on the first message and lists all seven in order', () => {
    const { container } = show();
    const rows = [...container.querySelectorAll('.net-seq-msg')];
    expect(rows.map((row) => row.querySelector('.net-seq-name')?.textContent)).toEqual([
      'version',
      'version',
      'verack',
      'verack',
      'inv',
      'getdata',
      'tx',
    ]);
    expect(rows[0].getAttribute('aria-current')).toBe('step');
    expect(hexOf(container).startsWith('f9beb4d9' + '76657273696f6e0000000000')).toBe(true);
  });

  it('steps forward and back through the messages', () => {
    const { container } = show();
    fireEvent.click(screen.getByRole('button', { name: 'Next message' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next message' }));
    const rows = [...container.querySelectorAll('.net-seq-msg')];
    expect(rows[2].getAttribute('data-state')).toBe('current');
    expect(rows[1].getAttribute('data-state')).toBe('sent');
    expect(rows[3].getAttribute('data-state')).toBe('pending');
    // verack: a header and nothing else, with the checksum of an empty payload
    expect(hexOf(container)).toBe('f9beb4d9' + '76657261636b000000000000' + '00000000' + '5df6e0e2');
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(rows[1].getAttribute('data-state')).toBe('current');
  });

  it('explains a field when it is focused', () => {
    const { container } = show();
    const checksum = container.querySelectorAll('.hex-seg')[3];
    fireEvent.focus(checksum);
    expect(container.querySelector('.net-field-note')?.textContent).toMatch(/^Checksum · 4 bytes · /);
    fireEvent.blur(checksum);
    expect(container.querySelector('.net-field-note')?.textContent).toBe('Point at a field, or move to it with Tab.');
  });

  it('re-encodes the first message when node A is renamed', () => {
    const { container } = show();
    const before = hexOf(container);
    fireEvent.change(screen.getByLabelText('What node A calls itself'), { target: { value: '/my node/' } });
    const after = hexOf(container);
    expect(after).not.toBe(before);
    expect(after).toContain('092f6d79206e6f64652f'); // length 9, then "/my node/"
    expect(container.querySelector('.net-check .tag')?.textContent).toBe('=');
  });

  it('says beside the box what renaming node A changes', () => {
    show();
    expect(screen.getByLabelText('What node A calls itself')).toHaveAccessibleDescription(
      'Change it, and the length and the checksum follow.',
    );
  });

  it('offers the box only with the message it changes', () => {
    const { container } = show();
    fireEvent.click(container.querySelectorAll('.net-seq-msg')[1]);
    expect(screen.queryByLabelText('What node A calls itself')).toBeNull();
    // Node B's name is explained without pointing at a box that is not there.
    fireEvent.focus(container.querySelector('.hex-seg[aria-label^="User agent:"]') as Element);
    expect(container.querySelector('.net-field-note')?.textContent).toMatch(
      /The name and version of the software, as text\.$/,
    );
  });

  it('shows that the transaction delivered is the one that was announced', () => {
    const { container } = show();
    fireEvent.click(container.querySelectorAll('.net-seq-msg')[6]);
    const tags = [...container.querySelectorAll('.net-check .tag')].map((tag) => tag.textContent);
    expect(tags).toEqual(['=', '=']);
    const hashes = [...container.querySelectorAll('.net-check .hash .visually-hidden')].map((hash) => hash.textContent);
    expect(hashes).toEqual([PAYMENT_TXID, PAYMENT_TXID]);
    expect(screen.getByRole('status').textContent).toContain('The receiver takes the message.');
  });

  it('lets the reader damage a message and see it fail both checks', () => {
    const { container } = show();
    fireEvent.click(container.querySelectorAll('.net-seq-msg')[6]);
    fireEvent.click(screen.getByRole('button', { name: 'Flip one bit on the way' }));
    const tags = [...container.querySelectorAll('.net-check .tag')].map((tag) => tag.textContent);
    expect(tags).toEqual(['≠', '≠']);
    expect(screen.getByRole('status').textContent).toContain('skips the message');
    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
    expect([...container.querySelectorAll('.net-check .tag')].map((tag) => tag.textContent)).toEqual(['=', '=']);
  });

  it('has nothing to damage in a message without payload', () => {
    const { container } = show();
    fireEvent.click(container.querySelectorAll('.net-seq-msg')[2]);
    expect(screen.getByRole('button', { name: 'Flip one bit on the way' })).toBeDisabled();
  });

  it('names each field in the reader’s language for assistive technology', () => {
    const labels = (container: HTMLElement) =>
      [...container.querySelectorAll('.hex-seg')].map((field) => field.getAttribute('aria-label'));

    const english = show();
    expect(labels(english.container).slice(0, 4)).toEqual([
      'Start bytes: 4 bytes',
      'Message type: 12 bytes',
      'Payload length: 4 bytes',
      'Checksum: 4 bytes',
    ]);
    // A field of the transaction says which input or output it belongs to.
    fireEvent.click(english.container.querySelectorAll('.net-seq-msg')[6]);
    expect(labels(english.container)).toContain('Input 1 · Spends: transaction: 32 bytes');
    expect(labels(english.container)).toContain('Output 2 · Amount: 8 bytes');
    english.unmount();

    expect(labels(show('zh').container)[0]).toBe('起始位元組: 4 位元組');
  });

  it('calls a single byte a byte, aloud and in the note', () => {
    const { container } = show();
    // The last field of a version message is one byte long.
    const relay = [...container.querySelectorAll('.hex-seg')].at(-1) as Element;
    expect(relay.getAttribute('aria-label')).toBe('Relay flag: 1 byte');
    fireEvent.focus(relay);
    expect(container.querySelector('.net-field-note')?.textContent).toMatch(/^Relay flag · 1 byte · /);
  });

  it('keeps the focus on Previous and Next at either end of the conversation', () => {
    const { container } = show();
    const rows = container.querySelectorAll('.net-seq-msg');
    const previous = screen.getByRole('button', { name: 'Previous' });
    const next = screen.getByRole('button', { name: 'Next message' });

    // At the first message Previous is switched off without leaving the tab order, and does nothing.
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    expect(previous).not.toBeDisabled();
    fireEvent.click(previous);
    expect(rows[0].getAttribute('data-state')).toBe('current');
    expect(next).not.toHaveAttribute('aria-disabled', 'true');

    // Pressing Next to the end leaves the focus on it.
    next.focus();
    for (let i = 0; i < 6; i++) fireEvent.click(next);
    expect(rows[6].getAttribute('data-state')).toBe('current');
    expect(next).toHaveAttribute('aria-disabled', 'true');
    expect(next).not.toBeDisabled();
    expect(document.activeElement).toBe(next);
    fireEvent.click(next);
    expect(rows[6].getAttribute('data-state')).toBe('current');
    expect(previous).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('speaks Chinese when asked to', () => {
    show('zh');
    expect(screen.getByRole('button', { name: '下一則訊息' })).toBeInTheDocument();
  });
});
