import { describe, expect, it } from 'vitest';
import { hexToBytes } from '@/lib/bytes';
import { headerHash, meetsTarget } from '@/lib/header';
import { verify } from '@/lib/keys';
import { merkleRoot, verifyProof } from '@/lib/merkle';
import { mineSync } from '@/lib/miner';
import { fee, txid } from '@/lib/tx';
import { buildStory } from './story';

const story = buildStory();

describe('the journey of one payment', () => {
  it('is the same every time', () => {
    expect(buildStory()).toEqual(story);
  });

  it('pays Bob half a bitcoin from two of Alice’s coins and returns the change', () => {
    expect(story.amount).toBe(50_000_000n);
    expect(story.inputs.map((coin) => coin.value)).toEqual([30_000_000n, 25_000_000n]);
    expect(story.tx.outputs).toEqual([
      { value: 50_000_000n, owner: story.bob.address },
      { value: 4_990_000n, owner: story.alice.address },
    ]);
  });

  it('leaves exactly the fee unclaimed', () => {
    expect(story.fee).toBe(10_000n);
    expect(fee(story.tx, story.inputs)).toBe(story.fee);
  });

  it('carries a signature by Alice’s key over the transaction id', () => {
    expect(story.txid).toBe(txid(story.tx));
    expect(verify(hexToBytes(story.signature), hexToBytes(story.txid), story.alice.pub)).toBe(true);
    expect(verify(hexToBytes(story.signature), hexToBytes(story.txid), story.bob.pub)).toBe(false);
  });

  it('puts the payment in a block template whose Merkle root commits to it', () => {
    expect(story.blockTxids).toContain(story.txid);
    expect(story.blockTxids.indexOf(story.txid)).toBe(story.txIndex);
    expect(story.merkleRoot).toBe(merkleRoot(story.blockTxids));
    expect(story.header.merkleRoot).toBe(story.merkleRoot);
  });

  it('gives the miner a header that can be solved at the toy target', () => {
    const found = mineSync(story.header, story.target, 2_000_000);
    expect(found.found).toBe(true);
    expect(meetsTarget(headerHash({ ...story.header, nonce: found.nonce }), story.target)).toBe(true);
  });

  it('lets a light wallet verify the payment from the Merkle branch alone', () => {
    expect(story.proof.length).toBeGreaterThan(0);
    expect(verifyProof(story.txid, story.proof, story.merkleRoot)).toBe(true);
    expect(verifyProof(story.blockTxids[0], story.proof, story.merkleRoot)).toBe(false);
  });
});
