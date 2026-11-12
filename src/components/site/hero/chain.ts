import { utf8, wireToHash } from '@/lib/bytes';
import { sha256d } from '@/lib/hash';
import { bitsToTarget, targetFromZeroBits, targetToBits } from '@/lib/header';
import type { BlockHeader } from '@/lib/header';

/** Leading zero bits a hero block needs: about 16,000 tries, a few seconds at the capped rate. */
export const HERO_ZERO_BITS = 14;
const HERO_BITS = targetToBits(targetFromZeroBits(HERO_ZERO_BITS));
export const HERO_TARGET = bitsToTarget(HERO_BITS);

/** Hashes per second the hero allows itself. Enough to watch, light on the reader's machine. */
export const HERO_RATE = 4200;

export interface HeroBlock {
  height: number;
  prev: string;
  nonce: number;
  hash: string;
}

/** The real 80-byte header of the hero's block at a height. Only the nonce is left to search. */
export function heroHeader(height: number, prev: string, nonce: number): BlockHeader {
  return {
    version: 1,
    prevHash: prev,
    merkleRoot: wireToHash(sha256d(utf8(`Bitcoin, explained: block ${height}`))),
    time: 1231006505 + height * 600,
    bits: HERO_BITS,
    nonce,
  };
}

/**
 * Four blocks mined ahead of time on top of the real genesis block, so the
 * page opens on a chain that is already valid. chain.test.ts checks them.
 */
export const HERO_SEED: readonly HeroBlock[] = [
  { height: 1, prev: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f', nonce: 20478, hash: '0002c928286e4aa92bca73cd4df608a70a50e0f86fe72e8f649fc66ada86bc59' },
  { height: 2, prev: '0002c928286e4aa92bca73cd4df608a70a50e0f86fe72e8f649fc66ada86bc59', nonce: 10451, hash: '00017ca18764be4b0884596d6e190ee713b4bec6913e00deeb25e42ed684c91e' },
  { height: 3, prev: '00017ca18764be4b0884596d6e190ee713b4bec6913e00deeb25e42ed684c91e', nonce: 15319, hash: '0000e5e8b644e1530abf166417840f113946fcd873c459024b7c5bd9d2cf671e' },
  { height: 4, prev: '0000e5e8b644e1530abf166417840f113946fcd873c459024b7c5bd9d2cf671e', nonce: 22669, hash: '0000d03af65fd2c394f73545c304fe23a0dfd4b0637ca229e0afa7f7c274bd2b' },
];
