// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { bytesToHex, hexToBytes, reverseBytes, u32le, u64le, utf8, varInt } from './bytes';
import { hash160, sha256, sha256d, sha256Hex } from './hash';

describe('bytes', () => {
  it('round-trips hex', () => {
    expect(bytesToHex(hexToBytes('00ff10ab'))).toBe('00ff10ab');
  });
  it('rejects malformed hex', () => {
    expect(() => hexToBytes('abc')).toThrow();
    expect(() => hexToBytes('zz')).toThrow();
  });
  it('encodes little-endian integers', () => {
    expect(bytesToHex(u32le(1))).toBe('01000000');
    expect(bytesToHex(u32le(0x1d00ffff))).toBe('ffff001d');
    expect(bytesToHex(u64le(5_000_000_000n))).toBe('00f2052a01000000');
  });
  it('encodes CompactSize', () => {
    expect(bytesToHex(varInt(0xfc))).toBe('fc');
    expect(bytesToHex(varInt(0xfd))).toBe('fdfd00');
    expect(bytesToHex(varInt(0x10000))).toBe('fe00000100');
  });
  it('reverses without mutating', () => {
    const a = hexToBytes('010203');
    expect(bytesToHex(reverseBytes(a))).toBe('030201');
    expect(bytesToHex(a)).toBe('010203');
  });
});

describe('hash', () => {
  it('matches SHA-256 test vectors', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
  it('double-hashes', () => {
    expect(bytesToHex(sha256d(utf8('hello')))).toBe('9595c9df90075148eb06860365df33584b75bff782a510c6cd4883a419833d50');
    expect(bytesToHex(sha256d(new Uint8Array(0))).slice(0, 8)).toBe('5df6e0e2');
  });
  it('computes HASH160 of the generator public key', () => {
    const pub = hexToBytes('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798');
    expect(bytesToHex(hash160(pub))).toBe('751e76e8199196d454941c45d1b3a323f1433bd6');
    expect(sha256(pub)).toHaveLength(32);
  });
  it('hashes a message longer than one 64-byte block (FIPS 180 vector)', () => {
    const msg = utf8('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq');
    expect(bytesToHex(sha256(msg))).toBe('248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
  });
  it('hashes strings as UTF-8, not as UTF-16 code units', () => {
    expect(sha256Hex('€')).toBe('c4cc90ed3d26f12d4b08a75140970a7904035c31cbb4515a83f19b9003c00d1d');
  });
  it('computes HASH160 of empty input', () => {
    const digest = hash160(new Uint8Array(0));
    expect(digest).toHaveLength(20);
    expect(bytesToHex(digest)).toBe('b472a266d0bd89c13706a4132ccfb16f7c3b9fcb');
  });
  it('leaves its input untouched', () => {
    const input = utf8('hello');
    sha256(input);
    sha256d(input);
    hash160(input);
    expect(bytesToHex(input)).toBe('68656c6c6f');
  });
});
