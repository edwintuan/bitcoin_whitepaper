import { describe, expect, it } from 'vitest';
import { parseRich } from '@/text/richtext';
import { TERMS, TERM_IDS } from './terms';

/**
 * The glossary was written before the parser existed. This runs every string
 * through the real parser: links must resolve, and no marker may be left
 * unparsed in the text a reader sees.
 */
describe('glossary copy through the real parser', () => {
  const strings = TERM_IDS.flatMap((id) => {
    const term = TERMS[id];
    return (['en', 'zh'] as const).flatMap((lang) =>
      [term.short[lang], term.precise?.[lang]].filter((s): s is string => Boolean(s)).map((text) => ({ id, lang, text })),
    );
  });

  it('resolves every linked term', () => {
    for (const { id, text } of strings) {
      for (const token of parseRich(text)) {
        if (token.type === 'term') {
          expect(TERMS[token.id], `${id} links to unknown term ${token.id}`).toBeDefined();
          expect(token.id, `${id} links to itself`).not.toBe(id);
        }
      }
    }
  });

  it('leaves no stray markers in the visible text', () => {
    for (const { id, lang, text } of strings) {
      const visible = parseRich(text)
        .filter((token) => token.type === 'text')
        .map((token) => token.text)
        .join('');
      expect(visible, `${id}.${lang}: ${text}`).not.toMatch(/\[\[|\]\]|\{§|`|\*\*/);
    }
  });
});
