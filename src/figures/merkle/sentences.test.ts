// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { merkleLevels } from '@/lib/merkle';
import { blockTxids, storageCount } from './model';
import { sentences, storageStatus, treeStatus } from './sentences';
import type { TreeStatusInput } from './sentences';

const levels = merkleLevels(blockTxids(4));
const none = [false, false, false, false];
const PAPER = [true, true, true, false];

/** A block of four at rest, nothing marked, unless a test says otherwise. */
const state = (over: Partial<TreeStatusInput> = {}): TreeStatusInput => ({
  building: null,
  count: 4,
  spent: 0,
  waiting: 0,
  pruned: false,
  counts: storageCount(levels, none),
  ...over,
});

describe('sentences', () => {
  it('puts a space between English sentences and nothing between Chinese ones', () => {
    expect(sentences('en', 'One.', 'Two.')).toBe('One. Two.');
    expect(sentences('zh', '第一句。', '第二句。')).toBe('第一句。第二句。');
  });

  it('leaves out parts that are missing', () => {
    expect(sentences('en', 'One.', null, false, undefined, '', 'Two.')).toBe('One. Two.');
  });
});

describe('the status line of the tree', () => {
  it('names the level being hashed while the tree builds', () => {
    expect(treeStatus('en', state({ building: { level: 1, levels: 3, oddBelow: false } }))).toEqual({
      text: 'Level 1 of 3: the hash of each transaction. These are the leaves.',
      aside: null,
    });
    expect(treeStatus('en', state({ building: { level: 2, levels: 3, oddBelow: false } })).text).toBe(
      'Level 2 of 3: each pair of hashes is joined and hashed with double SHA-256.',
    );
    expect(treeStatus('en', state({ count: 5, building: { level: 2, levels: 4, oddBelow: true } })).text).toBe(
      'Level 2 of 4: the last hash has no partner, so it is paired with a copy of itself.',
    );
  });

  it('invites a mark at rest, and explains the copy when the count is odd', () => {
    expect(treeStatus('en', state()).text).toBe(
      'Press a transaction to mark it as spent. Nothing is removed until you press Prune.',
    );
    expect(treeStatus('en', state({ count: 5 })).text).toMatch(/^An odd count: the last hash is paired with a copy of itself/);
  });

  it('counts the marks and points at Prune', () => {
    expect(treeStatus('en', state({ spent: 3, waiting: 3 }))).toEqual({
      text: '3 of 4 marked as spent. Press Prune to drop every branch whose transactions are all spent.',
      aside: null,
    });
  });

  it('reports a pruning, with the size of a hash stated once for each', () => {
    const pruned = treeStatus('en', state({ spent: 3, pruned: true, counts: storageCount(levels, PAPER) }));
    expect(pruned.text).toBe(
      'Gone from disk: 3 of 4 transactions. Standing in for them: 2 hashes, at 32 bytes a hash. The root recomputed from what is left is identical, so the block hash still holds.',
    );
    expect(pruned.aside).toBe('A pruned block cannot take new transactions. Start over to change it.');
  });

  it('writes one hash in the singular', () => {
    const counts = storageCount(levels, [true, true, false, false]);
    expect(treeStatus('en', state({ spent: 2, pruned: true, counts })).text).toContain('Standing in for them: 1 hash, at 32 bytes a hash.');
    expect(treeStatus('zh', state({ spent: 2, pruned: true, counts })).text).toContain('由 1 個哈希（每個 32 位元組）頂替');
  });

  it('says only the header is left when everything was pruned, and counts no hash as kept beside it', () => {
    const counts = storageCount(levels, [true, true, true, true]);
    const all = treeStatus('en', state({ spent: 4, pruned: true, counts }));
    expect(all.text).toBe(
      'Every transaction was spent, so nothing of the block is left but its 80-byte header. Its hash is unchanged, and the chain still links.',
    );
    expect(counts.stubHashes).toBe(0);
  });

  it('asks for another pruning when more is marked after one', () => {
    const counts = storageCount(levels, [true, true, false, false]);
    expect(treeStatus('en', state({ spent: 3, waiting: 1, pruned: true, counts })).text).toBe(
      '1 more marked as spent since the last pruning. Press Prune again.',
    );
  });

  it('speaks Chinese without a space between its sentences', () => {
    const pruned = treeStatus('zh', state({ spent: 3, pruned: true, counts: storageCount(levels, PAPER) }));
    expect(pruned.text).toBe(
      '4 筆交易中，有 3 筆已從磁碟刪除，由 2 個哈希（每個 32 位元組）頂替。以餘下的數據重新計算，默克爾根完全相同，區塊哈希因而依然成立。',
    );
    expect(pruned.aside).toBe('已修剪的區塊不能再加入交易。如要更改，請先重新開始。');
  });
});

describe('the status line of the header storage scene', () => {
  it('gives the paper’s own figure at ten minutes', () => {
    expect(storageStatus('en', 10)).toBe(
      'Ten minutes is the paper’s figure: 80 × 6 × 24 × 365 bytes, about 4.2 MB a year. That is about one block at its largest: the weight limit keeps a block just under 4 MB.',
    );
  });

  it('reads well at one minute, where "minutes" used to follow "1"', () => {
    expect(storageStatus('en', 1)).toBe(
      'With a block every 1 min: 42.0 MB of headers a year, about 10.5 times the largest block the rules allow.',
    );
    expect(storageStatus('zh', 1)).toBe('若每 1 分鐘出一個區塊：每年的區塊頭共 42.0 MB，約為規則容許的最大區塊的 10.5 倍。');
  });

  it('compares with the largest block as a multiple, at any interval', () => {
    expect(storageStatus('en', 11)).toBe(
      'With a block every 11 min: 3.8 MB of headers a year, about 1.0 times the largest block the rules allow.',
    );
    expect(storageStatus('en', 30)).toBe(
      'With a block every 30 min: 1.4 MB of headers a year, about 0.4 times the largest block the rules allow.',
    );
  });
});
