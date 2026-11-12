import { describe, expect, it } from 'vitest';
import { parseRich, termIdsIn } from './richtext';

describe('parseRich', () => {
  it('returns plain text untouched', () => {
    expect(parseRich('Nodes work all at once.')).toEqual([{ type: 'text', text: 'Nodes work all at once.' }]);
    expect(parseRich('')).toEqual([]);
  });

  it('reads a term, with or without its own label', () => {
    expect(parseRich('[[hash]]')).toEqual([{ type: 'term', id: 'hash' }]);
    expect(parseRich('[[hash|哈希值]]')).toEqual([{ type: 'term', id: 'hash', label: '哈希值' }]);
    expect(parseRich('[[merkle-tree|Merkle trees]]')).toEqual([
      { type: 'term', id: 'merkle-tree', label: 'Merkle trees' },
    ]);
  });

  it('reads a section reference', () => {
    expect(parseRich('{§4}')).toEqual([{ type: 'section', number: 4 }]);
    expect(parseRich('{§11|the calculations}')).toEqual([
      { type: 'section', number: 11, label: 'the calculations' },
    ]);
    expect(parseRich('{§0}')).toEqual([{ type: 'section', number: 0 }]);
  });

  it('reads inline styles', () => {
    expect(parseRich('**never** *ever* `nBits`')).toEqual([
      { type: 'strong', text: 'never' },
      { type: 'text', text: ' ' },
      { type: 'em', text: 'ever' },
      { type: 'text', text: ' ' },
      { type: 'code', text: 'nBits' },
    ]);
  });

  it('reads an external link', () => {
    expect(parseRich('See [BIP 174](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki).')).toEqual([
      { type: 'text', text: 'See ' },
      { type: 'link', text: 'BIP 174', href: 'https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki' },
      { type: 'text', text: '.' },
    ]);
  });

  it('keeps the text between markers, in order', () => {
    expect(parseRich('A [[nonce]] changes the [[hash|hash]]; see {§4}.')).toEqual([
      { type: 'text', text: 'A ' },
      { type: 'term', id: 'nonce' },
      { type: 'text', text: ' changes the ' },
      { type: 'term', id: 'hash', label: 'hash' },
      { type: 'text', text: '; see ' },
      { type: 'section', number: 4 },
      { type: 'text', text: '.' },
    ]);
  });

  it('works without spaces around markers, as Chinese is written', () => {
    expect(parseRich('礦工更換[[nonce|隨機數]]，直到[[hash|哈希值]]達標。')).toEqual([
      { type: 'text', text: '礦工更換' },
      { type: 'term', id: 'nonce', label: '隨機數' },
      { type: 'text', text: '，直到' },
      { type: 'term', id: 'hash', label: '哈希值' },
      { type: 'text', text: '達標。' },
    ]);
  });

  it('leaves unfinished or malformed markers as text', () => {
    expect(parseRich('[[hash')).toEqual([{ type: 'text', text: '[[hash' }]);
    expect(parseRich('**bold')).toEqual([{ type: 'text', text: '**bold' }]);
    expect(parseRich('[[Not An Id]]')).toEqual([{ type: 'text', text: '[[Not An Id]]' }]);
    expect(parseRich('{§99}')).toEqual([{ type: 'text', text: '{§99}' }]);
  });

  it('does not read arithmetic as emphasis', () => {
    expect(parseRich('80 bytes * 6 * 24 * 365 = 4.2MB')).toEqual([
      { type: 'text', text: '80 bytes * 6 * 24 * 365 = 4.2MB' },
    ]);
  });

  it('does not treat a javascript: target as a link', () => {
    expect(parseRich('[x](javascript:alert(1))')).toEqual([{ type: 'text', text: '[x](javascript:alert(1))' }]);
  });
});

describe('termIdsIn', () => {
  it('lists each term once, in order of first appearance', () => {
    expect(termIdsIn('[[hash]] then [[nonce|n]] then [[hash|h]] and {§4}')).toEqual(['hash', 'nonce']);
    expect(termIdsIn('no terms here')).toEqual([]);
  });
});
