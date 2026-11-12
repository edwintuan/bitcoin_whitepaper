import type { Lang } from '@/content/types';

/**
 * Joins sentences that were written separately. English wants a space between
 * them; Chinese, whose sentences end in full-width punctuation, wants none.
 */
export function sentences(lang: Lang, ...parts: (string | null | false | undefined)[]): string {
  return parts.filter((part): part is string => typeof part === 'string' && part !== '').join(lang === 'en' ? ' ' : '');
}
