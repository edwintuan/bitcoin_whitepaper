import { GENESIS_HASH } from '@/lib/header';
import type { BlockHeader } from '@/lib/header';

/** The real header of mainnet block 1, mined on 9 January 2009. */
export const BLOCK_1: BlockHeader = Object.freeze({
  version: 1,
  prevHash: GENESIS_HASH,
  merkleRoot: '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098',
  time: 1231469665,
  bits: 0x1d00ffff,
  nonce: 2573394689,
});

export const BLOCK_1_HASH = '00000000839a8e6886ab5951d76f411475428afc90947ee320161bbf18eb6048';

/** Average number of hashes needed to find `zeroBits` leading zero bits. */
export function expectedTries(zeroBits: number): number {
  return 2 ** zeroBits;
}

/** The six fields of the 80-byte header, in the order they are serialised, with their size in bytes. */
export const HEADER_FIELDS = [
  { key: 'version', bytes: 4 },
  { key: 'prevHash', bytes: 32 },
  { key: 'merkleRoot', bytes: 32 },
  { key: 'time', bytes: 4 },
  { key: 'bits', bytes: 4 },
  { key: 'nonce', bytes: 4 },
] as const;

export type HeaderField = (typeof HEADER_FIELDS)[number]['key'];

/** Where each field lies in the serialised header: `start` inclusive, `end` exclusive. */
export const HEADER_SEGMENTS: readonly { name: HeaderField; start: number; end: number }[] = HEADER_FIELDS.reduce<
  { name: HeaderField; start: number; end: number }[]
>((segments, field) => {
  const start = segments.length ? segments[segments.length - 1].end : 0;
  return [...segments, { name: field.key, start, end: start + field.bytes }];
}, []);
