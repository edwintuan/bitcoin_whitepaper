/**
 * The status lines of the payment verification figure, put together from its
 * copy and the state of the check. Kept out of the scenes so that each
 * sentence can be read, and tested, as the reader will read it.
 */
import type { Lang } from '@/content/types';
import { fill, formatCount } from '@/text/format';
import { COPY } from './copy';
import { pick } from '@/i18n/settings';

/** What goes between two sentences: a space in English, nothing in Chinese, whose sentences end in full-width punctuation. */
export const gap = (lang: Lang): string => (lang === 'en' ? ' ' : '');

/** A hash, as it travels: 32 bytes. */
export const HASH_BYTES = 32;

/** The state of the check, as far as its status line is concerned. */
export interface ProofStatusInput {
  /** Whether a branch has been asked for. */
  asked: boolean;
  /** Siblings folded in so far. */
  folded: number;
  /** Hashes in the branch. */
  steps: number;
  /** The side the wallet's own hash was on in the last fold, or null before the first. */
  ours: 'left' | 'right' | null;
  /** Once every sibling is folded in: whether the result is the root in the header. */
  equal: boolean;
  tamper: 'none' | 'tx' | 'sibling';
}

/** A status line: the verdict as a sentence of its own, once there is one, and what explains it. */
export interface ProofStatus {
  lead: string | null;
  text: string;
}

/** The status line under the check. */
export function proofStatus(lang: Lang, state: ProofStatusInput): ProofStatus {
  if (!state.asked) return { lead: null, text: pick(COPY.statusPick, lang) };
  if (state.folded >= state.steps) {
    if (state.equal) return { lead: pick(COPY.equalLead, lang), text: pick(COPY.statusEqual, lang) };
    return { lead: pick(COPY.notEqualLead, lang), text: pick((state.tamper === 'tx' ? COPY.statusForged : COPY.statusCorrupt), lang) };
  }
  if (state.folded === 0) {
    return { lead: null, text: fill(pick(COPY.statusAsked, lang), { n: state.steps, bytes: state.steps * HASH_BYTES }) };
  }
  const template = state.ours === 'left' ? COPY.statusFoldLeft : COPY.statusFoldRight;
  return { lead: null, text: fill(pick(template, lang), { k: state.folded, n: state.steps }) };
}

/** The status line of the size scene, for a block of `count` transactions and a branch of `hashes` hashes. */
export function sizeStatus(lang: Lang, count: number, hashes: number): string {
  return fill(pick(COPY.sizeStatus, lang), { count: formatCount(count), hashes });
}
