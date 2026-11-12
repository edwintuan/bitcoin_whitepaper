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
