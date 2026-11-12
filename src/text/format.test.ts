import { describe, expect, it } from 'vitest';
import { fill, formatBtc, formatCount, searchable, shortHex } from './format';

describe('formatBtc', () => {
  it('prints satoshis as bitcoin without trailing zeros', () => {
    expect(formatBtc(50_000_000n)).toBe('0.5');
    expect(formatBtc(4_990_000n)).toBe('0.0499');
    expect(formatBtc(10_000n)).toBe('0.0001');
    expect(formatBtc(100_000_000n)).toBe('1');
    expect(formatBtc(0n)).toBe('0');
    expect(formatBtc(1n)).toBe('0.00000001');
  });
  it('groups large whole amounts', () => {
    expect(formatBtc(2_099_999_997_690_000n)).toBe('20,999,999.9769');
    expect(formatBtc(5_000_000_000n)).toBe('50');
  });
});

describe('formatCount', () => {
  it('groups thousands the same way in both languages', () => {
    expect(formatCount(4096)).toBe('4,096');
    expect(formatCount(1_048_576)).toBe('1,048,576');
    expect(formatCount(12)).toBe('12');
  });
});

describe('shortHex', () => {
  const hash = '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';
  it('keeps the two ends', () => {
    expect(shortHex(hash, 8, 4)).toBe('00000000…e26f');
  });
  it('can end on the ellipsis', () => {
    expect(shortHex(hash, 8, 0)).toBe('00000000…');
  });
  it('returns short strings whole', () => {
    expect(shortHex('abcdef', 8, 4)).toBe('abcdef');
  });
});

describe('fill', () => {
  it('replaces named placeholders', () => {
    expect(fill('{tried} of {expected}', { tried: 3, expected: '4,096' })).toBe('3 of 4,096');
  });
  it('leaves an unknown placeholder empty', () => {
    expect(fill('a{x}b', {})).toBe('ab');
  });
});

describe('searchable', () => {
  it('adds a copy with straight apostrophes, so a query typed either way matches', () => {
    expect(searchable('Gambler’s Ruin')).toBe("Gambler’s Ruin Gambler's Ruin");
  });
  it('leaves text without typographic apostrophes as it is', () => {
    expect(searchable('Merkle tree 默克爾樹')).toBe('Merkle tree 默克爾樹');
  });
});
