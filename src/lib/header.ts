import { concatBytes, hashToWire, u32le, wireToHash } from './bytes';
import { sha256d } from './hash';

/**
 * The six fields of a block header, in the order they are serialized
 * (Bitcoin Core v32.1, src/primitives/block.h:30-42).
 *
 * `prevHash` and `merkleRoot` are display-order (big-endian) hex strings, the
 * way block explorers print them. `version`, `time`, `bits` and `nonce` are
 * unsigned 32-bit integers. (Bitcoin Core declares the version as signed; the
 * four bytes are the same, read here as an unsigned number.)
 */
export interface BlockHeader {
  version: number;
  /** Hash of the previous block's header, display order. */
  prevHash: string;
  /** Merkle root of this block's transactions, display order. */
  merkleRoot: string;
  /** Unix time in seconds. */
  time: number;
  /** The proof-of-work target in compact form; see {@link bitsToTarget}. */
  bits: number;
  nonce: number;
}

/** The header of mainnet block 0 (Bitcoin Core v32.1, src/kernel/chainparams.cpp:158-161). */
export const GENESIS_HEADER: Readonly<BlockHeader> = Object.freeze({
  version: 1,
  prevHash: '0'.repeat(64),
  merkleRoot: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
  time: 1231006505,
  bits: 0x1d00ffff,
  nonce: 2083236893,
});

/** The published hash of mainnet block 0, display order. `headerHash(GENESIS_HEADER)` recomputes it. */
export const GENESIS_HASH = '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';

const MAX_UINT256 = (1n << 256n) - 1n;

/**
 * Serializes a header into the exact 80 bytes that miners hash.
 *
 * Layout: version (4) | previous block hash (32) | merkle root (32) |
 * time (4) | bits (4) | nonce (4). The integers are little-endian. The two
 * hashes are written reversed: the header holds them in wire order, so the
 * display-order strings in `h` appear back to front in the output.
 *
 * @throws RangeError if a hash is not 64 hex characters or an integer field is
 * not an unsigned 32-bit integer.
 */
export function serializeHeader(h: BlockHeader): Uint8Array {
  return concatBytes(
    u32le(h.version),
    hashToWire(h.prevHash),
    hashToWire(h.merkleRoot),
    u32le(h.time),
    u32le(h.bits),
    u32le(h.nonce),
  );
}

/**
 * The block hash: double SHA-256 of the 80 serialized bytes, returned in
 * display order (the digest reversed), which is why a valid hash is written
 * with its zeros in front.
 */
export function headerHash(h: BlockHeader): string {
  return wireToHash(sha256d(serializeHeader(h)));
}

/**
 * Expands the header's 4-byte compact `bits` field into the full 256-bit
 * target. The top byte is a length in bytes, the low three bytes are the most
 * significant digits: `0x1d00ffff` means "0x00ffff followed by 26 zero bytes".
 * A port of `arith_uint256::SetCompact` (Bitcoin Core v32.1,
 * src/arith_uint256.cpp:176-194).
 *
 * @throws RangeError if `bits` is not an unsigned 32-bit integer, or encodes a
 * negative number or one that overflows 256 bits. Bitcoin Core rejects both as
 * proof-of-work targets (`DeriveTarget`, src/pow.cpp:146-159). It also rejects
 * a target of zero and one above the network's limit; this function returns
 * those, because the figures mine against far easier targets than the real one.
 */
export function bitsToTarget(bits: number): bigint {
  if (!Number.isInteger(bits) || bits < 0 || bits > 0xffffffff) {
    throw new RangeError(`bits must be an unsigned 32-bit integer, got ${bits}`);
  }
  const size = bits >>> 24;
  const mantissa = bits & 0x007fffff;
  const target = size <= 3
    ? BigInt(mantissa >>> (8 * (3 - size)))
    : BigInt(mantissa) << BigInt(8 * (size - 3));
  if (target !== 0n && (bits & 0x00800000) !== 0) {
    throw new RangeError(`compact target 0x${bits.toString(16)} is negative`);
  }
  if (target > MAX_UINT256) {
    throw new RangeError(`compact target 0x${bits.toString(16)} overflows 256 bits`);
  }
  return target;
}

/**
 * Compresses a target into the compact `bits` form. Only the top three bytes
 * survive, so this is lossy: `bitsToTarget(targetToBits(t))` can be slightly
 * below `t`. A port of `arith_uint256::GetCompact` (Bitcoin Core v32.1,
 * src/arith_uint256.cpp:196-217).
 *
 * @throws RangeError unless `target` is within 0 … 2^256 − 1.
 */
export function targetToBits(target: bigint): number {
  assertUint256(target);
  let size = 0;
  for (let rest = target; rest > 0n; rest >>= 8n) size++;
  let mantissa = size <= 3
    ? Number(target) << (8 * (3 - size))
    : Number(target >> BigInt(8 * (size - 3)));
  // Bit 0x00800000 is the sign bit of the format. If the top digit would set
  // it, drop one byte of precision and lengthen the number by one instead.
  if (mantissa & 0x00800000) {
    mantissa >>>= 8;
    size++;
  }
  return ((size << 24) | mantissa) >>> 0;
}

/**
 * The toy-difficulty target used by the figures: the largest value whose first
 * `n` bits are zero, `2^(256 − n) − 1`. A hash meets it exactly when it starts
 * with at least `n` zero bits, which takes `2^n` attempts on average.
 *
 * @throws RangeError unless `n` is an integer within 0 … 256.
 */
export function targetFromZeroBits(n: number): bigint {
  if (!Number.isInteger(n) || n < 0 || n > 256) {
    throw new RangeError(`zero bits must be an integer within 0 … 256, got ${n}`);
  }
  return (1n << BigInt(256 - n)) - 1n;
}

/**
 * The toy difficulty as a header can declare it: the target for `n` leading
 * zero bits packed into the four-byte compact form, and that form expanded
 * again. A figure that mines against the expanded value shows a `bits` field
 * and a target that are one and the same number, as on the real chain. The
 * compact form keeps three bytes of precision, so the target is never easier
 * than `targetFromZeroBits(n)` and only a hair harder.
 *
 * @throws RangeError unless `n` is an integer within 0 … 256.
 */
export function compactTargetFromZeroBits(n: number): { bits: number; target: bigint } {
  const bits = targetToBits(targetFromZeroBits(n));
  return { bits, target: bitsToTarget(bits) };
}

/**
 * Reads a display-order hash as the 256-bit number that proof-of-work compares
 * with the target. Display order is big-endian, so the string converts as written.
 *
 * @throws RangeError unless `hashHex` is exactly 64 hex characters.
 */
export function hashToBigInt(hashHex: string): bigint {
  if (!/^[0-9a-fA-F]{64}$/.test(hashHex)) {
    throw new RangeError('expected a 32-byte hash as 64 hex characters');
  }
  return BigInt(`0x${hashHex}`);
}

/**
 * The proof-of-work check: a display-order hash, read as a number, must not
 * exceed the target. Equal counts as valid (`CheckProofOfWorkImpl`, Bitcoin
 * Core v32.1, src/pow.cpp:161-171).
 */
export function meetsTarget(hashHex: string, target: bigint): boolean {
  return hashToBigInt(hashHex) <= target;
}

/** How many zero bits a display-order hash starts with: 0 … 256. */
export function leadingZeroBits(hashHex: string): number {
  const value = hashToBigInt(hashHex);
  return value === 0n ? 256 : 256 - value.toString(2).length;
}

/**
 * Prints a target as 64 hex digits so it lines up under a display-order hash.
 *
 * @throws RangeError unless `target` is within 0 … 2^256 − 1.
 */
export function targetToHex(target: bigint): string {
  assertUint256(target);
  return target.toString(16).padStart(64, '0');
}

function assertUint256(target: bigint): void {
  if (target < 0n || target > MAX_UINT256) {
    throw new RangeError('target must be within 0 … 2^256 − 1');
  }
}
