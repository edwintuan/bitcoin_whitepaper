// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { bitsToTarget, headerHash, leadingZeroBits, meetsTarget } from '@/lib/header';
import { merkleRoot, verifyProof } from '@/lib/merkle';
import { blockSubsidy } from '@/lib/subsidy';
import { ZERO_BITS, runOnce } from './run';

describe('one payment run through the whole machine', () => {
  const run = runOnce();

  it('starts from a real address', () => {
    expect(run.address).toMatch(/^bc1q[0-9a-z]{38}$/);
  });

  it('has the transaction checked the way a node checks it: by its signature', () => {
    expect(run.txid).toMatch(/^[0-9a-f]{64}$/);
    expect(run.signatureValid).toBe(true);
  });

  it('holds the payment in the mempool with two others, then packs all three behind a coinbase', () => {
    expect(run.mempool).toHaveLength(3);
    expect(run.mempool).toContain(run.txid);
    expect(new Set(run.mempool).size).toBe(3);
    expect(run.blockTxids).toHaveLength(4);
    expect(run.blockTxids.slice(1)).toEqual(run.mempool);
    expect(run.merkleRoot).toBe(merkleRoot(run.blockTxids));
  });

  it('mines the header for real: the hash meets the target the header declares', () => {
    expect(run.header.merkleRoot).toBe(run.merkleRoot);
    expect(headerHash(run.header)).toBe(run.hash);
    expect(meetsTarget(run.hash, bitsToTarget(run.header.bits))).toBe(true);
    expect(leadingZeroBits(run.hash)).toBeGreaterThanOrEqual(ZERO_BITS);
    // The search started at nonce 0, so the nonce found says how many hashes it took.
    expect(run.tried).toBe(run.header.nonce + 1);
  });

  it('pays the finder the subsidy of the first block after the genesis block, plus the fees of three transactions', () => {
    expect(run.subsidy).toBe(blockSubsidy(1));
    expect(run.fees).toBeGreaterThan(0n);
    expect(run.fees % BigInt(run.mempool.length)).toBe(0n);
  });

  it('gives the light wallet a Merkle branch that proves the payment against the header', () => {
    expect(run.proof).toHaveLength(2);
    expect(verifyProof(run.txid, run.proof, run.header.merkleRoot)).toBe(true);
    expect(run.proofValid).toBe(true);
  });

  it('carries only what the figure shows or checks', () => {
    expect(Object.keys(run).sort()).toEqual(
      ['address', 'blockTxids', 'fees', 'hash', 'header', 'mempool', 'merkleRoot', 'proof', 'proofValid', 'signatureValid', 'subsidy', 'tried', 'txid'].sort(),
    );
  });

  it('is the same run every time', () => {
    expect(runOnce()).toEqual(run);
  });
});
