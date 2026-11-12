import { describe, expect, it } from 'vitest';
import { GENESIS_HASH, headerHash, meetsTarget } from '@/lib/header';
import { mineSync } from '@/lib/miner';
import { TOY_TARGET, TOY_ZERO_BITS, buildChain, chainProblems, describeDamage, editBlock, headerOf } from './toyChain';

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

describe('describeDamage', () => {
  it('reports a whole chain as whole', () => {
    expect(describeDamage([null, null, null])).toEqual({ kind: 'whole' });
  });

  it('counts the edited block and everything after it', () => {
    expect(describeDamage(['hash', 'link', 'link'])).toEqual({ kind: 'broken', count: 3 });
    expect(describeDamage([null, 'hash', 'link'])).toEqual({ kind: 'broken', count: 2 });
  });

  it('knows when nothing stands on the edited block', () => {
    // Only the last block was edited: no block after it to cut off.
    expect(describeDamage([null, null, 'hash'])).toEqual({ kind: 'alone' });
  });

  it('counts two separate edits as what they are', () => {
    expect(describeDamage(['hash', 'link', 'hash'])).toEqual({ kind: 'broken', count: 3 });
  });

  it('knows when an edited block still meets its target by chance', () => {
    // About one edit in 2^10 leaves a hash that qualifies. The blocks after it
    // are cut off all the same, because they carry the old hash.
    expect(describeDamage([null, 'link', 'link'])).toEqual({ kind: 'lucky', count: 2 });
  });

  it('finds such an edit by searching, and describes it truthfully', () => {
    const chain = buildChain(DATA);
    let lucky: ReturnType<typeof editBlock> | null = null;
    for (let i = 0; i < 20_000 && !lucky; i++) {
      const edited = editBlock(chain, 0, `Alice pays Bob ${i + 6}`);
      if (meetsTarget(edited[0].hash, TOY_TARGET)) lucky = edited;
    }
    expect(lucky).not.toBeNull();
    expect(chainProblems(lucky!)).toEqual([null, 'link', 'link']);
    expect(describeDamage(chainProblems(lucky!))).toEqual({ kind: 'lucky', count: 2 });
    expect(TOY_ZERO_BITS).toBe(10);
  });
});
