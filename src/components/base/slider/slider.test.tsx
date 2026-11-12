import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Slider } from './slider';

describe('Slider', () => {
  it('is named by its visible label when it has one', () => {
    render(<Slider label="Required zero bits" minValue={4} maxValue={24} value={12} onChange={() => {}} />);
    expect(screen.getByRole('group', { name: 'Required zero bits' })).toBeInTheDocument();
  });

  it('takes the thumb’s name when it has no visible label, so the group is never anonymous', () => {
    render(<Slider thumbLabel="Required zero bits" minValue={4} maxValue={24} value={12} onChange={() => {}} />);
    expect(screen.getByRole('group', { name: 'Required zero bits' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Required zero bits' })).toHaveValue('12');
  });

  it('prefers a name given to the group itself', () => {
    render(<Slider aria-label="Difficulty" thumbLabel="Zero bits" minValue={4} maxValue={24} value={12} onChange={() => {}} />);
    expect(screen.getByRole('group', { name: 'Difficulty' })).toBeInTheDocument();
  });
});
