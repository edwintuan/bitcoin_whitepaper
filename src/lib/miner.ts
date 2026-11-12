import { sha256 } from '@noble/hashes/sha2.js';
import { hashToWire, wireToHash } from './bytes';
import { serializeHeader, targetToHex } from './header';
import type { BlockHeader } from './header';

/** The outcome of one slice of mining. */
export interface MineStep {
  /** Whether the last attempt of this slice met the target. */
  found: boolean;
  /** The nonce of the last attempt: the winning one when `found`. */
  nonce: number;
  /** The block hash of that attempt, display order (zeros in front). */
  hash: string;
  /** Hashes computed in this slice, counting the winning one. */
  tried: number;
}

/** A resumable nonce search over one block header. */
export interface Miner {
  /**
   * Tries up to `maxHashes` nonces, continuing where the previous call
   * stopped, and returns as soon as one meets the target. Every call resumes
   * at the nonce after the last attempt, including after a hit, and the nonce
   * wraps from 2^32 − 1 back to 0.
   *
   * @throws RangeError unless `maxHashes` is a positive integer.
   */
  step(maxHashes: number): MineStep;
  /** A fresh copy of the header carrying the nonce of the latest attempt. */
  readonly header: BlockHeader;
  /** Hashes computed since the miner was created. */
  readonly totalTried: number;
}

/** Byte offset of the nonce in the 80-byte header. */
const NONCE_OFFSET = 76;

/** SHA-256 works through its input in blocks of this many bytes. */
const SHA256_BLOCK = 64;

/**
 * Creates a miner that searches nonces upward from `header.nonce`, built to be
 * called once per animation frame with a hash budget that fits in the frame.
 *
 * The header is serialized once into an 80-byte buffer, and each attempt
 * rewrites only the four little-endian nonce bytes. Two things keep the cost
 * per hash low:
 *
 * - Midstate. The nonce sits in the last 16 bytes, so SHA-256's work on the
 *   first 64-byte block is the same for every nonce. It is done once; each
 *   attempt resumes from that saved state and hashes only the tail. Real
 *   mining hardware uses the same shortcut.
 * - Reuse. The hasher objects and digest buffers are created once, the digest
 *   is compared with the target byte by byte, and a hex string is built once
 *   per `step`, never per attempt.
 *
 * @throws RangeError if the header is malformed or `target` is outside 0 … 2^256 − 1.
 */
export function createMiner(opts: { header: BlockHeader; target: bigint }): Miner {
  const base = { ...opts.header };
  const buffer = serializeHeader(base);
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const tail = buffer.subarray(SHA256_BLOCK);
  const midstate = sha256.create().update(buffer.subarray(0, SHA256_BLOCK));
  const blank = sha256.create();
  const firstPass = sha256.create();
  const secondPass = sha256.create();
  const inner = new Uint8Array(32);
  const digest = new Uint8Array(32);
  // The target in the digest's own byte order: least significant byte first.
  const target = hashToWire(targetToHex(opts.target));
  let next = base.nonce;
  let last = base.nonce;
  let totalTried = 0;

  const meetsTarget = (): boolean => {
    for (let i = 31; i >= 0; i--) {
      if (digest[i] !== target[i]) return digest[i] < target[i];
    }
    return true;
  };

  return {
    step(maxHashes) {
      if (!Number.isInteger(maxHashes) || maxHashes < 1) {
        throw new RangeError(`maxHashes must be a positive integer, got ${maxHashes}`);
      }
      let tried = 0;
      let found = false;
      while (tried < maxHashes && !found) {
        last = next;
        next = (last + 1) >>> 0;
        view.setUint32(NONCE_OFFSET, last, true);
        midstate._cloneInto(firstPass).update(tail).digestInto(inner);
        blank._cloneInto(secondPass).update(inner).digestInto(digest);
        tried++;
        found = meetsTarget();
      }
      totalTried += tried;
      return { found, nonce: last, hash: wireToHash(digest), tried };
    },
    get header() {
      return { ...base, nonce: last };
    },
    get totalTried() {
      return totalTried;
    },
  };
}

/** Mines in one blocking call: at most `maxHashes` attempts starting from `header.nonce`. */
export function mineSync(header: BlockHeader, target: bigint, maxHashes: number): MineStep {
  return createMiner({ header, target }).step(maxHashes);
}
