// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { bytesToHex } from './bytes';
import {
  GENESIS_HASH, GENESIS_HEADER, bitsToTarget, compactTargetFromZeroBits, hashToBigInt, headerHash, leadingZeroBits,
  meetsTarget, serializeHeader, targetFromZeroBits, targetToBits, targetToHex,
} from './header';
import type { BlockHeader } from './header';

describe('block header', () => {
  it('serializes the genesis header to the known 80 bytes', () => {
    expect(bytesToHex(serializeHeader(GENESIS_HEADER))).toBe(
      '01000000' + '00'.repeat(32) +
      '3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a' +
      '29ab5f49' + 'ffff001d' + '1dac2b7c',
    );
  });
  it('hashes the genesis header to the genesis block hash', () => {
    expect(GENESIS_HASH).toBe('000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f');
    expect(headerHash(GENESIS_HEADER)).toBe(GENESIS_HASH);
  });
  it('changes completely when the nonce changes', () => {
    const other = headerHash({ ...GENESIS_HEADER, nonce: GENESIS_HEADER.nonce + 1 });
    expect(other).not.toBe(GENESIS_HASH);
    expect(leadingZeroBits(other)).toBeLessThan(32);
  });

  // Mainnet block 1. Unlike genesis its previous-block field is not all zeros,
  // so this is the test that catches a hash serialized in the wrong byte order.
  const BLOCK_1: BlockHeader = {
    version: 1,
    prevHash: GENESIS_HASH,
    merkleRoot: '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098',
    time: 1231469665,
    bits: 0x1d00ffff,
    nonce: 2573394689,
  };

  it('hashes mainnet block 1, which points back at genesis', () => {
    expect(headerHash(BLOCK_1)).toBe('00000000839a8e6886ab5951d76f411475428afc90947ee320161bbf18eb6048');
  });
  it('writes the previous-block hash back to front', () => {
    const prevField = serializeHeader(BLOCK_1).subarray(4, 36);
    expect(bytesToHex(prevField)).toBe('6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000');
  });
  it('lays out six fields in exactly 80 bytes', () => {
    const bytes = serializeHeader({
      version: 0x01020304,
      prevHash: 'aa' + '00'.repeat(31),
      merkleRoot: '00'.repeat(31) + 'bb',
      time: 0x05060708,
      bits: 0x090a0b0c,
      nonce: 0x0d0e0f10,
    });
    expect(bytes).toHaveLength(80);
    expect(bytesToHex(bytes.subarray(0, 4))).toBe('04030201');
    expect(bytes[35]).toBe(0xaa); // last byte of the reversed previous-block hash
    expect(bytes[36]).toBe(0xbb); // first byte of the reversed merkle root
    expect(bytesToHex(bytes.subarray(68, 72))).toBe('08070605');
    expect(bytesToHex(bytes.subarray(72, 76))).toBe('0c0b0a09');
    expect(bytesToHex(bytes.subarray(76, 80))).toBe('100f0e0d');
  });
  it('rejects hashes that are not 32 bytes and fields that are not unsigned 32-bit integers', () => {
    expect(() => serializeHeader({ ...GENESIS_HEADER, prevHash: '00' })).toThrow(RangeError);
    expect(() => serializeHeader({ ...GENESIS_HEADER, merkleRoot: GENESIS_HEADER.merkleRoot + '00' })).toThrow(RangeError);
    expect(() => serializeHeader({ ...GENESIS_HEADER, nonce: 2 ** 32 })).toThrow(RangeError);
    expect(() => serializeHeader({ ...GENESIS_HEADER, time: -1 })).toThrow(RangeError);
  });
  it('freezes the shared genesis constant', () => {
    expect(Object.isFrozen(GENESIS_HEADER)).toBe(true);
  });
});

describe('compact target', () => {
  it('expands 0x1d00ffff', () => {
    expect(targetToHex(bitsToTarget(0x1d00ffff))).toBe('00000000ffff' + '0'.repeat(52));
  });
  it('round-trips', () => {
    for (const bits of [0x1d00ffff, 0x1b0404cb, 0x170b3ce9, 0x207fffff]) {
      expect(targetToBits(bitsToTarget(bits))).toBe(bits);
    }
  });
  it('builds a target from a number of zero bits', () => {
    expect(targetFromZeroBits(8)).toBe((1n << 248n) - 1n);
    expect(meetsTarget('00' + 'f'.repeat(62), targetFromZeroBits(8))).toBe(true);
    expect(meetsTarget('01' + '0'.repeat(62), targetFromZeroBits(8))).toBe(false);
  });
  it('counts leading zero bits', () => {
    expect(leadingZeroBits(GENESIS_HASH)).toBe(43);
    expect(leadingZeroBits('8' + '0'.repeat(63))).toBe(0);
    expect(leadingZeroBits('0'.repeat(64))).toBe(256);
  });
  it('accepts the genesis hash under its own target', () => {
    expect(meetsTarget(GENESIS_HASH, bitsToTarget(GENESIS_HEADER.bits))).toBe(true);
  });

  it('expands 0x1b0404cb', () => {
    expect(targetToHex(bitsToTarget(0x1b0404cb))).toBe('00000000000404cb' + '0'.repeat(48));
  });

  // Vectors from Bitcoin Core v32.1, src/test/arith_uint256_tests.cpp,
  // bignum_SetCompact (lines 415-540): [compact, expanded value, GetCompact()].
  const CORE_VECTORS: [number, bigint, number][] = [
    [0x00000000, 0n, 0],
    [0x00123456, 0n, 0],
    [0x01003456, 0n, 0],
    [0x02000056, 0n, 0],
    [0x03000000, 0n, 0],
    [0x04000000, 0n, 0],
    [0x00923456, 0n, 0],
    [0x01803456, 0n, 0],
    [0x02800056, 0n, 0],
    [0x03800000, 0n, 0],
    [0x04800000, 0n, 0],
    [0x01123456, 0x12n, 0x01120000],
    [0x02123456, 0x1234n, 0x02123400],
    [0x03123456, 0x123456n, 0x03123456],
    [0x04123456, 0x12345600n, 0x04123456],
    [0x05009234, 0x92340000n, 0x05009234],
    [0x20123456, 0x123456n << 232n, 0x20123456],
  ];

  it("matches Bitcoin Core's SetCompact vectors", () => {
    for (const [bits, value] of CORE_VECTORS) expect(bitsToTarget(bits)).toBe(value);
  });
  it("matches Bitcoin Core's GetCompact vectors", () => {
    for (const [, value, compact] of CORE_VECTORS) expect(targetToBits(value)).toBe(compact);
  });
  it('never sets the sign bit when compressing', () => {
    expect(targetToBits(0x80n)).toBe(0x02008000);
  });
  it('rejects compact values that Bitcoin Core flags as negative or overflowing', () => {
    expect(() => bitsToTarget(0x01fedcba)).toThrow(RangeError);
    expect(() => bitsToTarget(0x04923456)).toThrow(RangeError);
    expect(() => bitsToTarget(0xff123456)).toThrow(RangeError);
    expect(() => bitsToTarget(0x21010000)).toThrow(RangeError); // 2^256
    expect(() => bitsToTarget(-1)).toThrow(RangeError);
    expect(() => bitsToTarget(2 ** 32)).toThrow(RangeError);
  });
  it('accepts the largest value that still fits in 256 bits', () => {
    expect(bitsToTarget(0x2100ffff)).toBe(0xffffn << 240n);
    expect(bitsToTarget(0x220000ff)).toBe(0xffn << 248n);
  });
  it('loses precision below the top three bytes, as the real encoding does', () => {
    const exact = targetFromZeroBits(8);
    expect(targetToBits(exact)).toBe(0x2000ffff);
    expect(bitsToTarget(0x2000ffff)).toBe(0xffffn << 232n);
    expect(bitsToTarget(targetToBits(exact))).toBeLessThan(exact);
  });
  it('rejects targets outside 0 … 2^256 − 1', () => {
    expect(() => targetToBits(-1n)).toThrow(RangeError);
    expect(() => targetToBits(1n << 256n)).toThrow(RangeError);
    expect(() => targetToHex(-1n)).toThrow(RangeError);
    expect(() => targetToHex(1n << 256n)).toThrow(RangeError);
  });
  it('prints targets as 64 hex digits', () => {
    expect(targetToHex(0n)).toBe('0'.repeat(64));
    expect(targetToHex(1n)).toBe('0'.repeat(63) + '1');
    expect(targetToHex((1n << 256n) - 1n)).toBe('f'.repeat(64));
  });
  it('covers the whole range of zero-bit counts', () => {
    expect(targetFromZeroBits(0)).toBe((1n << 256n) - 1n);
    expect(targetFromZeroBits(256)).toBe(0n);
    expect(meetsTarget('f'.repeat(64), targetFromZeroBits(0))).toBe(true);
    expect(meetsTarget('0'.repeat(64), targetFromZeroBits(256))).toBe(true);
    expect(meetsTarget('0'.repeat(63) + '1', targetFromZeroBits(256))).toBe(false);
  });
  it('rejects zero-bit counts outside 0 … 256', () => {
    expect(() => targetFromZeroBits(-1)).toThrow(RangeError);
    expect(() => targetFromZeroBits(257)).toThrow(RangeError);
    expect(() => targetFromZeroBits(7.5)).toThrow(RangeError);
  });
  it('requires exactly n leading zero bits to meet targetFromZeroBits(n)', () => {
    for (const n of [1, 4, 13, 24]) {
      const justEnough = targetToHex(1n << BigInt(255 - n)); // n zero bits, then a one
      const oneShort = targetToHex(1n << BigInt(256 - n)); // n − 1 zero bits
      expect(leadingZeroBits(justEnough)).toBe(n);
      expect(meetsTarget(justEnough, targetFromZeroBits(n))).toBe(true);
      expect(meetsTarget(oneShort, targetFromZeroBits(n))).toBe(false);
    }
  });
  it('treats a hash equal to the target as meeting it', () => {
    const target = bitsToTarget(0x1d00ffff);
    expect(meetsTarget(targetToHex(target), target)).toBe(true);
    expect(meetsTarget(targetToHex(target + 1n), target)).toBe(false);
  });
  it('reads a display-order hash as a 256-bit number', () => {
    expect(hashToBigInt('0'.repeat(63) + '1')).toBe(1n);
    expect(hashToBigInt('f'.repeat(64))).toBe((1n << 256n) - 1n);
    expect(hashToBigInt('FF' + '0'.repeat(62))).toBe(0xffn << 248n);
    expect(leadingZeroBits('0'.repeat(63) + '1')).toBe(255);
  });
  it('rejects hashes that are not 64 hex characters', () => {
    expect(() => hashToBigInt('')).toThrow(RangeError);
    expect(() => hashToBigInt('00')).toThrow(RangeError);
    expect(() => hashToBigInt('g' + '0'.repeat(63))).toThrow(RangeError);
    expect(() => leadingZeroBits('0'.repeat(65))).toThrow(RangeError);
    expect(() => meetsTarget('0x' + '0'.repeat(62), 1n)).toThrow(RangeError);
  });
});

describe('compactTargetFromZeroBits', () => {
  it('gives a target a header can declare: packing it again yields the same four bytes', () => {
    for (let n = 0; n <= 64; n++) {
      const { bits, target } = compactTargetFromZeroBits(n);
      expect(bitsToTarget(bits)).toBe(target);
      expect(targetToBits(target)).toBe(bits);
    }
  });

  it('asks for exactly the zero bits it was given, and is only a hair harder than the exact target', () => {
    for (let n = 1; n <= 64; n++) {
      const { target } = compactTargetFromZeroBits(n);
      expect(leadingZeroBits(targetToHex(target))).toBe(n);
      // The compact form keeps three bytes of precision: never easier than asked.
      expect(target <= targetFromZeroBits(n)).toBe(true);
      expect(meetsTarget(targetToHex(target), targetFromZeroBits(n))).toBe(true);
    }
  });

  it('refuses what targetFromZeroBits refuses', () => {
    expect(() => compactTargetFromZeroBits(-1)).toThrow(RangeError);
    expect(() => compactTargetFromZeroBits(1.5)).toThrow(RangeError);
  });
});
