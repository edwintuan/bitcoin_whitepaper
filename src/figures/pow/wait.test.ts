import { describe, expect, it } from 'vitest';
import { waitFor } from './wait';

describe('waitFor', () => {
  it('has nothing to say before a rate is known', () => {
    expect(waitFor(4096, 0)).toBeNull();
  });

  it('gives seconds for a short wait', () => {
    expect(waitFor(4096, 200_000)).toEqual({ value: '1', unit: 'seconds', under: true });
    expect(waitFor(1_048_576, 200_000)).toEqual({ value: '5', unit: 'seconds', under: false });
    expect(waitFor(16_777_216, 190_000)).toEqual({ value: '88', unit: 'seconds', under: false });
  });

  it('gives minutes from two minutes up, with one decimal while that says something', () => {
    expect(waitFor(16_777_216, 100_000)).toEqual({ value: '2.8', unit: 'minutes', under: false });
    expect(waitFor(16_777_216, 20_000)).toEqual({ value: '14', unit: 'minutes', under: false });
  });

  it('gives hours for a wait nobody should sit through', () => {
    expect(waitFor(16_777_216, 1_000)).toEqual({ value: '4.7', unit: 'hours', under: false });
  });
});
