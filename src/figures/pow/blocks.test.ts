import { describe, expect, it } from 'vitest';
import { headerHash, leadingZeroBits, meetsTarget, targetFromZeroBits, targetToHex } from '@/lib/header';
import { BLOCK_1, BLOCK_1_HASH, expectedTries, toyTarget } from './blocks';

describe('figure constants', () => {
  it('holds the real header of mainnet block 1', () => {
    expect(headerHash(BLOCK_1)).toBe(BLOCK_1_HASH);
    expect(BLOCK_1_HASH).toBe('00000000839a8e6886ab5951d76f411475428afc90947ee320161bbf18eb6048');
  });
});

describe('toyTarget', () => {
  it('gives a target with exactly the requested number of leading zero bits', () => {
    for (let n = 4; n <= 24; n++) {
      const { target } = toyTarget(n);
      expect(leadingZeroBits(targetToHex(target))).toBe(n);
    }
  });

  it('is the target a header can actually declare: it survives the compact encoding', () => {
    for (let n = 4; n <= 24; n++) {
      const { bits, target } = toyTarget(n);
      expect(toyTarget(n).bits).toBe(bits);
      // Never easier than "n zero bits", and only a hair harder.
      expect(target <= targetFromZeroBits(n)).toBe(true);
      expect(meetsTarget(targetToHex(target), targetFromZeroBits(n))).toBe(true);
    }
  });
});

describe('expectedTries', () => {
  it('doubles with every bit', () => {
    expect(expectedTries(12)).toBe(4096);
    expect(expectedTries(20)).toBe(1_048_576);
  });
});
