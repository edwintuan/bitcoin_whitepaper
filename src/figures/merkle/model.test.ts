// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { headerHash, meetsTarget } from '@/lib/header';
import { merkleLevels, merkleRoot, prunableNodes, rootFromStore } from '@/lib/merkle';
import {
  BLOCK_TARGET,
  HEADER_BYTES,
  MAX_TXS,
  MIN_TXS,
  blockHeader,
  blockTxids,
  megabytes,
  nodeStates,
  prunedStore,
  storageCount,
  yearlyHeaderBytes,
} from './model';

const PAPER = [true, true, true, false];
const none = (n: number) => Array.from({ length: n }, () => false);
const all = (n: number) => Array.from({ length: n }, () => true);

/** Every way of marking n leaves. */
function masks(n: number): boolean[][] {
  return Array.from({ length: 2 ** n }, (_, bits) => Array.from({ length: n }, (_, i) => ((bits >> i) & 1) === 1));
}

describe('blockTxids', () => {
  it('gives real, distinct transaction ids', () => {
    const txids = blockTxids(MAX_TXS);
    expect(txids).toHaveLength(MAX_TXS);
    expect(new Set(txids).size).toBe(MAX_TXS);
    for (const id of txids) expect(id).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic, and adding a transaction leaves the earlier ones alone', () => {
    expect(blockTxids(5)).toEqual(blockTxids(5));
    expect(blockTxids(5).slice(0, 4)).toEqual(blockTxids(4));
  });

  it('keeps to the range the figure offers', () => {
    expect(MIN_TXS).toBe(2);
    expect(MAX_TXS).toBe(8);
    expect(() => blockTxids(0)).toThrow(RangeError);
  });
});

describe('blockHeader', () => {
  it('is a real mined header that commits to the tree through its Merkle root', () => {
    for (const n of [2, 4, 5, 8]) {
      const txids = blockTxids(n);
      const { header, hash } = blockHeader(txids);
      expect(header.merkleRoot).toBe(merkleRoot(txids));
      expect(headerHash(header)).toBe(hash);
      expect(meetsTarget(hash, BLOCK_TARGET)).toBe(true);
    }
  });

  it('changes with the transactions', () => {
    expect(blockHeader(blockTxids(4)).hash).not.toBe(blockHeader(blockTxids(5)).hash);
  });
});

describe('nodeStates', () => {
  const levels = merkleLevels(blockTxids(4));

  it('before pruning, marks spent transactions and leaves every hash recomputable', () => {
    expect(nodeStates(levels, PAPER, none(4))).toEqual([
      ['spent', 'spent', 'spent', 'tx'],
      ['hash', 'hash'],
      ['hash'],
    ]);
  });

  it('reproduces the paper: pruning Tx0-2 leaves Hash01 and Hash2 as stubs', () => {
    expect(nodeStates(levels, PAPER, PAPER)).toEqual([
      ['gone', 'gone', 'stub', 'tx'],
      ['stub', 'hash'],
      ['hash'],
    ]);
  });

  it('shows a transaction spent after the last pruning as spent, not as pruned', () => {
    expect(nodeStates(levels, all(4), PAPER)[0]).toEqual(['gone', 'gone', 'stub', 'spent']);
  });

  it('collapses a fully spent block into its root', () => {
    expect(nodeStates(levels, all(4), all(4))).toEqual([
      ['gone', 'gone', 'gone', 'gone'],
      ['gone', 'gone'],
      ['stub'],
    ]);
  });

  it('carries a lone last node up with the copy it is paired with', () => {
    const five = merkleLevels(blockTxids(5));
    // Tx4 is alone on its level, and so is its parent: both vanish into the stub above them.
    expect(nodeStates(five, [false, false, false, false, true], [false, false, false, false, true])).toEqual([
      ['tx', 'tx', 'tx', 'tx', 'gone'],
      ['hash', 'hash', 'gone'],
      ['hash', 'stub'],
      ['hash'],
    ]);
  });

  it('agrees with the engine about which nodes become stubs', () => {
    for (let n = MIN_TXS; n <= MAX_TXS; n++) {
      const tree = merkleLevels(blockTxids(n));
      for (const mask of masks(n)) {
        const states = nodeStates(tree, mask, mask);
        const stubs = states.flatMap((row, level) => row.flatMap((state, index) => (state === 'stub' ? [{ level, index }] : [])));
        const byPosition = (a: { level: number; index: number }, b: { level: number; index: number }) =>
          a.level - b.level || a.index - b.index;
        expect(stubs.sort(byPosition)).toEqual(prunableNodes(tree, mask).sort(byPosition));
      }
    }
  });

  it('needs one flag per leaf', () => {
    expect(() => nodeStates(levels, [true], none(4))).toThrow(RangeError);
    expect(() => nodeStates(levels, none(4), [true])).toThrow(RangeError);
  });
});

describe('prunedStore', () => {
  const txids = blockTxids(4);
  const levels = merkleLevels(txids);

  it('keeps unspent transactions and one hash per pruned subtree, nothing else', () => {
    const store = prunedStore(levels, PAPER);
    expect(store.leafCount).toBe(4);
    expect([...store.txids]).toEqual([[3, txids[3]]]);
    expect(store.stubs).toEqual([
      { level: 1, index: 0, hash: levels[1][0] },
      { level: 0, index: 2, hash: txids[2] },
    ]);
  });

  it('holds every transaction and no hash before anything is pruned', () => {
    const store = prunedStore(levels, none(4));
    expect(store.txids.size).toBe(4);
    expect(store.stubs).toEqual([]);
  });

  it('is all the engine needs to recompute the root, whatever was pruned', () => {
    for (let n = MIN_TXS; n <= MAX_TXS; n++) {
      const txids = blockTxids(n);
      const levels = merkleLevels(txids);
      const root = merkleRoot(txids);
      for (const mask of masks(n)) {
        expect(rootFromStore(prunedStore(levels, mask)), `${n} leaves, ${mask.join()}`).toBe(root);
      }
    }
  });

  it('needs one flag per transaction', () => {
    expect(() => prunedStore(levels, [true])).toThrow(RangeError);
  });
});

describe('storageCount', () => {
  const levels = merkleLevels(blockTxids(4));

  it('counts the paper’s example', () => {
    expect(storageCount(levels, PAPER)).toEqual({ txTotal: 4, txKept: 1, stubHashes: 2, hashesGone: 2 });
  });

  it('counts a block nobody has pruned', () => {
    expect(storageCount(levels, none(4))).toEqual({ txTotal: 4, txKept: 4, stubHashes: 0, hashesGone: 0 });
  });

  it('counts no hash as kept once every transaction is pruned: the root that stands for them is in the header anyway', () => {
    expect(storageCount(levels, all(4))).toEqual({ txTotal: 4, txKept: 0, stubHashes: 0, hashesGone: 6 });
    for (let n = MIN_TXS; n <= MAX_TXS; n++) {
      const tree = merkleLevels(blockTxids(n));
      const count = storageCount(tree, all(n));
      expect(count.stubHashes, `${n} transactions`).toBe(0);
      // Every node below the root is gone.
      expect(count.hashesGone, `${n} transactions`).toBe(tree.reduce((sum, level) => sum + level.length, 0) - 1);
    }
  });

  it('adds up: every node is kept, a stub, gone, or the root in the header', () => {
    for (let n = MIN_TXS; n <= MAX_TXS; n++) {
      const tree = merkleLevels(blockTxids(n));
      const nodes = tree.reduce((sum, level) => sum + level.length, 0);
      for (const mask of masks(n)) {
        const count = storageCount(tree, mask);
        const live = nodeStates(tree, mask, mask).flat().filter((state) => state === 'tx' || state === 'hash').length;
        const rootAlone = mask.every(Boolean) ? 1 : 0;
        expect(live + count.stubHashes + count.hashesGone + rootAlone).toBe(nodes);
        expect(count.txKept).toBe(mask.filter((spent) => !spent).length);
      }
    }
  });
});

describe('the paper’s arithmetic', () => {
  it('is 80 bytes × 6 × 24 × 365 at ten minutes a block', () => {
    expect(HEADER_BYTES).toBe(80);
    expect(yearlyHeaderBytes(10)).toBe(4_204_800);
    expect(megabytes(yearlyHeaderBytes(10))).toBe('4.2');
  });

  it('scales with the block interval', () => {
    expect(yearlyHeaderBytes(5)).toBe(8_409_600);
    expect(yearlyHeaderBytes(1)).toBe(42_048_000);
    expect(megabytes(yearlyHeaderBytes(1))).toBe('42.0');
    expect(megabytes(yearlyHeaderBytes(30))).toBe('1.4');
  });

  it('rejects an interval that is not positive', () => {
    expect(() => yearlyHeaderBytes(0)).toThrow(RangeError);
  });
});
