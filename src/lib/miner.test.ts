// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { sha256Hex } from './hash';
import {
  GENESIS_HASH, GENESIS_HEADER, bitsToTarget, headerHash, meetsTarget, targetFromZeroBits,
} from './header';
import type { BlockHeader } from './header';
import { createMiner, mineSync } from './miner';

const GENESIS_NONCE = 2083236893;

/** A made-up header to mine against toy targets, starting at nonce 0. */
const TOY: BlockHeader = {
  version: 1,
  prevHash: GENESIS_HASH,
  merkleRoot: sha256Hex('toy block'),
  time: 1231006505,
  bits: 0x207fffff,
  nonce: 0,
};
const EASY = targetFromZeroBits(8);
const IMPOSSIBLE = 0n;
const hashAt = (header: BlockHeader, nonce: number) => headerHash({ ...header, nonce });

describe('mineSync', () => {
  it('re-mines the genesis block from five nonces before the real one', () => {
    const start = { ...GENESIS_HEADER, nonce: GENESIS_NONCE - 5 };
    expect(mineSync(start, bitsToTarget(0x1d00ffff), 10)).toEqual({
      found: true,
      nonce: GENESIS_NONCE,
      hash: GENESIS_HASH,
      tried: 6,
    });
  });
  it('gives up after maxHashes attempts', () => {
    const start = { ...GENESIS_HEADER, nonce: GENESIS_NONCE - 5 };
    const result = mineSync(start, bitsToTarget(0x1d00ffff), 5);
    expect(result.found).toBe(false);
    expect(result.tried).toBe(5);
    expect(result.nonce).toBe(GENESIS_NONCE - 1);
  });
});

describe('createMiner', () => {
  it('finds a nonce whose hash meets the target and can be recomputed from the header', () => {
    const result = createMiner({ header: TOY, target: EASY }).step(100_000);
    expect(result.found).toBe(true);
    expect(meetsTarget(result.hash, EASY)).toBe(true);
    expect(hashAt(TOY, result.nonce)).toBe(result.hash);
    expect(result.tried).toBe(result.nonce + 1); // started at nonce 0
  });
  it('returns the first nonce that works, not just any', () => {
    const { nonce } = createMiner({ header: TOY, target: EASY }).step(100_000);
    for (let earlier = 0; earlier < nonce; earlier++) {
      expect(meetsTarget(hashAt(TOY, earlier), EASY)).toBe(false);
    }
  });
  it('reaches the same nonce one hash at a time', () => {
    const inOneGo = createMiner({ header: TOY, target: EASY }).step(100_000);
    const slow = createMiner({ header: TOY, target: EASY });
    let last = slow.step(1);
    let calls = 1;
    while (!last.found) {
      last = slow.step(1);
      calls++;
    }
    expect(last.nonce).toBe(inOneGo.nonce);
    expect(last.hash).toBe(inOneGo.hash);
    expect(calls).toBe(inOneGo.tried);
    expect(slow.totalTried).toBe(inOneGo.tried);
  });
  it('reaches the same nonce whatever the slice size', () => {
    const inOneGo = createMiner({ header: TOY, target: EASY }).step(100_000);
    const sliced = createMiner({ header: TOY, target: EASY });
    let last = sliced.step(7);
    while (!last.found) last = sliced.step(7);
    expect(last.nonce).toBe(inOneGo.nonce);
    expect(sliced.totalTried).toBe(inOneGo.tried);
  });

  it('reports a miss with the last attempt, then resumes at the next nonce', () => {
    const miner = createMiner({ header: { ...TOY, nonce: 40 }, target: IMPOSSIBLE });
    const first = miner.step(25);
    expect(first).toEqual({ found: false, nonce: 64, hash: hashAt(TOY, 64), tried: 25 });
    const second = miner.step(10);
    expect(second).toEqual({ found: false, nonce: 74, hash: hashAt(TOY, 74), tried: 10 });
    expect(miner.totalTried).toBe(35);
  });
  it('keeps searching past a hit when stepped again', () => {
    const miner = createMiner({ header: TOY, target: EASY });
    const first = miner.step(100_000);
    const second = miner.step(100_000);
    expect(second.found).toBe(true);
    expect(second.nonce).toBeGreaterThan(first.nonce);
    expect(second.tried).toBe(second.nonce - first.nonce);
    expect(hashAt(TOY, second.nonce)).toBe(second.hash);
    expect(miner.totalTried).toBe(first.tried + second.tried);
  });
  it('wraps the nonce from 2^32 − 1 back to 0', () => {
    const miner = createMiner({ header: { ...TOY, nonce: 0xffffffff }, target: IMPOSSIBLE });
    expect(miner.step(1)).toEqual({ found: false, nonce: 0xffffffff, hash: hashAt(TOY, 0xffffffff), tried: 1 });
    expect(miner.step(2)).toEqual({ found: false, nonce: 1, hash: hashAt(TOY, 1), tried: 2 });
  });

  it('exposes the header with the nonce of the latest attempt', () => {
    const miner = createMiner({ header: { ...TOY, nonce: 7 }, target: EASY });
    expect(miner.header).toEqual({ ...TOY, nonce: 7 });
    expect(miner.totalTried).toBe(0);
    const result = miner.step(100_000);
    expect(miner.header).toEqual({ ...TOY, nonce: result.nonce });
    expect(headerHash(miner.header)).toBe(result.hash);
  });
  it('neither changes the header it was given nor shares the one it exposes', () => {
    const input = { ...TOY, nonce: 3 };
    const miner = createMiner({ header: input, target: IMPOSSIBLE });
    miner.step(10);
    expect(input).toEqual({ ...TOY, nonce: 3 });
    input.nonce = 999;
    input.merkleRoot = sha256Hex('something else');
    miner.header.nonce = 555;
    expect(miner.header).toEqual({ ...TOY, nonce: 12 });
    expect(miner.step(1).hash).toBe(hashAt(TOY, 13));
  });

  it('accepts the very first hash when every hash meets the target', () => {
    const result = createMiner({ header: TOY, target: targetFromZeroBits(0) }).step(50);
    expect(result).toEqual({ found: true, nonce: 0, hash: hashAt(TOY, 0), tried: 1 });
  });
  it('treats a hash equal to the target as a hit and one above it as a miss', () => {
    const exact = BigInt(`0x${hashAt(TOY, 0)}`);
    expect(createMiner({ header: TOY, target: exact }).step(1).found).toBe(true);
    expect(createMiner({ header: TOY, target: exact - 1n }).step(1).found).toBe(false);
  });
  it('agrees with meetsTarget on every attempt', () => {
    const target = targetFromZeroBits(3);
    const miner = createMiner({ header: TOY, target });
    for (let nonce = 0; nonce < 200; nonce++) {
      expect(miner.step(1).found).toBe(meetsTarget(hashAt(TOY, nonce), target));
    }
  });

  it('rejects a hash budget that is not a positive integer', () => {
    const miner = createMiner({ header: TOY, target: EASY });
    expect(() => miner.step(0)).toThrow(RangeError);
    expect(() => miner.step(-1)).toThrow(RangeError);
    expect(() => miner.step(1.5)).toThrow(RangeError);
    expect(() => miner.step(Number.NaN)).toThrow(RangeError);
    expect(miner.totalTried).toBe(0);
  });
  it('rejects a target outside 0 … 2^256 − 1 and a malformed header', () => {
    expect(() => createMiner({ header: TOY, target: -1n })).toThrow(RangeError);
    expect(() => createMiner({ header: TOY, target: 1n << 256n })).toThrow(RangeError);
    expect(() => createMiner({ header: { ...TOY, prevHash: 'abcd' }, target: EASY })).toThrow(RangeError);
    expect(() => createMiner({ header: { ...TOY, nonce: -1 }, target: EASY })).toThrow(RangeError);
  });
});
