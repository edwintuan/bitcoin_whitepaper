/**
 * How the two listings of the code scene are printed: the paper's C and the
 * engine's TypeScript, token by token, with the statements the live values
 * belong to marked so that a value and its line can point at each other.
 */
import { tokenizeCpp } from '@/text/cppHighlight';
import type { CppToken } from '@/text/cppHighlight';

/** Words that are keywords in TypeScript but not in the C++ tokenizer's list. */
const TS_KEYWORDS = /\b(export|function|let|number)\b/;

/**
 * Tokens for each line of a listing in C or TypeScript. The site's C++
 * tokenizer does the work; this adds the handful of TypeScript keywords so
 * that `let` is printed like `const`. The text is never altered.
 */
export function tokenizeListing(code: string): CppToken[][] {
  return tokenizeCpp(code).map((tokens) =>
    tokens.flatMap((token): CppToken[] =>
      token.kind !== 'plain'
        ? [token]
        : token.text
            .split(TS_KEYWORDS)
            .map((text, index): CppToken => ({ kind: index % 2 === 1 ? 'keyword' : 'plain', text }))
            .filter((part) => part.text !== ''),
    ),
  );
}

/** The value a line of either listing computes, if the scene shows it. */
export type Mark = 'p' | 'lambda' | 'poisson' | 'sum' | 'return';

const MARKS: [Mark, RegExp][] = [
  ['p', /\bp = 1\.0 - q;/],
  ['lambda', /\blambda = z \* \(q \/ p\);/],
  ['poisson', /\bpoisson = (?:Math\.)?exp\(-lambda\);|\bpoisson \*= lambda \/ i;/],
  ['sum', /\bsum -= poisson \* /],
  ['return', /\breturn sum;/],
];

/** Which watched value, if any, the statement on this line belongs to. The same in C and in the port. */
export function markOf(line: string): Mark | null {
  return MARKS.find(([, pattern]) => pattern.test(line))?.[0] ?? null;
}
