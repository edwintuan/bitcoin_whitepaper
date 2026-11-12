/**
 * The small inline markup used by every piece of copy on the site.
 *
 *   [[term-id]]            a glossary term, shown with its default name
 *   [[term-id|words]]      a glossary term, shown as "words"
 *   {§4}  {§4|words}       a link to a section of the paper (0 = Abstract)
 *   **strong**  *em*  `code`
 *   [words](https://…)     an external link
 *
 * Markers do not nest. Anything malformed is left as plain text, so a typo in
 * the copy shows up on the page instead of breaking it.
 */

export type RichToken =
  | { type: 'text'; text: string }
  | { type: 'term'; id: string; label?: string }
  | { type: 'section'; number: number; label?: string }
  | { type: 'strong' | 'em' | 'code'; text: string }
  | { type: 'link'; href: string; text: string };

const MARKER = new RegExp(
  [
    String.raw`\[\[([a-z0-9]+(?:-[a-z0-9]+)*)(?:\|([^\]|]+))?\]\]`, // 1 id, 2 label
    String.raw`\{§(1[0-2]|[0-9])(?:\|([^}|]+))?\}`, // 3 number, 4 label
    String.raw`\*\*([^*]+)\*\*`, // 5 strong
    String.raw`\*([^*\s](?:[^*]*[^*\s])?)\*`, // 6 em: no space just inside the stars
    '`([^`]+)`', // 7 code
    String.raw`\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)`, // 8 text, 9 href
  ].join('|'),
  'g',
);

export function parseRich(source: string): RichToken[] {
  const tokens: RichToken[] = [];
  let cursor = 0;

  const pushText = (end: number) => {
    if (end > cursor) tokens.push({ type: 'text', text: source.slice(cursor, end) });
  };

  for (const match of source.matchAll(MARKER)) {
    pushText(match.index);
    cursor = match.index + match[0].length;

    const [, termId, termLabel, sectionNo, sectionLabel, strong, em, code, linkText, href] = match;
    if (termId !== undefined) {
      tokens.push(termLabel ? { type: 'term', id: termId, label: termLabel } : { type: 'term', id: termId });
    } else if (sectionNo !== undefined) {
      const number = Number(sectionNo);
      tokens.push(sectionLabel ? { type: 'section', number, label: sectionLabel } : { type: 'section', number });
    } else if (strong !== undefined) {
      tokens.push({ type: 'strong', text: strong });
    } else if (em !== undefined) {
      tokens.push({ type: 'em', text: em });
    } else if (code !== undefined) {
      tokens.push({ type: 'code', text: code });
    } else if (linkText !== undefined && href !== undefined) {
      tokens.push({ type: 'link', text: linkText, href });
    }
  }

  pushText(source.length);
  return tokens;
}

/** Glossary ids used in a piece of copy, each once, in order of first appearance. */
export function termIdsIn(source: string): string[] {
  const ids = new Set<string>();
  for (const token of parseRich(source)) {
    if (token.type === 'term') ids.add(token.id);
  }
  return [...ids];
}

/**
 * The same copy without markup, for search indexes and accessible names.
 * `nameOf` supplies a term's display name when the copy does not give one.
 */
export function plainRich(source: string, nameOf: (termId: string) => string | undefined): string {
  return parseRich(source)
    .map((token) => {
      switch (token.type) {
        case 'term':
          return token.label ?? nameOf(token.id) ?? token.id;
        case 'section':
          return token.label ?? `§${token.number}`;
        default:
          return token.text;
      }
    })
    .join('');
}
