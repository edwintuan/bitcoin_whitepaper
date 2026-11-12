import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import { describe, expect, it } from 'vitest';
import { SECTION_IDS } from '@/content/types';
import { sectionBlocks } from './sectionChain';

const doubleSha = (text: string) => bytesToHex(sha256(sha256(utf8ToBytes(text))));

describe('the table of contents as a chain', () => {
  const blocks = sectionBlocks();

  it('has one block for each section, in the paper’s order', () => {
    expect(blocks.map((block) => block.id)).toEqual([...SECTION_IDS]);
    expect(blocks.map((block) => block.number)).toEqual(SECTION_IDS.map((_, index) => index));
  });

  it('links every block to the hash of the one before', () => {
    expect(blocks[0].prev).toBe('0'.repeat(64));
    for (let i = 1; i < blocks.length; i++) expect(blocks[i].prev).toBe(blocks[i - 1].hash);
  });

  it('shows hashes that are real: anyone can recompute them from what the block says', () => {
    for (const block of blocks) {
      expect(doubleSha(`${block.prev}|${block.id}|${block.nonce}`)).toBe(block.hash);
      // The toy target: two zero hex digits, about 256 tries.
      expect(block.hash.startsWith('00')).toBe(true);
    }
  });

  it('gives the first nonce that works, not just any', () => {
    for (const block of blocks) {
      for (let nonce = 0; nonce < block.nonce; nonce++) {
        expect(doubleSha(`${block.prev}|${block.id}|${nonce}`).startsWith('00')).toBe(false);
      }
    }
  });

  it('is computed once and is the same every time', () => {
    expect(sectionBlocks()).toBe(blocks);
  });
});
