import { describe, expect, it } from 'vitest';
import { leadingZeroBits } from '@/lib/header';
import { hexPrefix } from './zeros';

describe('hexPrefix', () => {
  it('is a run of zero digits when the bits fill whole digits', () => {
    expect(hexPrefix(4)).toEqual({ zeros: '0', max: null });
    expect(hexPrefix(12)).toEqual({ zeros: '000', max: null });
    expect(hexPrefix(24)).toEqual({ zeros: '000000', max: null });
  });

  it('otherwise limits the digit that follows', () => {
    expect(hexPrefix(13)).toEqual({ zeros: '000', max: 7 });
    expect(hexPrefix(14)).toEqual({ zeros: '000', max: 3 });
    expect(hexPrefix(15)).toEqual({ zeros: '000', max: 1 });
  });

  it('agrees with the way the engine counts zero bits', () => {
    const hash = (start: string) => start.padEnd(64, 'f');
    for (let bits = 4; bits <= 24; bits++) {
      const { zeros, max } = hexPrefix(bits);
      if (max === null) {
        expect(leadingZeroBits(hash(zeros))).toBe(bits);
      } else {
        // The largest digit allowed still has enough zero bits; the next one up does not.
        expect(leadingZeroBits(hash(zeros + max.toString(16)))).toBe(bits);
        expect(leadingZeroBits(hash(zeros + (max + 1).toString(16)))).toBeLessThan(bits);
      }
    }
  });
});
