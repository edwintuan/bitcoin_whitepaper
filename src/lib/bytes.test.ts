// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  bytesToHex, concatBytes, hashToWire, hexToBytes, reverseBytes, u32le, u64le, utf8, varInt, wireToHash,
} from './bytes';

describe('hex', () => {
  it('maps the empty string to no bytes and back', () => {
    expect(hexToBytes('')).toEqual(new Uint8Array(0));
    expect(bytesToHex(new Uint8Array(0))).toBe('');
  });
  it('accepts upper case and always writes lower case', () => {
    expect(bytesToHex(hexToBytes('DEADBEEF'))).toBe('deadbeef');
  });
  it('rejects whitespace and a 0x prefix', () => {
    expect(() => hexToBytes('de ad')).toThrow();
    expect(() => hexToBytes('0xdead')).toThrow();
  });
});

describe('concatBytes', () => {
  it('joins parts in order', () => {
    expect(bytesToHex(concatBytes(hexToBytes('01'), hexToBytes('0203'), hexToBytes('04')))).toBe('01020304');
  });
  it('returns an empty array for no parts and skips empty parts', () => {
    expect(concatBytes()).toEqual(new Uint8Array(0));
    expect(bytesToHex(concatBytes(new Uint8Array(0), hexToBytes('ff'), new Uint8Array(0)))).toBe('ff');
  });
  it('copies, so later edits to a part do not leak into the result', () => {
    const part = hexToBytes('0102');
    const joined = concatBytes(part);
    part[0] = 0xff;
    expect(bytesToHex(joined)).toBe('0102');
  });
});

describe('reverseBytes', () => {
  it('handles empty and single-byte input', () => {
    expect(reverseBytes(new Uint8Array(0))).toEqual(new Uint8Array(0));
    expect(bytesToHex(reverseBytes(hexToBytes('7f')))).toBe('7f');
  });
});

describe('hash byte order', () => {
  // The genesis block hash as explorers print it, and as block 1 stores it in
  // its previous-block field.
  const DISPLAY = '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';
  const WIRE = '6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000';

  it('reverses a display-order hash into the bytes that go on the wire', () => {
    expect(bytesToHex(hashToWire(DISPLAY))).toBe(WIRE);
  });
  it('reverses wire bytes back into display order', () => {
    expect(wireToHash(hexToBytes(WIRE))).toBe(DISPLAY);
  });
  it('accepts upper case and writes lower case', () => {
    expect(wireToHash(hashToWire(DISPLAY.toUpperCase()))).toBe(DISPLAY);
  });
  it('does not mutate the bytes it is given', () => {
    const wire = hexToBytes(WIRE);
    wireToHash(wire);
    expect(bytesToHex(wire)).toBe(WIRE);
  });
  it('rejects anything that is not exactly 32 bytes', () => {
    expect(() => hashToWire('')).toThrow(RangeError);
    expect(() => hashToWire(DISPLAY.slice(2))).toThrow(RangeError);
    expect(() => hashToWire(DISPLAY + '00')).toThrow(RangeError);
    expect(() => hashToWire('zz' + DISPLAY.slice(2))).toThrow(RangeError);
    expect(() => wireToHash(new Uint8Array(31))).toThrow(RangeError);
    expect(() => wireToHash(new Uint8Array(33))).toThrow(RangeError);
  });
});

describe('u32le', () => {
  it('encodes the ends of the range', () => {
    expect(bytesToHex(u32le(0))).toBe('00000000');
    expect(bytesToHex(u32le(0xffffffff))).toBe('ffffffff');
    expect(bytesToHex(u32le(0x01020304))).toBe('04030201');
  });
  it('rejects values that are not unsigned 32-bit integers', () => {
    expect(() => u32le(-1)).toThrow(RangeError);
    expect(() => u32le(2 ** 32)).toThrow(RangeError);
    expect(() => u32le(1.5)).toThrow(RangeError);
    expect(() => u32le(Number.NaN)).toThrow(RangeError);
  });
});

describe('u64le', () => {
  it('encodes the ends of the range', () => {
    expect(bytesToHex(u64le(0n))).toBe('0000000000000000');
    expect(bytesToHex(u64le(2n ** 64n - 1n))).toBe('ffffffffffffffff');
    expect(bytesToHex(u64le(0x0102030405060708n))).toBe('0807060504030201');
  });
  it('rejects values outside the unsigned 64-bit range', () => {
    expect(() => u64le(-1n)).toThrow(RangeError);
    expect(() => u64le(2n ** 64n)).toThrow(RangeError);
  });
});

describe('varInt (CompactSize)', () => {
  it('uses the shortest form at every boundary', () => {
    expect(bytesToHex(varInt(0))).toBe('00');
    expect(bytesToHex(varInt(0xfc))).toBe('fc');
    expect(bytesToHex(varInt(0xfd))).toBe('fdfd00');
    expect(bytesToHex(varInt(0xffff))).toBe('fdffff');
    expect(bytesToHex(varInt(0x10000))).toBe('fe00000100');
    expect(bytesToHex(varInt(0xffffffff))).toBe('feffffffff');
    expect(bytesToHex(varInt(0x100000000))).toBe('ff0000000001000000');
    expect(bytesToHex(varInt(Number.MAX_SAFE_INTEGER))).toBe('ffffffffffffff1f00');
  });
  it('rejects negative, fractional and unsafe values', () => {
    expect(() => varInt(-1)).toThrow(RangeError);
    expect(() => varInt(0.5)).toThrow(RangeError);
    expect(() => varInt(2 ** 53)).toThrow(RangeError);
    expect(() => varInt(Number.NaN)).toThrow(RangeError);
  });
});

describe('utf8', () => {
  it('encodes ASCII one byte per character', () => {
    expect(bytesToHex(utf8('abc'))).toBe('616263');
    expect(utf8('')).toEqual(new Uint8Array(0));
  });
  it('encodes multi-byte characters', () => {
    expect(bytesToHex(utf8('€'))).toBe('e282ac');
    expect(bytesToHex(utf8('幣'))).toBe('e5b9a3');
  });
});
