import { describe, expect, it } from 'vitest';
import { GENESIS_HASH, headerHash, meetsTarget } from '@/lib/header';
import { mineSync } from '@/lib/miner';
import { TOY_TARGET, buildChain, chainProblems, editBlock, headerOf } from './toyChain';

const DATA = ['Alice pays Bob 5', 'Bob pays Carol 2', 'Carol pays Dan 1'];

describe('toy chain', () => {
  it('builds three valid blocks, each on the hash of the one before', () => {
    const chain = buildChain(DATA);
    expect(chain.map((block) => block.data)).toEqual(DATA);
    expect(chain[0].prev).toBe(GENESIS_HASH);
    expect(chain[1].prev).toBe(chain[0].hash);
    expect(chain[2].prev).toBe(chain[1].hash);
    chain.forEach((block, index) => {
      expect(headerHash(headerOf(block, index))).toBe(block.hash);
      expect(meetsTarget(block.hash, TOY_TARGET)).toBe(true);
    });
    expect(chainProblems(chain)).toEqual([null, null, null]);
  });

  it('is deterministic', () => {
    expect(buildChain(DATA)).toEqual(buildChain(DATA));
  });

  it('an edit changes the hash of that block only, keeping its old nonce', () => {
    const chain = buildChain(DATA);
    const edited = editBlock(chain, 0, 'Alice pays Bob 500');
    expect(edited[0].hash).not.toBe(chain[0].hash);
    expect(edited[0].nonce).toBe(chain[0].nonce);
    expect(edited[1]).toEqual(chain[1]);
    expect(edited[2]).toEqual(chain[2]);
    expect(chain[0].data).toBe(DATA[0]); // the original is not mutated
  });

  it('editing the first block breaks it and cuts off every block after it', () => {
    const edited = editBlock(buildChain(DATA), 0, 'Alice pays Bob 500');
    expect(meetsTarget(edited[0].hash, TOY_TARGET)).toBe(false);
    expect(chainProblems(edited)).toEqual(['hash', 'link', 'link']);
  });

  it('editing the middle block leaves the first one valid', () => {
    const edited = editBlock(buildChain(DATA), 1, 'Bob pays Carol 200');
    expect(chainProblems(edited)).toEqual([null, 'hash', 'link']);
  });

  it('redoing one block does not rescue the blocks after it', () => {
    const edited = editBlock(buildChain(DATA), 0, 'Alice pays Bob 500');
    const found = mineSync(headerOf({ ...edited[0], nonce: 0 }, 0), TOY_TARGET, 1_000_000);
    const repaired = edited.map((block, i) => (i === 0 ? { ...block, nonce: found.nonce, hash: found.hash } : block));
    // Block 2 still carries the hash of the block that no longer exists.
    expect(chainProblems(repaired)).toEqual([null, 'link', 'link']);
  });
});
