import { describe, expect, it } from 'vitest';
import { GENESIS_HASH, headerHash, meetsTarget } from '@/lib/header';
import { HERO_SEED, HERO_TARGET, HERO_ZERO_BITS, heroHeader } from './chain';

describe('hero chain seed', () => {
  it('starts with four blocks that are really valid', () => {
    expect(HERO_SEED).toHaveLength(4);
    HERO_SEED.forEach((block) => {
      expect(headerHash(heroHeader(block.height, block.prev, block.nonce))).toBe(block.hash);
      expect(meetsTarget(block.hash, HERO_TARGET)).toBe(true);
    });
  });

  it('links each block to the one before, beginning at the real genesis block', () => {
    expect(HERO_SEED[0].height).toBe(1);
    expect(HERO_SEED[0].prev).toBe(GENESIS_HASH);
    for (let i = 1; i < HERO_SEED.length; i++) {
      expect(HERO_SEED[i].height).toBe(HERO_SEED[i - 1].height + 1);
      expect(HERO_SEED[i].prev).toBe(HERO_SEED[i - 1].hash);
    }
  });

  it('uses a target of a watchable difficulty', () => {
    expect(HERO_ZERO_BITS).toBeGreaterThanOrEqual(12);
    expect(HERO_ZERO_BITS).toBeLessThanOrEqual(16);
  });

  it('gives every height a different header', () => {
    expect(headerHash(heroHeader(5, GENESIS_HASH, 0))).not.toBe(headerHash(heroHeader(6, GENESIS_HASH, 0)));
  });
});
