import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HexView } from './HexView';

const bytes = Uint8Array.of(0xf9, 0xbe, 0xb4, 0xd9, 0x01, 0x00);
const segments = [
  { name: 'magic', start: 0, end: 4 },
  { name: 'count', start: 4, end: 6 },
];

describe('HexView', () => {
  it('prints every byte as two hex digits, grouped by field', () => {
    render(<HexView bytes={bytes} segments={segments} />);
    const fields = screen.getAllByRole('listitem');
    expect(fields.map((field) => field.textContent)).toEqual(['f9beb4d9', '0100']);
  });

  it('names each field and its size for readers who cannot see the tints', () => {
    render(<HexView bytes={bytes} segments={segments} />);
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'magic: 4 bytes' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'count: 2 bytes' })).toBeInTheDocument();
  });

  it('announces a field by the words it is given, in the reader\u2019s language', () => {
    const labelled = [
      { name: 'magic', label: '起始位元組', start: 0, end: 4 },
      { name: 'count', start: 4, end: 6 },
    ];
    render(<HexView bytes={bytes} segments={labelled} unit="位元組" />);
    expect(screen.getByRole('listitem', { name: '起始位元組: 4 位元組' })).toBeInTheDocument();
    // A field without words of its own falls back to its name.
    expect(screen.getByRole('listitem', { name: 'count: 2 位元組' })).toBeInTheDocument();
  });

  it('lets the unit follow the count, so one byte is not "1 bytes"', () => {
    const one = [
      { name: 'relay', start: 0, end: 1 },
      { name: 'rest', start: 1, end: 6 },
    ];
    render(<HexView bytes={bytes} segments={one} unit={(count) => (count === 1 ? 'byte' : 'bytes')} />);
    expect(screen.getByRole('listitem', { name: 'relay: 1 byte' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'rest: 5 bytes' })).toBeInTheDocument();
  });

  it('reports the field under the keyboard focus, and none once the focus leaves', async () => {
    const user = userEvent.setup();
    const onActive = vi.fn();
    render(<HexView bytes={bytes} segments={segments} onActive={onActive} />);
    await user.tab();
    expect(onActive).toHaveBeenLastCalledWith('magic');
    await user.tab();
    expect(onActive).toHaveBeenLastCalledWith('count');
    await user.tab();
    expect(onActive).toHaveBeenLastCalledWith(null);
  });

  it('is not a tab stop when nothing listens for the active field', () => {
    render(<HexView bytes={bytes} segments={segments} />);
    for (const field of screen.getAllByRole('listitem')) expect(field).not.toHaveAttribute('tabindex');
  });

  it('marks the active field', () => {
    render(<HexView bytes={bytes} segments={segments} active="count" />);
    expect(screen.getByRole('listitem', { name: 'count: 2 bytes' })).toHaveAttribute('data-active', 'true');
    expect(screen.getByRole('listitem', { name: 'magic: 4 bytes' })).toHaveAttribute('data-active', 'false');
  });
});
