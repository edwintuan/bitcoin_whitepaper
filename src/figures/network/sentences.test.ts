// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { sentences } from './sentences';

describe('sentences', () => {
  it('puts a space between English sentences', () => {
    expect(sentences('en', 'At rest.', 'One is waiting.')).toBe('At rest. One is waiting.');
  });
  it('puts nothing between Chinese sentences, which end in full-width punctuation', () => {
    expect(sentences('zh', '網絡靜止。', '有一筆交易正在等候。')).toBe('網絡靜止。有一筆交易正在等候。');
  });
  it('leaves out parts that are missing', () => {
    expect(sentences('en', 'One.', null, false, undefined, '', 'Two.')).toBe('One. Two.');
    expect(sentences('zh')).toBe('');
  });
});
