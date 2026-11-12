import { describe, expect, it } from 'vitest';
import { bytesToHex } from '@/lib/bytes';
import { GENESIS_HEADER, headerHash, leadingZeroBits, serializeHeader } from '@/lib/header';
import { BLOCK_1, BLOCK_1_HASH, HEADER_FIELDS, HEADER_SEGMENTS, expectedTries } from './blocks';

describe('figure constants', () => {
  it('holds the real header of mainnet block 1', () => {
    expect(headerHash(BLOCK_1)).toBe(BLOCK_1_HASH);
    expect(BLOCK_1_HASH).toBe('00000000839a8e6886ab5951d76f411475428afc90947ee320161bbf18eb6048');
  });
});

describe('expectedTries', () => {
  it('doubles with every bit', () => {
    expect(expectedTries(12)).toBe(4096);
    expect(expectedTries(20)).toBe(1_048_576);
  });
});

describe('the header layout', () => {
  it('adds up to 80 bytes, with no gap between fields', () => {
    expect(HEADER_FIELDS.reduce((sum, field) => sum + field.bytes, 0)).toBe(80);
    expect(HEADER_SEGMENTS[0].start).toBe(0);
    HEADER_SEGMENTS.forEach((segment, index) => {
      if (index > 0) expect(segment.start).toBe(HEADER_SEGMENTS[index - 1].end);
    });
    expect(HEADER_SEGMENTS[HEADER_SEGMENTS.length - 1].end).toBe(80);
  });

  it('is where the engine writes each field', () => {
    const bytes = serializeHeader(GENESIS_HEADER);
    const slice = (name: string) => {
      const segment = HEADER_SEGMENTS.find((entry) => entry.name === name)!;
      return bytesToHex(bytes.slice(segment.start, segment.end));
    };
    // Little-endian on the wire: version 1, the genesis nonce 2083236893 = 0x7c2bac1d, bits 0x1d00ffff.
    expect(slice('version')).toBe('01000000');
    expect(slice('nonce')).toBe('1dac2b7c');
    expect(slice('bits')).toBe('ffff001d');
    expect(slice('prevHash')).toBe('00'.repeat(32));
    expect(slice('time')).toBe('29ab5f49');
  });
});

describe('the genesis header with its nonce one higher', () => {
  it('hashes to something with no leading zero bit at all, as the figure says', () => {
    const bumped = headerHash({ ...GENESIS_HEADER, nonce: GENESIS_HEADER.nonce + 1 });
    expect(leadingZeroBits(bumped)).toBe(0);
    expect(leadingZeroBits(headerHash(GENESIS_HEADER))).toBe(43);
  });
});
