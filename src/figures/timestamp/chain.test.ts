// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { sha256Hex } from '@/lib/hash';
import {
  NO_PREVIOUS, buildChain, chainStatus, editItem, repairCost, repairPlan, republish, stampHash,
} from './chain';

const DATA = [
  ['Alice pays Bob 5', 'Deed of sale'],
  ['Bob pays Carol 2', 'Lab notes, p. 14'],
  ['Carol pays Dan 1', 'Will, second draft'],
  ['Dan pays Erin 1', 'Song, first take'],
];

describe('stampHash', () => {
  it('is the SHA-256 of the previous hash followed by each item with its length in front', () => {
    // 32 zero bytes, then 0x03 "abc".
    expect(stampHash(NO_PREVIOUS, ['abc'])).toBe(sha256Hex(`${'\0'.repeat(32)}\x03abc`));
    expect(stampHash(NO_PREVIOUS, ['abc', 'de'])).toBe(sha256Hex(`${'\0'.repeat(32)}\x03abc\x02de`));
  });

  it('gives 64 hex characters', () => {
    expect(stampHash(NO_PREVIOUS, [])).toMatch(/^[0-9a-f]{64}$/);
  });

  it('tells apart item lists that read the same when run together', () => {
    const hashes = [['ab', 'c'], ['a', 'bc'], ['abc'], ['abc', '']].map((items) => stampHash(NO_PREVIOUS, items));
    expect(new Set(hashes).size).toBe(4);
  });

  it('depends on the previous hash', () => {
    expect(stampHash('11'.repeat(32), ['abc'])).not.toBe(stampHash(NO_PREVIOUS, ['abc']));
  });

  it('counts the length of an item in bytes, not characters', () => {
    // "幣" is three bytes in UTF-8.
    expect(stampHash(NO_PREVIOUS, ['幣'])).toBe(sha256Hex(`${'\0'.repeat(32)}\x03幣`));
  });
});

describe('buildChain', () => {
  const chain = buildChain(DATA);

  it('starts from nothing and gives every later block the hash of the one before', () => {
    expect(chain).toHaveLength(4);
    expect(chain[0].prev).toBe(NO_PREVIOUS);
    for (let i = 1; i < chain.length; i++) expect(chain[i].prev).toBe(chain[i - 1].hash);
  });

  it('hashes each block over its previous hash and its items, and publishes that hash', () => {
    chain.forEach((block, i) => {
      expect(block.items).toEqual(DATA[i]);
      expect(block.hash).toBe(stampHash(block.prev, block.items));
      expect(block.published).toBe(block.hash);
    });
  });

  it('is whole', () => {
    expect(chainStatus(chain)).toEqual(['ok', 'ok', 'ok', 'ok']);
    expect(repairPlan(chain)).toEqual([]);
  });

  it('is deterministic and does not keep hold of the input arrays', () => {
    expect(buildChain(DATA)).toEqual(chain);
    expect(chain[0].items).not.toBe(DATA[0]);
  });
});

describe('editItem', () => {
  const chain = buildChain(DATA);
  const edited = editItem(chain, 1, 0, 'Bob pays Carol 200');

  it('changes that block’s item and hash, but not the hash that was published', () => {
    expect(edited[1].items).toEqual(['Bob pays Carol 200', 'Lab notes, p. 14']);
    expect(edited[1].hash).toBe(stampHash(chain[1].prev, edited[1].items));
    expect(edited[1].hash).not.toBe(chain[1].hash);
    expect(edited[1].published).toBe(chain[1].hash);
    expect(edited[1].prev).toBe(chain[1].prev);
  });

  it('leaves every other block exactly as it was published', () => {
    expect(edited[0]).toBe(chain[0]);
    expect(edited[2]).toBe(chain[2]);
    expect(edited[3]).toBe(chain[3]);
  });

  it('does not mutate the chain it is given', () => {
    expect(chain).toEqual(buildChain(DATA));
  });

  it('marks the edited block as changed and every later block as no longer following', () => {
    expect(chainStatus(edited)).toEqual(['ok', 'changed', 'broken', 'broken']);
  });

  it('breaks the whole chain when the first block is edited', () => {
    expect(chainStatus(editItem(chain, 0, 1, 'Deed of sale, amended'))).toEqual(['changed', 'broken', 'broken', 'broken']);
  });

  it('breaks nothing else when the last block is edited: nothing has been built on it yet', () => {
    const last = editItem(chain, 3, 0, 'Dan pays Erin 100');
    expect(chainStatus(last)).toEqual(['ok', 'ok', 'ok', 'changed']);
  });

  it('heals when the original words are put back', () => {
    const restored = editItem(edited, 1, 0, 'Bob pays Carol 2');
    expect(restored).toEqual(chain);
    expect(chainStatus(restored)).toEqual(['ok', 'ok', 'ok', 'ok']);
  });

  it('ignores an item that does not exist', () => {
    expect(editItem(chain, 1, 7, 'x')).toEqual(chain);
    expect(editItem(chain, 9, 0, 'x')).toEqual(chain);
  });
});

describe('republish', () => {
  const chain = buildChain(DATA);
  const edited = editItem(chain, 1, 0, 'Bob pays Carol 200');

  it('lists the blocks to publish again, from the first one that changed to the end', () => {
    expect(repairPlan(edited)).toEqual([1, 2, 3]);
    expect(repairPlan(editItem(chain, 3, 0, 'x'))).toEqual([3]);
  });

  it('publishes the edited block’s new hash without touching anything after it', () => {
    const step = republish(edited, 1);
    expect(step[1].published).toBe(edited[1].hash);
    expect(chainStatus(step)).toEqual(['ok', 'ok', 'broken', 'broken']);
  });

  it('gives a later block the new hash of the one before it, at the cost of one hash', () => {
    const step = republish(republish(edited, 1), 2);
    expect(step[2].prev).toBe(edited[1].hash);
    expect(step[2].hash).toBe(stampHash(edited[1].hash, DATA[2]));
    expect(step[2].published).toBe(step[2].hash);
    expect(chainStatus(step)).toEqual(['ok', 'ok', 'ok', 'broken']);
  });

  it('does not help to publish a later block before the one it stands on', () => {
    const outOfOrder = republish(edited, 3);
    expect(chainStatus(outOfOrder)).toEqual(['ok', 'changed', 'broken', 'broken']);
  });

  it('makes the chain whole again when the plan is followed, as if it had always said so', () => {
    const repaired = repairPlan(edited).reduce(republish, edited);
    expect(chainStatus(repaired)).toEqual(['ok', 'ok', 'ok', 'ok']);
    expect(repaired).toEqual(buildChain([DATA[0], ['Bob pays Carol 200', 'Lab notes, p. 14'], DATA[2], DATA[3]]));
  });

  it('does not mutate the chain it is given', () => {
    const before = structuredClone(edited);
    republish(edited, 2);
    expect(edited).toEqual(before);
  });
});

describe('repairCost', () => {
  const chain = buildChain(DATA);

  it('is one hash for the edited block and one for every block after it', () => {
    expect(repairCost(editItem(chain, 1, 0, 'Bob pays Carol 200'))).toBe(3);
    expect(repairCost(editItem(chain, 0, 0, 'Alice pays Bob 500'))).toBe(4);
    expect(repairCost(editItem(chain, 3, 0, 'Dan pays Erin 100'))).toBe(1);
  });

  it('is nothing for a chain that is whole', () => {
    expect(repairCost(chain)).toBe(0);
  });

  it('falls by one with every block published again, down to nothing', () => {
    let current = editItem(chain, 1, 0, 'Bob pays Carol 200');
    const costs = [repairCost(current)];
    for (const index of repairPlan(current)) {
      current = republish(current, index);
      costs.push(repairCost(current));
    }
    expect(costs).toEqual([3, 2, 1, 0]);
  });
});
