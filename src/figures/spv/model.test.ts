// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { GENESIS_HASH, headerHash, meetsTarget } from '@/lib/header';
import { foldProof, merkleLevels, merkleProof, merkleRoot, verifyProof } from '@/lib/merkle';
import { txid } from '@/lib/tx';
import {
  BLOCK_TX_COUNT,
  CHAIN_TARGET,
  MAX_DOUBLINGS,
  MIN_DOUBLINGS,
  PAYMENT_BLOCK,
  bigBlock,
  blockPayments,
  corrupt,
  forge,
  headerChain,
  nodeRoles,
} from './model';

const payments = blockPayments();
const ids = payments.map((payment) => payment.id);
const root = merkleRoot(ids);

describe('blockPayments', () => {
  it('holds eight real transactions, each named by its own id', () => {
    expect(payments).toHaveLength(BLOCK_TX_COUNT);
    expect(new Set(ids).size).toBe(BLOCK_TX_COUNT);
    for (const payment of payments) {
      expect(payment.id).toBe(txid(payment.tx));
      expect(payment.tx.outputs[0].value).toBe(payment.amount);
      expect(payment.amount > 0n).toBe(true);
    }
  });

  it('is the same block every time', () => {
    expect(blockPayments().map((payment) => payment.id)).toEqual(ids);
  });
});

describe('forge', () => {
  it('is the same payment with a larger amount, and therefore a different transaction', () => {
    for (const payment of payments) {
      const fake = forge(payment);
      expect(fake.tx.inputs).toEqual(payment.tx.inputs);
      expect(fake.amount).toBe(payment.amount * 100n);
      expect(fake.id).toBe(txid(fake.tx));
      expect(fake.id).not.toBe(payment.id);
    }
  });
});

describe('corrupt', () => {
  it('changes the first hex digit, the one every shortened hash shows, and leaves a well-formed hash', () => {
    for (const id of [...ids, 'f'.repeat(64), '0'.repeat(64)]) {
      const bad = corrupt(id);
      expect(bad).toMatch(/^[0-9a-f]{64}$/);
      expect(bad[0]).not.toBe(id[0]);
      expect(bad.slice(1)).toBe(id.slice(1));
    }
  });

  it('accepts a hash in upper case', () => {
    expect(corrupt('F'.repeat(64))).toMatch(/^[0-9a-f][fF]{63}$/);
    expect(corrupt('F'.repeat(64))[0]).not.toBe('f');
  });
});

describe('the two ways to tamper', () => {
  const end = (id: string, proof: ReturnType<typeof merkleProof>) => foldProof(id, proof).at(-1)?.out;

  it('a branch folds every transaction of the block up to the root in the header', () => {
    ids.forEach((id, index) => expect(end(id, merkleProof(ids, index))).toBe(root));
  });

  it('a forged transaction ends somewhere else', () => {
    const proof = merkleProof(ids, 5);
    const fake = forge(payments[5]);
    expect(end(fake.id, proof)).not.toBe(root);
    expect(verifyProof(fake.id, proof, root)).toBe(false);
  });

  it('an altered sibling ends somewhere else, whichever one it is', () => {
    const proof = merkleProof(ids, 5);
    proof.forEach((_, level) => {
      const bad = proof.map((step, i) => (i === level ? { ...step, hash: corrupt(step.hash) } : step));
      expect(end(ids[5], bad)).not.toBe(root);
      expect(verifyProof(ids[5], bad, root)).toBe(false);
    });
  });
});

describe('nodeRoles', () => {
  it('marks the path of the picked transaction and the sibling beside each step', () => {
    // Tx5 of eight: path 5 → 2 → 1 → root; siblings 4, 3, 0.
    expect(nodeRoles(BLOCK_TX_COUNT, 5)).toEqual([
      ['none', 'none', 'none', 'none', 'sibling', 'path', 'none', 'none'],
      ['none', 'none', 'path', 'sibling'],
      ['sibling', 'path'],
      ['path'],
    ]);
  });

  it('names exactly one sibling per level below the root', () => {
    for (let index = 0; index < BLOCK_TX_COUNT; index++) {
      const roles = nodeRoles(BLOCK_TX_COUNT, index);
      roles.slice(0, -1).forEach((row) => {
        expect(row.filter((role) => role === 'sibling')).toHaveLength(1);
        expect(row.filter((role) => role === 'path')).toHaveLength(1);
      });
      expect(roles[roles.length - 1]).toEqual(['path']);
    }
  });

  it('agrees with the engine about which hashes a proof carries', () => {
    const levels = merkleLevels(ids);
    for (let index = 0; index < BLOCK_TX_COUNT; index++) {
      const roles = nodeRoles(BLOCK_TX_COUNT, index);
      const siblings = roles.slice(0, -1).map((row, level) => levels[level][row.indexOf('sibling')]);
      expect(siblings).toEqual(merkleProof(ids, index).map((step) => step.hash));
    }
  });
});

describe('headerChain', () => {
  const chain = headerChain();

  it('is three mined headers, each carrying the hash of the one before', () => {
    expect(chain).toHaveLength(3);
    expect(chain[0].header.prevHash).toBe(GENESIS_HASH);
    expect(chain[1].header.prevHash).toBe(chain[0].hash);
    expect(chain[2].header.prevHash).toBe(chain[1].hash);
    for (const block of chain) {
      expect(headerHash(block.header)).toBe(block.hash);
      expect(meetsTarget(block.hash, CHAIN_TARGET)).toBe(true);
    }
    expect(chain.map((block) => block.height)).toEqual([1, 2, 3]);
  });

  it('commits to the payments in the middle header and nowhere else', () => {
    expect(chain[PAYMENT_BLOCK].header.merkleRoot).toBe(root);
    expect(chain[0].header.merkleRoot).not.toBe(root);
    expect(chain[2].header.merkleRoot).not.toBe(root);
  });

  it('is the same chain every time', () => {
    expect(headerChain().map((block) => block.hash)).toEqual(chain.map((block) => block.hash));
  });
});

describe('bigBlock', () => {
  it('adds one hash to the branch each time the block doubles', () => {
    for (let doublings = MIN_DOUBLINGS; doublings <= MAX_DOUBLINGS; doublings++) {
      const block = bigBlock(doublings);
      expect(block.count).toBe(2 ** doublings);
      expect(block.proof).toHaveLength(doublings);
    }
  });

  it('is a real tree: the branch verifies against the root, and a forged id does not', () => {
    for (const doublings of [MIN_DOUBLINGS, 7, MAX_DOUBLINGS]) {
      const block = bigBlock(doublings);
      expect(block.index).toBeGreaterThanOrEqual(0);
      expect(block.index).toBeLessThan(block.count);
      expect(verifyProof(block.txid, block.proof, block.root)).toBe(true);
      expect(verifyProof(corrupt(block.txid), block.proof, block.root)).toBe(false);
    }
  });

  it('covers eight transactions to a few thousand', () => {
    expect(2 ** MIN_DOUBLINGS).toBe(8);
    expect(2 ** MAX_DOUBLINGS).toBe(4096);
    expect(() => bigBlock(MAX_DOUBLINGS + 1)).toThrow(RangeError);
  });
});
