import { HANS_FROM, HANS_TERMS, HANS_TO } from './hans-table';

/**
 * The Simplified edition of the Chinese copy, derived from the Traditional one.
 * See scripts/hans.mjs for how the table is made and why it is this small.
 */
const CHARS = new Map<string, string>();
{
  const from = [...HANS_FROM];
  const to = [...HANS_TO];
  from.forEach((char, i) => CHARS.set(char, to[i]!));
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const TERM = new Map(HANS_TERMS);
// One pass, longest term first: a later term cannot rewrite what an earlier one wrote.
const TERM_PATTERN = new RegExp(HANS_TERMS.map(([from]) => escape(from)).join('|'), 'g');

const strings = new Map<string, string>();

/** A string of the Chinese copy in Simplified characters and mainland wording. */
export function toHans(text: string): string {
  const known = strings.get(text);
  if (known !== undefined) return known;
  let out = '';
  for (const char of text.replace(TERM_PATTERN, (term) => TERM.get(term)!)) out += CHARS.get(char) ?? char;
  strings.set(text, out);
  return out;
}

const objects = new WeakMap<object, unknown>();

/**
 * The same for a value that holds strings: a list of steps, a record of
 * labels. The result is kept, so the same input gives the same object and a
 * component that depends on it is not drawn again for nothing.
 */
export function toHansDeep<T>(value: T): T {
  if (typeof value === 'string') return toHans(value) as T;
  if (value === null || typeof value !== 'object') return value;
  // A React element or anything else that is not plain data is passed through.
  const proto = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && proto !== Object.prototype && proto !== null) return value;
  if ('$$typeof' in value) return value;
  const known = objects.get(value);
  if (known !== undefined) return known as T;
  const out = Array.isArray(value)
    ? value.map((item) => toHansDeep(item))
    : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toHansDeep(item)]));
  objects.set(value, out);
  return out as T;
}
