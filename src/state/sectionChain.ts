import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import { SECTION_IDS } from '@/content/types';

export interface SectionBlock {
  /** 0 to 12: the Abstract and the paper's twelve sections. */
  number: number;
  id: string;
  prev: string;
  nonce: number;
  hash: string;
}

const GENESIS_PREV = '0'.repeat(64);

/** Leading zero bits each section's block must have. A toy target: about 256 tries. */
const ZERO_HEX_DIGITS = 2;

function doubleSha256Hex(text: string): string {
  return bytesToHex(sha256(sha256(utf8ToBytes(text))));
}

function mine(prev: string, id: string): { nonce: number; hash: string } {
  const target = '0'.repeat(ZERO_HEX_DIGITS);
  for (let nonce = 0; ; nonce += 1) {
    const hash = doubleSha256Hex(`${prev}|${id}|${nonce}`);
    if (hash.startsWith(target)) return { nonce, hash };
  }
}

let cached: SectionBlock[] | null = null;

/**
 * The table of contents as a real, if tiny, chain: each section is a block
 * whose hash commits to the section before it. Deterministic, computed once.
 */
export function sectionBlocks(): SectionBlock[] {
  if (cached) return cached;
  const blocks: SectionBlock[] = [];
  let prev = GENESIS_PREV;
  SECTION_IDS.forEach((id, number) => {
    const { nonce, hash } = mine(prev, id);
    blocks.push({ number, id, prev, nonce, hash });
    prev = hash;
  });
  cached = blocks;
  return blocks;
}
