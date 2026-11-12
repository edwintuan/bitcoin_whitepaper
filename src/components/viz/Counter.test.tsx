import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Counter } from './Counter';

describe('Counter', () => {
  it('groups digits by default', () => {
    const { container } = render(<Counter value={1048576} mode="event" />);
    expect(container).toHaveTextContent('1,048,576');
  });

  it('pops a changed value in, and not the first one', () => {
    const { container, rerender } = render(<Counter value={1} mode="event" />);
    expect(container.querySelector('.t-pop')).toBeNull();
    rerender(<Counter value={2} mode="event" />);
    expect(container.querySelector('.t-pop')).toHaveTextContent('2');
  });

  it('in its subtle mode, says the value once as plain text and keeps the moving digits to the eye', () => {
    const { container, rerender } = render(<Counter value={1299} />);
    rerender(<Counter value={1300} />);
    const root = container.firstElementChild as HTMLElement;
    // A label on an element with no role is not announced by every reader; hidden text is.
    expect(root.hasAttribute('aria-label')).toBe(false);
    expect(root.querySelector('.visually-hidden')).toHaveTextContent('1,300');
    const seen = [...root.children].filter((child) => !child.classList.contains('visually-hidden'));
    expect(seen.length).toBeGreaterThan(0);
    for (const child of seen) expect(child.getAttribute('aria-hidden')).toBe('true');
  });

  it('in its subtle mode, animates only the digits that changed', () => {
    const { container, rerender } = render(<Counter value={1299} />);
    rerender(<Counter value={1300} />);
    // 1,299 → 1,300: the last three digits change, "1," stays.
    expect(container.querySelectorAll('.t-subtle-slot')).toHaveLength(3);
  });
});
